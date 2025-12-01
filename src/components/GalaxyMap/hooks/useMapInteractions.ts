import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import * as THREE from 'three';
import { useGalaxyMapContext } from '../providers/GalaxyMapContext';
import { useCameraController } from './useCameraController';
import { computeAnchor, resolveHitObject } from './interactionsHelpers';

interface UseMapInteractionsParams {
  onSelectRef: MutableRefObject<
    ((systemId: string, anchor: { x: number; y: number }) => void) | undefined
  >;
  onClearRef: MutableRefObject<(() => void) | undefined>;
  onPlanetSelect?: (
    planetId: string,
    systemId: string,
    anchor: { x: number; y: number },
  ) => void;
  onShipyardSelect?: (
    systemId: string,
    anchor: { x: number; y: number },
  ) => void;
}

export const useMapInteractions = ({
  onSelectRef,
  onClearRef,
  onPlanetSelect,
  onShipyardSelect,
}: UseMapInteractionsParams) => {
  const { focusOnPosition, toggleTilt, clampZoom, setZoomTarget } = useCameraController();
  const {
    sceneContext,
    cameraState: { systemGroupRef },
  } = useGalaxyMapContext();
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  useEffect(() => {
    const group = systemGroupRef.current ?? sceneContext?.systemGroup ?? null;
    if (!sceneContext || !group) {
      return undefined;
    }
    const { renderer, camera, controls } = sceneContext;
    const systemGroup = group;

    const handleContextMenu = (event: MouseEvent) => event.preventDefault();
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const target = controls.target ?? new THREE.Vector3();
      const distance = sceneContext.camera.position.distanceTo(target);
      const step = Math.max(20, distance * 0.35);
      const delta = Math.sign(event.deltaY) * step;
      const next = clampZoom(distance + delta);
      setZoomTarget(next);
    };

    const handleAuxiliaryTilt = (event: MouseEvent) => {
      if (event.button !== 1) return;
      event.preventDefault();
      event.stopPropagation();
      toggleTilt();
    };

    const handleClick = (event: MouseEvent) => {
      if (event.button !== 0 || !systemGroup.children.length) {
        return;
      }

      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = mouseRef.current;
      const raycaster = raycasterRef.current;
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(systemGroup.children, true);
      const hit = resolveHitObject(intersects);
      if (!hit) {
        onClearRef.current?.();
        return;
      }

      if (hit.visibility === 'unknown') {
        onClearRef.current?.();
        return;
      }
      const { systemId, planetId, kind, worldPos } = hit;
      focusOnPosition(worldPos, { zoom: 60 });
      const anchor = computeAnchor(worldPos, camera, {
        width: renderer.domElement.clientWidth,
        height: renderer.domElement.clientHeight,
      });
      if (kind === 'shipyard' && onShipyardSelect) {
        onShipyardSelect(systemId, anchor);
      } else if (planetId && onPlanetSelect) {
        onPlanetSelect(planetId, systemId, anchor);
      } else {
        onSelectRef.current?.(systemId, anchor);
      }
    };

    renderer.domElement.addEventListener('contextmenu', handleContextMenu);
    renderer.domElement.addEventListener('wheel', handleWheel, { passive: false });
    renderer.domElement.addEventListener('auxclick', handleAuxiliaryTilt);
    renderer.domElement.addEventListener('click', handleClick);

    return () => {
      renderer.domElement.removeEventListener('wheel', handleWheel);
      renderer.domElement.removeEventListener('auxclick', handleAuxiliaryTilt);
      renderer.domElement.removeEventListener('click', handleClick);
      renderer.domElement.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [
    sceneContext,
    systemGroupRef,
    onSelectRef,
    onClearRef,
    onPlanetSelect,
    onShipyardSelect,
    focusOnPosition,
    toggleTilt,
    clampZoom,
    setZoomTarget,
  ]);
};
