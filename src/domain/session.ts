import { createTestGalaxy } from './galaxy';
import type { GalaxyGenerationParams } from './galaxy';
import type { GameSession, SimulationClock } from './types';
import { createInitialScienceShips } from './exploration';
import { createInitialEconomy, type EconomyConfig } from './economy';

export interface SessionParams {
  seed: string;
  label?: string;
  galaxyOverrides?: Partial<GalaxyGenerationParams>;
  economyConfig: EconomyConfig;
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
  economyConfig,
}: SessionParams): GameSession => {
  const galaxy = createTestGalaxy({ seed, ...galaxyOverrides });
  const homeSystemId = galaxy.systems[0]?.id ?? 'unknown';
  return {
    id: crypto.randomUUID(),
    label: label ?? `Session ${new Date().toLocaleTimeString()}`,
    createdAt: Date.now(),
    galaxy,
    clock: createClock(),
    scienceShips: createInitialScienceShips(galaxy),
    economy: createInitialEconomy(homeSystemId, economyConfig),
    colonizationTasks: [],
  };
};
