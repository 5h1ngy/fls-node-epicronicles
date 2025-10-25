export type GameView = 'mainMenu' | 'simulation';

export interface SimulationClock {
  tick: number;
  elapsedMs: number;
  speedMultiplier: number;
  isRunning: boolean;
  lastUpdate: number | null;
}

export type StarClass = 'mainSequence' | 'giant' | 'dwarf';

export type SystemVisibility = 'unknown' | 'revealed' | 'surveyed';

export type ScienceShipStatus = 'idle' | 'traveling' | 'surveying';

export type ResourceType = 'energy' | 'minerals' | 'food' | 'research';
export type ResourceCost = Partial<Record<ResourceType, number>>;

export interface ResourceLedger {
  amount: number;
  income: number;
  upkeep: number;
}

export type PlanetKind = 'terrestrial' | 'desert' | 'tundra';

export interface Vector2 {
  x: number;
  y: number;
}

export interface HabitableWorldTemplate {
  name: string;
  kind: PlanetKind;
  size: number;
  baseProduction: ResourceCost;
  upkeep: ResourceCost;
}

export interface StarSystem {
  id: string;
  name: string;
  position: Vector2;
  starClass: StarClass;
  visibility: SystemVisibility;
  habitableWorld?: HabitableWorldTemplate;
}

export interface ScienceShip {
  id: string;
  name: string;
  currentSystemId: string;
  targetSystemId: string | null;
  status: ScienceShipStatus;
  ticksRemaining: number;
  autoExplore: boolean;
}

export interface Planet {
  id: string;
  name: string;
  systemId: string;
  kind: PlanetKind;
  size: number;
  population: number;
  baseProduction: Partial<Record<ResourceType, number>>;
  upkeep: Partial<Record<ResourceType, number>>;
}

export interface EconomyState {
  resources: Record<ResourceType, ResourceLedger>;
  planets: Planet[];
}

export type ColonizationStatus = 'preparing' | 'colonizing';

export interface ColonizationTask {
  id: string;
  systemId: string;
  planetTemplate: HabitableWorldTemplate;
  ticksRemaining: number;
  status: ColonizationStatus;
  totalTicks: number;
}

export interface GalaxyState {
  seed: string;
  systems: StarSystem[];
}

export interface GameSession {
  id: string;
  label: string;
  createdAt: number;
  galaxy: GalaxyState;
  clock: SimulationClock;
  scienceShips: ScienceShip[];
  economy: EconomyState;
  colonizationTasks: ColonizationTask[];
}
