import type { GalaxyState, Fleet, GameSession } from '@domain/types';
import { createFleetShip, createInitialFleet } from '../fleet/ships';
import { calculateTravelTicks, sumFleetAttack } from '../fleet/fleets';
import type { MilitaryConfig, DiplomacyConfig } from '@config/gameConfig';

const getCombatDesigns = (military: MilitaryConfig) => {
  const combat = military.shipDesigns.filter(
    (design) => (design.role ?? 'military') === 'military',
  );
  return combat.length > 0 ? combat : military.shipDesigns;
};

const chooseTargetSystem = ({
  galaxy,
  avoidSystemIds,
  preferHostile,
  fleetPower,
}: {
  galaxy: GalaxyState;
  avoidSystemIds: string[];
  preferHostile: boolean;
  fleetPower: number;
}): string | null => {
  const hostile = galaxy.systems
    .filter(
      (system) =>
        (system.hostilePower ?? 0) > 0 &&
        !avoidSystemIds.includes(system.id),
    )
    .sort((a, b) => (b.hostilePower ?? 0) - (a.hostilePower ?? 0));
  if (preferHostile) {
    const viable = hostile.find(
      (system) => (system.hostilePower ?? 0) <= fleetPower * 1.6,
    );
    if (viable) {
      return viable.id;
    }
  }
  if (hostile.length > 0) {
    return hostile[0]?.id ?? null;
  }
  const nonHostile = galaxy.systems.filter(
    (system) =>
      (system.hostilePower ?? 0) === 0 &&
      !avoidSystemIds.includes(system.id),
  );
  if (nonHostile.length === 0) {
    return null;
  }
  return nonHostile[Math.floor(Math.random() * nonHostile.length)]?.id ?? null;
};

export const ensureAiFleet = (
  session: GameSession,
  military: MilitaryConfig,
  diplomacy: DiplomacyConfig,
): GameSession => {
  const hostileSystems = session.galaxy.systems.filter(
    (system) => (system.hostilePower ?? 0) > 0,
  ).length;
  const totalThreat = session.galaxy.systems.reduce(
    (sum, system) => sum + (system.hostilePower ?? 0),
    0,
  );
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
  if (session.fleets.some((fleet) => fleet.ownerId === 'ai-1')) {
    return session;
  }
  const designPool = getCombatDesigns(military);
  const size =
    diplomacy.aiFleetStrength.baseShips +
    Math.min(
      hostileSystems * diplomacy.aiFleetStrength.extraPerHostile,
      diplomacy.aiFleetStrength.maxShips,
    );
  const attackBonus = Math.min(
    6,
    Math.floor(totalThreat / Math.max(1, diplomacy.aiFleetStrength.attackBonusPerThreat)),
  );
  const ships: Fleet['ships'] = [];
  for (let idx = 0; idx < size; idx += 1) {
    const design = designPool[idx % designPool.length];
    const boost =
      hostileSystems >= 5 ? 6 : hostileSystems >= 3 ? 3 : hostileSystems >= 1 ? 1 : 0;
    ships.push({
      id: `SHIP-${crypto.randomUUID()}`,
      designId: design.id,
      hullPoints: design.hullPoints + boost,
      attackBonus: Math.max(0, attackBonus),
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

export const reinforceAiFleets = (
  session: GameSession,
  military: MilitaryConfig,
  diplomacy: DiplomacyConfig,
): GameSession => {
  const hostileSystems = session.galaxy.systems.filter(
    (system) => (system.hostilePower ?? 0) > 0,
  ).length;
  const desiredShips =
    diplomacy.aiFleetStrength.baseShips +
    Math.min(
      hostileSystems * diplomacy.aiFleetStrength.extraPerHostile,
      diplomacy.aiFleetStrength.maxShips,
    );
  const designPool = getCombatDesigns(military);
  const fleets = session.fleets.map((fleet) => ({ ...fleet, ships: [...fleet.ships] }));
  let changed = false;
  fleets.forEach((fleet) => {
    if (!fleet.ownerId || fleet.ownerId === 'player') {
      return;
    }
    while (fleet.ships.length < desiredShips) {
      const design = designPool[fleet.ships.length % designPool.length];
      fleet.ships.push(
        createFleetShip(design, {
          attackBonus: hostileSystems >= 3 ? 2 : 0,
        }),
      );
      changed = true;
    }
  });
  return changed ? { ...session, fleets } : session;
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
    const currentSystem =
      session.galaxy.systems.find((sys) => sys.id === fleet.systemId) ?? null;
    const fleetPower = sumFleetAttack(fleet, new Map(military.shipDesigns.map((d) => [d.id, d])));
    const threat = currentSystem?.hostilePower ?? 0;
    const homeSystem = session.galaxy.systems[1] ?? session.galaxy.systems[0];
    if (threat > fleetPower * 1.25 && homeSystem) {
      const retreatTicks = calculateTravelTicks(
        fleet.systemId,
        homeSystem.id,
        session.galaxy,
        military.fleet,
      );
      fleet.targetSystemId = homeSystem.id;
      fleet.ticksToArrival = Math.max(1, retreatTicks);
      changed = true;
      return;
    }
    const avoidIds = [fleet.systemId];
    if (fleet.lastTargetSystemId) {
      avoidIds.push(fleet.lastTargetSystemId);
    }
    const target =
      chooseTargetSystem({
        galaxy: session.galaxy,
        avoidSystemIds: avoidIds,
        preferHostile: true,
        fleetPower,
      }) ??
      chooseTargetSystem({
        galaxy: session.galaxy,
        avoidSystemIds: avoidIds,
        preferHostile: false,
        fleetPower,
      }) ??
      session.galaxy.systems[0]?.id ??
      null;
    if (!target || target === fleet.systemId) {
      return;
    }
    const travelTicks = calculateTravelTicks(
      fleet.systemId,
      target,
      session.galaxy,
      military.fleet,
    );
    fleet.targetSystemId = target;
    fleet.ticksToArrival = Math.max(1, travelTicks);
    fleet.lastTargetSystemId = target;
    changed = true;
  });
  if (!changed) {
    return session;
  }
  return { ...session, fleets };
};
