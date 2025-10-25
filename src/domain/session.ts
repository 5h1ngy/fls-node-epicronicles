import { createTestGalaxy } from './galaxy';
import type { GameSession, SimulationClock } from './types';

export interface SessionParams {
  seed: string;
  label?: string;
}

const createClock = (): SimulationClock => ({
  tick: 0,
  elapsedMs: 0,
  speedMultiplier: 1,
  isRunning: false,
  lastUpdate: null,
});

export const createSession = ({ seed, label }: SessionParams): GameSession => ({
  id: crypto.randomUUID(),
  label: label ?? `Session ${new Date().toLocaleTimeString()}`,
  createdAt: Date.now(),
  galaxy: createTestGalaxy({ seed }),
  clock: createClock(),
});
