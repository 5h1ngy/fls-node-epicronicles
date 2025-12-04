import type { TraditionConfig } from './types';

export const traditionsConfig: TraditionConfig = {
  trees: [
    {
      id: 'exploration',
      label: 'Esplorazione',
      description: 'Scoperta rapida della galassia.',
    },
    {
      id: 'economy',
      label: 'Economia',
      description: 'Crescita risorse e stabilita.',
    },
    {
      id: 'military',
      label: 'Militare',
      description: 'Potenza e mobilità delle flotte.',
    },
  ],
  perks: [
    {
      id: 'survey-speed',
      tree: 'exploration',
      name: 'Scansioni fulminee',
      description: '+5% produzione ricerca.',
      cost: 2,
      effects: ['researchIncome:+0.05'],
      era: 1,
      clusterId: 'explore-1',
      origin: 'standard',
    },
    {
      id: 'logistics',
      tree: 'military',
      name: 'Logistica avanzata',
      description: '+5% produzione energia.',
      cost: 3,
      effects: ['energyIncome:+0.05'],
      era: 1,
      clusterId: 'military-1',
      origin: 'standard',
    },
    {
      id: 'bureaucrats',
      tree: 'economy',
      name: 'Quadri amministrativi',
      description: '+0.5 influenza/tick.',
      cost: 2,
      effects: ['influenceFlat:+0.5'],
      era: 1,
      clusterId: 'economy-1',
      origin: 'standard',
    },
    {
      id: 'planetary-planning',
      tree: 'economy',
      name: 'Pianificazione planetaria',
      description: '+5% produzione minerali.',
      cost: 3,
      effects: ['mineralsIncome:+0.05'],
      prerequisites: ['bureaucrats'],
      era: 1,
      clusterId: 'economy-1',
      origin: 'standard',
    },
  ],
  pointsPerInfluenceIncome: 0.05,
};
