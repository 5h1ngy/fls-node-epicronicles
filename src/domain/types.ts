export type GameView = 'mainMenu' | 'simulation';

export interface SimulationClock {
  tick: number;
  elapsedMs: number;
  speedMultiplier: number;
  isRunning: boolean;
  lastUpdate: number | null;
}

export interface GalaxyState {
  seed: string;
  systemCount: number;
}

export interface GameSession {
  id: string;
  label: string;
  createdAt: number;
  galaxy: GalaxyState;
  clock: SimulationClock;
}
