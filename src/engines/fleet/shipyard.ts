import type { MilitaryConfig } from '@config';
import {
  createFleetShip,
  createInitialFleet,
  getShipDesign,
  composeDesign,
} from './ships';
import type {
  Fleet,
  ScienceShip,
  ShipClassId,
  ShipyardTask,
  ShipCustomization,
} from '@domain/types';

export const createShipyardTask = (
  designId: ShipClassId,
  buildTime: number,
  templateId?: string,
  customization?: ShipCustomization,
): ShipyardTask => ({
  id: `YARD-${crypto.randomUUID()}`,
  designId,
  ticksRemaining: buildTime,
  totalTicks: buildTime,
  templateId,
  customization,
});

interface AdvanceShipyardArgs {
  tasks: ShipyardTask[];
  fleets: Fleet[];
  scienceShips: ScienceShip[];
  military: MilitaryConfig;
  fallbackSystemId: string;
}

export const advanceShipyard = ({
  tasks,
  fleets,
  scienceShips,
  military,
  fallbackSystemId,
}: AdvanceShipyardArgs): { tasks: ShipyardTask[]; fleets: Fleet[]; scienceShips: ScienceShip[] } => {
  if (tasks.length === 0) {
    return { tasks, fleets, scienceShips };
  }

  let updatedFleets = fleets;
  let updatedScience = scienceShips;
  let fleetsCloned = false;
  let scienceCloned = false;

  const shipRoleFor = (designId: string) => {
    try {
      return getShipDesign(military, designId).role ?? 'military';
    } catch {
      return 'military';
    }
  };

  const ensureFleetForRole = (role: string) => {
    const matching = updatedFleets.find((fleet) =>
      fleet.ships.some((ship) => shipRoleFor(ship.designId) === role),
    );
    if (matching) {
      if (!fleetsCloned) {
        updatedFleets = updatedFleets.map((fleet) => ({
          ...fleet,
          ships: [...fleet.ships],
        }));
        fleetsCloned = true;
      }
      return updatedFleets.find((fleet) => fleet.id === matching.id)!;
    }
    const count = updatedFleets.filter((fleet) =>
      fleet.ships.some((ship) => shipRoleFor(ship.designId) === role),
    ).length;
    const roleLabel =
      role === 'construction'
        ? 'Flotta Costruttrice'
        : role === 'colony'
          ? 'Flotta Colonia'
          : 'Flotta Militare';
    const newFleet: Fleet = {
      id: `FLEET-${crypto.randomUUID()}`,
      name: `${roleLabel} ${count + 1}`,
      ownerId: 'player',
      systemId: fallbackSystemId,
      targetSystemId: null,
      ticksToArrival: 0,
      ships: [],
    };
    updatedFleets = fleetsCloned ? [...updatedFleets, newFleet] : [...updatedFleets, newFleet];
    fleetsCloned = true;
    return newFleet;
  };

  const ensureFleetAvailable = () => {
    if (updatedFleets.length === 0) {
      updatedFleets = [createInitialFleet(fallbackSystemId, military)];
      fleetsCloned = true;
    } else if (!fleetsCloned) {
      updatedFleets = updatedFleets.map((fleet) => ({
        ...fleet,
        ships: [...fleet.ships],
      }));
      fleetsCloned = true;
    }
    return updatedFleets[0];
  };

  const remainingTasks: ShipyardTask[] = [];

  tasks.forEach((task) => {
    const ticksRemaining = Math.max(0, task.ticksRemaining - 1);
    if (ticksRemaining === 0) {
      const baseDesign = getShipDesign(military, task.designId);
      const template = task.templateId
        ? military.templates.find((entry) => entry.id === task.templateId)
        : military.templates.find((entry) => entry.base === baseDesign.id);
      const effectiveDesign = composeDesign({
        design: baseDesign,
        template,
        customization: task.customization,
      });
      if (baseDesign.role === 'science') {
        if (!scienceCloned) {
          updatedScience = [...updatedScience];
          scienceCloned = true;
        }
        updatedScience.push({
          id: `SCI-${crypto.randomUUID()}`,
          name: effectiveDesign.name ?? baseDesign.name,
          currentSystemId: fallbackSystemId,
          targetSystemId: null,
          status: 'idle',
          ticksRemaining: 0,
          autoExplore: true,
        });
      } else {
        const role = baseDesign.role ?? 'military';
        const fleet =
          role === 'construction' || role === 'colony' || role === 'military'
            ? ensureFleetForRole(role)
            : ensureFleetAvailable();
        fleet.ships.push(createFleetShip(effectiveDesign));
      }
    } else {
      remainingTasks.push({
        ...task,
        ticksRemaining,
      });
    }
  });

  return {
    tasks: remainingTasks,
    fleets: updatedFleets,
    scienceShips: updatedScience,
  };
};


