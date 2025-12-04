export type GameView = 'mainMenu' | 'simulation';

export interface SimulationClock {
  tick: number;
  elapsedMs: number;
  speedMultiplier: number;
  isRunning: boolean;
  lastUpdate: number | null;
}

export type StarClass = 'O' | 'B' | 'A' | 'F' | 'G' | 'K' | 'M';

export type SystemVisibility = 'unknown' | 'revealed' | 'surveyed';

export type ScienceShipStatus = 'idle' | 'traveling' | 'surveying';

export type ResourceType = 'energy' | 'minerals' | 'food' | 'research' | 'influence';
export type ResourceCost = Partial<Record<ResourceType, number>>;

export type ResearchBranch = 'physics' | 'society' | 'engineering';

export interface ResearchTech {
  id: string;
  branch: ResearchBranch;
  name: string;
  description: string;
  cost: number;
  prerequisites?: string[];
  effects?: string[];
  era?: number;
  clusterId?: string;
  kind?: 'foundation' | 'feature' | 'rare';
  origin?: 'standard' | 'relic' | 'anomaly' | 'faction';
  mutuallyExclusiveGroup?: string;
}

export interface ResearchBranchState {
  currentTechId: string | null;
  progress: number;
  completed: string[];
}

export interface ResearchState {
  branches: Record<ResearchBranch, ResearchBranchState>;
  backlog: ResearchTech[];
  currentEra: number;
  unlockedEras: number[];
  exclusivePicks?: Record<string, string>;
}

export type TraditionTreeId = 'exploration' | 'economy' | 'military';

export interface TraditionPerk {
  id: string;
  tree: TraditionTreeId;
  name: string;
  description: string;
  cost: number;
  prerequisites?: string[];
  effects?: string[];
  era?: number;
  clusterId?: string;
  origin?: 'standard' | 'relic' | 'anomaly' | 'faction';
  mutuallyExclusiveGroup?: string;
}

export interface TraditionState {
  availablePoints: number;
  unlocked: string[];
  backlog: TraditionPerk[];
  currentEra: number;
  unlockedEras: number[];
  exclusivePicks?: Record<string, string>;
}

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
  accessToPlayer?: boolean;
}

export type WarEventType = 'warStart' | 'warEnd';

export interface WarEvent {
  id: string;
  empireId: string;
  type: WarEventType;
  tick: number;
  message: string;
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
  requiresColonists?: number;
}

export type NotificationKind =
  | 'districtComplete'
  | 'districtSuspended'
  | 'colonizationStarted'
  | 'colonizationCompleted'
  | 'combatReport'
  | 'warDeclared'
  | 'peaceAccepted'
  | 'researchComplete'
  | 'traditionUnlocked'
  | 'eventStarted'
  | 'eventResolved';

export interface EventOptionEffect {
  kind:
    | 'resource'
    | 'stability'
    | 'hostileSpawn'
    | 'insight'
    | 'influence'
    | 'triggerEvent';
  target?: ResourceType;
  amount?: number;
  systemId?: string;
  nextEventId?: string;
  techId?: string;
  perkId?: string;
}

export interface EventOption {
  id: string;
  label: string;
  description: string;
  effects: EventOptionEffect[];
}

export type EventKind = 'narrative' | 'anomaly' | 'crisis';

export interface GameEvent {
  id: string;
  kind: EventKind;
  title: string;
  description: string;
  systemId?: string | null;
  options: EventOption[];
  resolvedOptionId?: string | null;
}

export interface EventLogEntry {
  id: string;
  tick: number;
  title: string;
  result: string;
}

export interface GameNotification {
  id: string;
  tick: number;
  kind: NotificationKind;
  message: string;
}

export type PlanetKind = 'terrestrial' | 'desert' | 'tundra';

// Config-driven ship ids; keep it open to allow new classes from config
export type ShipClassId = string;

export interface ShipDesign {
  id: ShipClassId;
  name: string;
  description?: string;
  role?: ShipRole;
  buildCost: ResourceCost;
  buildTime: number;
  attack: number;
  defense: number;
  hullPoints: number;
  speed: number;
  templateId?: string;
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
  habitability: number;
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
  ownerId?: string | null;
  hasShipyard?: boolean;
  shipyardAnchorPlanetId?: string | null;
  shipyardBuild?: {
    ticksRemaining: number;
    totalTicks: number;
    anchorPlanetId: string | null;
  };
}

export interface ScienceShip {
  id: string;
  name: string;
  currentSystemId: string;
  targetSystemId: string | null;
  anchorPlanetId?: string | null;
  localOffset?: Vector3 | null;
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
  habitability: number;
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
  attackBonus?: number;
}

export type ShipRole = 'military' | 'colony' | 'construction' | 'science';

export interface Fleet {
  id: string;
  name: string;
  ownerId?: string;
  systemId: string;
  targetSystemId: string | null;
  anchorPlanetId?: string | null;
  localOffset?: Vector3 | null;
  ticksToArrival: number;
  ships: FleetShip[];
  lastTargetSystemId?: string | null;
}

export interface ShipyardTask {
  id: string;
  designId: ShipClassId;
  ticksRemaining: number;
  totalTicks: number;
  templateId?: string;
  customization?: ShipCustomization;
}

export interface ShipCustomization {
  name?: string;
  attackBonus: number;
  defenseBonus: number;
  hullBonus: number;
  costMultiplier: number;
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

export type CombatResultType =
  | 'playerVictory'
  | 'playerDefeat'
  | 'mutualDestruction'
  | 'stalemate';

export interface CombatReport {
  id: string;
  systemId: string;
  tick: number;
  playerPower: number;
  playerDefense: number;
  damageTaken: number;
  hostilePower: number;
  result: CombatResultType;
  losses: CombatLoss[];
}

export type FleetManageError =
  | 'NO_SESSION'
  | 'FLEET_NOT_FOUND'
  | 'TARGET_NOT_FOUND'
  | 'SAME_FLEET'
  | 'DIFFERENT_SYSTEM'
  | 'INSUFFICIENT_SHIPS';

export type FleetMergeResult =
  | { success: true }
  | { success: false; reason: FleetManageError };

export type FleetSplitResult =
  | { success: true; newFleetId: string }
  | { success: false; reason: FleetManageError };

export interface GalaxyState {
  seed: string;
  galaxyShape?: 'circle' | 'spiral';
  systems: StarSystem[];
}

export interface GameSession {
  id: string;
  label: string;
  createdAt: number;
  galaxy: GalaxyState;
  empires: Empire[];
  warEvents: WarEvent[];
  clock: SimulationClock;
  scienceShips: ScienceShip[];
  economy: EconomyState;
  research: ResearchState;
  traditions: TraditionState;
  events: {
    active: GameEvent | null;
    queue: GameEvent[];
    log: EventLogEntry[];
  };
  colonizationTasks: ColonizationTask[];
  fleets: Fleet[];
  shipyardQueue: ShipyardTask[];
  districtConstructionQueue: DistrictConstructionTask[];
  combatReports: CombatReport[];
  notifications: GameNotification[];
}
