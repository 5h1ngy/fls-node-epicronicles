import * as THREE from 'three';
import type { StarClass, StarSystem } from '@domain/types';
import { createSystemEntity } from '../entities/system';
import type { StarVisual } from '../entities/star';

interface SystemBuildParams {
  group: THREE.Group;
  systems: StarSystem[];
  colonizedLookup: Map<string, { id: string; name: string }>;
  recentCombatSystems: Set<string>;
  activeBattles: Set<string>;
  starVisuals: Record<StarClass, StarVisual>;
  starRotations?: Map<string, number>;
}

export const buildSystems = ({
  group,
  systems,
  colonizedLookup,
  recentCombatSystems,
  activeBattles,
  starVisuals,
  starRotations,
}: SystemBuildParams) => {
  const positions = new Map<string, THREE.Vector3>();

  systems.forEach((system) => {
    const colonizedPlanet = colonizedLookup.get(system.id);
    const visuals = starVisuals;
    const node = createSystemEntity(
      system,
      recentCombatSystems,
      activeBattles,
      colonizedPlanet,
      visuals,
    );
    const preservedSpin = starRotations?.get(system.id);
    if (preservedSpin !== undefined) {
      const starGroup = node.getObjectByName('starVisual') as THREE.Group | null;
      if (starGroup) {
        starGroup.rotation.y = preservedSpin;
      }
    }
    group.add(node);
    positions.set(system.id, node.position.clone());
  });

  return positions;
};
