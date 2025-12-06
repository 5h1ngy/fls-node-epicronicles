import type { GalaxyGenerationParams, GalaxyShape } from '@domain/galaxy';
import type { EconomyConfig } from '@domain/economy';
import type {
  GameEvent,
  ResearchBranch,
  ResearchTech,
  ResourceCost,
  ShipClassId,
  ShipDesign,
  StarClass,
  TraditionPerk,
  TraditionTreeId,
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
    buildCost: ResourceCost;
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
  galaxyShapes?: GalaxyShape[];
  galaxyRadii?: number[];
  galaxySystemCounts?: number[];
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
