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
} from './types';

export const RESOURCE_TYPES: ResourceType[] = [
  'energy',
  'minerals',
  'food',
  'research',
];

export interface HomeworldConfig {
  name: string;
  kind: PlanetKind;
  size: number;
  population: number;
  baseProduction: Partial<Record<ResourceType, number>>;
  upkeep: Partial<Record<ResourceType, number>>;
  districts?: Record<string, number>;
}

export interface EconomyConfig {
  startingResources: Partial<Record<ResourceType, number>>;
  homeworld: HomeworldConfig;
  districts: DistrictDefinition[];
  populationJobs: PopulationJobDefinition[];
}

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
): Planet => ({
  id: `HOME-${systemId}`,
  name: config.name,
  systemId,
  kind: config.kind,
  size: config.size,
  population: {
    total: config.population,
    workers: config.population,
    specialists: 0,
    researchers: 0,
  },
  baseProduction: config.baseProduction,
  upkeep: config.upkeep,
  districts: { ...(config.districts ?? {}) },
});

export const createInitialEconomy = (
  homeSystemId: string,
  config: EconomyConfig,
): EconomyState => ({
  resources: createLedger(config.startingResources),
  planets: [createHomeworld(homeSystemId, config.homeworld)],
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

export interface AdvanceEconomyResult {
  economy: EconomyState;
  netProduction: Record<ResourceType, number>;
}

export const advanceEconomy = (
  state: EconomyState,
  config: EconomyConfig,
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

  state.planets.forEach((planet) => {
    RESOURCE_TYPES.forEach((type) => {
      const production = planet.baseProduction[type] ?? 0;
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
        const income = definition.production[type] ?? 0;
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
        const income = job.production[type] ?? 0;
        const upkeep = job.upkeep[type] ?? 0;
        totals.income[type] += income * count;
        totals.upkeep[type] += upkeep * count;
      });
    });
  });

  const resources = { ...state.resources };
  const netProduction: Record<ResourceType, number> = {
    energy: 0,
    minerals: 0,
    food: 0,
    research: 0,
  };

  RESOURCE_TYPES.forEach((type) => {
    const income = totals.income[type];
    const upkeep = totals.upkeep[type];
    const net = income - upkeep;
    netProduction[type] = net;
    const current = resources[type] ?? { amount: 0, income: 0, upkeep: 0 };
    resources[type] = {
      amount: Math.max(0, current.amount + net),
      income,
      upkeep,
    };
  });

  return {
    economy: {
      ...state,
      resources,
    },
    netProduction,
  };
};
