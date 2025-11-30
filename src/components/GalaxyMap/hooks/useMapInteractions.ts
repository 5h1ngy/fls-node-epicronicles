import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import * as THREE from 'three';
import { useGalaxyMapContext } from '../providers/GalaxyMapContext';
import { useCameraController } from './useCameraController';

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
  const { focusOnPosition, toggleTilt, syncZoomToCurrent } = useCameraController();
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
      controls.enableZoom = true;
      syncZoomToCurrent();
    };

    const handleAuxiliaryTilt = (event: MouseEvent | MouseEvent) => {
      if (event.button === 1) {
        event.preventDefault();
        event.stopPropagation();
        toggleTilt();
      }
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
      const hit = intersects.find((intersect) => {
        let obj: THREE.Object3D | null = intersect.object;
        while (obj && !obj.userData.systemId && !obj.userData.planetId && !obj.userData.kind) {
          obj = obj.parent;
        }
        return Boolean(obj?.userData.systemId);
      });
      if (!hit) {
        onClearRef.current?.();
        return;
      }
      let targetNode: THREE.Object3D | null = hit.object;
      while (
        targetNode &&
        !targetNode.userData.systemId &&
        !targetNode.userData.planetId &&
        !targetNode.userData.kind
      ) {
        targetNode = targetNode.parent;
      }
      if (!targetNode) {
        return;
      }

      if (targetNode.userData.visibility === 'unknown') {
        onClearRef.current?.();
        return;
      }
      const worldPos = new THREE.Vector3();
      targetNode.getWorldPosition(worldPos);
      const systemId = targetNode.userData.systemId as string;
      const planetId = targetNode.userData.planetId as string | undefined;
      const kind = targetNode.userData.kind as string | undefined;
      focusOnPosition(worldPos, { zoom: 60 });
      const projected = worldPos.clone().project(camera);
      const anchorX = ((projected.x + 1) / 2) * renderer.domElement.clientWidth;
      const anchorY = ((-projected.y + 1) / 2) * renderer.domElement.clientHeight;
      if (kind === 'shipyard' && onShipyardSelect) {
        onShipyardSelect(systemId, { x: anchorX, y: anchorY });
      } else if (planetId && onPlanetSelect) {
        onPlanetSelect(planetId, systemId, { x: anchorX, y: anchorY });
      } else {
        onSelectRef.current?.(systemId, {
          x: anchorX,
          y: anchorY,
        });
      }
    };

    renderer.domElement.addEventListener('contextmenu', handleContextMenu);
    renderer.domElement.addEventListener('wheel', handleWheel, { passive: false });
    renderer.domElement.addEventListener('mousedown', handleAuxiliaryTilt);
    renderer.domElement.addEventListener('auxclick', handleAuxiliaryTilt);
    renderer.domElement.addEventListener('click', handleClick);

    return () => {
      renderer.domElement.removeEventListener('wheel', handleWheel);
      renderer.domElement.removeEventListener('mousedown', handleAuxiliaryTilt);
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
    syncZoomToCurrent,
  ]);
};
