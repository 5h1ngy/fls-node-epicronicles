import type { StarSystem } from '@domain/types';

export const makeSeededRandom = (seed: string) => {
  let t =
    seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) +
    0x6d2b79f5;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
};

export const toMapPosition = (system: StarSystem) => ({
  x: system.mapPosition?.x ?? system.position.x,
  y: system.mapPosition?.y ?? system.position.y,
  z: system.mapPosition?.z ?? 0,
});

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);
