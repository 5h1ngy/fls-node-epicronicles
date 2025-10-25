import { create } from 'zustand';
import { gameConfig, type GameConfig } from '../config/gameConfig';
import { advanceClock, setClockRunning, setClockSpeed } from '../domain/clock';
import { createSession } from '../domain/session';
import type { GameSession, GameView } from '../domain/types';
import { advanceSimulation } from '../domain/simulation';
import { createColonizationTask } from '../domain/colonization';
import { canAffordCost, spendResources } from '../domain/economy';

export interface StartSessionArgs {
  seed?: string;
  label?: string;
}

export type ColonizationError =
  | 'NO_SESSION'
  | 'SYSTEM_NOT_FOUND'
  | 'SYSTEM_NOT_SURVEYED'
  | 'NO_HABITABLE_WORLD'
  | 'ALREADY_COLONIZED'
  | 'TASK_IN_PROGRESS'
  | 'INSUFFICIENT_RESOURCES';

export type StartColonizationResult =
  | { success: true }
  | { success: false; reason: ColonizationError };

interface GameStoreState {
  view: GameView;
  config: GameConfig;
  session: GameSession | null;
  startNewSession: (args?: StartSessionArgs) => void;
  returnToMenu: () => void;
  setSimulationRunning: (isRunning: boolean, now?: number) => void;
  setSpeedMultiplier: (speed: number) => void;
  advanceClockBy: (elapsedMs: number, now: number) => void;
  startColonization: (systemId: string) => StartColonizationResult;
}

const tickDurationMs = (cfg: GameConfig) =>
  Math.max(16, Math.round(1000 / cfg.ticksPerSecond));

export const useGameStore = create<GameStoreState>((set, get) => ({
  view: 'mainMenu',
  config: gameConfig,
  session: null,
  startNewSession: (args) => {
    const cfg = get().config;
    const seed = args?.seed ?? cfg.defaultGalaxy.seed;
    const session = createSession({
      seed,
      label: args?.label,
      galaxyOverrides: {
        systemCount: cfg.defaultGalaxy.systemCount,
        galaxyRadius: cfg.defaultGalaxy.galaxyRadius,
      },
      economyConfig: cfg.economy,
    });
    set({ session, view: 'simulation' });
  },
  returnToMenu: () => set({ view: 'mainMenu', session: null }),
  setSimulationRunning: (isRunning, now = Date.now()) =>
    set((state) => {
      if (!state.session) {
        return state;
      }

      return {
        ...state,
        session: {
          ...state.session,
          clock: setClockRunning(state.session.clock, isRunning, now),
        },
      };
    }),
  setSpeedMultiplier: (speed) =>
    set((state) => {
      if (!state.session) {
        return state;
      }

      return {
        ...state,
        session: {
          ...state.session,
          clock: setClockSpeed(state.session.clock, speed),
        },
      };
    }),
  advanceClockBy: (elapsedMs, now) =>
    set((state) => {
      if (!state.session) {
        return state;
      }

      const cfg = state.config;
      const updatedClock = advanceClock({
        clock: state.session.clock,
        elapsedMs,
        tickDurationMs: tickDurationMs(cfg),
        now,
      });

      const ticksAdvanced = updatedClock.tick - state.session.clock.tick;
      const simulatedSession =
        ticksAdvanced > 0
          ? advanceSimulation(state.session, ticksAdvanced, cfg)
          : state.session;

      return {
        ...state,
        session: {
          ...simulatedSession,
          clock: updatedClock,
        },
      };
    }),
  startColonization: (systemId) => {
    const state = get();
    const session = state.session;
    if (!session) {
      return { success: false, reason: 'NO_SESSION' };
    }
    const system = session.galaxy.systems.find(
      (candidate) => candidate.id === systemId,
    );
    if (!system) {
      return { success: false, reason: 'SYSTEM_NOT_FOUND' };
    }
    if (system.visibility !== 'surveyed') {
      return { success: false, reason: 'SYSTEM_NOT_SURVEYED' };
    }
    if (!system.habitableWorld) {
      return { success: false, reason: 'NO_HABITABLE_WORLD' };
    }
    const alreadyColonized = session.economy.planets.some(
      (planet) => planet.systemId === systemId,
    );
    if (alreadyColonized) {
      return { success: false, reason: 'ALREADY_COLONIZED' };
    }
    const taskInProgress = session.colonizationTasks.some(
      (task) => task.systemId === systemId,
    );
    if (taskInProgress) {
      return { success: false, reason: 'TASK_IN_PROGRESS' };
    }
    const cost = state.config.colonization.cost;
    if (!canAffordCost(session.economy, cost)) {
      return { success: false, reason: 'INSUFFICIENT_RESOURCES' };
    }

    const updatedEconomy = spendResources(session.economy, cost);
    const task = createColonizationTask(system, state.config.colonization);

    set({
      session: {
        ...session,
        economy: updatedEconomy,
        colonizationTasks: [...session.colonizationTasks, task],
      },
    });

    return { success: true };
  },
}));
