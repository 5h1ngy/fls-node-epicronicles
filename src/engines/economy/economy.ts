import type {
  EconomyState,
  Planet,
  PlanetKind,
  ResourceCost,
  ResourceLedger,
  ResourceType,
  DistrictDefinition,
  PopulationJobDefinition,
  PopulationJobId,
} from '@domain/types';

export const RESOURCE_TYPES: ResourceType[] = [
  'energy',
  'minerals',
  'food',
  'research',
  'influence',
];

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export interface HomeworldConfig {
  name: string;
  kind: PlanetKind;
  size: number;
  habitability?: number;
  population: number;
  baseProduction: Partial<Record<ResourceType, number>>;
  upkeep: Partial<Record<ResourceType, number>>;
  districts?: Record<string, number>;
}

export interface MoraleConfig {
  baseStability: number;
  min: number;
  max: number;
  overcrowdingThreshold: number;
  overcrowdingPenalty: number;
  deficitThreshold: number;
  deficitPenalty: number;
  happinessBonusPerSpecialist: number;
  happinessPenaltyPerWorker: number;
}

export interface PopulationAutomationConfig {
  enabled: boolean;
  priorities: ResourceType[];
  deficitThreshold: number;
  surplusThreshold: number;
}

export interface EconomyConfig {
  startingResources: Partial<Record<ResourceType, number>>;
  homeworld: HomeworldConfig;
  districts: DistrictDefinition[];
  populationJobs: PopulationJobDefinition[];
  populationAutomation?: PopulationAutomationConfig;
  morale?: MoraleConfig;
  habitabilityByKind?: Partial<Record<PlanetKind, number>>;
}

const defaultMoraleConfig: MoraleConfig = {
  baseStability: 65,
  min: 20,
  max: 95,
  overcrowdingThreshold: 2,
  overcrowdingPenalty: 2,
  deficitThreshold: 25,
  deficitPenalty: 5,
  happinessBonusPerSpecialist: 0.5,
  happinessPenaltyPerWorker: 0.2,
};

const createLedger = (
  starting: Partial<Record<ResourceType, number>>,
): Record<ResourceType, ResourceLedger> =>
  RESOURCE_TYPES.reduce<Record<ResourceType, ResourceLedger>>((acc, type) => {
    const amount = starting[type] ?? 0;
    acc[type] = {
      amount,
      income: 0,
      upkeep: 0,
    };
    return acc;
  }, {} as Record<ResourceType, ResourceLedger>);

const createHomeworld = (
  systemId: string,
  config: HomeworldConfig,
  morale: MoraleConfig,
): Planet => ({
  id: `HOME-${systemId}`,
  name: config.name,
  systemId,
  kind: config.kind,
  size: config.size,
  habitability: config.habitability ?? 1,
  population: {
    total: config.population,
    workers: config.population,
    specialists: 0,
    researchers: 0,
  },
  baseProduction: config.baseProduction,
  upkeep: config.upkeep,
  districts: { ...(config.districts ?? {}) },
  stability: morale.baseStability,
  happiness: morale.baseStability,
});

export const createInitialEconomy = (
  homeSystemId: string,
  config: EconomyConfig,
): EconomyState => ({
  resources: createLedger(config.startingResources),
  planets: [
    createHomeworld(
      homeSystemId,
      config.homeworld,
      config.morale ?? defaultMoraleConfig,
    ),
  ],
});

export const canAffordCost = (
  state: EconomyState,
  cost: ResourceCost,
): boolean =>
  Object.entries(cost).every(([type, amount]) => {
    if (!amount) {
      return true;
    }
    const ledger = state.resources[type as ResourceType];
    return ledger?.amount >= amount;
  });

export const spendResources = (
  state: EconomyState,
  cost: ResourceCost,
): EconomyState => {
  const resources = { ...state.resources };
  Object.entries(cost).forEach(([type, amount]) => {
    if (!amount) {
      return;
    }
    const resourceType = type as ResourceType;
    const ledger = resources[resourceType];
    if (!ledger) {
      return;
    }
    resources[resourceType] = {
      ...ledger,
      amount: Math.max(0, ledger.amount - amount),
    };
  });
  return {
    ...state,
    resources,
  };
};

