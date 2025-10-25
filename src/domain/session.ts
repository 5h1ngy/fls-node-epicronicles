import { createTestGalaxy } from './galaxy';
import type { GalaxyGenerationParams } from './galaxy';
import type { GameSession, SimulationClock } from './types';
import { createInitialScienceShips } from './exploration';

export interface SessionParams {
  seed: string;
  label?: string;
  galaxyOverrides?: Partial<GalaxyGenerationParams>;
}

const createClock = (): SimulationClock => ({
  tick: 0,
  elapsedMs: 0,
  speedMultiplier: 1,
  isRunning: false,
  lastUpdate: null,
});

export const createSession = ({
  seed,
  label,
  galaxyOverrides,
}: SessionParams): GameSession => {
  const galaxy = createTestGalaxy({ seed, ...galaxyOverrides });
  return {
    id: crypto.randomUUID(),
    label: label ?? `Session ${new Date().toLocaleTimeString()}`,
    createdAt: Date.now(),
    galaxy,
    clock: createClock(),
    scienceShips: createInitialScienceShips(galaxy),
  };
};
