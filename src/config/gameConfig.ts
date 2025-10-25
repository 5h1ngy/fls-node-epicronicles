import type { GalaxyGenerationParams } from '../domain/galaxy';

export interface GameConfig {
  ticksPerSecond: number;
  defaultGalaxy: GalaxyGenerationParams;
  debug: {
    autoStart: boolean;
  };
}

export const gameConfig: GameConfig = {
  ticksPerSecond: 1,
  defaultGalaxy: {
    seed: 'debug-seed',
    systemCount: 12,
  },
  debug: {
    autoStart: false,
  },
};
