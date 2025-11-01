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

export type EmpireKind = 'player' | 'ai';
export type WarStatus = 'peace' | 'war';

export interface Empire {
  id: string;
  name: string;
  kind: EmpireKind;
  color: string;
  opinion: number;
  warStatus: WarStatus;
  warSince?: number | null;
  personality?: string;
}

export interface ResourceLedger {
  amount: number;
  income: number;
  upkeep: number;
}

export type PopulationJobId = 'workers' | 'specialists' | 'researchers';

export interface PopulationJobDefinition {
  id: PopulationJobId;
  label: string;
  description: string;
  production: Partial<Record<ResourceType, number>>;
  upkeep: Partial<Record<ResourceType, number>>;
}

export interface PopulationStats {
  total: number;
  workers: number;
  specialists: number;
  researchers: number;
}

export interface DistrictDefinition {
  id: string;
  label: string;
  description: string;
  cost: ResourceCost;
  buildTime: number;
  production: Partial<Record<ResourceType, number>>;
  upkeep: Partial<Record<ResourceType, number>>;
}

export type NotificationKind =
  | 'districtComplete'
  | 'districtSuspended'
  | 'colonizationStarted'
  | 'colonizationCompleted'
  | 'combatReport'
  | 'warDeclared'
  | 'peaceAccepted';

export interface GameNotification {
  id: string;
  tick: number;
  kind: NotificationKind;
  message: string;
}

export type PlanetKind = 'terrestrial' | 'desert' | 'tundra';

export type ShipClassId = 'corvette' | 'frigate' | 'colony';

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

export interface Vector3 extends Vector2 {
  z: number;
}

export interface HabitableWorldTemplate {
  name: string;
  kind: PlanetKind;
  size: number;
  baseProduction: ResourceCost;
  upkeep: ResourceCost;
}

export interface OrbitingPlanet {
  id: string;
  name: string;
  orbitRadius: number;
  size: number;
  color: string;
  orbitSpeed: number;
}

export interface StarSystem {
  id: string;
  name: string;
  position: Vector2;
  mapPosition: Vector3;
  starClass: StarClass;
  visibility: SystemVisibility;
  habitableWorld?: HabitableWorldTemplate;
  hostilePower?: number;
  orbitingPlanets: OrbitingPlanet[];
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
  population: PopulationStats;
  baseProduction: Partial<Record<ResourceType, number>>;
  upkeep: Partial<Record<ResourceType, number>>;
  districts: Record<string, number>;
  stability: number;
  happiness: number;
}

export interface EconomyState {
  resources: Record<ResourceType, ResourceLedger>;
  planets: Planet[];
}
export interface DistrictConstructionTask {
  id: string;
  planetId: string;
  districtId: string;
  ticksRemaining: number;
  totalTicks: number;
}

export interface FleetShip {
  id: string;
  designId: ShipClassId;
  hullPoints: number;
}

export interface Fleet {
  id: string;
  name: string;
  ownerId?: string;
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

export type ColonizationStatus = 'preparing' | 'traveling' | 'colonizing';

export interface ColonizationTask {
  id: string;
  systemId: string;
  planetTemplate: HabitableWorldTemplate;
  ticksRemaining: number;
  status: ColonizationStatus;
  totalTicks: number;
  missionElapsedTicks: number;
  missionTotalTicks: number;
  shipId: string;
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
  empires: Empire[];
  clock: SimulationClock;
  scienceShips: ScienceShip[];
  economy: EconomyState;
  colonizationTasks: ColonizationTask[];
  fleets: Fleet[];
  shipyardQueue: ShipyardTask[];
  districtConstructionQueue: DistrictConstructionTask[];
  combatReports: CombatReport[];
  notifications: GameNotification[];
}
