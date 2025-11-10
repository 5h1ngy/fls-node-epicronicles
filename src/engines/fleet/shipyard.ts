import type { MilitaryConfig } from '@config/gameConfig';
import {
  createFleetShip,
  createInitialFleet,
  getShipDesign,
  composeDesign,
} from './ships';
import type {
  Fleet,
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
  military: MilitaryConfig;
  fallbackSystemId: string;
}

export const advanceShipyard = ({
  tasks,
  fleets,
  military,
  fallbackSystemId,
}: AdvanceShipyardArgs): { tasks: ShipyardTask[]; fleets: Fleet[] } => {
  if (tasks.length === 0) {
    return { tasks, fleets };
  }

  let updatedFleets = fleets;
  let fleetsCloned = false;

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
      const fleet = ensureFleetAvailable();
      fleet.ships.push(createFleetShip(effectiveDesign));
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
  };
};


