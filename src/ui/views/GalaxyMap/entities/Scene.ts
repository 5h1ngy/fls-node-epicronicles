import * as THREE from 'three';
import type { MutableRefObject } from 'react';
import type { GalaxySceneContext } from '../hooks/useGalaxyScene';
import type { AnchorEntry } from './Anchors';
import { CameraEntity } from './Camera';
import { updateSystemEntities, buildSystems } from './System';
import type {
  StarSystem,
  ScienceShip,
  Fleet,
  ShipDesign,
  StarClass,
} from '@domain/types';
import { buildScienceAnchors } from './SpaceshipsScience';
import { buildMilitaryAnchors } from './SpaceshipsMilitary';
import { buildConstructionAnchors } from './SpaceshipsConstruction';
import type { StarVisual } from './Star';
import { BASE_TILT, MAX_TILT_DOWN } from './Config';

export interface SceneUpdateParams {
  ctx: GalaxySceneContext;
  delta: number;
  elapsed: number;
  minZoom: number;
  maxZoom: number;
  baseTilt?: number;
  maxTiltDown?: number;
  offsetTargetRef: MutableRefObject<THREE.Vector3>;
  zoomTargetRef: MutableRefObject<number>;
  zoomTargetDirtyRef: MutableRefObject<boolean>;
  tiltStateRef: MutableRefObject<{ current: number; target: number }>;
  tempSphericalRef: MutableRefObject<THREE.Spherical>;
  tempOffsetRef: MutableRefObject<THREE.Vector3>;
  scienceAnchors: AnchorEntry[];
  fleetAnchors: AnchorEntry[];
  updateAnchors: (group: THREE.Group, entries: AnchorEntry[]) => void;
}

export interface SceneRebuildParams {
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

export const updateScene = (params: SceneUpdateParams) => {
  const cameraEntity = new CameraEntity();
  const baseTilt = params.baseTilt ?? BASE_TILT;
  const maxTiltDown = params.maxTiltDown ?? MAX_TILT_DOWN;
  const cameraStep = () =>
    cameraEntity.update({
      ctx: params.ctx,
      delta: params.delta,
      minZoom: params.minZoom,
      maxZoom: params.maxZoom,
      minTilt: baseTilt,
      maxTilt: maxTiltDown,
      offsetTargetRef: params.offsetTargetRef,
      zoomTargetRef: params.zoomTargetRef,
      zoomTargetDirtyRef: params.zoomTargetDirtyRef,
      tiltStateRef: params.tiltStateRef,
      tempSphericalRef: params.tempSphericalRef,
      tempOffsetRef: params.tempOffsetRef,
    });

  const sceneEffectsStep = (zoomFactor: number) => {
    updateSystemEntities({
      systemGroup: params.ctx.systemGroup,
      zoomFactor,
      camera: params.ctx.camera,
    });
  };

  const anchorsStep = () => {
    params.updateAnchors(params.ctx.systemGroup, params.scienceAnchors);
    params.updateAnchors(params.ctx.systemGroup, params.fleetAnchors);
  };

  const { zoomFactor } = cameraStep();
  sceneEffectsStep(zoomFactor);
  anchorsStep();
};

export const rebuildScene = (params: SceneRebuildParams) => {
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

  const fleetTargetGroup = buildMilitaryAnchors({
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
  const constructorTargetGroup = buildConstructionAnchors({
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
    constructorTargetGroup,
    updateAnchorInstances,
  };
};
