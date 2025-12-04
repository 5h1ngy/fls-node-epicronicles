import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useGalaxyMapContext } from '../providers/GalaxyMapContext';
import { useCameraController } from './useCameraController';

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
  const { focusOnPosition, focusOnObject, clampZoom } = useCameraController();
  const {
    cameraState: { systemGroupRef },
    sceneContext,
  } = useGalaxyMapContext();
  const lastFocusSystemRef = useRef<string | null>(null);
  const lastFocusPlanetRef = useRef<string | null>(null);
  const lastFocusAppliedRef = useRef<{ id: string | null; trigger: number }>(
    { id: null, trigger: -1 },
  );

  useEffect(() => {
    if (sceneContext) {
      lastFocusAppliedRef.current = { id: null, trigger: -1 };
      lastFocusSystemRef.current = null;
      lastFocusPlanetRef.current = null;
    }
  }, [sceneContext]);

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
    };
    focusOnPosition(pos, { zoom: 60, immediate: true });
    lastFocusSystemRef.current = focusSystemId;
    lastFocusAppliedRef.current = { id: focusSystemId, trigger: focusTrigger };
  }, [
    focusSystemId,
    focusPlanetId,
    systems,
    onClearFocus,
    focusTrigger,
    focusOnPosition,
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
      focusOnObject(planetObj, { zoom: clampZoom(70), immediate: true });
      lastFocusPlanetRef.current = focusPlanetId;
      return;
    }
    const system = systems.find((entry) => entry.id === focusSystemId) ?? null;
    if (system) {
      const pos = {
        x: system.mapPosition?.x ?? system.position.x,
        y: system.mapPosition?.y ?? system.position.y,
      };
      focusOnPosition(pos, { zoom: 60, immediate: true });
    }
    lastFocusPlanetRef.current = focusPlanetId;
  }, [
    focusPlanetId,
    systems,
    focusSystemId,
    focusOnObject,
    focusOnPosition,
    clampZoom,
    systemGroupRef,
  ]);
};
