import type { GalaxyGenerationParams } from '@domain/galaxy';
import type { EconomyConfig } from '@domain/economy';
import type {
  ResourceCost,
  ShipDesign,
  ShipClassId,
  ResearchTech,
  TraditionPerk,
  ResearchBranch,
  TraditionTreeId,
  GameEvent,
} from '@domain/types';

export interface ColonizationConfig {
  cost: ResourceCost;
  preparationTicks: number;
  travelTicks: number;
  durationTicks: number;
}

export interface DiplomacyConfig {
  aiStartingOpinion: {
    min: number;
    max: number;
  };
  warThreshold: number;
  peaceThreshold: number;
  autoCheckInterval: number;
  opinionDriftPerCheck: number;
  warZones: {
    count: number;
    powerMin: number;
    powerMax: number;
  };
  aiFleetStrength: {
    baseShips: number;
    extraPerHostile: number;
    maxShips: number;
    attackBonusPerThreat: number;
  };
  warEventLogLimit: number;
}

export interface ResearchBranchConfig {
  id: ResearchBranch;
  label: string;
  description: string;
}

export interface ResearchConfig {
  branches: ResearchBranchConfig[];
  techs: ResearchTech[];
  pointsPerResearchIncome: number;
}

export interface TraditionTreeConfig {
  id: TraditionTreeId;
  label: string;
  description: string;
}

export interface TraditionConfig {
  trees: TraditionTreeConfig[];
  perks: TraditionPerk[];
  pointsPerInfluenceIncome: number;
}

export type EventDefinition = Omit<GameEvent, 'systemId' | 'resolvedOptionId'>;

export interface EventsConfig {
  narrative: EventDefinition[];
  anomalies: EventDefinition[];
  crisis: EventDefinition[];
  narrativeIntervalTicks: number;
  anomalyIntervalTicks: number;
  crisisIntervalTicks: number;
}

export interface MilitaryConfig {
  shipyard: {
    queueSize: number;
    homeSystemDesignId: ShipClassId;
  };
  fleet: {
    baseTravelTicks: number;
  };
  colonyShipDesignId: ShipClassId;
  startingColonyShips: number;
  shipDesigns: ShipDesign[];
  templates: Array<{
    id: string;
    base: ShipClassId;
    name: string;
    attack: number;
    defense: number;
    hull: number;
    costMultiplier: number;
  }>;
}

