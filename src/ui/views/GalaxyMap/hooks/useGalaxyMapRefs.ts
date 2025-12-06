import { useRef } from 'react';
import * as THREE from 'three';
import { createAnchorResolver, type AnchorEntry } from '../lib/anchors';
import { BASE_TILT } from '../lib/config';
import type { GalaxySceneContext } from './useGalaxyScene';

export type GalaxyMapRefs = ReturnType<typeof useGalaxyMapRefs>;

export const useGalaxyMapRefs = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const systemGroupRef = useRef<THREE.Group | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const offsetTargetRef = useRef(new THREE.Vector3(0, 0, 0));
  const zoomTargetRef = useRef(170);
  const zoomTargetDirtyRef = useRef(false);
  const tiltStateRef = useRef<{ current: number; target: number }>({
    current: BASE_TILT,
    target: BASE_TILT,
  });
  const tempSphericalRef = useRef(new THREE.Spherical());
  const tempOffsetRef = useRef(new THREE.Vector3());
  const systemPositionRef = useRef(new Map<string, THREE.Vector3>());
  const scienceAnchorsRef = useRef<AnchorEntry[]>([]);
  const fleetAnchorsRef = useRef<AnchorEntry[]>([]);
  const systemsSignatureRef = useRef<string>('');
  const anchorResolverRef = useRef<ReturnType<typeof createAnchorResolver> | null>(null);

  const syncSceneContext = (sceneContext: GalaxySceneContext | null) => {
    if (!sceneContext) {
      return;
    }
    cameraRef.current = sceneContext.camera;
    systemGroupRef.current = sceneContext.systemGroup;
  };

  const cameraState = {
    systemGroupRef,
    cameraRef,
    offsetTargetRef,
    zoomTargetRef,
    zoomTargetDirtyRef,
    tiltStateRef,
    tempSphericalRef,
    tempOffsetRef,
  };

  const anchorState = {
    systemPositionRef,
    scienceAnchorsRef,
    fleetAnchorsRef,
    systemsSignatureRef,
    anchorResolverRef,
  };

  return {
    containerRef,
    systemGroupRef,
    cameraRef,
    offsetTargetRef,
    zoomTargetRef,
    zoomTargetDirtyRef,
    tiltStateRef,
    tempSphericalRef,
    tempOffsetRef,
    systemPositionRef,
    scienceAnchorsRef,
    fleetAnchorsRef,
    systemsSignatureRef,
    anchorResolverRef,
    cameraState,
    anchorState,
    syncSceneContext,
  };
};
