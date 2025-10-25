import type { GalaxyState } from './types';

export interface GalaxyGenerationParams {
  seed: string;
  systemCount?: number;
}

export const createTestGalaxy = ({
  seed,
  systemCount = 8,
}: GalaxyGenerationParams): GalaxyState => ({
  seed,
  systemCount,
});
