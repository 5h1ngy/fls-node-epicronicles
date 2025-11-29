import * as THREE from 'three';
import type { MutableRefObject } from 'react';
import type { GalaxySceneContext } from '../hooks/useGalaxyScene';
import type { AnchorEntry } from './anchors';
import { updateCameraAndTilt } from './frame/camera';
import { updateNebulaOpacity } from './frame/nebula';
import { updateSystemNodes } from './frame/systemNodes';
import { updateBlackHoleFrame } from './frame/blackHole';

export interface FrameUpdateParams {
  ctx: GalaxySceneContext;
  delta: number;
  elapsed: number;
  minZoom: number;
  maxZoom: number;
  offsetTargetRef: MutableRefObject<THREE.Vector3>;
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

export const updateFrame = ({
  ctx,
  delta,
  elapsed,
  minZoom,
  maxZoom,
  offsetTargetRef,
  tiltStateRef,
  tempSphericalRef,
  tempOffsetRef,
  planetAngleRef,
  nebulaRef,
  blackHoleRef,
  scienceAnchors,
  fleetAnchors,
  updateAnchors,
}: FrameUpdateParams) => {
  const { zoomFactor, deltaFactor } = updateCameraAndTilt({
    ctx,
    delta,
    minZoom,
    maxZoom,
    offsetTargetRef,
    tiltStateRef,
    tempSphericalRef,
    tempOffsetRef,
  });

  updateNebulaOpacity(nebulaRef.current, zoomFactor);
  updateSystemNodes({
    systemGroup: ctx.systemGroup,
    delta,
    elapsed,
    zoomFactor,
    planetAngleRef,
    camera: ctx.camera,
    deltaFactor,
  });
  updateBlackHoleFrame(blackHoleRef, delta, elapsed);

  updateAnchors(ctx.systemGroup, scienceAnchors);
  updateAnchors(ctx.systemGroup, fleetAnchors);
};
