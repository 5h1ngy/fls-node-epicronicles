import * as THREE from 'three';
import type { StarSystem } from '@domain/types';
import { createGalaxyMaskTexture, createNebulaLayer } from '../background';

interface NebulaParams {
  group: THREE.Group;
  systems: StarSystem[];
  galaxyShape: 'circle' | 'spiral';
  galaxySeed: string;
  maxSystemRadius: number;
}

export const buildNebula = ({
  group,
  systems,
  galaxyShape,
  galaxySeed,
  maxSystemRadius,
}: NebulaParams) => {
  const nebulaRadius = Math.max(maxSystemRadius * 1.08, 140);
  const maskTexture = createGalaxyMaskTexture(systems, nebulaRadius);
  const nebula = createNebulaLayer({
    radius: nebulaRadius,
    shape: galaxyShape,
    seed: galaxySeed,
    mask: maskTexture,
  });
  group.add(nebula);
  return nebula;
};
