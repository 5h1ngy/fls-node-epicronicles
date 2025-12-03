import * as THREE from 'three';
import type { MutableRefObject } from 'react';
import type { GalaxySceneContext } from '../../hooks/useGalaxyScene';
import type { AnchorEntry } from '../anchors';
import { updateCameraAndTilt } from './camera';
import { updateNebulaOpacity } from './nebula';
import { updateSystemNodes } from './systemNodes';
import { updateBlackHoleFrame } from './blackHole';

export interface FrameUpdateParams {
  ctx: GalaxySceneContext;
  delta: number;
  elapsed: number;
  minZoom: number;
  maxZoom: number;
  offsetTargetRef: MutableRefObject<THREE.Vector3>;
  zoomTargetRef: MutableRefObject<number>;
  zoomTargetDirtyRef: MutableRefObject<boolean>;
  tiltStateRef: MutableRefObject<{ current: number; target: number }>;
  tempSphericalRef: MutableRefObject<THREE.Spherical>;
  tempOffsetRef: MutableRefObject<THREE.Vector3>;
  planetAngleRef: MutableRefObject<Map<string, number>>;
  nebulaRef: MutableRefObject<THREE.Group | null>;
  blackHoleRef: MutableRefObject<THREE.Group | null>;
  scienceAnchors: AnchorEntry[];
  fleetAnchors: AnchorEntry[];
  updateAnchors: (group: THREE.Group, entries: AnchorEntry[]) => void;
}

export const updateFrame = (params: FrameUpdateParams) => {
  const cameraStep = () =>
    updateCameraAndTilt({
      ctx: params.ctx,
      delta: params.delta,
      minZoom: params.minZoom,
      maxZoom: params.maxZoom,
      offsetTargetRef: params.offsetTargetRef,
      zoomTargetRef: params.zoomTargetRef,
      zoomTargetDirtyRef: params.zoomTargetDirtyRef,
      tiltStateRef: params.tiltStateRef,
      tempSphericalRef: params.tempSphericalRef,
      tempOffsetRef: params.tempOffsetRef,
    });

  const sceneEffectsStep = (zoomFactor: number, deltaFactor: number) => {
    updateNebulaOpacity(params.nebulaRef.current, zoomFactor);
    updateSystemNodes({
      systemGroup: params.ctx.systemGroup,
      delta: params.delta,
      elapsed: params.elapsed,
      zoomFactor,
      planetAngleRef: params.planetAngleRef,
      camera: params.ctx.camera,
      deltaFactor,
    });
    updateBlackHoleFrame(params.blackHoleRef, params.delta, params.elapsed);
  };

  const anchorsStep = () => {
    params.updateAnchors(params.ctx.systemGroup, params.scienceAnchors);
    params.updateAnchors(params.ctx.systemGroup, params.fleetAnchors);
  };

  const { zoomFactor, deltaFactor } = cameraStep();
  sceneEffectsStep(zoomFactor, deltaFactor);
  anchorsStep();
};
