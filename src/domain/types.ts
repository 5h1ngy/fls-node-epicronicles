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

export type ShipClassId = 'corvette';

export interface ShipDesign {
  id: ShipClassId;
  name: string;
  buildCost: ResourceCost;
  buildTime: number;
  attack: number;
  defense: number;
  hullPoints: number;
  speed: number;
}

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
  hostilePower?: number;
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

export interface FleetShip {
  id: string;
  designId: ShipClassId;
  hullPoints: number;
}

export interface Fleet {
  id: string;
  name: string;
  systemId: string;
  targetSystemId: string | null;
  ticksToArrival: number;
  ships: FleetShip[];
}

export interface ShipyardTask {
  id: string;
  designId: ShipClassId;
  ticksRemaining: number;
  totalTicks: number;
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

export interface CombatLoss {
  fleetId: string;
  shipsLost: number;
}

export type CombatResultType = 'playerVictory' | 'playerDefeat' | 'mutualDestruction';

export interface CombatReport {
  id: string;
  systemId: string;
  tick: number;
  playerPower: number;
  hostilePower: number;
  result: CombatResultType;
  losses: CombatLoss[];
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
  fleets: Fleet[];
  shipyardQueue: ShipyardTask[];
  combatReports: CombatReport[];
}
