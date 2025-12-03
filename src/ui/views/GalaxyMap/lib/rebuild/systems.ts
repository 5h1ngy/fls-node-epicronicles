import * as THREE from 'three';
import type { StarSystem } from '@domain/types';
import { createSystemNode } from '../map/systemNodes';

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
  starRotations?: Map<string, number>;
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
  starRotations,
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
    const preservedSpin = starRotations?.get(system.id);
    if (preservedSpin !== undefined) {
      const starGroup = node.getObjectByName('starVisual') as THREE.Group | null;
      if (starGroup) {
        starGroup.rotation.z = preservedSpin;
      }
    }
    group.add(node);
    positions.set(system.id, node.position.clone());
  });

  return positions;
};