export interface ResourceContribution {
  base: number;
  districts: number;
  population: number;
  upkeep: number;
  net: number;
}

export type PlanetProductionSummary = Record<ResourceType, ResourceContribution>;

export const computePlanetProduction = (
  planet: Planet,
  config: EconomyConfig,
): PlanetProductionSummary => {
  const summary = RESOURCE_TYPES.reduce((acc, type) => {
    acc[type] = {
      base: planet.baseProduction[type] ?? 0,
      districts: 0,
      population: 0,
      upkeep: planet.upkeep[type] ?? 0,
      net: 0,
    };
    return acc;
  }, {} as PlanetProductionSummary);

  const districtLookup = new Map(
    config.districts.map((definition) => [definition.id, definition]),
  );
  const jobLookup = new Map<PopulationJobId, PopulationJobDefinition>(
    config.populationJobs.map((job) => [job.id, job]),
  );

  Object.entries(planet.districts ?? {}).forEach(([districtId, count]) => {
    const definition = districtLookup.get(districtId);
    if (!definition || (count ?? 0) <= 0) {
      return;
    }
    RESOURCE_TYPES.forEach((type) => {
      const production = definition.production[type] ?? 0;
      const upkeep = definition.upkeep[type] ?? 0;
      summary[type].districts += production * count;
      summary[type].upkeep += upkeep * count;
    });
  });

  jobLookup.forEach((job, jobId) => {
    const assigned = planet.population[jobId] ?? 0;
    if (assigned <= 0) {
      return;
    }
    RESOURCE_TYPES.forEach((type) => {
      const production = job.production[type] ?? 0;
      const upkeep = job.upkeep[type] ?? 0;
      summary[type].population += production * assigned;
      summary[type].upkeep += upkeep * assigned;
    });
  });

  RESOURCE_TYPES.forEach((type) => {
    const entry = summary[type];
    entry.net = entry.base + entry.districts + entry.population - entry.upkeep;
  });

  return summary;
};

interface PlanetMoraleResult {
  stability: number;
  happiness: number;
  modifier: number;
}

export const calculatePlanetMorale = (
  planet: Planet,
  economy: EconomyState,
  config: EconomyConfig,
): PlanetMoraleResult => {
  const morale = config.morale ?? defaultMoraleConfig;
  const safeCapacity = Math.max(
    0,
    planet.size / morale.overcrowdingThreshold,
  );
  const crowdingPenalty =
    Math.max(0, planet.population.total - safeCapacity) *
    morale.overcrowdingPenalty;
  const deficitPenalty = RESOURCE_TYPES.reduce((total, resource) => {
    const ledger = economy.resources[resource];
    const amount = ledger?.amount ?? 0;
    if (amount >= morale.deficitThreshold) {
      return total;
    }
    const severity =
      (morale.deficitThreshold - amount) / morale.deficitThreshold;
    return total + severity * morale.deficitPenalty;
  }, 0);
  const habitability = planet.habitability ?? 1;
  const habitabilityPenalty =
    habitability < 1 ? Math.round((1 - habitability) * 20) : 0;
  const rawStability =
    morale.baseStability - crowdingPenalty - deficitPenalty - habitabilityPenalty;
  const stability = clamp(rawStability, morale.min, morale.max);
  const specialistCount =
    (planet.population.specialists ?? 0) +
    (planet.population.researchers ?? 0);
  const happinessScore =
    stability +
    specialistCount * morale.happinessBonusPerSpecialist -
    planet.population.workers * morale.happinessPenaltyPerWorker;
  const happiness = clamp(happinessScore, morale.min, morale.max);
  return {
    stability,
    happiness,
    modifier: stability / 100,
  };
};

