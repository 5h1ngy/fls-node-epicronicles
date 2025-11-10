import type {
  DistrictConstructionTask,
  EconomyState,
  Planet,
} from '@domain/types';
import type { EconomyConfig } from './economy';

export const createDistrictConstructionTask = ({
  planetId,
  districtId,
  buildTime,
}: {
  planetId: string;
  districtId: string;
  buildTime: number;
}): DistrictConstructionTask => ({
  id: `DIST-${planetId}-${districtId}-${crypto.randomUUID()}`,
  planetId,
  districtId,
  ticksRemaining: buildTime,
  totalTicks: buildTime,
});

const applyDistrictToPlanet = (
  planet: Planet,
  districtId: string,
): Planet => ({
  ...planet,
  districts: {
    ...planet.districts,
    [districtId]: (planet.districts[districtId] ?? 0) + 1,
  },
});

export const advanceDistrictConstruction = ({
  tasks,
  economy,
  config,
}: {
  tasks: DistrictConstructionTask[];
  economy: EconomyState;
  config?: EconomyConfig;
}): {
  tasks: DistrictConstructionTask[];
  economy: EconomyState;
  completed: DistrictConstructionTask[];
} => {
  if (tasks.length === 0) {
    return { tasks, economy, completed: [] };
  }
  const updatedTasks: DistrictConstructionTask[] = [];
  let updatedEconomy = economy;
  const completedTasks: DistrictConstructionTask[] = [];

  tasks.forEach((task) => {
    const remaining = Math.max(0, task.ticksRemaining - 1);
    if (remaining === 0) {
      completedTasks.push(task);
      const planet = updatedEconomy.planets.find(
        (candidate) => candidate.id === task.planetId,
      );
      const definition = config?.districts.find(
        (entry) => entry.id === task.districtId,
      );
      const canApply =
        !definition?.requiresColonists ||
        (planet?.population.total ?? 0) >=
          (definition.requiresColonists ?? 0);
      updatedEconomy = canApply
        ? {
            ...updatedEconomy,
            planets: updatedEconomy.planets.map((entry) =>
              entry.id === task.planetId
                ? applyDistrictToPlanet(entry, task.districtId)
                : entry,
            ),
          }
        : updatedEconomy;
    } else {
      updatedTasks.push({
        ...task,
        ticksRemaining: remaining,
      });
    }
  });

  return {
    tasks: updatedTasks,
    economy: updatedEconomy,
    completed: completedTasks,
  };
};

