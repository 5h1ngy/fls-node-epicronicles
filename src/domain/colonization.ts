import type { ColonizationConfig } from '../config/gameConfig';
import type {
  ColonizationTask,
  EconomyState,
  Planet,
  StarSystem,
} from './types';

export const createColonizationTask = (
  system: StarSystem,
  config: ColonizationConfig,
): ColonizationTask => {
  if (!system.habitableWorld) {
    throw new Error('System has no habitable world');
  }
  return {
    id: `CLN-${system.id}-${crypto.randomUUID()}`,
    systemId: system.id,
    planetTemplate: system.habitableWorld,
    ticksRemaining: config.durationTicks,
    totalTicks: config.durationTicks,
    status: 'colonizing',
  };
};

const createPlanetFromTask = (task: ColonizationTask): Planet => ({
  id: `COL-${task.systemId}-${crypto.randomUUID()}`,
  name: task.planetTemplate.name,
  systemId: task.systemId,
  kind: task.planetTemplate.kind,
  size: task.planetTemplate.size,
  population: 1,
  baseProduction: task.planetTemplate.baseProduction,
  upkeep: task.planetTemplate.upkeep,
});

export interface AdvanceColonizationResult {
  tasks: ColonizationTask[];
  economy: EconomyState;
}

export const advanceColonization = (
  tasks: ColonizationTask[],
  economy: EconomyState,
): AdvanceColonizationResult => {
  if (tasks.length === 0) {
    return { tasks, economy };
  }

  let updatedEconomy = economy;
  const updatedTasks: ColonizationTask[] = [];
  const completedPlanets: Planet[] = [];

  tasks.forEach((task) => {
    const ticksRemaining = Math.max(0, task.ticksRemaining - 1);
    if (ticksRemaining === 0) {
      completedPlanets.push(createPlanetFromTask(task));
    } else {
      updatedTasks.push({
        ...task,
        ticksRemaining,
      });
    }
  });

  if (completedPlanets.length > 0) {
    updatedEconomy = {
      ...updatedEconomy,
      planets: [...updatedEconomy.planets, ...completedPlanets],
    };
  }

  return {
    tasks: updatedTasks,
    economy: updatedEconomy,
  };
};
