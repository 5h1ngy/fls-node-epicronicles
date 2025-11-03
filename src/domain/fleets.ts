import type { GameConfig } from '../config/gameConfig';
import type {
  CombatReport,
  CombatResultType,
  Fleet,
  FleetShip,
  GalaxyState,
  ShipDesign,
} from './types';
import { createInitialFleet } from './ships';

const buildDesignMap = (config: GameConfig) =>
  new Map(config.military.shipDesigns.map((design) => [design.id, design]));

const cloneFleet = (fleet: Fleet): Fleet => ({
  ...fleet,
  ships: fleet.ships.map((ship) => ({ ...ship })),
});

const applyDamage = (
  ships: FleetShip[],
  damage: number,
  designLookup: Map<string, ShipDesign>,
): { survivors: FleetShip[]; shipsLost: number } => {
  if (damage <= 0) {
    return { survivors: ships, shipsLost: 0 };
  }

  const survivors: FleetShip[] = [];
  let remainingDamage = damage;
  let losses = 0;

  ships.forEach((ship) => {
    const design = designLookup.get(ship.designId);
    const maxHull = design?.hullPoints ?? ship.hullPoints;
    const effectiveHull = ship.hullPoints;
    if (remainingDamage >= effectiveHull) {
      remainingDamage -= effectiveHull;
      losses += 1;
    } else {
      survivors.push({
        ...ship,
        hullPoints: Math.min(maxHull, effectiveHull - remainingDamage),
      });
      remainingDamage = 0;
    }
  });

  return { survivors, shipsLost: losses };
};

const sumFleetAttack = (
  fleet: Fleet,
  designLookup: Map<string, ShipDesign>,
): number =>
  fleet.ships.reduce((total, ship) => {
    const design = designLookup.get(ship.designId);
    const bonus = ship.attackBonus ?? 0;
    return total + (design?.attack ?? 0) + bonus;
  }, 0);

const sumFleetDefense = (
  fleet: Fleet,
  designLookup: Map<string, ShipDesign>,
): number =>
  fleet.ships.reduce((total, ship) => {
    const design = designLookup.get(ship.designId);
    return total + (design?.defense ?? 0);
  }, 0);

export interface AdvanceFleetsArgs {
  fleets: Fleet[];
  galaxy: GalaxyState;
  config: GameConfig;
  fallbackSystemId: string;
  tick: number;
}

export const advanceFleets = ({
  fleets,
  galaxy,
  config,
  fallbackSystemId,
  tick,
}: AdvanceFleetsArgs): {
  fleets: Fleet[];
  galaxy: GalaxyState;
  reports: CombatReport[];
  hostilesCleared: string[];
} => {
  if (fleets.length === 0) {
    return { fleets, galaxy, reports: [], hostilesCleared: [] };
  }

  const designLookup = buildDesignMap(config);
  let updatedGalaxySystems = galaxy.systems;
  let systemsCloned = false;
  const reports: CombatReport[] = [];
  const updatedFleets: Fleet[] = fleets.map(cloneFleet);
  const hostilesCleared: string[] = [];

  const getSystemIndex = (systemId: string) =>
    updatedGalaxySystems.findIndex((system) => system.id === systemId);

  const ensureSystemsCloned = () => {
    if (!systemsCloned) {
      updatedGalaxySystems = updatedGalaxySystems.map((system) => ({
        ...system,
      }));
      systemsCloned = true;
    }
  };

  updatedFleets.forEach((fleet) => {
    if (fleet.targetSystemId && fleet.ticksToArrival > 0) {
      fleet.ticksToArrival = Math.max(0, fleet.ticksToArrival - 1);
      if (fleet.ticksToArrival === 0) {
        fleet.systemId = fleet.targetSystemId;
        fleet.targetSystemId = null;
      }
    }

    if (fleet.ships.length === 0) {
      return;
    }

    const systemIndex = getSystemIndex(fleet.systemId);
    if (systemIndex < 0) {
      return;
    }

    const system = updatedGalaxySystems[systemIndex];
    const hostilePower = system.hostilePower ?? 0;
    if (hostilePower <= 0) {
      return;
    }

    ensureSystemsCloned();
    const fleetAttack = sumFleetAttack(fleet, designLookup);
    const fleetDefense = sumFleetDefense(fleet, designLookup);

    const outgoingDamage = fleetAttack;
    const incomingDamage = Math.max(
      0,
      hostilePower - Math.round(fleetDefense * 0.5),
    );

    const hostileRemaining = Math.max(0, hostilePower - outgoingDamage);
    const damageResult = applyDamage(fleet.ships, incomingDamage, designLookup);
    fleet.ships = damageResult.survivors;
    const losses = damageResult.shipsLost;

    let result: CombatResultType = 'playerVictory';
    if (hostileRemaining <= 0 && fleet.ships.length === 0) {
      result = 'mutualDestruction';
    } else if (hostileRemaining > 0 && fleet.ships.length === 0) {
      result = 'playerDefeat';
    } else if (hostileRemaining > 0 && fleet.ships.length > 0) {
      result = 'stalemate';
    }

    updatedGalaxySystems[systemIndex] = {
      ...system,
      hostilePower: Math.max(0, hostileRemaining),
    };

    if (hostileRemaining <= 0) {
      hostilesCleared.push(system.id);
    }

    reports.push({
      id: `COMBAT-${system.id}-${tick}-${crypto.randomUUID()}`,
      systemId: system.id,
      tick,
      playerPower: fleetAttack,
      hostilePower,
      result,
      losses: [
        {
          fleetId: fleet.id,
          shipsLost: losses,
        },
      ],
    });

    if (fleet.ships.length === 0) {
      // if fleet destroyed, respawn empty placeholder to avoid losing actions
      fleet.targetSystemId = null;
      fleet.ticksToArrival = 0;
    }
  });

  const sanitizedFleets =
    updatedFleets.length > 0
      ? updatedFleets
      : [createInitialFleet(fallbackSystemId, config.military)];

  return {
    fleets: sanitizedFleets,
    galaxy: systemsCloned ? { ...galaxy, systems: updatedGalaxySystems } : galaxy,
    reports,
    hostilesCleared,
  };
};

const findSystem = (galaxy: GalaxyState, id: string) =>
  galaxy.systems.find((system) => system.id === id);

export const calculateTravelTicks = (
  fromSystemId: string,
  toSystemId: string,
  galaxy: GalaxyState,
  config: GameConfig,
): number => {
  if (fromSystemId === toSystemId) {
    return 0;
  }

  const from = findSystem(galaxy, fromSystemId);
  const to = findSystem(galaxy, toSystemId);
  if (!from || !to) {
    return config.military.fleet.baseTravelTicks;
  }

  const dx = to.position.x - from.position.x;
  const dy = to.position.y - from.position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const scaled = distance / 60;

  return Math.max(
    1,
    Math.round(config.military.fleet.baseTravelTicks + scaled),
  );
};
