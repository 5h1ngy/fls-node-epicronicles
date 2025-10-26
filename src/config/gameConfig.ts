import type { GalaxyGenerationParams } from '../domain/galaxy';
import type { EconomyConfig } from '../domain/economy';
import type { ResourceCost, ShipDesign, ShipClassId } from '../domain/types';

export interface ColonizationConfig {
  cost: ResourceCost;
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
    },
  },
  colonization: {
    cost: {
      energy: 50,
      minerals: 80,
      food: 30,
    },
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
