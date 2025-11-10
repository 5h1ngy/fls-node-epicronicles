import type { GalaxyState, ScienceShip, SystemVisibility } from '@domain/types';
import type { GameConfig } from '@config/gameConfig';

const visibilityRank: Record<SystemVisibility, number> = {
  unknown: 0,
  revealed: 1,
  surveyed: 2,
};

const upgradeSystemVisibility = (
  galaxy: GalaxyState,
  systemId: string,
  visibility: SystemVisibility,
): GalaxyState => {
  let updated = false;
  const systems = galaxy.systems.map((system) => {
    if (system.id !== systemId) {
      return system;
    }

    if (visibilityRank[visibility] <= visibilityRank[system.visibility]) {
      return system;
    }

    updated = true;
    return { ...system, visibility };
  });

  return updated ? { ...galaxy, systems } : galaxy;
};

const assignNextTarget = (
  ship: ScienceShip,
  galaxy: GalaxyState,
  settings: GameConfig['exploration'],
): { ship: ScienceShip; galaxy: GalaxyState } => {
  const target = galaxy.systems.find(
    (system) => system.visibility === 'unknown',
  );

  if (!target) {
    return { ship, galaxy };
  }

  const assignedShip: ScienceShip = {
    ...ship,
    status: 'traveling',
    targetSystemId: target.id,
    ticksRemaining: Math.max(1, settings.travelTicks),
  };

  const updatedGalaxy = upgradeSystemVisibility(galaxy, target.id, 'revealed');
  return { ship: assignedShip, galaxy: updatedGalaxy };
};

const tickShip = (
  ship: ScienceShip,
  galaxy: GalaxyState,
  settings: GameConfig['exploration'],
): { ship: ScienceShip; galaxy: GalaxyState } => {
  let updatedShip = ship;
  let updatedGalaxy = galaxy;

  if (updatedShip.status === 'traveling') {
    const ticksRemaining = Math.max(0, updatedShip.ticksRemaining - 1);
    updatedShip = { ...updatedShip, ticksRemaining };

    if (ticksRemaining === 0 && updatedShip.targetSystemId) {
      updatedShip = {
        ...updatedShip,
        status: 'surveying',
        currentSystemId: updatedShip.targetSystemId,
        targetSystemId: null,
        ticksRemaining: Math.max(1, settings.surveyTicks),
      };
      updatedGalaxy = upgradeSystemVisibility(
        updatedGalaxy,
        updatedShip.currentSystemId,
        'revealed',
      );
    }
  } else if (updatedShip.status === 'surveying') {
    const ticksRemaining = Math.max(0, updatedShip.ticksRemaining - 1);
    updatedShip = { ...updatedShip, ticksRemaining };

    if (ticksRemaining === 0) {
      updatedShip = {
        ...updatedShip,
        status: 'idle',
        ticksRemaining: 0,
      };
      updatedGalaxy = upgradeSystemVisibility(
        updatedGalaxy,
        updatedShip.currentSystemId,
        'surveyed',
      );
    }
  }

  if (updatedShip.status === 'idle' && updatedShip.autoExplore) {
    return assignNextTarget(updatedShip, updatedGalaxy, settings);
  }

  return { ship: updatedShip, galaxy: updatedGalaxy };
};

export const createInitialScienceShips = (
  galaxy: GalaxyState,
): ScienceShip[] => {
  if (galaxy.systems.length === 0) {
    return [];
  }

  const homeSystem = galaxy.systems[0];

  return [
    {
      id: `SCI-${crypto.randomUUID()}`,
      name: 'ISS Pathfinder',
      currentSystemId: homeSystem.id,
      targetSystemId: null,
      status: 'idle',
      ticksRemaining: 0,
      autoExplore: true,
    },
  ];
};

export const advanceExploration = (
  galaxy: GalaxyState,
  ships: ScienceShip[],
  settings: GameConfig['exploration'],
): { galaxy: GalaxyState; scienceShips: ScienceShip[] } => {
  if (ships.length === 0) {
    return { galaxy, scienceShips: ships };
  }

  let updatedGalaxy = galaxy;

  const updatedShips = ships.map((ship) => {
    const result = tickShip(ship, updatedGalaxy, settings);
    updatedGalaxy = result.galaxy;
    return result.ship;
  });

  return {
    galaxy: updatedGalaxy,
    scienceShips: updatedShips,
  };
};


