import type { StarClass } from '@domain/types';

export const starVisuals: Record<
  StarClass,
  {
    coreColor: string;
    glowColor: string;
    coreRadius: number;
    glowScale: number;
    plasmaSpeed: number;
    jetIntensity: number;
    streakOpacity: number;
  }
> = {
  O: {
    coreColor: '#b9d8ff',
    glowColor: '#7ecbff',
    coreRadius: 6.5,
    glowScale: 22,
    plasmaSpeed: 1.4,
    jetIntensity: 0.32,
    streakOpacity: 0.2,
  },
  B: {
    coreColor: '#9fc4ff',
    glowColor: '#7ac8ff',
    coreRadius: 5.8,
    glowScale: 19.5,
    plasmaSpeed: 1.2,
    jetIntensity: 0.25,
    streakOpacity: 0.18,
  },
  A: {
    coreColor: '#c7d6ff',
    glowColor: '#9cc5ff',
    coreRadius: 5.0,
    glowScale: 17.5,
    plasmaSpeed: 1.1,
    jetIntensity: 0.22,
    streakOpacity: 0.16,
  },
  F: {
    coreColor: '#f7f2d0',
    glowColor: '#ffd27a',
    coreRadius: 4.6,
    glowScale: 16.2,
    plasmaSpeed: 1.05,
    jetIntensity: 0.2,
    streakOpacity: 0.15,
  },
  G: {
    coreColor: '#ffd27a',
    glowColor: '#ffbe55',
    coreRadius: 4.2,
    glowScale: 14.5,
    plasmaSpeed: 1,
    jetIntensity: 0.18,
    streakOpacity: 0.14,
  },
  K: {
    coreColor: '#ffb36b',
    glowColor: '#ff9b5f',
    coreRadius: 3.6,
    glowScale: 12.5,
    plasmaSpeed: 0.95,
    jetIntensity: 0.16,
    streakOpacity: 0.12,
  },
  M: {
    coreColor: '#ff8a5c',
    glowColor: '#ff6b5f',
    coreRadius: 3.2,
    glowScale: 10.8,
    plasmaSpeed: 0.9,
    jetIntensity: 0.14,
    streakOpacity: 0.1,
  },
};
