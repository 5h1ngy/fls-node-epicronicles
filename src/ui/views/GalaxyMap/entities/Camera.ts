import * as THREE from 'three';
import type { MutableRefObject } from 'react';
import type { GalaxySceneContext } from '../hooks/useGalaxyScene';
import { SceneEntityBase } from './SpaceshipsBase';

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export interface CameraUpdateParams {
  ctx: GalaxySceneContext;
  delta: number;
  minZoom: number;
  maxZoom: number;
  minTilt: number;
  maxTilt: number;
  offsetTargetRef: MutableRefObject<THREE.Vector3>;
  zoomTargetRef: MutableRefObject<number>;
  zoomTargetDirtyRef: MutableRefObject<boolean>;
  tiltStateRef: MutableRefObject<{ current: number; target: number }>;
  tempSphericalRef: MutableRefObject<THREE.Spherical>;
  tempOffsetRef: MutableRefObject<THREE.Vector3>;
}

export class CameraEntity extends SceneEntityBase {
  setup(): void {
    // nothing to init
  }

  rebuild(): void {
    // camera has no rebuild step
  }

  update({
    ctx,
    delta,
    minZoom,
    maxZoom,
    minTilt,
    maxTilt,
    offsetTargetRef,
    zoomTargetRef,
    zoomTargetDirtyRef,
    tiltStateRef,
    tempSphericalRef,
    tempOffsetRef,
  }: CameraUpdateParams) {
    const { camera, controls, systemGroup } = ctx;
    const target = controls?.target ?? new THREE.Vector3();
    systemGroup.rotation.y = 0;
    systemGroup.rotation.x = 0;
    offsetTargetRef.current.copy(target);

    if (controls) {
      controls.minDistance = minZoom;
      controls.maxDistance = maxZoom;
      controls.minPolarAngle = minTilt;
      controls.maxPolarAngle = maxTilt;
    }

    const tilt = tiltStateRef.current;
    const deltaTilt = tilt.target - tilt.current;
    if (Math.abs(deltaTilt) > 0.0005) {
      tilt.current += deltaTilt * 0.18;
    }
    const appliedTilt = clamp(tilt.current, minTilt, maxTilt);
    const tempOffset = tempOffsetRef.current;
    const tempSpherical = tempSphericalRef.current;
    tempOffset.copy(camera.position).sub(target);
    tempSpherical.setFromVector3(tempOffset);
    tempSpherical.theta = 0;
    tempSpherical.phi = appliedTilt;
    const currentRadius = tempSpherical.radius;
    if (zoomTargetDirtyRef.current) {
      const nextRadius = THREE.MathUtils.lerp(
        currentRadius,
        zoomTargetRef.current,
        0.1,
      );
      tempSpherical.radius = nextRadius;
      if (Math.abs(nextRadius - zoomTargetRef.current) < 0.1) {
        zoomTargetDirtyRef.current = false;
      }
    } else {
      zoomTargetRef.current = currentRadius;
    }
    tempOffset.setFromSpherical(tempSpherical).add(target);
    camera.position.copy(tempOffset);
    camera.lookAt(target);
    controls?.update();

    const radius = camera.position.distanceTo(target);
    const zoomFactor = THREE.MathUtils.clamp((radius - minZoom) / Math.max(1, maxZoom - minZoom), 0, 1);

    return { zoomFactor, deltaFactor: delta > 0 ? Math.min(4, delta * 60) : 1 };
  }
}
