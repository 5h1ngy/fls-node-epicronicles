import type { MilitaryConfig } from '@config/gameConfig';
import type { Fleet, FleetShip, ShipClassId, ShipDesign } from '@domain/types';
import type { ShipCustomization } from '@domain/types';

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

export const applyShipTemplate = (
  design: ShipDesign,
  template: MilitaryConfig['templates'][number],
): ShipDesign => ({
  ...design,
  id: design.id,
  name: `${design.name} - ${template.name}`,
  attack: design.attack + template.attack,
  defense: design.defense + template.defense,
  hullPoints: design.hullPoints + template.hull,
  buildCost: Object.fromEntries(
    Object.entries(design.buildCost).map(([key, value]) => [
      key,
      Math.round((value ?? 0) * template.costMultiplier),
    ]),
  ) as ShipDesign['buildCost'],
});

export const applyCustomization = (
  design: ShipDesign,
  customization?: ShipCustomization,
): ShipDesign => {
  if (!customization) {
    return design;
  }
  const { attackBonus, defenseBonus, hullBonus, costMultiplier, name } =
    customization;
  return {
    ...design,
    name: name ? `${design.name} - ${name}` : design.name,
    attack: design.attack + attackBonus,
    defense: design.defense + defenseBonus,
    hullPoints: design.hullPoints + hullBonus,
    buildCost: Object.fromEntries(
      Object.entries(design.buildCost).map(([key, value]) => [
        key,
        Math.round((value ?? 0) * costMultiplier),
      ]),
    ) as ShipDesign['buildCost'],
  };
};

export const composeDesign = ({
  design,
  template,
  customization,
}: {
  design: ShipDesign;
  template?: MilitaryConfig['templates'][number];
  customization?: ShipCustomization;
}): ShipDesign => {
  const withTemplate =
    template && template.base === design.id
      ? applyShipTemplate(design, template)
      : design;
  return applyCustomization(withTemplate, customization);
};

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


