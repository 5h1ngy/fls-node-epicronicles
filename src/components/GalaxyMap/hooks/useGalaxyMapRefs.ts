import { useRef } from 'react';
import * as THREE from 'three';
import { createAnchorResolver, type AnchorEntry } from '../scene/anchors';
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
    current: Math.PI / 2,
    target: Math.PI / 2,
  });
  const tempSphericalRef = useRef(new THREE.Spherical());
  const tempOffsetRef = useRef(new THREE.Vector3());
  const systemPositionRef = useRef(new Map<string, THREE.Vector3>());
  const scienceAnchorsRef = useRef<AnchorEntry[]>([]);
  const fleetAnchorsRef = useRef<AnchorEntry[]>([]);
  const planetAngleRef = useRef(new Map<string, number>());
  const planetLookupRef = useRef(new Map<string, THREE.Object3D>());
  const systemsSignatureRef = useRef<string>('');
  const blackHoleRef = useRef<THREE.Group | null>(null);
  const nebulaRef = useRef<THREE.Group | null>(null);
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
    planetAngleRef,
    planetLookupRef,
    systemsSignatureRef,
    blackHoleRef,
    nebulaRef,
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
    planetAngleRef,
    planetLookupRef,
    systemsSignatureRef,
    blackHoleRef,
    nebulaRef,
    anchorResolverRef,
    cameraState,
    anchorState,
    syncSceneContext,
  };
};
