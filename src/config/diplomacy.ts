import type { DiplomacyConfig } from './types';

export const diplomacyConfig: DiplomacyConfig = {
  aiStartingOpinion: {
    min: -10,
    max: 30,
  },
  warThreshold: -60,
  peaceThreshold: -5,
  autoCheckInterval: 12,
  opinionDriftPerCheck: -1.5,
  warZones: {
    count: 2,
    powerMin: 8,
    powerMax: 18,
  },
  aiFleetStrength: {
    baseShips: 1,
    extraPerHostile: 1,
    maxShips: 6,
    attackBonusPerThreat: 10,
  },
  warEventLogLimit: 15,
};
