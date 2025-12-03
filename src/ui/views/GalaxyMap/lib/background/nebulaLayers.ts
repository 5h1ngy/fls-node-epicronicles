import * as THREE from 'three';
import { createFallbackMask } from './mask';
import { buildNebulaParticles } from './nebulaParticles';
import { buildNebulaFog } from './nebulaFog';
import { buildNebulaStarfield } from './nebulaStarfield';
import type { NebulaShape } from './nebulaSampling';

export const createNebulaLayer = ({
  radius,
  shape,
  seed,
  mask,
}: {
  radius: number;
  shape: NebulaShape;
  seed: string;
  mask: THREE.Texture | null;
}): THREE.Group => {
  const group = new THREE.Group();
  group.name = 'nebula';
  const maskTexture = mask ?? createFallbackMask();
  group.userData.maskTexture = maskTexture;
  group.userData.maskOwned = Boolean(mask);

  const baseColors = [
    new THREE.Color('#3b6fcf'),
    new THREE.Color('#72e3ff'),
    new THREE.Color('#c39bff'),
  ];

  const particles = buildNebulaParticles({
    radius,
    shape,
    seed,
    maskTexture,
    baseColors,
  });
  group.add(particles);

  const fog = buildNebulaFog({
    radius,
    shape,
    seed,
    baseColors,
  });
  group.add(fog);

  const starfield = buildNebulaStarfield({
    radius,
    shape,
    seed,
    baseColors,
  });
  if (starfield) {
    group.add(starfield);
  }

  return group;
};
