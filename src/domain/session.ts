import { createTestGalaxy } from './galaxy';
import type { GalaxyGenerationParams } from './galaxy';
import type {
  Empire,
  GameSession,
  SimulationClock,
} from './types';
import { createInitialScienceShips } from './exploration';
import { createInitialEconomy, type EconomyConfig } from './economy';
import type {
  DiplomacyConfig,
  MilitaryConfig,
} from '../config/gameConfig';
import { createInitialFleet } from './ships';

export interface SessionParams {
  seed: string;
  label?: string;
  galaxyOverrides?: Partial<GalaxyGenerationParams>;
  economyConfig: EconomyConfig;
  militaryConfig: MilitaryConfig;
  diplomacyConfig: DiplomacyConfig;
}

const createClock = (): SimulationClock => ({
  tick: 0,
  elapsedMs: 0,
  speedMultiplier: 1,
  isRunning: false,
  lastUpdate: null,
});

const createRandom = (seed: string) => {
  let t = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
};

const createEmpires = (
  seed: string,
  diplomacy: DiplomacyConfig,
): Empire[] => {
  const random = createRandom(seed);
  const clampOpinion = (value: number) =>
    Math.max(-100, Math.min(100, value));

  const palette = ['#ff9b5f', '#8bcf8a', '#f6e05e', '#dd97ff'];
  const aiNames = ['Impero Arcturus', 'Confederazione Lyra', 'Lega Vega'];

  const createAi = (index: number): Empire => {
    const baseOpinion =
      diplomacy.aiStartingOpinion.min +
      random() *
        (diplomacy.aiStartingOpinion.max - diplomacy.aiStartingOpinion.min);
    const opinion = clampOpinion(Math.round(baseOpinion));
    return {
      id: `ai-${index + 1}`,
      name: aiNames[index] ?? `Impero-${index + 1}`,
      kind: 'ai',
      color: palette[index % palette.length] ?? '#ff9b5f',
      opinion,
      warStatus: 'peace',
      personality: opinion < 0 ? 'espansionista' : 'pragmatico',
    };
  };

  const player: Empire = {
    id: 'player',
    name: 'Impero del Giocatore',
    kind: 'player',
    color: '#9fc1ff',
    opinion: 0,
    warStatus: 'peace',
  };

  return [player, createAi(0), createAi(1)];
};

export const createSession = ({
  seed,
  label,
  galaxyOverrides,
  economyConfig,
  militaryConfig,
  diplomacyConfig,
}: SessionParams): GameSession => {
  const galaxy = createTestGalaxy({ seed, ...galaxyOverrides });
  const homeSystemId = galaxy.systems[0]?.id ?? 'unknown';
  return {
    id: crypto.randomUUID(),
    label: label ?? `Session ${new Date().toLocaleTimeString()}`,
    createdAt: Date.now(),
    galaxy,
    empires: createEmpires(seed, diplomacyConfig),
    warEvents: [],
    clock: createClock(),
    scienceShips: createInitialScienceShips(galaxy),
    economy: createInitialEconomy(homeSystemId, economyConfig),
    colonizationTasks: [],
    fleets: [createInitialFleet(homeSystemId, militaryConfig)],
    shipyardQueue: [],
    districtConstructionQueue: [],
    combatReports: [],
    notifications: [],
  };
};
