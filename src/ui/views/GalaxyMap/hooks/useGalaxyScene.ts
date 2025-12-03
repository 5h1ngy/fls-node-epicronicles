import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import * as THREE from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { useGalaxySceneSetup } from './useGalaxySceneSetup';

export interface GalaxySceneContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  composer: EffectComposer | null;
  clock: THREE.Clock;
  systemGroup: THREE.Group;
}

interface UseGalaxySceneOptions {
  containerRef: RefObject<HTMLDivElement | null>;
  minZoom: number;
  maxZoom: number;
  onFrame: (ctx: GalaxySceneContext, delta: number, elapsed: number) => void;
}

export const useGalaxyScene = ({
  containerRef,
  minZoom,
  maxZoom,
  onFrame,
}: UseGalaxySceneOptions): GalaxySceneContext | null => {
  const context = useGalaxySceneSetup({ containerRef, minZoom, maxZoom });
  const animationRef = useRef<number | null>(null);
  const contextRef = useRef<GalaxySceneContext | null>(null);

  useEffect(() => {
    contextRef.current = context ?? null;
  }, [context]);

  useEffect(() => {
    if (!context) {
      return undefined;
    }
    const { renderer, camera, composer } = context;
    const handleResize = () => {
      const container = containerRef.current;
      if (!container) return;
      renderer.setSize(container.clientWidth, container.clientHeight);
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      composer?.setSize(container.clientWidth, container.clientHeight);
      // Aggiorna eventuali pass aggiuntivi (gestito nel setup hook)
    };
    window.addEventListener('resize', handleResize);

    const renderLoop = () => {
      const current = contextRef.current;
      if (!current) {
        return;
      }
      const delta = current.clock.getDelta();
      const elapsed =
        typeof current.clock.elapsedTime === 'number'
          ? current.clock.elapsedTime
          : current.clock.getElapsedTime();
      onFrame(current, delta, elapsed);
      if (current.composer) {
        current.composer.render();
      } else {
        current.renderer.render(current.scene, current.camera);
      }
      animationRef.current = requestAnimationFrame(renderLoop);
    };
    animationRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [context, containerRef, onFrame]);

  return context ?? null;
};
