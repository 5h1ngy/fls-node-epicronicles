import { create } from 'zustand';
import { gameConfig, type GameConfig } from '../config/gameConfig';
import { advanceClock, setClockRunning, setClockSpeed } from '../domain/clock';
import { createSession } from '../domain/session';
import type { GameSession, GameView } from '../domain/types';

export interface StartSessionArgs {
  seed?: string;
  label?: string;
}

interface GameStoreState {
  view: GameView;
  config: GameConfig;
  session: GameSession | null;
  startNewSession: (args?: StartSessionArgs) => void;
  returnToMenu: () => void;
  setSimulationRunning: (isRunning: boolean, now?: number) => void;
  setSpeedMultiplier: (speed: number) => void;
  advanceClockBy: (elapsedMs: number, now: number) => void;
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
    const session = createSession({ seed, label: args?.label });
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

      return {
        ...state,
        session: {
          ...state.session,
          clock: updatedClock,
        },
      };
    }),
}));
