import * as THREE from 'three';

export interface SceneSetup {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  dispose: () => void;
}

export const createScene = (container: HTMLDivElement): SceneSetup => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05070d);

  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    1000,
  );
  camera.position.set(0, 0, 170);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0xffffff, 0.35);
  const keyLight = new THREE.PointLight(0xffffff, 1.2);
  keyLight.position.set(60, 60, 100);
  scene.add(ambient);
  scene.add(keyLight);

  const dispose = () => {
    renderer.dispose();
    renderer.domElement.remove();
  };

  return { scene, camera, renderer, dispose };
};
