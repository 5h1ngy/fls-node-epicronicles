import {
  CanvasTexture,
  LinearFilter,
  ClampToEdgeWrapping,
  DataTexture,
  RGBFormat,
} from 'three';
import type { Texture } from 'three';

const starGlowTexture = (() => {
  let cache: CanvasTexture | null = null;
  return () => {
    if (cache) {
      return cache;
    }
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return null;
    }
    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      size * 0.08,
      size / 2,
      size / 2,
      size * 0.5,
    );
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.4, 'rgba(255,255,255,0.65)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    cache = new CanvasTexture(canvas);
    cache.needsUpdate = true;
    cache.minFilter = LinearFilter;
    cache.magFilter = LinearFilter;
    cache.wrapS = ClampToEdgeWrapping;
    cache.wrapT = ClampToEdgeWrapping;
    return cache;
  };
})();

const starStreakTexture = (() => {
  let cache: CanvasTexture | null = null;
  return () => {
    if (cache) {
      return cache;
    }
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return null;
    }
    const gradient = ctx.createLinearGradient(0, size / 2, size, size / 2);
    gradient.addColorStop(0, 'rgba(255,255,255,0)');
    gradient.addColorStop(0.2, 'rgba(255,255,255,0.55)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.9)');
    gradient.addColorStop(0.8, 'rgba(255,255,255,0.55)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, size / 2 - size * 0.08, size, size * 0.16);
    cache = new CanvasTexture(canvas);
    cache.needsUpdate = true;
    cache.minFilter = LinearFilter;
    cache.magFilter = LinearFilter;
    cache.wrapS = ClampToEdgeWrapping;
    cache.wrapT = ClampToEdgeWrapping;
    return cache;
  };
})();

const getStarCoreTexture = (() => {
  let cache: Texture | null = null;
  return () => {
    if (cache) {
      return cache;
    }
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      const data = new Uint8Array(size * size * 3).fill(255);
      const tex = new DataTexture(data, size, size, RGBFormat);
      tex.needsUpdate = true;
      cache = tex;
      return tex;
    }
    const imgData = ctx.createImageData(size, size);
    let seed = 1337;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const dx = x - size / 2;
        const dy = y - size / 2;
        const r = Math.sqrt(dx * dx + dy * dy) / (size * 0.5);
        const falloff = Math.max(0, 1 - r);
        const noise = (rand() * 0.5 + rand() * 0.35) * falloff;
        const value = Math.min(1, 0.5 * falloff + noise);
        const idx = (y * size + x) * 4;
        const channel = Math.floor(value * 255);
        imgData.data[idx] = channel;
        imgData.data[idx + 1] = channel;
        imgData.data[idx + 2] = channel;
        imgData.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    const tex = new CanvasTexture(canvas);
    tex.needsUpdate = true;
    tex.minFilter = LinearFilter;
    tex.magFilter = LinearFilter;
    tex.wrapS = ClampToEdgeWrapping;
    tex.wrapT = ClampToEdgeWrapping;
    cache = tex;
    return tex;
  };
})();

const createStarBurstTexture = (() => {
  let cache: CanvasTexture | null = null;
  return () => {
    if (cache) {
      return cache;
    }
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return null;
    }
    ctx.translate(size / 2, size / 2);
    const radial = ctx.createRadialGradient(0, 0, size * 0.04, 0, 0, size * 0.5);
    radial.addColorStop(0, 'rgba(255,255,255,1)');
    radial.addColorStop(0.25, 'rgba(255,255,255,0.65)');
    radial.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = radial;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
    ctx.fill();

    const drawSpike = (width: number, opacity: number, angle: number) => {
      ctx.save();
      ctx.rotate(angle);
      const grad = ctx.createLinearGradient(-size / 2, 0, size / 2, 0);
      grad.addColorStop(0, `rgba(255,255,255,0)`);
      grad.addColorStop(0.5, `rgba(255,255,255,${opacity})`);
      grad.addColorStop(1, `rgba(255,255,255,0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(-size / 2, -width / 2, size, width);
      ctx.restore();
    };

    drawSpike(size * 0.08, 0.6, 0);
    drawSpike(size * 0.05, 0.4, Math.PI / 4);

    cache = new CanvasTexture(canvas);
    cache.needsUpdate = true;
    cache.minFilter = LinearFilter;
    cache.magFilter = LinearFilter;
    cache.wrapS = ClampToEdgeWrapping;
    cache.wrapT = ClampToEdgeWrapping;
    return cache;
  };
})();

export { starGlowTexture, starStreakTexture, getStarCoreTexture, createStarBurstTexture };
