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
  StarClass,
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

export interface ResearchEra {
  id: number;
  label: string;
  description: string;
  gatewayTechs: string[];
}

export interface ResearchConfig {
  eras: ResearchEra[];
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
  constructionShipDesignId: ShipClassId;
  startingShips: {
    science: number;
    construction: number;
    colony: number;
    military: Array<{ designId: ShipClassId; count: number }>;
  };
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
  starVisuals: Record<
    StarClass,
    {
      coreColor: string;
      glowColor: string;
      coreRadius: number;
      glowScale: number;
      plasmaSpeed: number;
      jetIntensity: number;
      streakOpacity: number;
    }
  >;
  starClasses: Array<{ id: StarClass; weight: number }>;
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
              { kind: 'insight', techId: 'ancient-drives' },
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
              { kind: 'insight', techId: 'relic-sensors' },
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
      {
        id: 'alien-envoy',
        kind: 'narrative',
        title: 'Emissario alieno',
        description: 'Una delegazione offre conoscenze in cambio di supporto.',
        options: [
          {
            id: 'accetta-patto',
            label: 'Accetta il patto',
            description: 'Guadagni influenza e una tecnologia rara di fazione.',
            effects: [
              { kind: 'influence', amount: 3 },
              { kind: 'insight', techId: 'stellar-ward' },
            ],
          },
          {
            id: 'rifiuta',
            label: 'Rifiuta l\'offerta',
            description: 'Mantieni l\'indipendenza, piccolo bonus ricerca.',
            effects: [{ kind: 'resource', target: 'research', amount: 6 }],
          },
        ],
      },
      {
        id: 'dark-archive',
        kind: 'anomaly',
        title: 'Archivio oscuro',
        description: 'Un archivio alieno sepolto emette deboli segnali psionici.',
        options: [
          {
            id: 'decifra',
            label: 'Decifra i segnali',
            description: 'Rivela conoscenze rare ma rischia instabilita.',
            effects: [
              { kind: 'resource', target: 'research', amount: 10 },
              { kind: 'stability', amount: -2 },
              { kind: 'insight', techId: 'psi-echoes' },
            ],
          },
          {
            id: 'sigilla',
            label: 'Sigilla il sito',
            description: 'Eviti rischi, guadagni solo prestigio.',
            effects: [{ kind: 'influence', amount: 1 }],
          },
        ],
      },
      {
        id: 'time-fragment',
        kind: 'anomaly',
        title: 'Frammento temporale',
        description: 'Un frammento instabile distorce i sensori nel sistema.',
        options: [
          {
            id: 'studia-frammento',
            label: 'Studia il frammento',
            description: 'Guadagna ricerca, rischio instabilita.',
            effects: [
              { kind: 'resource', target: 'research', amount: 14 },
              { kind: 'stability', amount: -2 },
              { kind: 'insight', techId: 'chrono-scanners' },
            ],
          },
          {
            id: 'isola',
            label: 'Isola l’area',
            description: 'Eviti rischi, guadagni un minimo in influenza.',
            effects: [{ kind: 'influence', amount: 1 }],
          },
        ],
      },
      {
        id: 'void-echo',
        kind: 'anomaly',
        title: 'Eco del vuoto',
        description: 'Un’eco misteriosa oscilla tra frequenze subspaziali.',
        options: [
          {
            id: 'sintonizza',
            label: 'Sintonizza i sensori',
            description: 'Guadagna energia e scopri tecnologia rara, rischio instabilita.',
            effects: [
              { kind: 'resource', target: 'energy', amount: 15 },
              { kind: 'stability', amount: -2 },
              { kind: 'insight', techId: 'void-harmonics' },
            ],
          },
          {
            id: 'isola-eco',
            label: 'Isola l’eco',
            description: 'Eviti rischi, piccolo guadagno in ricerca.',
            effects: [{ kind: 'resource', target: 'research', amount: 6 }],
          },
        ],
      },
      {
        id: 'lost-beacon',
        kind: 'anomaly',
        title: 'Faro perduto',
        description: 'Un antico faro quantico trasmette ancora deboli segnali.',
        options: [
          {
            id: 'riattiva',
            label: 'Riattiva il faro',
            description: 'Potenzia le reti, rischio instabilita.',
            effects: [
              { kind: 'resource', target: 'energy', amount: 12 },
              { kind: 'stability', amount: -2 },
              { kind: 'insight', techId: 'quantum-beacons' },
            ],
          },
          {
            id: 'analizza',
            label: 'Analizza i protocolli',
            description: 'Piccolo bonus ricerca senza rischi.',
            effects: [{ kind: 'resource', target: 'research', amount: 6 }],
          },
        ],
      },
      {
        id: 'derelict-reactor',
        kind: 'anomaly',
        title: 'Reattore derelitto',
        description: 'Un nucleo energetico alieno galleggia vicino alla stella.',
        options: [
          {
            id: 'recupera',
            label: 'Recupera il nucleo',
            description: 'Ottieni energia e schemi rari, ma rischi instabilita.',
            effects: [
              { kind: 'resource', target: 'energy', amount: 18 },
              { kind: 'stability', amount: -3 },
              { kind: 'insight', techId: 'dark-core-reactor' },
            ],
          },
          {
            id: 'analizza-sicuro',
            label: 'Analizza in sicurezza',
            description: 'Piccolo bonus ricerca senza rischi.',
            effects: [{ kind: 'resource', target: 'research', amount: 7 }],
          },
        ],
      },
      {
        id: 'gravitic-anomaly',
        kind: 'anomaly',
        title: 'Lente gravitica',
        description: 'Un anello di materia oscura piega i sensori.',
        options: [
          {
            id: 'studia-lente',
            label: 'Studia la distorsione',
            description: 'Guadagna ricerca e uno schema raro, rischio instabilita.',
            effects: [
              { kind: 'resource', target: 'research', amount: 16 },
              { kind: 'stability', amount: -2 },
              { kind: 'insight', techId: 'gravitic-lens' },
            ],
          },
          {
            id: 'aggira',
            label: 'Aggira il fenomeno',
            description: 'Eviti rischi, piccolo bonus energia.',
            effects: [{ kind: 'resource', target: 'energy', amount: 8 }],
          },
        ],
      },
      {
        id: 'drone-cache',
        kind: 'anomaly',
        title: 'Archivio droni',
        description: 'Un hangar derelitto ospita droni automatici inattivi.',
        options: [
          {
            id: 'riattiva-droni',
            label: 'Riattiva i droni',
            description: 'Minerali bonus e schema raro, ma instabilita.',
            effects: [
              { kind: 'resource', target: 'minerals', amount: 18 },
              { kind: 'stability', amount: -3 },
              { kind: 'insight', techId: 'drone-foundry' },
            ],
          },
          {
            id: 'smantella',
            label: 'Smantella i droni',
            description: 'Recuperi minerali senza rischi.',
            effects: [{ kind: 'resource', target: 'minerals', amount: 8 }],
          },
        ],
      },
      {
        id: 'phase-echo',
        kind: 'anomaly',
        title: 'Eco di fase',
        description: 'Un residuo energetico distorce il continuum locale.',
        options: [
          {
            id: 'canalizza',
            label: 'Canalizza l’eco',
            description: 'Rischio instabilita, ottieni schema raro e ricerca.',
            effects: [
              { kind: 'resource', target: 'research', amount: 18 },
              { kind: 'stability', amount: -3 },
              { kind: 'insight', techId: 'phase-catalyst' },
            ],
          },
          {
            id: 'sigilla-eco',
            label: 'Sigilla l’eco',
            description: 'Piccolo bonus energia, nessun rischio.',
            effects: [{ kind: 'resource', target: 'energy', amount: 10 }],
          },
        ],
      },
      {
        id: 'void-sarcophagus',
        kind: 'anomaly',
        title: 'Sarcofago del vuoto',
        description: 'Un contenitore massivo ospita antiche sentinelle.',
        options: [
          {
            id: 'riattiva-sentinelle',
            label: 'Riattiva le sentinelle',
            description: 'Bonus difensivo raro, rischio instabilita.',
            effects: [
              { kind: 'stability', amount: -3 },
              { kind: 'insight', techId: 'void-sentinels' },
            ],
          },
          {
            id: 'analizza-sentinelle',
            label: 'Analizza e smantella',
            description: 'Recuperi risorse senza rischi.',
            effects: [{ kind: 'resource', target: 'minerals', amount: 12 }],
          },
        ],
      },
      {
        id: 'phase-rift',
        kind: 'anomaly',
        title: 'Frattura di fase',
        description: 'Una frattura instabile pulsa vicino alla stella.',
        options: [
          {
            id: 'stabilizza',
            label: 'Stabilizza la frattura',
            description: 'Schema raro scudi di fase, rischio instabilita.',
            effects: [
              { kind: 'stability', amount: -3 },
              { kind: 'insight', techId: 'phase-shield-lattice' },
            ],
          },
          {
            id: 'osserva',
            label: 'Osserva a distanza',
            description: 'Piccolo bonus ricerca senza rischi.',
            effects: [{ kind: 'resource', target: 'research', amount: 10 }],
          },
        ],
      },
      {
        id: 'ancient-datavault',
        kind: 'anomaly',
        title: 'Archivio dati antico',
        description: 'Un relitto custodisce banche dati sigillate.',
        options: [
          {
            id: 'decifra-dati',
            label: 'Decifra i dati',
            description: 'Ottieni schema raro e influenza, rischio instabilita.',
            effects: [
              { kind: 'stability', amount: -2 },
              { kind: 'influence', amount: 2 },
              { kind: 'insight', techId: 'ancient-databanks' },
            ],
          },
          {
            id: 'estrai-energia',
            label: 'Estrarre energia residua',
            description: 'Guadagni energia senza rischi.',
            effects: [{ kind: 'resource', target: 'energy', amount: 10 }],
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
    eras: [
      {
        id: 1,
        label: 'Era 1 - Esodo',
        description: 'Prime tecnologie di sopravvivenza e uscita dal sistema.',
        gatewayTechs: ['photonics', 'bio-domes'],
      },
      {
        id: 2,
        label: 'Era 2 - Espansione locale',
        description: 'Espansione stellare, amministrazione e primi cantieri avanzati.',
        gatewayTechs: ['advanced-sensors', 'reinforced-alloys'],
      },
    ],
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
        era: 1,
        clusterId: 'energy-1',
        kind: 'foundation',
        origin: 'standard',
      },
      {
        id: 'advanced-sensors',
        branch: 'physics',
        name: 'Sensori avanzati',
        description: '+10% produzione ricerca.',
        cost: 30,
        effects: ['researchIncome:+0.1'],
        era: 1,
        clusterId: 'sensors-1',
        kind: 'feature',
        origin: 'standard',
      },
      {
        id: 'bio-domes',
        branch: 'society',
        name: 'Bio-cupole',
        description: '+10% produzione cibo.',
        cost: 35,
        effects: ['foodIncome:+0.1'],
        era: 1,
        clusterId: 'bio-1',
        kind: 'foundation',
        origin: 'standard',
      },
      {
        id: 'bureaucracy',
        branch: 'society',
        name: 'Burosfera',
        description: '+1 influenza per tick.',
        cost: 45,
        effects: ['influenceFlat:+1'],
        era: 2,
        clusterId: 'admin-1',
        kind: 'feature',
        origin: 'standard',
      },
      {
        id: 'reinforced-alloys',
        branch: 'engineering',
        name: 'Leghe rinforzate',
        description: '+10% produzione minerali.',
        cost: 45,
        effects: ['mineralsIncome:+0.1'],
        era: 1,
        clusterId: 'materials-1',
        kind: 'foundation',
        origin: 'standard',
      },
      {
        id: 'modular-yards',
        branch: 'engineering',
        name: 'Cantieri modulari',
        description: '+10% produzione energia e minerali.',
        cost: 55,
        effects: ['energyIncome:+0.1', 'mineralsIncome:+0.1'],
        prerequisites: ['reinforced-alloys'],
        era: 2,
        clusterId: 'yards-1',
        kind: 'feature',
        origin: 'standard',
      },
      {
        id: 'relic-sensors',
        branch: 'physics',
        name: 'Sensori reliquia',
        description: 'Tecnologia rara: +15% produzione ricerca.',
        cost: 35,
        effects: ['researchIncome:+0.15'],
        era: 1,
        clusterId: 'relic-1',
        kind: 'rare',
        origin: 'anomaly',
      },
      {
        id: 'ancient-drives',
        branch: 'engineering',
        name: 'Propulsori antichi',
        description: 'Tecnologia rara: +10% produzione energia e flessibilita FTL.',
        cost: 40,
        effects: ['energyIncome:+0.1'],
        era: 2,
        clusterId: 'relic-2',
        kind: 'rare',
        origin: 'relic',
      },
      {
        id: 'psi-echoes',
        branch: 'physics',
        name: 'Echi psionici',
        description: 'Tecnologia rara: +10% ricerca, +2 influenza/tick (anomalia).',
        cost: 55,
        effects: ['researchIncome:+0.1', 'influenceFlat:+2'],
        era: 2,
        clusterId: 'relic-3',
        kind: 'rare',
        origin: 'relic',
      },
      {
        id: 'chrono-scanners',
        branch: 'physics',
        name: 'Scanner cronici',
        description: 'Tecnologia rara: +10% ricerca, migliora rilevamento anomalia.',
        cost: 60,
        effects: ['researchIncome:+0.1'],
        era: 2,
        clusterId: 'relic-4',
        kind: 'rare',
        origin: 'anomaly',
      },
      {
        id: 'void-harmonics',
        branch: 'physics',
        name: 'Armoniche del vuoto',
        description: 'Tecnologia rara: +10% energia, +5% ricerca (anomaly/relic).',
        cost: 65,
        effects: ['energyIncome:+0.1', 'researchIncome:+0.05'],
        era: 3,
        clusterId: 'relic-5',
        kind: 'rare',
        origin: 'anomaly',
      },
      {
        id: 'quantum-beacons',
        branch: 'physics',
        name: 'Beacon quantici',
        description: 'Tecnologia rara: +8% energia e ricerca, reti di faro quantico.',
        cost: 70,
        effects: ['energyIncome:+0.08', 'researchIncome:+0.08'],
        era: 3,
        clusterId: 'relic-6',
        kind: 'rare',
        origin: 'anomaly',
      },
      {
        id: 'dark-core-reactor',
        branch: 'engineering',
        name: 'Reattore nucleo oscuro',
        description: 'Tecnologia rara: +12% energia, +5% minerali (relic).',
        cost: 75,
        effects: ['energyIncome:+0.12', 'mineralsIncome:+0.05'],
        era: 3,
        clusterId: 'relic-7',
        kind: 'rare',
        origin: 'relic',
      },
      {
        id: 'stellar-ward',
        branch: 'physics',
        name: 'Baluardo stellare',
        description: 'Tecnologia rara: +5% ricerca, +1.5 influenza/tick (faction).',
        cost: 70,
        effects: ['researchIncome:+0.05', 'influenceFlat:+1.5'],
        era: 3,
        clusterId: 'faction-1',
        kind: 'rare',
        origin: 'faction',
      },
      {
        id: 'gravitic-lens',
        branch: 'physics',
        name: 'Lente gravitica',
        description: 'Tecnologia rara: +10% ricerca, +10% velocita sondaggio.',
        cost: 70,
        effects: ['researchIncome:+0.1'],
        era: 3,
        clusterId: 'relic-8',
        kind: 'rare',
        origin: 'anomaly',
      },
      {
        id: 'drone-foundry',
        branch: 'engineering',
        name: 'Fonderia droni reliquia',
        description: 'Tecnologia rara: +12% minerali, -5% costo navi leggere.',
        cost: 75,
        effects: ['mineralsIncome:+0.12'],
        era: 3,
        clusterId: 'relic-9',
        kind: 'rare',
        origin: 'relic',
      },
      {
        id: 'phase-catalyst',
        branch: 'physics',
        name: 'Catalizzatore di fase',
        description: 'Tecnologia rara: +12% ricerca, +8% energia (Era 4).',
        cost: 90,
        effects: ['researchIncome:+0.12', 'energyIncome:+0.08'],
        era: 4,
        clusterId: 'relic-10',
        kind: 'rare',
        origin: 'anomaly',
      },
      {
        id: 'void-sentinels',
        branch: 'engineering',
        name: 'Sentinelle del vuoto',
        description: 'Tecnologia rara: -8% costo navi capitali, +10% difesa flotte.',
        cost: 95,
        effects: ['mineralsIncome:+0.08'],
        era: 4,
        clusterId: 'relic-11',
        kind: 'rare',
        origin: 'relic',
      },
      {
        id: 'phase-shield-lattice',
        branch: 'physics',
        name: 'Reticolo scudi di fase',
        description: 'Tecnologia rara: +8% ricerca, +12% difesa flotte (Era 4).',
        cost: 100,
        effects: ['researchIncome:+0.08'],
        era: 4,
        clusterId: 'relic-12',
        kind: 'rare',
        origin: 'relic',
      },
      {
        id: 'ancient-databanks',
        branch: 'society',
        name: 'Databank antichi',
        description: 'Tecnologia rara: +0.8 influenza/tick, +8% ricerca (Era 4).',
        cost: 95,
        effects: ['influenceFlat:+0.8', 'researchIncome:+0.08'],
        era: 4,
        clusterId: 'relic-13',
        kind: 'rare',
        origin: 'anomaly',
      },
      {
        id: 'ai-open',
        branch: 'society',
        name: 'IA aperta',
        description: '+10% produzione ricerca, governance flessibile.',
        cost: 60,
        effects: ['researchIncome:+0.1'],
        era: 2,
        clusterId: 'ai-1',
        kind: 'feature',
        origin: 'standard',
        mutuallyExclusiveGroup: 'ai-governance',
      },
      {
        id: 'ai-regulated',
        branch: 'society',
        name: 'IA regolata',
        description: '+0.5 influenza/tick, IA sotto supervisione.',
        cost: 60,
        effects: ['influenceFlat:+0.5'],
        era: 2,
        clusterId: 'ai-1',
        kind: 'feature',
        origin: 'standard',
        mutuallyExclusiveGroup: 'ai-governance',
      },
      {
        id: 'bio-adaptation',
        branch: 'society',
        name: 'Adattamento biologico',
        description: '+10% produzione cibo, popolazioni adattabili.',
        cost: 65,
        effects: ['foodIncome:+0.1'],
        era: 2,
        clusterId: 'bio-cyber-1',
        kind: 'feature',
        origin: 'standard',
        mutuallyExclusiveGroup: 'bio-cyber',
      },
      {
        id: 'cyber-augmentation',
        branch: 'engineering',
        name: 'Potenziamenti cibernetici',
        description: '+10% produzione energia, efficienza meccanica.',
        cost: 65,
        effects: ['energyIncome:+0.1'],
        era: 2,
        clusterId: 'bio-cyber-1',
        kind: 'feature',
        origin: 'standard',
        mutuallyExclusiveGroup: 'bio-cyber',
      },
      {
        id: 'doctrine-swarm',
        branch: 'engineering',
        name: 'Dottrina sciame',
        description: '+5% minerali e velocita di produzione navi leggere.',
        cost: 60,
        effects: ['mineralsIncome:+0.05'],
        era: 2,
        clusterId: 'doctrine-1',
        kind: 'feature',
        origin: 'standard',
        mutuallyExclusiveGroup: 'fleet-doctrine',
      },
      {
        id: 'doctrine-core',
        branch: 'engineering',
        name: 'Dottrina nucleo d’élite',
        description: '+5% produzione energia e focus su navi capitali.',
        cost: 60,
        effects: ['energyIncome:+0.05'],
        era: 2,
        clusterId: 'doctrine-1',
        kind: 'feature',
        origin: 'standard',
        mutuallyExclusiveGroup: 'fleet-doctrine',
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
        era: 1,
        clusterId: 'explore-1',
        origin: 'standard',
      },
      {
        id: 'logistics',
        tree: 'military',
        name: 'Logistica avanzata',
        description: '+5% produzione energia.',
        cost: 3,
        effects: ['energyIncome:+0.05'],
        era: 1,
        clusterId: 'military-1',
        origin: 'standard',
      },
      {
        id: 'bureaucrats',
        tree: 'economy',
        name: 'Quadri amministrativi',
        description: '+0.5 influenza/tick.',
        cost: 2,
        effects: ['influenceFlat:+0.5'],
        era: 1,
        clusterId: 'economy-1',
        origin: 'standard',
      },
      {
        id: 'planetary-planning',
        tree: 'economy',
        name: 'Pianificazione planetaria',
        description: '+5% produzione minerali.',
        cost: 3,
        effects: ['mineralsIncome:+0.05'],
        prerequisites: ['bureaucrats'],
        era: 1,
        clusterId: 'economy-1',
        origin: 'standard',
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
    constructionShipDesignId: 'constructor',
    startingShips: {
      science: 1,
      construction: 1,
      colony: 0,
      military: [],
    },
    shipDesigns: [
      {
        id: 'corvette',
        name: 'Classe Aurora',
        role: 'military',
        description: 'Corvetta versatile per pattugliamenti rapidi e schermaglia.',
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
        role: 'military',
        description: 'Fregata di linea, buon bilanciamento tra attacco e difesa.',
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
        role: 'colony',
        description: 'Nave colonia con moduli di supporto e stiva ampliata.',
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
      {
        id: 'constructor',
        name: 'Classe Atlas',
        role: 'construction',
        description: 'Nave costruttrice per avamposti e infrastrutture orbitali.',
        buildCost: {
          minerals: 110,
          energy: 55,
        },
        buildTime: 6,
        attack: 0,
        defense: 2,
        hullPoints: 18,
        speed: 0.85,
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
  starClasses: [
    { id: 'O', weight: 1 },
    { id: 'B', weight: 2 },
    { id: 'A', weight: 4 },
    { id: 'F', weight: 8 },
    { id: 'G', weight: 10 },
    { id: 'K', weight: 12 },
    { id: 'M', weight: 16 },
  ],
  starVisuals: {
    O: {
      coreColor: '#b9d8ff',
      glowColor: '#7ecbff',
      coreRadius: 1.6,
      glowScale: 5.6,
      plasmaSpeed: 1.4,
      jetIntensity: 0.32,
      streakOpacity: 0.2,
    },
    B: {
      coreColor: '#9fc4ff',
      glowColor: '#7ac8ff',
      coreRadius: 1.4,
      glowScale: 5.2,
      plasmaSpeed: 1.2,
      jetIntensity: 0.25,
      streakOpacity: 0.18,
    },
    A: {
      coreColor: '#c7d6ff',
      glowColor: '#9cc5ff',
      coreRadius: 1.3,
      glowScale: 5.0,
      plasmaSpeed: 1.1,
      jetIntensity: 0.22,
      streakOpacity: 0.16,
    },
    F: {
      coreColor: '#f7f2d0',
      glowColor: '#ffd27a',
      coreRadius: 1.3,
      glowScale: 5.1,
      plasmaSpeed: 1.05,
      jetIntensity: 0.2,
      streakOpacity: 0.15,
    },
    G: {
      coreColor: '#ffd27a',
      glowColor: '#ffbe55',
      coreRadius: 1.2,
      glowScale: 4.8,
      plasmaSpeed: 1,
      jetIntensity: 0.18,
      streakOpacity: 0.14,
    },
    K: {
      coreColor: '#ffb36b',
      glowColor: '#ff9b5f',
      coreRadius: 1.1,
      glowScale: 4.6,
      plasmaSpeed: 0.95,
      jetIntensity: 0.16,
      streakOpacity: 0.12,
    },
    M: {
      coreColor: '#ff8a5c',
      glowColor: '#ff6b5f',
      coreRadius: 1,
      glowScale: 4.2,
      plasmaSpeed: 0.9,
      jetIntensity: 0.14,
      streakOpacity: 0.1,
    },
  },
};
