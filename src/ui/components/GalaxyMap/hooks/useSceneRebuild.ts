import { useEffect } from 'react';
import * as THREE from 'three';
import type { StarSystem, ScienceShip, Fleet } from '@domain/types';
import { disposeNebula } from '../lib/background';
import { rebuildSceneGraph } from '../lib/rebuild';
import { createAnchorResolver } from '../lib/anchors';
import { useGalaxyMapContext } from '../providers/GalaxyMapContext';

export interface UseSceneRebuildParams {
  systems: StarSystem[];
  galaxyShape: 'circle' | 'spiral';
  galaxySeed: string;
  maxSystemRadius: number;
  orbitBaseSpeed: number;
  colonizedLookup: Map<string, { id: string; name: string }>;
  recentCombatSystems: Set<string>;
  activeBattles: Set<string>;
  starVisuals: Record<string, unknown>;
  scienceShips: ScienceShip[];
  fleets: Fleet[];
  empireWar: boolean;
  systemsSignature: string;
  scienceMaterials: Record<string, THREE.Material>;
  scienceLineMaterials: Record<string, THREE.Material>;
  fleetMaterials: Record<string, THREE.Material>;
  shipDesignLookup: Map<string, import('@domain/types').ShipDesign>;
}

const disposeObjectResources = (object: THREE.Object3D) => {
  const mesh = object as THREE.Mesh;
  if (mesh.geometry) {
    mesh.geometry.dispose();
  }
  const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
  if (material) {
    const materials = Array.isArray(material) ? material : [material];
    materials.forEach((mat) => {
      // @ts-expect-error allow optional texture cleanup
      if (mat.map?.dispose) mat.map.dispose();
      if (mat instanceof THREE.Material) {
        mat.dispose();
      }
    });
  }
};

const preserveOrbitAngles = (group: THREE.Group, planetAngleRef: Map<string, number>) => {
  group.children.forEach((child) => {
    const orbit = child.getObjectByName('orbits') as THREE.Group | null;
    if (!orbit) {
      return;
    }
    orbit.children.forEach((entry) => {
      const planetId = entry.userData?.planetId as string | undefined;
      if (planetId && typeof entry.userData?.orbitAngle === 'number') {
        planetAngleRef.set(planetId, entry.userData.orbitAngle);
      }
    });
  });
};

const disposeGroupResources = (group: THREE.Group) => {
  group.traverse((child) => {
    if (child !== group) {
      disposeObjectResources(child);
    }
  });
  group.clear();
};

export const useSceneRebuild = ({
  systems,
  galaxyShape,
  galaxySeed,
  maxSystemRadius,
  orbitBaseSpeed,
  colonizedLookup,
  recentCombatSystems,
  activeBattles,
  starVisuals,
  scienceShips,
  fleets,
  empireWar,
  systemsSignature,
  scienceMaterials,
  scienceLineMaterials,
  fleetMaterials,
  shipDesignLookup,
}: UseSceneRebuildParams) => {
  const {
    sceneContext,
    cameraState: { systemGroupRef },
    anchorState: {
      systemPositionRef,
      planetAngleRef,
      planetLookupRef,
      systemsSignatureRef,
      nebulaRef,
      blackHoleRef,
      scienceAnchorsRef,
      fleetAnchorsRef,
      anchorResolverRef,
    },
  } = useGalaxyMapContext();
  useEffect(() => {
    const group = systemGroupRef.current ?? sceneContext?.systemGroup ?? null;
    if (!sceneContext || !group) {
      return;
    }

    if (systemsSignatureRef.current === systemsSignature) {
      return;
    }
    systemsSignatureRef.current = systemsSignature;

    if (nebulaRef.current) {
      disposeNebula(nebulaRef.current);
      nebulaRef.current = null;
    }

    preserveOrbitAngles(group, planetAngleRef.current);

    disposeGroupResources(group);
    planetLookupRef.current.clear();

    const resolverForBuild =
      anchorResolverRef.current ??
      createAnchorResolver(systemPositionRef.current, planetLookupRef.current);

    const { nebula, positions, updateAnchorInstances } = rebuildSceneGraph({
      group,
      systems,
      galaxyShape,
      galaxySeed,
      maxSystemRadius,
      orbitBaseSpeed,
      colonizedLookup,
      recentCombatSystems,
      activeBattles,
      starVisuals,
      scienceShips,
      fleets,
      empireWar,
      planetAngleRef: planetAngleRef.current,
      planetLookupRef: planetLookupRef.current,
      scienceMaterials,
      scienceLineMaterials,
      fleetMaterials,
      scienceAnchorsRef: scienceAnchorsRef.current,
      fleetAnchorsRef: fleetAnchorsRef.current,
      getVector: resolverForBuild.getVector,
      releaseVector: resolverForBuild.releaseVector,
      getMatrix: resolverForBuild.getMatrix,
      releaseMatrix: resolverForBuild.releaseMatrix,
      shipDesignLookup,
    });

    nebulaRef.current = nebula;
    systemPositionRef.current = positions;
    anchorResolverRef.current = createAnchorResolver(
      systemPositionRef.current,
      planetLookupRef.current,
    );
    if (blackHoleRef.current) {
      blackHoleRef.current.position.set(0, 0, 0);
      group.add(blackHoleRef.current);
    }

    updateAnchorInstances();
  }, [
    sceneContext,
    systems,
    galaxyShape,
    galaxySeed,
    maxSystemRadius,
    orbitBaseSpeed,
    colonizedLookup,
    recentCombatSystems,
    activeBattles,
    starVisuals,
    scienceShips,
    fleets,
    shipDesignLookup,
    empireWar,
    systemsSignature,
    scienceMaterials,
    scienceLineMaterials,
    fleetMaterials,
    anchorResolverRef,
    systemGroupRef,
    systemPositionRef,
    planetAngleRef,
    planetLookupRef,
    systemsSignatureRef,
    nebulaRef,
    blackHoleRef,
    scienceAnchorsRef,
    fleetAnchorsRef,
  ]);
};
