import { useEffect } from 'react';
import type { MutableRefObject } from 'react';
import * as THREE from 'three';
import { useGalaxyMapContext } from './GalaxyMapContext';

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

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
  const {
    sceneContext,
    minZoom,
    maxZoom,
    baseTilt,
    maxTiltDown,
    refs: { systemGroupRef, tiltStateRef, offsetTargetRef, zoomTargetRef },
  } = useGalaxyMapContext();

  useEffect(() => {
    if (!sceneContext || !systemGroupRef.current) {
      return undefined;
    }
    const { renderer, camera, controls } = sceneContext;
    const systemGroup = systemGroupRef.current;

    let isPanning = false;
    let lastPointer = { x: 0, y: 0 };

    const handleContextMenu = (event: MouseEvent) => event.preventDefault();
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      controls.enableZoom = true;
    };

    const handleMouseDown = (event: MouseEvent) => {
      if (event.button === 1) {
        event.preventDefault();
        event.stopPropagation();
        const isAtMax =
          Math.abs(tiltStateRef.current.target - maxTiltDown) < 0.01;
        tiltStateRef.current.target = isAtMax ? baseTilt : maxTiltDown;
        return;
      }
      if (event.button === 2) {
        isPanning = true;
        lastPointer = { x: event.clientX, y: event.clientY };
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isPanning) {
        return;
      }
      const deltaX = event.clientX - lastPointer.x;
      const deltaY = event.clientY - lastPointer.y;
      lastPointer = { x: event.clientX, y: event.clientY };
      const panScale = (camera.position.z / 400) * 0.8;
      offsetTargetRef.current.x += deltaX * -panScale;
      offsetTargetRef.current.y += deltaY * panScale;
    };

    const handleMouseUp = (event: MouseEvent) => {
      if (event.button === 2) {
        isPanning = false;
      }
    };

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = (event: MouseEvent) => {
      if (event.button !== 0 || !systemGroup.children.length) {
        return;
      }

      const rect = renderer.domElement.getBoundingClientRect();
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
      offsetTargetRef.current.set(-worldPos.x, -worldPos.y, 0);
      zoomTargetRef.current = clamp(60, minZoom, maxZoom);
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
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('click', handleClick);

    return () => {
      renderer.domElement.removeEventListener('wheel', handleWheel);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('click', handleClick);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [
    sceneContext,
    minZoom,
    maxZoom,
    baseTilt,
    maxTiltDown,
    tiltStateRef,
    offsetTargetRef,
    zoomTargetRef,
    systemGroupRef,
    onSelectRef,
    onClearRef,
    onPlanetSelect,
    onShipyardSelect,
  ]);
};
