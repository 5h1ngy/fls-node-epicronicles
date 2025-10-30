import type {
  DistrictConstructionTask,
  EconomyState,
  Planet,
} from './types';

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
}: {
  tasks: DistrictConstructionTask[];
  economy: EconomyState;
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
      updatedEconomy = {
        ...updatedEconomy,
        planets: updatedEconomy.planets.map((planet) =>
          planet.id === task.planetId
            ? applyDistrictToPlanet(planet, task.districtId)
            : planet,
        ),
      };
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
