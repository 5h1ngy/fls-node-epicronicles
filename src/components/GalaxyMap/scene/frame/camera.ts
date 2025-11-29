import * as THREE from 'three';
import type { MutableRefObject } from 'react';
import type { GalaxySceneContext } from '../../hooks/useGalaxyScene';

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export interface CameraUpdateParams {
  ctx: GalaxySceneContext;
  delta: number;
  minZoom: number;
  maxZoom: number;
  offsetTargetRef: MutableRefObject<THREE.Vector3>;
  tiltStateRef: MutableRefObject<{ current: number; target: number }>;
  tempSphericalRef: MutableRefObject<THREE.Spherical>;
  tempOffsetRef: MutableRefObject<THREE.Vector3>;
}

export const updateCameraAndTilt = ({
  ctx,
  delta,
  minZoom,
  maxZoom,
  offsetTargetRef,
  tiltStateRef,
  tempSphericalRef,
  tempOffsetRef,
}: CameraUpdateParams) => {
  const { camera, controls, systemGroup } = ctx;
  const deltaFactor = delta > 0 ? Math.min(4, delta * 60) : 1;
  systemGroup.rotation.y = 0;
  systemGroup.rotation.x = 0;
  systemGroup.position.lerp(offsetTargetRef.current, 0.08);

  if (controls) {
    controls.minDistance = minZoom;
    controls.maxDistance = maxZoom;
    controls.minPolarAngle = Math.PI / 2;
    controls.maxPolarAngle = Math.PI / 2 + Math.PI / 6;
    const tilt = tiltStateRef.current;
    const deltaTilt = tilt.target - tilt.current;
    if (Math.abs(deltaTilt) > 0.0005) {
      tilt.current += deltaTilt * 0.18;
    }
    const appliedTilt = clamp(tilt.current, Math.PI / 2, Math.PI / 2 + Math.PI / 6);
    const target = controls.target;
    const tempOffset = tempOffsetRef.current;
    const tempSpherical = tempSphericalRef.current;
    tempOffset.copy(camera.position).sub(target);
    tempSpherical.setFromVector3(tempOffset);
    tempSpherical.phi = appliedTilt;
    tempOffset.setFromSpherical(tempSpherical).add(target);
    camera.position.copy(tempOffset);
    camera.lookAt(target);
    controls.update();
  }

  const zoomFactor = THREE.MathUtils.clamp(
    (camera.position.z - minZoom) / Math.max(1, maxZoom - minZoom),
    0,
    1,
  );

  return { zoomFactor, deltaFactor };
};
