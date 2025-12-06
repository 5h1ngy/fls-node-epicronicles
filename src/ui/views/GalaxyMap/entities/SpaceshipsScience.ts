import * as THREE from 'three';
import type { ScienceShip } from '@domain/types';
import { SpaceshipsBase } from './SpaceshipsBase';
import type { AnchorEntry } from './Anchors';

interface ScienceSpaceshipParams {
  group: THREE.Group;
  scienceShips: ScienceShip[];
  positions: Map<string, THREE.Vector3>;
  scienceAnchorsRef: AnchorEntry[];
  scienceMaterials: Record<string, THREE.Material>;
  scienceLineMaterials: Record<string, THREE.Material>;
  getVector: () => THREE.Vector3;
  releaseVector: (v: THREE.Vector3) => void;
}

export class ScienceSpaceships extends SpaceshipsBase {
  private scienceAnchorsRef: AnchorEntry[] = [];
  private scienceMaterials: Record<string, THREE.Material> = {};
  private scienceLineMaterials: Record<string, THREE.Material> = {};

  setup({
    scienceAnchorsRef,
    scienceMaterials,
    scienceLineMaterials,
  }: Pick<ScienceSpaceshipParams, 'scienceAnchorsRef' | 'scienceMaterials' | 'scienceLineMaterials'>) {
    this.scienceAnchorsRef = scienceAnchorsRef;
    this.scienceMaterials = scienceMaterials;
    this.scienceLineMaterials = scienceLineMaterials;
  }

  rebuild({
    group,
    scienceShips,
  }: Pick<ScienceSpaceshipParams, 'group' | 'scienceShips'>) {
    const scienceTargetGroup = new THREE.Group();
    scienceTargetGroup.name = 'scienceTargets';
    const shipGeometry = new THREE.SphereGeometry(0.6, 12, 12);
    const targetMarkerGeometry = new THREE.SphereGeometry(0.35, 10, 10);
    this.scienceAnchorsRef.length = 0;

    (['idle', 'traveling', 'surveying'] as const).forEach((status) => {
      const list = scienceShips.filter((ship) => ship.status === status);
      if (list.length === 0) {
        return;
      }
      const mesh = new THREE.InstancedMesh(
        shipGeometry,
        this.scienceMaterials[status] ?? this.scienceMaterials.idle,
        list.length,
      );
      mesh.userData = { entityKind: 'science', instances: list };
      list.forEach((ship, idx) => {
        this.scienceAnchorsRef.push({
          mesh,
          index: idx,
          systemId: ship.currentSystemId,
          height: 6,
        });
        if (ship.targetSystemId && ship.targetSystemId !== ship.currentSystemId) {
          const lineMaterial =
            this.scienceLineMaterials[status] ?? this.scienceLineMaterials.idle;
          const targetMaterial =
            this.scienceMaterials[status] ?? this.scienceMaterials.idle;
          this.createTravelPath({
            group: scienceTargetGroup,
            fromSystemId: ship.currentSystemId,
            toSystemId: ship.targetSystemId,
            lineMaterial,
            targetGeometry: targetMarkerGeometry,
            targetMaterial,
            targetHeight: 1.5,
          });
        }
      });
      mesh.instanceMatrix.needsUpdate = true;
      group.add(mesh);
    });
    group.add(scienceTargetGroup);

    return scienceTargetGroup;
  }
}

export const buildScienceAnchors = (params: ScienceSpaceshipParams) => {
  const builder = new ScienceSpaceships(
    params.positions,
    params.getVector,
    params.releaseVector,
  );
  builder.setup({
    scienceAnchorsRef: params.scienceAnchorsRef,
    scienceMaterials: params.scienceMaterials,
    scienceLineMaterials: params.scienceLineMaterials,
  });
  return builder.rebuild({ group: params.group, scienceShips: params.scienceShips });
};
