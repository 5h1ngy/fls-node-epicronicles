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
    galaxyRadius: 256,
    galaxyShape: 'circle',
  },
  galaxyShapes: ['circle', 'spiral', 'ring', 'bar', 'ellipse', 'cluster'],
  galaxyRadii: [128, 256, 512, 1024, 1536, 2048],
  galaxySystemCounts: [8, 16, 32, 64, 128, 256],
  galaxyPresets: [
    {
      id: 'tiny-ring',
      label: 'Anello 128',
      seed: 'ring-128',
      systemCount: 12,
      galaxyRadius: 128,
      galaxyShape: 'ring',
    },
    {
      id: 'small-ellipse',
      label: 'Ellisse 256',
      seed: 'ellipse-256',
      systemCount: 18,
      galaxyRadius: 256,
      galaxyShape: 'ellipse',
    },
    {
      id: 'medium-circle',
      label: 'Cerchio 512',
      seed: 'circle-512',
      systemCount: 28,
      galaxyRadius: 512,
      galaxyShape: 'circle',
    },
    {
      id: 'large-spiral',
      label: 'Spirale 1024',
      seed: 'spiral-1024',
      systemCount: 42,
      galaxyRadius: 1024,
      galaxyShape: 'spiral',
    },
    {
      id: 'bar-1536',
      label: 'Barra 1536',
      seed: 'bar-1536',
      systemCount: 64,
      galaxyRadius: 1536,
      galaxyShape: 'bar',
    },
    {
      id: 'cluster-2048',
      label: 'Cluster 2048',
      seed: 'cluster-2048',
      systemCount: 120,
      galaxyRadius: 2048,
      galaxyShape: 'cluster',
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
