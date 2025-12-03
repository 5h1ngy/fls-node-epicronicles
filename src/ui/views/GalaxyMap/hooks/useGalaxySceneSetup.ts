import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { createScene } from '@three/scene';
import type { GalaxySceneContext } from './useGalaxyScene';

interface UseGalaxySceneSetupOptions {
  containerRef: RefObject<HTMLDivElement | null>;
  minZoom: number;
  maxZoom: number;
}

export const useGalaxySceneSetup = ({
  containerRef,
  minZoom,
  maxZoom,
}: UseGalaxySceneSetupOptions) => {
  const contextRef = useRef<GalaxySceneContext | null>(null);
  const [context, setContext] = useState<GalaxySceneContext | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const { scene, camera, renderer, dispose } = createScene(container);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio ?? 1, 2));

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enabled = true;
    controls.enablePan = true;
    controls.screenSpacePanning = true;
    controls.enableRotate = false;
    controls.enableZoom = false; // gestito a mano per evitare side-effect su tilt
    controls.minDistance = minZoom;
    controls.maxDistance = maxZoom;
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE, // rotation disabilitata, click sinistro non muove
      MIDDLE: THREE.MOUSE.ROTATE, // click centrale gestito a mano, nessun drag
      RIGHT: THREE.MOUSE.PAN,
    };
    controls.minAzimuthAngle = 0;
    controls.maxAzimuthAngle = 0;
    controls.minPolarAngle = Math.PI / 2;
    controls.maxPolarAngle = Math.PI / 2 + Math.PI / 6;

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(container.clientWidth, container.clientHeight),
      0.3,
      0.5,
      0.2,
    );
    composer.addPass(bloomPass);

    const systemGroup = new THREE.Group();
    systemGroup.name = 'systemGroup';
    scene.add(systemGroup);

    const clock = new THREE.Clock();

    const ctx: GalaxySceneContext = {
      scene,
      camera,
      renderer,
      controls,
      composer,
      clock,
      systemGroup,
    };
    contextRef.current = ctx;
    setContext(ctx);

    const handleResize = () => {
      renderer.setSize(container.clientWidth, container.clientHeight);
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      composer?.setSize(container.clientWidth, container.clientHeight);
      bloomPass.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      composer?.dispose();
      dispose();
      contextRef.current = null;
      setContext(null);
    };
  }, [containerRef, minZoom, maxZoom]);

  return context;
};
