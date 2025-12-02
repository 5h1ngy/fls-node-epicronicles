import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import type { Fleet, ShipDesign } from '@domain/types';
import { createTravelPath } from './anchorUtils';

interface FleetAnchorParams {
  group: THREE.Group;
  fleets: Fleet[];
  positions: Map<string, THREE.Vector3>;
  empireWar: boolean;
  fleetAnchorsRef: Array<{
    mesh?: THREE.InstancedMesh;
    object?: THREE.Object3D;
    index?: number;
    systemId: string;
    planetId: string | null;
    height: number;
  }>;
  fleetMaterials: Record<string, THREE.Material>;
  getVector: () => THREE.Vector3;
  releaseVector: (v: THREE.Vector3) => void;
  shipDesignLookup: Map<string, ShipDesign>;
}

const constructorModel = (() => {
  let cache: Promise<THREE.Object3D> | null = null;
  const objUrl = new URL(
    '../../../../assets/scene/spaceships-constructor/base.obj',
    import.meta.url,
  ).href;
  const diffuseUrl = new URL(
    '../../../../assets/scene/spaceships-constructor/texture_diffuse.png',
    import.meta.url,
  ).href;
  const normalUrl = new URL(
    '../../../../assets/scene/spaceships-constructor/texture_normal.png',
    import.meta.url,
  ).href;
  const roughnessUrl = new URL(
    '../../../../assets/scene/spaceships-constructor/texture_roughness.png',
    import.meta.url,
  ).href;
  const metallicUrl = new URL(
    '../../../../assets/scene/spaceships-constructor/texture_metallic.png',
    import.meta.url,
  ).href;

  return () => {
    if (cache) {
      return cache;
    }
    cache = new Promise<THREE.Object3D>((resolve, reject) => {
      const loader = new OBJLoader();
      const textureLoader = new THREE.TextureLoader();
      const diffuse = textureLoader.load(diffuseUrl);
      const normal = textureLoader.load(normalUrl);
      const roughness = textureLoader.load(roughnessUrl);
      const metallic = textureLoader.load(metallicUrl);
      loader.load(
        objUrl,
        (obj: THREE.Group) => {
          obj.traverse((child: THREE.Object3D) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.material = new THREE.MeshStandardMaterial({
                map: diffuse,
                normalMap: normal,
                roughnessMap: roughness,
                metalnessMap: metallic,
                metalness: 0.8,
                roughness: 0.6,
              });
              mesh.castShadow = false;
              mesh.receiveShadow = false;
            }
          });
          obj.scale.set(0.015, 0.015, 0.015);
          obj.rotation.x = Math.PI / 2;
          resolve(obj);
        },
        undefined,
        (err: unknown) => reject(err),
      );
    });
    return cache;
  };
})();

const cloneConstructionShip = (base: THREE.Object3D) => {
  const clone = base.clone(true);
  clone.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map((mat) => mat.clone());
      } else if (mesh.material) {
        mesh.material = (mesh.material as THREE.Material).clone();
      }
    }
  });
  return clone;
};

const isConstructionFleet = (
  fleet: Fleet,
  designLookup: Map<string, ShipDesign>,
) =>
  fleet.ships.some(
    (ship) => designLookup.get(ship.designId)?.role === 'construction',
  );

export const buildFleetAnchors = ({
  group,
  fleets,
  positions,
  empireWar,
  fleetAnchorsRef,
  fleetMaterials,
  getVector,
  releaseVector,
  shipDesignLookup,
}: FleetAnchorParams) => {
  const fleetTargetGroup = new THREE.Group();
  fleetTargetGroup.name = 'fleetTargets';
  const fleetGeometry = new THREE.SphereGeometry(0.8, 12, 12);
  const fleetTargetGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  fleetAnchorsRef.length = 0;

  (['idle', 'war'] as const).forEach((status) => {
    const list = fleets.filter(() =>
      status === 'war' ? empireWar : !empireWar,
    );
    if (list.length === 0) {
      return;
    }
    const constructionFleets = list.filter((fleet) =>
      isConstructionFleet(fleet, shipDesignLookup),
    );
    const regularFleets = list.filter(
      (fleet) => !isConstructionFleet(fleet, shipDesignLookup),
    );

    if (regularFleets.length > 0) {
      const material =
        status === 'war' ? fleetMaterials.war : fleetMaterials.idle;
      const mesh = new THREE.InstancedMesh(
        fleetGeometry,
        material,
        regularFleets.length,
      );
      mesh.userData = { entityKind: 'fleet', instances: regularFleets };
      regularFleets.forEach((fleet, idx) => {
        fleetAnchorsRef.push({
          mesh,
          index: idx,
          systemId: fleet.systemId,
          planetId:
            fleet.targetSystemId && fleet.targetSystemId !== fleet.systemId
              ? null
              : fleet.anchorPlanetId ?? null,
          height: 5,
        });
        if (fleet.targetSystemId && fleet.targetSystemId !== fleet.systemId) {
          const lineMaterial =
            status === 'war' ? fleetMaterials.warLine : fleetMaterials.line;
          const targetMaterial =
            status === 'war' ? fleetMaterials.war : fleetMaterials.idle;
          createTravelPath({
            group: fleetTargetGroup,
            positions,
            fromSystemId: fleet.systemId,
            toSystemId: fleet.targetSystemId,
            lineMaterial,
            targetGeometry: fleetTargetGeometry,
            targetMaterial,
            targetHeight: 1.5,
            getVector,
            releaseVector,
          });
        }
      });
      mesh.instanceMatrix.needsUpdate = true;
      group.add(mesh);
    }

    if (constructionFleets.length > 0) {
      const lineMaterial =
        status === 'war' ? fleetMaterials.warLine : fleetMaterials.line;
      const targetMaterial =
        status === 'war' ? fleetMaterials.war : fleetMaterials.idle;
      constructorModel()
        .then((model) => {
          constructionFleets.forEach((fleet) => {
            const ship = cloneConstructionShip(model);
            ship.name = 'constructionShip';
            const pos = positions.get(fleet.systemId);
            if (pos) {
              ship.position.copy(pos);
            }
            fleetAnchorsRef.push({
              object: ship,
              systemId: fleet.systemId,
              planetId:
                fleet.targetSystemId && fleet.targetSystemId !== fleet.systemId
                  ? null
                  : fleet.anchorPlanetId ?? null,
              height: 5,
            });
            if (fleet.targetSystemId && fleet.targetSystemId !== fleet.systemId) {
              createTravelPath({
                group: fleetTargetGroup,
                positions,
                fromSystemId: fleet.systemId,
                toSystemId: fleet.targetSystemId,
                lineMaterial,
                targetGeometry: fleetTargetGeometry,
                targetMaterial,
                targetHeight: 1.5,
                getVector,
                releaseVector,
              });
            }
            group.add(ship);
          });
        })
        .catch(() => {
          // Ignore loading errors to avoid breaking the scene.
        });
    }
  });
  group.add(fleetTargetGroup);

  return fleetTargetGroup;
};
