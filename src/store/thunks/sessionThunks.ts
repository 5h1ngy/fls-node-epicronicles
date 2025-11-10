import { type AnyAction, type ThunkAction } from '@reduxjs/toolkit';
import { createSession, advanceSimulation } from '@domain/session';
import { advanceClock, setClockRunning as setClockRunningDomain, setClockSpeed } from '@domain/time/clock';
import type { GameSession } from '@domain/types';
import type { RootState } from '../index';
import {
  startSessionSuccess,
  returnToMenu as returnToMenuAction,
  setSessionState,
} from '../slice/gameSlice';
import type { StartSessionArgs } from '../slice/gameSlice';
import { tickDurationMs } from './helpers';

type SimulationWorkerMessage =
  | { type: 'ready' }
  | { type: 'result'; id: number; session: GameSession };

type SimulationWorkerRequest = {
  type: 'simulate';
  id: number;
  session: GameSession;
  ticks: number;
  config: RootState['game']['config'];
};

let simulationWorker: Worker | null = null;
let workerIdCounter = 0;
const workerPending = new Map<
  number,
  { resolve: (session: GameSession) => void; reject: (err: Error) => void }
>();

const getSimulationWorker = () => {
  if (simulationWorker) {
    return simulationWorker;
  }
  simulationWorker = new Worker(
    new URL('../../shared/workers/simulationWorker.ts', import.meta.url),
    { type: 'module' },
  );
  simulationWorker.onmessage = (event: MessageEvent<SimulationWorkerMessage>) => {
    const data = event.data;
    if (data.type !== 'result') {
      return;
    }
    const pending = workerPending.get(data.id);
    if (pending) {
      pending.resolve(data.session);
      workerPending.delete(data.id);
    }
  };
  simulationWorker.onerror = (err) => {
    workerPending.forEach(({ reject }) =>
      reject(new Error(`Simulation worker error: ${err.message}`)),
    );
    workerPending.clear();
    simulationWorker?.terminate();
    simulationWorker = null;
  };
  return simulationWorker;
};

const simulateInWorker = (
  session: GameSession,
  ticks: number,
  config: RootState['game']['config'],
): Promise<GameSession> => {
  return new Promise((resolve, reject) => {
    try {
      const worker = getSimulationWorker();
      const id = ++workerIdCounter;
      workerPending.set(id, { resolve, reject });
      const message: SimulationWorkerRequest = {
        type: 'simulate',
        id,
        session,
        ticks,
        config,
      };
      worker.postMessage(message);
    } catch (err) {
      reject(err as Error);
    }
  });
};

export const startNewSession =
  (args?: StartSessionArgs): ThunkAction<void, RootState, unknown, AnyAction> =>
  (dispatch, getState) => {
    const cfg = getState().game.config;
    const preset =
      cfg.galaxyPresets.find((entry) => entry.id === (args?.presetId ?? '')) ??
      cfg.galaxyPresets.find((entry) => entry.id === 'standard');
    const seed = args?.seed ?? preset?.seed ?? cfg.defaultGalaxy.seed;
    const session = createSession({
      seed,
      label: args?.label,
      galaxyOverrides: {
        systemCount: preset?.systemCount ?? cfg.defaultGalaxy.systemCount,
        galaxyRadius: preset?.galaxyRadius ?? cfg.defaultGalaxy.galaxyRadius,
      },
      economyConfig: cfg.economy,
      researchConfig: cfg.research,
      traditionConfig: cfg.traditions,
      militaryConfig: cfg.military,
      diplomacyConfig: cfg.diplomacy,
    });
    dispatch(startSessionSuccess(session));
  };

export const returnToMenu = () => returnToMenuAction();

export const setSimulationRunning =
  (isRunning: boolean, now = Date.now()): ThunkAction<void, RootState, unknown, AnyAction> =>
  (dispatch, getState) => {
    const session = getState().game.session;
    if (!session) {
      return;
    }
    const updated: GameSession = {
      ...session,
      clock: setClockRunningDomain(session.clock, isRunning, now),
    };
    dispatch(setSessionState(updated));
  };

export const setSpeedMultiplier =
  (speed: number): ThunkAction<void, RootState, unknown, AnyAction> =>
  (dispatch, getState) => {
    const session = getState().game.session;
    if (!session) {
      return;
    }
    const updated: GameSession = {
      ...session,
      clock: setClockSpeed(session.clock, speed),
    };
    dispatch(setSessionState(updated));
  };

export const advanceClockBy =
  (elapsedMs: number, now: number): ThunkAction<void, RootState, unknown, AnyAction> =>
  async (dispatch, getState) => {
    const state = getState().game;
    const session = state.session;
    if (!session) {
      return;
    }

    const updatedClock = advanceClock({
      clock: session.clock,
      elapsedMs,
      tickDurationMs: tickDurationMs(state.config),
      now,
    });

    const ticksAdvanced = Math.min(
      updatedClock.tick - session.clock.tick,
      5,
    );
    const adjustedClock =
      ticksAdvanced < updatedClock.tick - session.clock.tick
        ? { ...updatedClock, tick: session.clock.tick + ticksAdvanced }
        : updatedClock;
    let simulatedSession = session;
    if (ticksAdvanced > 0) {
      try {
        simulatedSession = await simulateInWorker(
          session,
          ticksAdvanced,
          state.config,
        );
      } catch {
        // fallback su main thread in caso di errore worker
        simulatedSession = advanceSimulation(session, ticksAdvanced, state.config);
      }
    }

    dispatch(
      setSessionState({
        ...simulatedSession,
        clock: adjustedClock,
      }),
    );
  };
