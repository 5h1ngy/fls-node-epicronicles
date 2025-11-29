import type { GameConfig } from './types';
import { eventsConfig } from './events';
import { researchConfig } from './research';
import { traditionsConfig } from './traditions';
import { economyConfig } from './economy';
import { militaryConfig } from './military';
import { colonizationConfig } from './colonization';
import { diplomacyConfig } from './diplomacy';
import { mapConfig } from './map';
import { starVisuals } from './starVisuals';
import { starClasses } from './starClasses';

export * from './types';

export const gameConfig: GameConfig = {
  ticksPerSecond: 1,
  defaultGalaxy: {
    seed: 'debug-seed',
    systemCount: 18,
    galaxyRadius: 260,
    galaxyShape: 'circle',
  },
  galaxyPresets: [
    {
      id: 'test',
      label: 'Test (piccola)',
      seed: 'debug-seed',
      systemCount: 8,
      galaxyRadius: 140,
      galaxyShape: 'circle',
    },
    {
      id: 'standard',
      label: 'Standard',
      seed: 'debug-seed',
      systemCount: 18,
      galaxyRadius: 260,
      galaxyShape: 'circle',
    },
    {
      id: 'large',
      label: 'Grande',
      seed: 'debug-seed',
      systemCount: 28,
      galaxyRadius: 320,
      galaxyShape: 'circle',
    },
    {
      id: 'mega',
      label: 'Colossale (1200)',
      seed: 'debug-seed',
      systemCount: 1200,
      galaxyRadius: 1400,
      galaxyShape: 'spiral',
    },
  ],
  debug: {
    autoStart: false,
  },
  exploration: {
    travelTicks: 3,
    surveyTicks: 2,
  },
  economy: economyConfig,
  research: researchConfig,
  traditions: traditionsConfig,
  events: eventsConfig,
  colonization: colonizationConfig,
  diplomacy: diplomacyConfig,
  military: militaryConfig,
  map: mapConfig,
  starVisuals,
  starClasses,
};