export interface GameConfig {
  ticksPerSecond: number;
  defaultGalaxy: GalaxyGenerationParams;
  galaxyPresets: Array<GalaxyGenerationParams & { id: string; label: string }>;
  debug: {
    autoStart: boolean;
  };
  exploration: {
    travelTicks: number;
    surveyTicks: number;
  };
  economy: EconomyConfig;
  research: ResearchConfig;
  traditions: TraditionConfig;
  events: EventsConfig;
  colonization: ColonizationConfig;
  diplomacy: DiplomacyConfig;
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
    galaxyShape: 'circle',
  },
  events: {
    narrativeIntervalTicks: 12,
    anomalyIntervalTicks: 14,
    crisisIntervalTicks: 36,
    narrative: [
      {
        id: 'support-request',
        kind: 'narrative',
        title: 'Richiesta di supporto',
        description: 'Una colonia chiede fondi per infrastrutture.',
        options: [
          {
            id: 'fund',
            label: 'Finanzia (Minerali -20)',
            description: 'Migliora la stabilita locale.',
            effects: [
              { kind: 'resource', target: 'minerals', amount: -20 },
              { kind: 'stability', amount: 4 },
            ],
          },
          {
            id: 'decline',
            label: 'Rifiuta',
            description: 'Risparmi ma scontenti i coloni.',
            effects: [{ kind: 'stability', amount: -3 }],
          },
        ],
      },
      {
        id: 'science-breakthrough',
        kind: 'narrative',
        title: 'Scoperta scientifica',
        description: 'Un team ottiene risultati imprevisti.',
        options: [
          {
            id: 'publish',
            label: 'Pubblica',
            description: '+10 Ricerca, +1 Influenza.',
            effects: [
              { kind: 'resource', target: 'research', amount: 10 },
              { kind: 'influence', amount: 1 },
            ],
          },
          {
            id: 'brevettare',
            label: 'Brevettare',
            description: '+15 Energia.',
            effects: [{ kind: 'resource', target: 'energy', amount: 15 }],
          },
        ],
      },
    ],
    anomalies: [
      {
        id: 'ancient-signal',
        kind: 'anomaly',
        title: 'Segnale antico',
        description: 'Un segnale debole proviene da un relitto orbitale.',
        options: [
          {
            id: 'indaga',
            label: 'Indaga',
            description: '+8 Ricerca, possibile minaccia.',
            effects: [
              { kind: 'resource', target: 'research', amount: 8 },
              { kind: 'hostileSpawn', amount: 6 },
            ],
          },
          {
            id: 'ignora',
            label: 'Ignora',
            description: 'Nessun rischio, nessun guadagno.',
            effects: [],
          },
        ],
      },
      {
        id: 'energy-crystals',
        kind: 'anomaly',
        title: 'Cristalli energetici',
        description: 'Formazioni cristalline rilasciano energia.',
        options: [
          {
            id: 'estrai',
            label: 'Estrarre',
            description: '+20 Energia, rischio instabilita.',
            effects: [
              { kind: 'resource', target: 'energy', amount: 20 },
              { kind: 'stability', amount: -2 },
            ],
          },
          {
            id: 'studia',
            label: 'Studiare',
            description: '+12 Ricerca.',
            effects: [{ kind: 'resource', target: 'research', amount: 12 }],
          },
        ],
      },
    ],
    crisis: [
      {
        id: 'external-raid',
        kind: 'crisis',
        title: 'Incursione esterna',
        description: 'Forze sconosciute attraversano i confini.',
        options: [
          {
            id: 'allerta',
            label: 'Allerta flotte',
            description: 'Nemici appaiono in un sistema chiave.',
            effects: [{ kind: 'hostileSpawn', amount: 15 }],
          },
          {
            id: 'negozia',
            label: 'Tentare negoziati',
            description: 'Piccolo costo di influenza, minaccia ridotta.',
            effects: [
              { kind: 'influence', amount: -3 },
              { kind: 'hostileSpawn', amount: 8 },
            ],
          },
        ],
      },
    ],
  },
  galaxyPresets: [
    {
      id: 'test',
      label: 'Test (piccola)',
      seed: 'debug-seed',
      systemCount: 8,
      galaxyRadius: 140,
      galaxyShape: 'circle',
    },
    {
      id: 'standard',
      label: 'Standard',
      seed: 'debug-seed',
      systemCount: 18,
      galaxyRadius: 260,
      galaxyShape: 'circle',
    },
    {
      id: 'large',
      label: 'Grande',
      seed: 'debug-seed',
      systemCount: 28,
      galaxyRadius: 320,
      galaxyShape: 'circle',
    },
    {
      id: 'mega',
      label: 'Colossale (1200)',
      seed: 'debug-seed',
      systemCount: 1200,
      galaxyRadius: 1400,
      galaxyShape: 'spiral',
    },
  ],
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
      influence: 50,
    },
    homeworld: {
      name: 'Aurora Prime',
      kind: 'terrestrial',
      size: 18,
      habitability: 1,
      population: 4,
      baseProduction: {
        energy: 6,
        minerals: 5,
        food: 7,
        research: 3,
        influence: 1,
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
        cost: { minerals: 70, energy: 10 },
        buildTime: 5,
        production: { energy: 5 },
        upkeep: { food: 1 },
      },
      {
        id: 'mining',
        label: 'Distretto minerario',
        description: 'Estrae minerali dalle superfici del pianeta.',
        cost: { minerals: 65 },
        buildTime: 5,
        production: { minerals: 5 },
        upkeep: { energy: 1 },
      },
      {
        id: 'farm',
        label: 'Distretto agricolo',
        description: 'Aumenta la produzione di cibo locale.',
        cost: { minerals: 55 },
        buildTime: 4,
        production: { food: 6 },
        upkeep: { energy: 1 },
      },
      {
        id: 'research',
        label: 'Distretto di ricerca',
        description: 'Laboratori e campus scientifici.',
        cost: { minerals: 90, energy: 30 },
        buildTime: 6,
        production: { research: 5 },
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
    populationAutomation: {
      enabled: true,
      priorities: ['food', 'energy', 'minerals', 'research'],
      deficitThreshold: 0.5,
      surplusThreshold: 3,
    },
    morale: {
      baseStability: 65,
      min: 20,
      max: 95,
      overcrowdingThreshold: 2,
      overcrowdingPenalty: 2,
      deficitThreshold: 25,
      deficitPenalty: 6,
      happinessBonusPerSpecialist: 0.6,
      happinessPenaltyPerWorker: 0.2,
    },
    habitabilityByKind: {
      terrestrial: 0.9,
      desert: 0.6,
      tundra: 0.65,
    },
  },
  research: {
    branches: [
      {
        id: 'physics',
        label: 'Fisica',
        description: 'Energia, sensori e propulsione.',
      },
      {
        id: 'society',
        label: 'Societa',
        description: 'Biologia, amministrazione, tradizioni civili.',
      },
      {
        id: 'engineering',
        label: 'Ingegneria',
        description: 'Materiali, costruzioni e armamenti.',
      },
    ],
    techs: [
      {
        id: 'photonics',
        branch: 'physics',
        name: 'Energia fotonica',
        description: '+10% produzione energia.',
        cost: 40,
        effects: ['energyIncome:+0.1'],
      },
      {
        id: 'advanced-sensors',
        branch: 'physics',
        name: 'Sensori avanzati',
        description: '+10% produzione ricerca.',
        cost: 30,
        effects: ['researchIncome:+0.1'],
      },
      {
        id: 'bio-domes',
        branch: 'society',
        name: 'Bio-cupole',
        description: '+10% produzione cibo.',
        cost: 35,
        effects: ['foodIncome:+0.1'],
      },
      {
        id: 'bureaucracy',
        branch: 'society',
        name: 'Burosfera',
        description: '+1 influenza per tick.',
        cost: 45,
        effects: ['influenceFlat:+1'],
      },
      {
        id: 'reinforced-alloys',
        branch: 'engineering',
        name: 'Leghe rinforzate',
        description: '+10% produzione minerali.',
        cost: 45,
        effects: ['mineralsIncome:+0.1'],
      },
      {
        id: 'modular-yards',
        branch: 'engineering',
        name: 'Cantieri modulari',
        description: '+10% produzione energia e minerali.',
        cost: 55,
        effects: ['energyIncome:+0.1', 'mineralsIncome:+0.1'],
        prerequisites: ['reinforced-alloys'],
      },
    ],
    pointsPerResearchIncome: 1,
  },
  traditions: {
    trees: [
      {
        id: 'exploration',
        label: 'Esplorazione',
        description: 'Scoperta rapida della galassia.',
      },
      {
        id: 'economy',
        label: 'Economia',
        description: 'Crescita risorse e stabilita.',
      },
      {
        id: 'military',
        label: 'Militare',
        description: 'Potenza e mobilità delle flotte.',
      },
    ],
    perks: [
      {
        id: 'survey-speed',
        tree: 'exploration',
        name: 'Scansioni fulminee',
        description: '+5% produzione ricerca.',
        cost: 2,
        effects: ['researchIncome:+0.05'],
      },
      {
        id: 'logistics',
        tree: 'military',
        name: 'Logistica avanzata',
        description: '+5% produzione energia.',
        cost: 3,
        effects: ['energyIncome:+0.05'],
      },
      {
        id: 'bureaucrats',
        tree: 'economy',
        name: 'Quadri amministrativi',
        description: '+0.5 influenza/tick.',
        cost: 2,
        effects: ['influenceFlat:+0.5'],
      },
      {
        id: 'planetary-planning',
        tree: 'economy',
        name: 'Pianificazione planetaria',
        description: '+5% produzione minerali.',
        cost: 3,
        effects: ['mineralsIncome:+0.05'],
        prerequisites: ['bureaucrats'],
      },
    ],
    pointsPerInfluenceIncome: 0.05,
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
  diplomacy: {
    aiStartingOpinion: {
      min: -10,
      max: 30,
    },
    warThreshold: -60,
    peaceThreshold: -5,
    autoCheckInterval: 12,
    opinionDriftPerCheck: -1.5,
    warZones: {
      count: 2,
      powerMin: 8,
      powerMax: 18,
    },
    aiFleetStrength: {
      baseShips: 1,
      extraPerHostile: 1,
      maxShips: 6,
      attackBonusPerThreat: 10,
    },
    warEventLogLimit: 15,
  },
  military: {
    shipyard: {
      queueSize: 4,
      homeSystemDesignId: 'corvette',
    },
    fleet: {
      baseTravelTicks: 3,
    },
    colonyShipDesignId: 'colony',
    startingColonyShips: 1,
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
      {
        id: 'frigate',
        name: 'Classe Asteria',
        buildCost: {
          minerals: 170,
          energy: 70,
        },
        buildTime: 7,
        attack: 10,
        defense: 4,
        hullPoints: 28,
        speed: 0.9,
      },
      {
        id: 'colony',
        name: 'Classe Horizon',
        buildCost: {
          minerals: 150,
          energy: 60,
          food: 20,
        },
        buildTime: 6,
        attack: 0,
        defense: 1,
        hullPoints: 15,
        speed: 0.8,
      },
    ],
    templates: [
      {
        id: 'assault',
        base: 'corvette',
        name: 'Variante d Assalto',
        attack: 3,
        defense: 0,
        hull: 2,
        costMultiplier: 1.15,
      },
      {
        id: 'guardian',
        base: 'corvette',
        name: 'Variante Guardia',
        attack: 0,
        defense: 3,
        hull: 3,
        costMultiplier: 1.2,
      },
    ],
  },
  map: {
    orbitSpeed: 0.0025,
  },
};
