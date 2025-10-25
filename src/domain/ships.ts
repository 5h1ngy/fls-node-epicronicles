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
): Fleet => {
  const starterDesign = getShipDesign(
    config,
    config.shipyard.homeSystemDesignId,
  );

  return {
    id: `FLEET-${crypto.randomUUID()}`,
    name: '1ª Flotta',
    systemId: homeSystemId,
    targetSystemId: null,
    ticksToArrival: 0,
    ships: [createFleetShip(starterDesign)],
  };
};
