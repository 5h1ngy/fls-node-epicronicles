import * as THREE from 'three';
import type { StarSystem } from '@domain/types';
import { toMapPosition } from '../utils';

export const createGalaxyMaskTexture = (
  systems: StarSystem[],
  radius: number,
): THREE.Texture | null => {
  if (systems.length === 0) {
    return null;
  }
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return null;
  }
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, size, size);
  ctx.globalCompositeOperation = 'lighter';
  const baseRadius = size * 0.022;
  systems.forEach((system) => {
    const pos = toMapPosition(system);
    const nx = pos.x / Math.max(1, radius * 1.05);
    const ny = pos.y / Math.max(1, radius * 1.05);
    const px = size * 0.5 + nx * size * 0.45;
    const py = size * 0.5 + ny * size * 0.45;
    const r = baseRadius * (0.6 + Math.random() * 0.9);
    const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
    grad.addColorStop(0, 'rgba(255,255,255,0.4)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.filter = 'blur(3px)';
  const blurred = ctx.getImageData(0, 0, size, size);
  ctx.putImageData(blurred, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
};

export const createFallbackMask = (() => {
  let cache: THREE.DataTexture | null = null;
  return () => {
    if (cache) {
      return cache;
    }
    const data = new Uint8Array([255, 255, 255, 255]);
    const tex = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
    tex.needsUpdate = true;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    cache = tex;
    return tex;
  };
})();
