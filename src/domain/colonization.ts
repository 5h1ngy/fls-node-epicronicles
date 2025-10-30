import type { ColonizationConfig } from '../config/gameConfig';
import type {
  ColonizationTask,
  ColonizationStatus,
  EconomyState,
  Planet,
  StarSystem,
} from './types';

type StageDurations = Record<ColonizationStatus, number>;

const STAGE_ORDER: ColonizationStatus[] = [
  'preparing',
  'traveling',
  'colonizing',
];

const getStageDurations = (config: ColonizationConfig): StageDurations => ({
  preparing: Math.max(0, config.preparationTicks),
  traveling: Math.max(0, config.travelTicks),
  colonizing: Math.max(1, config.durationTicks),
});

const getInitialStatus = (durations: StageDurations): ColonizationStatus => {
  for (const status of STAGE_ORDER) {
    if (durations[status] > 0) {
      return status;
    }
  }
  return 'colonizing';
};

const getNextStatus = (
  current: ColonizationStatus,
  durations: StageDurations,
): ColonizationStatus | null => {
  const index = STAGE_ORDER.indexOf(current);
  for (let i = index + 1; i < STAGE_ORDER.length; i += 1) {
    const status = STAGE_ORDER[i];
    if (durations[status] > 0) {
      return status;
    }
  }
  return null;
};

export const createColonizationTask = (
  system: StarSystem,
  config: ColonizationConfig,
): ColonizationTask => {
  if (!system.habitableWorld) {
    throw new Error('System has no habitable world');
  }
  const durations = getStageDurations(config);
  const initialStatus = getInitialStatus(durations);
  const initialTicks = durations[initialStatus];
  const missionTotalTicks = STAGE_ORDER.reduce(
    (sum, status) => sum + durations[status],
    0,
  );

  return {
    id: `CLN-${system.id}-${crypto.randomUUID()}`,
    systemId: system.id,
    planetTemplate: system.habitableWorld,
    ticksRemaining: initialTicks,
    totalTicks: initialTicks,
    status: initialStatus,
    missionElapsedTicks: 0,
    missionTotalTicks: missionTotalTicks || durations.colonizing,
  };
};

const createPlanetFromTask = (task: ColonizationTask): Planet => ({
  id: `COL-${task.systemId}-${crypto.randomUUID()}`,
  name: task.planetTemplate.name,
  systemId: task.systemId,
  kind: task.planetTemplate.kind,
  size: task.planetTemplate.size,
  population: {
    total: 1,
    workers: 1,
    specialists: 0,
    researchers: 0,
  },
  baseProduction: task.planetTemplate.baseProduction,
  upkeep: task.planetTemplate.upkeep,
  districts: {},
});

export interface AdvanceColonizationResult {
  tasks: ColonizationTask[];
  economy: EconomyState;
}

export const advanceColonization = (
  tasks: ColonizationTask[],
  economy: EconomyState,
  config: ColonizationConfig,
): AdvanceColonizationResult => {
  if (tasks.length === 0) {
    return { tasks, economy };
  }

  let updatedEconomy = economy;
  const updatedTasks: ColonizationTask[] = [];
  const completedPlanets: Planet[] = [];
  const durations = getStageDurations(config);

  const handleStageCompletion = (
    task: ColonizationTask,
    missionElapsed: number,
  ) => {
    const nextStatus = getNextStatus(task.status, durations);
    if (!nextStatus) {
      completedPlanets.push(createPlanetFromTask(task));
      return;
    }
    const nextDuration = durations[nextStatus];
    updatedTasks.push({
      ...task,
      status: nextStatus,
      ticksRemaining: nextDuration,
      totalTicks: nextDuration,
      missionElapsedTicks: missionElapsed,
    });
  };

  tasks.forEach((task) => {
    const ticksRemaining = task.ticksRemaining - 1;
    const missionElapsed = Math.min(
      task.missionTotalTicks,
      task.missionElapsedTicks + 1,
    );
    if (ticksRemaining > 0) {
      updatedTasks.push({
        ...task,
        ticksRemaining,
        missionElapsedTicks: missionElapsed,
      });
      return;
    }
    if (task.status === 'colonizing') {
      completedPlanets.push(createPlanetFromTask(task));
      return;
    }
    handleStageCompletion(task, missionElapsed);
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
