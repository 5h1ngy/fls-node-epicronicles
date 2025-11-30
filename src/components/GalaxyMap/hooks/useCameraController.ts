import * as THREE from 'three';
import { useCallback, useMemo } from 'react';
import { useGalaxyMapContext } from './GalaxyMapContext';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export interface FocusOptions {
  zoom?: number;
  immediate?: boolean;
}

export const useCameraController = () => {
  const {
    sceneContext,
    minZoom,
    maxZoom,
    baseTilt,
    maxTiltDown,
    cameraState: {
      cameraRef,
      offsetTargetRef,
      zoomTargetRef,
      zoomTargetDirtyRef,
      tiltStateRef,
    },
  } = useGalaxyMapContext();

  const clampZoom = useCallback(
    (value: number) => clamp(value, minZoom, maxZoom),
    [minZoom, maxZoom],
  );

  const focusOnPosition = useCallback(
    (pos: { x: number; y: number; z?: number } | THREE.Vector3, options?: FocusOptions) => {
      const zoom = options?.zoom ?? zoomTargetRef.current;
      const targetZoom = clampZoom(zoom);
      const targetVector =
        pos instanceof THREE.Vector3 ? pos : new THREE.Vector3(pos.x, pos.y, pos.z ?? 0);
      if (sceneContext?.controls) {
        sceneContext.controls.target.copy(targetVector);
        sceneContext.controls.update();
      }
      offsetTargetRef.current.copy(targetVector);
      zoomTargetRef.current = targetZoom;
      zoomTargetDirtyRef.current = true;
      if (options?.immediate && cameraRef.current) {
        const camera = cameraRef.current;
        const currentTarget = sceneContext?.controls?.target ?? targetVector;
        const offset = camera.position.clone().sub(currentTarget);
        if (offset.lengthSq() === 0) {
          offset.set(0, 0, targetZoom);
        } else {
          offset.setLength(targetZoom);
        }
        camera.position.copy(offset.add(currentTarget));
      }
    },
    [
      clampZoom,
      offsetTargetRef,
      zoomTargetRef,
      zoomTargetDirtyRef,
      cameraRef,
      sceneContext,
    ],
  );

  const focusOnObject = useCallback(
    (object: THREE.Object3D, options?: FocusOptions) => {
      const worldPos = new THREE.Vector3();
      object.getWorldPosition(worldPos);
      focusOnPosition(worldPos, options);
    },
    [focusOnPosition],
  );

  const toggleTilt = useCallback(() => {
    const tilt = tiltStateRef.current;
    const isAtMax = Math.abs(tilt.target - maxTiltDown) < 0.01;
    tilt.target = isAtMax ? baseTilt : maxTiltDown;
  }, [baseTilt, maxTiltDown, tiltStateRef]);

  const setZoomTarget = useCallback(
    (value: number, { immediate = false }: { immediate?: boolean } = {}) => {
      const next = clampZoom(value);
      zoomTargetRef.current = next;
      zoomTargetDirtyRef.current = !immediate;
      if (immediate && cameraRef.current) {
        cameraRef.current.position.z = next;
      }
    },
    [clampZoom, zoomTargetRef, zoomTargetDirtyRef, cameraRef],
  );

  const syncZoomToCurrent = useCallback(() => {
    const ctx = sceneContext;
    if (!ctx) {
      return;
    }
    const distance = ctx.camera.position.distanceTo(ctx.controls?.target ?? new THREE.Vector3());
    setZoomTarget(distance, { immediate: true });
    zoomTargetDirtyRef.current = false;
  }, [sceneContext, setZoomTarget, zoomTargetDirtyRef]);

  return useMemo(
    () => ({
      clampZoom,
      focusOnPosition,
      focusOnObject,
      toggleTilt,
      setZoomTarget,
      syncZoomToCurrent,
    }),
    [clampZoom, focusOnPosition, focusOnObject, toggleTilt, setZoomTarget, syncZoomToCurrent],
  );
};
