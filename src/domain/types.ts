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

export interface Vector2 {
  x: number;
  y: number;
}

export interface StarSystem {
  id: string;
  name: string;
  position: Vector2;
  starClass: StarClass;
  visibility: SystemVisibility;
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
}
