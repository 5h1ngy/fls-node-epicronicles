import type { GalaxyGenerationParams } from '../domain/galaxy';
import type { EconomyConfig } from '../domain/economy';
import type {
  ResourceCost,
  ShipDesign,
  ShipClassId,
} from '../domain/types';

export interface ColonizationConfig {
  cost: ResourceCost;
  preparationTicks: number;
  travelTicks: number;
  durationTicks: number;
}

export interface MilitaryConfig {
  shipyard: {
    queueSize: number;
    homeSystemDesignId: ShipClassId;
  };
  fleet: {
    baseTravelTicks: number;
  };
  shipDesigns: ShipDesign[];
}

export interface GameConfig {
  ticksPerSecond: number;
  defaultGalaxy: GalaxyGenerationParams;
  debug: {
    autoStart: boolean;
  };
  exploration: {
    travelTicks: number;
    surveyTicks: number;
  };
  economy: EconomyConfig;
  colonization: ColonizationConfig;
  military: MilitaryConfig;
  map: {
    orbitSpeed: number;
  };
}

export const gameConfig: GameConfig = {
  ticksPerSecond: 1,
  defaultGalaxy: {
    seed: 'debug-seed',
    systemCount: 18,
    galaxyRadius: 260,
  },
  debug: {
    autoStart: false,
  },
  exploration: {
    travelTicks: 3,
    surveyTicks: 2,
  },
  economy: {
    startingResources: {
      energy: 100,
      minerals: 80,
      food: 60,
      research: 0,
    },
    homeworld: {
      name: 'Aurora Prime',
      kind: 'terrestrial',
      size: 18,
      population: 4,
      baseProduction: {
        energy: 6,
        minerals: 5,
        food: 7,
        research: 3,
      },
      upkeep: {
        food: 4,
      },
      districts: {
        generator: 2,
        mining: 2,
        farm: 1,
        research: 1,
      },
    },
    districts: [
      {
        id: 'generator',
        label: 'Distretto energetico',
        description: 'Produce energia sfruttando la rete planetaria.',
        cost: { minerals: 60 },
        buildTime: 4,
        production: { energy: 4 },
        upkeep: { food: 1 },
      },
      {
        id: 'mining',
        label: 'Distretto minerario',
        description: 'Estrae minerali dalle superfici del pianeta.',
        cost: { minerals: 50 },
        buildTime: 4,
        production: { minerals: 4 },
        upkeep: { energy: 1 },
      },
      {
        id: 'farm',
        label: 'Distretto agricolo',
        description: 'Aumenta la produzione di cibo locale.',
        cost: { minerals: 45 },
        buildTime: 3,
        production: { food: 5 },
        upkeep: { energy: 1 },
      },
      {
        id: 'research',
        label: 'Distretto di ricerca',
        description: 'Laboratori e campus scientifici.',
        cost: { minerals: 80, energy: 20 },
        buildTime: 5,
        production: { research: 4 },
        upkeep: { energy: 2 },
      },
    ],
    populationJobs: [
      {
        id: 'workers',
        label: 'Lavoratori',
        description: 'Pop dedicati a miniere, fattorie e infrastrutture.',
        production: { minerals: 1.5, food: 1.5 },
        upkeep: { food: 0.5 },
      },
      {
        id: 'specialists',
        label: 'Specialisti',
        description: 'Tecnici e amministratori per distretti avanzati.',
        production: { energy: 2 },
        upkeep: { food: 0.5, energy: 0.2 },
      },
      {
        id: 'researchers',
        label: 'Ricercatori',
        description: 'Scienziati che aumentano la produzione di ricerca.',
        production: { research: 2.5 },
        upkeep: { food: 0.5, energy: 0.5 },
      },
    ],
  },
  colonization: {
    cost: {
      energy: 50,
      minerals: 80,
      food: 30,
    },
    preparationTicks: 2,
    travelTicks: 3,
    durationTicks: 6,
  },
  military: {
    shipyard: {
      queueSize: 4,
      homeSystemDesignId: 'corvette',
    },
    fleet: {
      baseTravelTicks: 3,
    },
    shipDesigns: [
      {
        id: 'corvette',
        name: 'Classe Aurora',
        buildCost: {
          minerals: 120,
          energy: 40,
        },
        buildTime: 5,
        attack: 6,
        defense: 2,
        hullPoints: 20,
        speed: 1,
      },
    ],
  },
  map: {
    orbitSpeed: 0.0025,
  },
};
