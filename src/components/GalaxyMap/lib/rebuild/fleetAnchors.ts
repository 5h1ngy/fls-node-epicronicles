import * as THREE from 'three';
import type { Fleet } from '@domain/types';
import { createTravelPath } from './anchorUtils';

interface FleetAnchorParams {
  group: THREE.Group;
  fleets: Fleet[];
  positions: Map<string, THREE.Vector3>;
  empireWar: boolean;
  fleetAnchorsRef: Array<{
    mesh: THREE.InstancedMesh;
    index: number;
    systemId: string;
    planetId: string | null;
    height: number;
  }>;
  fleetMaterials: Record<string, THREE.Material>;
  getVector: () => THREE.Vector3;
  releaseVector: (v: THREE.Vector3) => void;
}

export const buildFleetAnchors = ({
  group,
  fleets,
  positions,
  empireWar,
  fleetAnchorsRef,
  fleetMaterials,
  getVector,
  releaseVector,
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
    const material = status === 'war' ? fleetMaterials.war : fleetMaterials.idle;
    const mesh = new THREE.InstancedMesh(fleetGeometry, material, list.length);
    mesh.userData = { entityKind: 'fleet', instances: list };
    list.forEach((fleet, idx) => {
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
  });
  group.add(fleetTargetGroup);

  return fleetTargetGroup;
};
