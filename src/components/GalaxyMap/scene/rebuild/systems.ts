import * as THREE from 'three';
import type { StarSystem } from '@domain/types';
import { createSystemNode } from '@three/mapUtils';

interface SystemBuildParams {
  group: THREE.Group;
  systems: StarSystem[];
  orbitBaseSpeed: number;
  colonizedLookup: Map<string, { id: string; name: string }>;
  planetAngleRef: Map<string, number>;
  planetLookupRef: Map<string, THREE.Object3D>;
  recentCombatSystems: Set<string>;
  activeBattles: Set<string>;
  starVisuals: Record<string, unknown>;
}

export const buildSystems = ({
  group,
  systems,
  orbitBaseSpeed,
  colonizedLookup,
  planetAngleRef,
  planetLookupRef,
  recentCombatSystems,
  activeBattles,
  starVisuals,
}: SystemBuildParams) => {
  const positions = new Map<string, THREE.Vector3>();

  systems.forEach((system) => {
    const colonizedPlanet = colonizedLookup.get(system.id);
    const visuals = starVisuals as Parameters<typeof createSystemNode>[7];
    const node = createSystemNode(
      system,
      orbitBaseSpeed,
      planetAngleRef,
      planetLookupRef,
      recentCombatSystems,
      activeBattles,
      colonizedPlanet,
      visuals,
    );
    group.add(node);
    positions.set(system.id, node.position.clone());
  });

  return positions;
};
