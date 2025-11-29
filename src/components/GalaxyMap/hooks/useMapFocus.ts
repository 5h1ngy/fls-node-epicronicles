import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { clamp } from '../scene/utils';
import { useGalaxyMapContext } from './GalaxyMapContext';

export interface MapFocusParams {
  focusSystemId: string | null;
  focusPlanetId: string | null;
  focusTrigger: number;
  systems: Array<{
    id: string;
    visibility: string;
    position: { x: number; y: number };
    mapPosition?: { x: number; y: number; z?: number };
  }>;
  onClearFocus?: () => void;
}

export const useMapFocus = ({
  focusSystemId,
  focusPlanetId,
  focusTrigger,
  systems,
  onClearFocus,
}: MapFocusParams) => {
  const {
    minZoom,
    maxZoom,
    refs: {
      systemGroupRef,
      cameraRef,
      offsetTargetRef,
      zoomTargetRef,
    },
  } = useGalaxyMapContext();
  const lastFocusSystemRef = useRef<string | null>(null);
  const lastFocusPlanetRef = useRef<string | null>(null);
  const lastFocusAppliedRef = useRef<{ id: string | null; trigger: number }>(
    { id: null, trigger: -1 },
  );

  useEffect(() => {
    if (!focusSystemId || focusPlanetId) {
      if (!focusSystemId) {
        lastFocusSystemRef.current = null;
        lastFocusAppliedRef.current = { id: null, trigger: -1 };
      }
      return;
    }
    const alreadyApplied =
      lastFocusAppliedRef.current.id === focusSystemId &&
      lastFocusAppliedRef.current.trigger === focusTrigger;
    if (alreadyApplied) {
      return;
    }
    const target = systems.find((system) => system.id === focusSystemId);
    if (!target) {
      return;
    }
    if (target.visibility === 'unknown') {
      onClearFocus?.();
      return;
    }
    const pos = {
      x: target.mapPosition?.x ?? target.position.x,
      y: target.mapPosition?.y ?? target.position.y,
      z: target.mapPosition?.z ?? 0,
    };
    offsetTargetRef.current.set(-pos.x, -pos.y, 0);
    const group = systemGroupRef.current;
    if (group) {
      group.position.copy(offsetTargetRef.current);
    }
    zoomTargetRef.current = clamp(60, minZoom, maxZoom);
    if (cameraRef.current) {
      cameraRef.current.position.z = zoomTargetRef.current;
    }
    lastFocusSystemRef.current = focusSystemId;
    lastFocusAppliedRef.current = { id: focusSystemId, trigger: focusTrigger };
  }, [
    focusSystemId,
    focusPlanetId,
    systems,
    onClearFocus,
    focusTrigger,
    minZoom,
    maxZoom,
    offsetTargetRef,
    systemGroupRef,
    cameraRef,
    zoomTargetRef,
  ]);

  useEffect(() => {
    if (!focusPlanetId) {
      lastFocusPlanetRef.current = null;
      return;
    }
    if (lastFocusPlanetRef.current === focusPlanetId) {
      return;
    }
    const planetObj = systemGroupRef.current?.getObjectByProperty(
      'userData.planetId',
      focusPlanetId,
    ) as THREE.Object3D | null;
    if (planetObj) {
      const worldPos = new THREE.Vector3();
      planetObj.getWorldPosition(worldPos);
      const group = systemGroupRef.current;
      if (group) {
        const desiredOffset = new THREE.Vector3(-worldPos.x, -worldPos.y, 0);
        offsetTargetRef.current.copy(desiredOffset);
        group.position.copy(desiredOffset);
      } else {
        offsetTargetRef.current.set(-worldPos.x, -worldPos.y, 0);
      }
      zoomTargetRef.current = clamp(70, minZoom, maxZoom);
      if (cameraRef.current) {
        cameraRef.current.position.z = zoomTargetRef.current;
      }
      lastFocusPlanetRef.current = focusPlanetId;
      return;
    }
    const system = systems.find((entry) => entry.id === focusSystemId) ?? null;
    if (system) {
      const pos = {
        x: system.mapPosition?.x ?? system.position.x,
        y: system.mapPosition?.y ?? system.position.y,
      };
      offsetTargetRef.current.set(-pos.x, -pos.y, 0);
      const group = systemGroupRef.current;
      if (group) {
        group.position.copy(offsetTargetRef.current);
      }
      zoomTargetRef.current = clamp(60, minZoom, maxZoom);
      if (cameraRef.current) {
        cameraRef.current.position.z = zoomTargetRef.current;
      }
    }
    lastFocusPlanetRef.current = focusPlanetId;
  }, [
    focusPlanetId,
    systems,
    focusSystemId,
    minZoom,
    maxZoom,
    offsetTargetRef,
    systemGroupRef,
    cameraRef,
    zoomTargetRef,
  ]);
};
