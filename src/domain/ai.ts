import type { GalaxyState, Fleet, GameSession } from './types';
import { createInitialFleet } from './ships';
import { calculateTravelTicks } from './fleets';
import type { MilitaryConfig, DiplomacyConfig } from '../config/gameConfig';

const chooseTargetSystem = (
  galaxy: GalaxyState,
  avoidSystemId: string,
  preferHostile: boolean,
): string | null => {
  const hostile = galaxy.systems.filter(
    (system) =>
      (system.hostilePower ?? 0) > 0 && system.id !== avoidSystemId,
  );
  if (preferHostile && hostile.length > 0) {
    return hostile[Math.floor(Math.random() * hostile.length)]?.id ?? null;
  }
  const nonHostile = galaxy.systems.filter(
    (system) => (system.hostilePower ?? 0) === 0 && system.id !== avoidSystemId,
  );
  const pool = hostile.length > 0 ? hostile : nonHostile;
  if (pool.length === 0) {
    return null;
  }
  return pool[Math.floor(Math.random() * pool.length)]?.id ?? null;
};

export const ensureAiFleet = (
  session: GameSession,
  military: MilitaryConfig,
  diplomacy: DiplomacyConfig,
): GameSession => {
  const hostileSystems = session.galaxy.systems.filter(
    (system) => (system.hostilePower ?? 0) > 0,
  ).length;
  const desiredAiFleets =
    hostileSystems >= 5 ? 3 : hostileSystems >= 3 ? 2 : 1;
  const aiFleets = session.fleets.filter(
    (fleet) => fleet.ownerId && fleet.ownerId !== 'player',
  );
  if (aiFleets.length >= desiredAiFleets) {
    return session;
  }
  const homeSystem = session.galaxy.systems[1]?.id ?? session.galaxy.systems[0]?.id;
  if (!homeSystem) {
    return session;
  }
  const size =
    diplomacy.aiFleetStrength.baseShips +
    Math.min(
      hostileSystems * diplomacy.aiFleetStrength.extraPerHostile,
      diplomacy.aiFleetStrength.maxShips,
    );
  const ships: Fleet['ships'] = [];
  for (let idx = 0; idx < size; idx += 1) {
    const design = military.shipDesigns[idx % military.shipDesigns.length];
    const boost =
      hostileSystems >= 5 ? 6 : hostileSystems >= 3 ? 3 : hostileSystems >= 1 ? 1 : 0;
    ships.push({
      id: `SHIP-${crypto.randomUUID()}`,
      designId: design.id,
      hullPoints: design.hullPoints + boost,
    });
  }
  const newFleet: Fleet = {
    ...createInitialFleet(homeSystem, military, 'ai-1'),
    name: `Flotta AI ${aiFleets.length + 1}`,
    ships,
  };
  return {
    ...session,
    fleets: [...session.fleets, newFleet],
  };
};

export const advanceAiWarMoves = ({
  session,
  military,
}: {
  session: GameSession;
  military: MilitaryConfig;
}): GameSession => {
  const aiEmpires = session.empires.filter(
    (empire) => empire.kind === 'ai' && empire.warStatus === 'war',
  );
  if (aiEmpires.length === 0) {
    return session;
  }
  const fleets = session.fleets.map((fleet) => ({ ...fleet }));
  let changed = false;
  aiEmpires.forEach((empire) => {
    const fleet = fleets.find((entry) => entry.ownerId === empire.id);
    if (!fleet || fleet.targetSystemId) {
      return;
    }
    const target =
      chooseTargetSystem(session.galaxy, fleet.systemId, true) ??
      chooseTargetSystem(session.galaxy, fleet.systemId, false) ??
      session.galaxy.systems[0]?.id ??
      null;
    if (!target || target === fleet.systemId) {
      return;
    }
    const travelTicks = calculateTravelTicks(
      fleet.systemId,
      target,
      session.galaxy,
      { ...military, fleet: military.fleet },
    );
    fleet.targetSystemId = target;
    fleet.ticksToArrival = Math.max(1, travelTicks);
    changed = true;
  });
  if (!changed) {
    return session;
  }
  return { ...session, fleets };
};
