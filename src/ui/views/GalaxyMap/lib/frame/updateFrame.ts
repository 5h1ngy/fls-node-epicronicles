import * as THREE from 'three';
import type { MutableRefObject } from 'react';
import type { GalaxySceneContext } from '../../hooks/useGalaxyScene';
import type { AnchorEntry } from '../anchors';
import { updateCameraAndTilt } from './camera';
import { updateSystemEntities } from '../entities/systemUpdate';

export interface FrameUpdateParams {
  ctx: GalaxySceneContext;
  delta: number;
  elapsed: number;
  minZoom: number;
  maxZoom: number;
  baseTilt: number;
  maxTiltDown: number;
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

export const updateFrame = (params: FrameUpdateParams) => {
  const cameraStep = () =>
    updateCameraAndTilt({
      ctx: params.ctx,
      delta: params.delta,
      minZoom: params.minZoom,
      maxZoom: params.maxZoom,
      minTilt: params.baseTilt,
      maxTilt: params.maxTiltDown,
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
