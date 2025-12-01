import * as THREE from 'three';
import type { StarSystem, ScienceShip, Fleet } from '@domain/types';
import { buildNebula } from './rebuild/nebula';
import { buildSystems } from './rebuild/systems';
import { buildScienceAnchors } from './rebuild/scienceAnchors';
import { buildFleetAnchors } from './rebuild/fleetAnchors';

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
  scienceAnchorsRef: Array<{
    mesh: THREE.InstancedMesh;
    index: number;
    systemId: string;
    planetId: string | null;
    height: number;
  }>;
  fleetAnchorsRef: Array<{
    mesh: THREE.InstancedMesh;
    index: number;
    systemId: string;
    planetId: string | null;
    height: number;
  }>;
  getVector: () => THREE.Vector3;
  releaseVector: (v: THREE.Vector3) => void;
  getMatrix: () => THREE.Matrix4;
  releaseMatrix: (m: THREE.Matrix4) => void;
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
  });

  const updateAnchorInstances = () => {
    scienceAnchorsRef.forEach((entry) => {
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
      const matrix = getMatrix().setPosition(target.x, target.y, target.z);
      entry.mesh.setMatrixAt(entry.index, matrix);
      entry.mesh.instanceMatrix.needsUpdate = true;
      releaseMatrix(matrix);
      if (target !== pos) {
        releaseVector(target);
      }
    });
    fleetAnchorsRef.forEach((entry) => {
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
      const matrix = getMatrix().setPosition(target.x, target.y, target.z);
      entry.mesh.setMatrixAt(entry.index, matrix);
      entry.mesh.instanceMatrix.needsUpdate = true;
      releaseMatrix(matrix);
      if (target !== pos) {
        releaseVector(target);
      }
    });
  };

  return {
    nebula,
    positions,
    scienceTargetGroup,
    fleetTargetGroup,
    updateAnchorInstances,
  };
};
