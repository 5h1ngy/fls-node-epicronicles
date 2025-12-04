import { RESOURCE_TYPES, type EconomyConfig } from './economy';
import type {
  EconomyState,
  Planet,
  PopulationJobDefinition,
  PopulationJobId,
  ResourceType,
} from '@domain/types';

const jobNetContribution = (
  job: PopulationJobDefinition,
  resource: ResourceType,
): number => {
  const production = job.production[resource] ?? 0;
  const upkeep = job.upkeep[resource] ?? 0;
  return production - upkeep;
};

const createResourceRecord = (): Record<ResourceType, number> => ({
  energy: 0,
  minerals: 0,
  food: 0,
  research: 0,
  influence: 0,
});

const clonePopulation = (planet: Planet) => ({
  ...planet.population,
});

interface RebalanceArgs {
  planet: Planet;
  workerJob: PopulationJobDefinition;
  bestJobs: Map<ResourceType, PopulationJobDefinition>;
  deficitTargets: Partial<Record<ResourceType, number>>;
  surplusTargets: Partial<Record<ResourceType, number>>;
  priorities: ResourceType[];
  automation: NonNullable<EconomyConfig['populationAutomation']>;
}

const rebalancePlanetPopulation = ({
  planet,
  workerJob,
  bestJobs,
  deficitTargets,
  surplusTargets,
  priorities,
  automation,
}: RebalanceArgs): Planet => {
  const population = clonePopulation(planet);
  let changed = false;

  const adjustPopulation = (
    from: PopulationJobId,
    to: PopulationJobId,
  ) => {
    population[from] = Math.max(0, (population[from] ?? 0) - 1);
    population[to] = (population[to] ?? 0) + 1;
    changed = true;
  };

  priorities.forEach((resource) => {
    let remainingDeficit = deficitTargets[resource];
    if (
      remainingDeficit === undefined ||
      remainingDeficit <= automation.deficitThreshold
    ) {
      return;
    }
    const targetJob = bestJobs.get(resource);
    if (!targetJob || targetJob.id === 'workers') {
      return;
    }
    const delta =
      jobNetContribution(targetJob, resource) -
      jobNetContribution(workerJob, resource);
    if (delta <= 0) {
      return;
    }
    if (population.workers <= 0) {
      return;
    }
    const maxPromotions = Math.min(
      population.workers,
      Math.ceil(remainingDeficit / delta),
    );
    if (maxPromotions <= 0) {
      return;
    }
    for (let idx = 0; idx < maxPromotions; idx += 1) {
      if (population.workers <= 0) {
        break;
      }
      adjustPopulation('workers', targetJob.id as PopulationJobId);
      remainingDeficit = Math.max(0, remainingDeficit - delta);
      deficitTargets[resource] = remainingDeficit;
      if (remainingDeficit <= automation.deficitThreshold) {
        break;
      }
    }
  });

  priorities.forEach((resource) => {
    let remainingSurplus = surplusTargets[resource];
    if (
      remainingSurplus === undefined ||
      remainingSurplus <= automation.surplusThreshold
    ) {
      return;
    }
    const targetJob = bestJobs.get(resource);
    if (!targetJob || targetJob.id === 'workers') {
      return;
    }
    const populationInJob = population[targetJob.id as PopulationJobId] ?? 0;
    if (populationInJob <= 0) {
      return;
    }
    const delta =
      jobNetContribution(targetJob, resource) -
      jobNetContribution(workerJob, resource);
    if (delta <= 0) {
      return;
    }
    const maxDemotions = Math.min(
      populationInJob,
      Math.ceil(
        (remainingSurplus - automation.surplusThreshold) / delta,
      ),
    );
    if (maxDemotions <= 0) {
      return;
    }
    for (let idx = 0; idx < maxDemotions; idx += 1) {
      const currentCount =
        population[targetJob.id as PopulationJobId] ?? 0;
      if (currentCount <= 0) {
        break;
      }
      adjustPopulation(targetJob.id as PopulationJobId, 'workers');
      remainingSurplus = Math.max(
        automation.surplusThreshold,
        remainingSurplus - delta,
      );
      surplusTargets[resource] = remainingSurplus;
      if (remainingSurplus <= automation.surplusThreshold) {
        break;
      }
    }
  });

  if (!changed) {
    return planet;
  }
  return {
    ...planet,
    population,
  };
};

export const autoBalancePopulation = ({
  economy,
  config,
}: {
  economy: EconomyState;
  config: EconomyConfig;
}): EconomyState => {
  const automation = config.populationAutomation;
  if (!automation?.enabled) {
    return economy;
  }
  const workerJob = config.populationJobs.find(
    (job) => job.id === 'workers',
  );
  if (!workerJob) {
    return economy;
  }

  const resourceTrends = createResourceRecord();
  RESOURCE_TYPES.forEach((resource) => {
    const ledger = economy.resources[resource];
    const income = ledger?.income ?? 0;
    const upkeep = ledger?.upkeep ?? 0;
    resourceTrends[resource] = income - upkeep;
  });

  const deficitTargets: Partial<Record<ResourceType, number>> = {};
  const surplusTargets: Partial<Record<ResourceType, number>> = {};
  let needsAdjustment = false;

  automation.priorities.forEach((resource) => {
    const trend = resourceTrends[resource] ?? 0;
    if (trend < -automation.deficitThreshold) {
      deficitTargets[resource] = Math.abs(trend);
      needsAdjustment = true;
    } else if (trend > automation.surplusThreshold) {
      surplusTargets[resource] = trend;
      needsAdjustment = true;
    }
  });

  if (!needsAdjustment) {
    return economy;
  }

  const bestJobs = new Map<ResourceType, PopulationJobDefinition>();
  RESOURCE_TYPES.forEach((resource) => {
    const best = config.populationJobs.reduce<PopulationJobDefinition | null>(
      (current, job) => {
        if (job.id === 'workers') {
          return current;
        }
        const value = jobNetContribution(job, resource);
        if (value <= 0) {
          return current;
        }
        if (!current) {
          return job;
        }
        const currentValue = jobNetContribution(current, resource);
        return value > currentValue ? job : current;
      },
      null,
    );
    if (best) {
      bestJobs.set(resource, best);
    }
  });

  const updatedPlanets = economy.planets.map((planet) =>
    rebalancePlanetPopulation({
      planet,
      workerJob,
      bestJobs,
      deficitTargets,
      surplusTargets,
      priorities: automation.priorities,
      automation,
    }),
  );

  return {
    ...economy,
    planets: updatedPlanets,
  };
};

