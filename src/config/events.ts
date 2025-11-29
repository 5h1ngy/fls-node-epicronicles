import type { EventsConfig } from './types';

export const eventsConfig: EventsConfig = {
  narrativeIntervalTicks: 12,
  anomalyIntervalTicks: 14,
  crisisIntervalTicks: 36,
  narrative: [
    {
      id: 'support-request',
      kind: 'narrative',
      title: 'Richiesta di supporto',
      description: 'Una colonia chiede fondi per infrastrutture.',
      options: [
        {
          id: 'fund',
          label: 'Finanzia (Minerali -20)',
          description: 'Migliora la stabilita locale.',
          effects: [
            { kind: 'resource', target: 'minerals', amount: -20 },
            { kind: 'stability', amount: 4 },
          ],
        },
        {
          id: 'decline',
          label: 'Rifiuta',
          description: 'Risparmi ma scontenti i coloni.',
          effects: [{ kind: 'stability', amount: -3 }],
        },
      ],
    },
    {
      id: 'science-breakthrough',
      kind: 'narrative',
      title: 'Scoperta scientifica',
      description: 'Un team ottiene risultati imprevisti.',
      options: [
        {
          id: 'publish',
          label: 'Pubblica',
          description: '+12 Ricerca, +1 Influenza.',
          effects: [
            { kind: 'resource', target: 'research', amount: 12 },
            { kind: 'influence', amount: 1 },
          ],
        },
        {
          id: 'brevettare',
          label: 'Brevettare',
          description: '+15 Energia.',
          effects: [{ kind: 'resource', target: 'energy', amount: 15 }],
        },
      ],
    },
  ],
  anomalies: [
    {
      id: 'ancient-signal',
      kind: 'anomaly',
      title: 'Segnale antico',
      description: 'Un segnale debole proviene da un relitto orbitale.',
      options: [
        {
          id: 'indaga',
          label: 'Indaga',
          description: '+8 Ricerca, possibile minaccia.',
          effects: [
            { kind: 'resource', target: 'research', amount: 8 },
            { kind: 'hostileSpawn', amount: 6 },
          ],
        },
        {
          id: 'ignora',
          label: 'Ignora',
          description: 'Nessun rischio, nessun guadagno.',
          effects: [],
        },
      ],
    },
    {
      id: 'energy-crystals',
      kind: 'anomaly',
      title: 'Cristalli energetici',
      description: 'Formazioni cristalline rilasciano energia.',
      options: [
        {
          id: 'estrai',
          label: 'Estrarre',
          description: '+20 Energia, rischio instabilita.',
          effects: [
            { kind: 'resource', target: 'energy', amount: 20 },
            { kind: 'stability', amount: -2 },
          ],
        },
        {
          id: 'studia',
          label: 'Studiare',
          description: '+12 Ricerca.',
          effects: [{ kind: 'resource', target: 'research', amount: 12 }],
        },
      ],
    },
  ],
  crisis: [
    {
      id: 'external-raid',
      kind: 'crisis',
      title: 'Incursione esterna',
      description: 'Forze sconosciute attraversano i confini.',
      options: [
        {
          id: 'allerta',
          label: 'Allerta flotte',
          description: 'Nemici appaiono in un sistema chiave.',
          effects: [{ kind: 'hostileSpawn', amount: 15 }],
        },
        {
          id: 'negozia',
          label: 'Tentare negoziati',
          description: 'Piccolo costo di influenza, minaccia ridotta.',
          effects: [
            { kind: 'influence', amount: -3 },
            { kind: 'hostileSpawn', amount: 8 },
          ],
        },
      ],
    },
  ],
};
