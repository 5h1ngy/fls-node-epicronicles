import * as THREE from 'three';
import type { StarSystem, ScienceShip, Fleet, ShipDesign } from '@domain/types';
import { buildNebula } from './nebula';
import { buildSystems } from './systems';
import { buildScienceAnchors } from './scienceAnchors';
import { buildFleetAnchors } from './fleetAnchors';
import type { AnchorEntry } from '../anchors';

export interface RebuildSceneParams {
  group: THREE.Group;
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
  planetAngleRef: Map<string, number>;
  planetLookupRef: Map<string, THREE.Object3D>;
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
}

export const rebuildSceneGraph = (params: RebuildSceneParams) => {
  const {
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
    planetAngleRef,
    planetLookupRef,
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
  } = params;

  const nebula = buildNebula({
    group,
    systems,
    galaxyShape,
    galaxySeed,
    maxSystemRadius,
  });

  const positions = buildSystems({
    group,
    systems,
    orbitBaseSpeed,
    colonizedLookup,
    planetAngleRef,
    planetLookupRef,
    recentCombatSystems,
    activeBattles,
    starVisuals,
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
      const planetId = entry.planetId;
      let target = pos;
      if (planetId) {
        const obj = planetLookupRef.get(planetId);
        if (obj) {
          const world = getVector();
          obj.getWorldPosition(world);
          group.worldToLocal(world);
          world.z += entry.height;
          target = world;
        }
      }
      if (entry.mesh && typeof entry.index === 'number') {
        const matrix = getMatrix().setPosition(target.x, target.y, target.z);
        entry.mesh.setMatrixAt(entry.index, matrix);
        entry.mesh.instanceMatrix.needsUpdate = true;
        releaseMatrix(matrix);
      } else if (entry.object) {
        entry.object.position.set(target.x, target.y, target.z);
      }
      if (target !== pos) {
        releaseVector(target);
      }
    };
    scienceAnchorsRef.forEach(updateEntry);
    fleetAnchorsRef.forEach(updateEntry);
  };

  return {
    nebula,
    positions,
    scienceTargetGroup,
    fleetTargetGroup,
    updateAnchorInstances,
  };
};
