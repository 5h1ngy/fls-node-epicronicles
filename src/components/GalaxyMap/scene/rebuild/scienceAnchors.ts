import * as THREE from 'three';
import type { ScienceShip } from '@domain/types';

interface ScienceAnchorParams {
  group: THREE.Group;
  scienceShips: ScienceShip[];
  positions: Map<string, THREE.Vector3>;
  scienceAnchorsRef: Array<{
    mesh: THREE.InstancedMesh;
    index: number;
    systemId: string;
    planetId: string | null;
    height: number;
  }>;
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
        const from = positions.get(ship.currentSystemId);
        const to = positions.get(ship.targetSystemId);
        if (from && to) {
          const a = getVector().set(from.x, from.y, from.z + 0.5);
          const b = getVector().set(to.x, to.y, to.z + 0.5);
          const points = [a, b];
          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          const lineMaterial =
            scienceLineMaterials[status] ?? scienceLineMaterials.idle;
          const line = new THREE.Line(geometry, lineMaterial);
          scienceTargetGroup.add(line);

          const targetMarker = new THREE.Mesh(
            targetMarkerGeometry,
            scienceMaterials[status] ?? scienceMaterials.idle,
          );
          targetMarker.position.set(to.x, to.y, to.z + 1.5);
          scienceTargetGroup.add(targetMarker);
          releaseVector(a);
          releaseVector(b);
        }
      }
    });
    mesh.instanceMatrix.needsUpdate = true;
    group.add(mesh);
  });
  group.add(scienceTargetGroup);

  return scienceTargetGroup;
};
