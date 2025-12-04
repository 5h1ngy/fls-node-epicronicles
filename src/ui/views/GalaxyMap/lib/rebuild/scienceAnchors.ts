import * as THREE from 'three';
import type { ScienceShip } from '@domain/types';
import { createTravelPath } from './anchorUtils';
import type { AnchorEntry } from '../anchors';

interface ScienceAnchorParams {
  group: THREE.Group;
  scienceShips: ScienceShip[];
  positions: Map<string, THREE.Vector3>;
  scienceAnchorsRef: AnchorEntry[];
  scienceMaterials: Record<string, THREE.Material>;
  scienceLineMaterials: Record<string, THREE.Material>;
  getVector: () => THREE.Vector3;
  releaseVector: (v: THREE.Vector3) => void;
}

export const buildScienceAnchors = ({
  group,
  scienceShips,
  positions,
  scienceAnchorsRef,
  scienceMaterials,
  scienceLineMaterials,
  getVector,
  releaseVector,
}: ScienceAnchorParams) => {
  const scienceTargetGroup = new THREE.Group();
  scienceTargetGroup.name = 'scienceTargets';
  const shipGeometry = new THREE.SphereGeometry(0.6, 12, 12);
  const targetMarkerGeometry = new THREE.SphereGeometry(0.35, 10, 10);
  scienceAnchorsRef.length = 0;

  (['idle', 'traveling', 'surveying'] as const).forEach((status) => {
    const list = scienceShips.filter((ship) => ship.status === status);
    if (list.length === 0) {
      return;
    }
    const mesh = new THREE.InstancedMesh(
      shipGeometry,
      scienceMaterials[status] ?? scienceMaterials.idle,
      list.length,
    );
    mesh.userData = { entityKind: 'science', instances: list };
    list.forEach((ship, idx) => {
      scienceAnchorsRef.push({
        mesh,
        index: idx,
        systemId: ship.currentSystemId,
        planetId:
          ship.targetSystemId && ship.targetSystemId !== ship.currentSystemId
            ? null
            : ship.anchorPlanetId ?? null,
        height: 6,
      });
      if (ship.targetSystemId && ship.targetSystemId !== ship.currentSystemId) {
        const lineMaterial =
          scienceLineMaterials[status] ?? scienceLineMaterials.idle;
        const targetMaterial =
          scienceMaterials[status] ?? scienceMaterials.idle;
        createTravelPath({
          group: scienceTargetGroup,
          positions,
          fromSystemId: ship.currentSystemId,
          toSystemId: ship.targetSystemId,
          lineMaterial,
          targetGeometry: targetMarkerGeometry,
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
  group.add(scienceTargetGroup);

  return scienceTargetGroup;
};
