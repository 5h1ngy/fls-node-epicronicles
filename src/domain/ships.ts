import type { MilitaryConfig } from '../config/gameConfig';
import type { Fleet, FleetShip, ShipClassId, ShipDesign } from './types';

export const getShipDesign = (
  config: MilitaryConfig,
  designId: ShipClassId,
): ShipDesign => {
  const design = config.shipDesigns.find((entry) => entry.id === designId);
  if (!design) {
    throw new Error(`Unknown ship design: ${designId}`);
  }
  return design;
};

export const createFleetShip = (
  design: ShipDesign,
  overrides?: Partial<FleetShip>,
): FleetShip => ({
  id: `SHIP-${crypto.randomUUID()}`,
  designId: design.id,
  hullPoints: design.hullPoints,
  ...overrides,
});

export const createInitialFleet = (
  homeSystemId: string,
  config: MilitaryConfig,
  ownerId = 'player',
): Fleet => {
  const starterDesign = getShipDesign(
    config,
    config.shipyard.homeSystemDesignId,
  );
  const colonyDesign =
    config.colonyShipDesignId !== config.shipyard.homeSystemDesignId
      ? getShipDesign(config, config.colonyShipDesignId)
      : starterDesign;

  const ships: Fleet['ships'] = [createFleetShip(starterDesign)];
  if (config.startingColonyShips > 0) {
    for (let idx = 0; idx < config.startingColonyShips; idx += 1) {
      ships.push(createFleetShip(colonyDesign));
    }
  }

  return {
    id: `FLEET-${crypto.randomUUID()}`,
    name: '1 Flotta',
    ownerId,
    systemId: homeSystemId,
    targetSystemId: null,
    ticksToArrival: 0,
    ships,
  };
};
