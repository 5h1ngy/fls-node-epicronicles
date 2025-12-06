import * as THREE from 'three';
import type {
  StarSystem,
  ScienceShip,
  Fleet,
  ShipDesign,
  StarClass,
} from '@domain/types';
import { buildSystems } from './systems';
import { buildScienceAnchors } from './scienceAnchors';
import { buildFleetAnchors } from './fleetAnchors';
import type { AnchorEntry } from '../anchors';
import type { StarVisual } from '../scene/starVisual';

export interface RebuildSceneParams {
  group: THREE.Group;
  systems: StarSystem[];
  colonizedLookup: Map<string, { id: string; name: string }>;
  recentCombatSystems: Set<string>;
  activeBattles: Set<string>;
  starVisuals: Record<string, unknown>;
  scienceShips: ScienceShip[];
  fleets: Fleet[];
  empireWar: boolean;
  scienceMaterials: Record<string, THREE.Material>;
  scienceLineMaterials: Record<string, THREE.Material>;
  fleetMaterials: Record<string, THREE.Material>;
  scienceAnchorsRef: AnchorEntry[];
  fleetAnchorsRef: AnchorEntry[];
  getVector: () => THREE.Vector3;
  releaseVector: (v: THREE.Vector3) => void;
  getMatrix: () => THREE.Matrix4;
  releaseMatrix: (m: THREE.Matrix4) => void;
  shipDesignLookup: Map<string, ShipDesign>;
  starRotations?: Map<string, number>;
}

export const rebuildSceneGraph = (params: RebuildSceneParams) => {
  const {
    group,
    systems,
    colonizedLookup,
    recentCombatSystems,
    activeBattles,
    starVisuals,
    scienceShips,
    fleets,
    empireWar,
    scienceMaterials,
    scienceLineMaterials,
    fleetMaterials,
    scienceAnchorsRef,
    fleetAnchorsRef,
    getVector,
    releaseVector,
    getMatrix,
    releaseMatrix,
    shipDesignLookup,
    starRotations,
  } = params;

  const positions = buildSystems({
    group,
    systems,
    colonizedLookup,
    recentCombatSystems,
    activeBattles,
    starVisuals: starVisuals as Record<StarClass, StarVisual>,
    starRotations,
  });

  const scienceTargetGroup = buildScienceAnchors({
    group,
    scienceShips,
    positions,
    scienceAnchorsRef,
    scienceMaterials,
    scienceLineMaterials,
    getVector,
    releaseVector,
  });

  const fleetTargetGroup = buildFleetAnchors({
    group,
    fleets,
    positions,
    empireWar,
    fleetAnchorsRef,
    fleetMaterials,
    getVector,
    releaseVector,
    shipDesignLookup,
  });

  const updateAnchorInstances = () => {
    const updateEntry = (entry: AnchorEntry) => {
      const pos = positions.get(entry.systemId);
      if (!pos) {
        return;
      }
      const base = getVector().copy(pos);
      base.y += entry.height;
      const resolvedTarget = base;
      if (entry.mesh && typeof entry.index === 'number') {
        const matrix = getMatrix().setPosition(
          resolvedTarget.x,
          resolvedTarget.y,
          resolvedTarget.z,
        );
        entry.mesh.setMatrixAt(entry.index, matrix);
        entry.mesh.instanceMatrix.needsUpdate = true;
        releaseMatrix(matrix);
      } else if (entry.object) {
        entry.object.position.set(
          resolvedTarget.x,
          resolvedTarget.y,
          resolvedTarget.z,
        );
      }
      releaseVector(resolvedTarget);
    };
    scienceAnchorsRef.forEach(updateEntry);
    fleetAnchorsRef.forEach(updateEntry);
  };

  return {
    positions,
    scienceTargetGroup,
    fleetTargetGroup,
    updateAnchorInstances,
  };
};
