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
  (dispatch, getState) => {
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

    const ticksAdvanced = updatedClock.tick - session.clock.tick;
    const simulatedSession =
      ticksAdvanced > 0
        ? advanceSimulation(session, ticksAdvanced, state.config)
        : session;

    dispatch(
      setSessionState({
        ...simulatedSession,
        clock: updatedClock,
      }),
    );
  };