export interface AdvanceEconomyResult {
  economy: EconomyState;
  netProduction: Record<ResourceType, number>;
}

export interface EconomyModifiers {
  incomeMultipliers?: Partial<Record<ResourceType, number>>;
  influenceFlat?: number;
}

const applyIncomeMultiplier = (
  value: number,
  type: ResourceType,
  modifiers?: EconomyModifiers,
): number => {
  const mult = modifiers?.incomeMultipliers?.[type] ?? 0;
  return value * (1 + mult);
};

const clampLedger = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const advanceEconomy = (
  state: EconomyState,
  config: EconomyConfig,
  modifiers?: EconomyModifiers,
): AdvanceEconomyResult => {
  const totals = RESOURCE_TYPES.reduce(
    (acc, type) => {
      acc.income[type] = 0;
      acc.upkeep[type] = 0;
      return acc;
    },
    {
      income: {} as Record<ResourceType, number>,
      upkeep: {} as Record<ResourceType, number>,
    },
  );

  const districtLookup = new Map(
    config.districts.map((definition) => [definition.id, definition]),
  );
  const jobLookup = new Map<PopulationJobId, PopulationJobDefinition>(
    config.populationJobs.map((job) => [job.id, job]),
  );

  const planetsWithMorale: Planet[] = [];

  state.planets.forEach((planet) => {
    const morale = calculatePlanetMorale(planet, state, config);
    RESOURCE_TYPES.forEach((type) => {
      const production = applyIncomeMultiplier(
        (planet.baseProduction[type] ?? 0) * morale.modifier,
        type,
        modifiers,
      );
      const consumption = planet.upkeep[type] ?? 0;
      totals.income[type] += production;
      totals.upkeep[type] += consumption;
    });
    Object.entries(planet.districts ?? {}).forEach(([districtId, count]) => {
      const definition = districtLookup.get(districtId);
      if (!definition || count <= 0) {
        return;
      }
      RESOURCE_TYPES.forEach((type) => {
        const income = applyIncomeMultiplier(
          (definition.production[type] ?? 0) * morale.modifier,
          type,
          modifiers,
        );
        const upkeep = definition.upkeep[type] ?? 0;
        totals.income[type] += income * count;
        totals.upkeep[type] += upkeep * count;
      });
    });
    jobLookup.forEach((job) => {
      const count = planet.population[job.id] ?? 0;
      if (count <= 0) {
        return;
      }
      RESOURCE_TYPES.forEach((type) => {
        const income = applyIncomeMultiplier(
          (job.production[type] ?? 0) * morale.modifier,
          type,
          modifiers,
        );
        const upkeep = job.upkeep[type] ?? 0;
        totals.income[type] += income * count;
        totals.upkeep[type] += upkeep * count;
      });
    });
    planetsWithMorale.push({
      ...planet,
      stability: morale.stability,
      happiness: morale.happiness,
    });
  });

  const resources = { ...state.resources };
  const netProduction: Record<ResourceType, number> = {
    energy: 0,
    minerals: 0,
    food: 0,
    research: 0,
    influence: 0,
  };

  RESOURCE_TYPES.forEach((type) => {
    let income = totals.income[type];
    const upkeep = totals.upkeep[type];
    if (type === 'influence' && (modifiers?.influenceFlat ?? 0) !== 0) {
      income += modifiers?.influenceFlat ?? 0;
    }
    const net = income - upkeep;
    netProduction[type] = net;
    const current = resources[type] ?? { amount: 0, income: 0, upkeep: 0 };
    const boundedIncome = clampLedger(income, -99999, 99999);
    const boundedUpkeep = clampLedger(upkeep, -99999, 99999);
    const boundedAmount = clampLedger(current.amount + net, 0, 999999);
    resources[type] = {
      amount: boundedAmount,
      income: boundedIncome,
      upkeep: boundedUpkeep,
    };
  });

  return {
    economy: {
      ...state,
      resources,
      planets: planetsWithMorale,
    },
    netProduction,
  };
};

