import { type AnyAction, type ThunkAction } from '@reduxjs/toolkit';
import type { GameSession } from '@domain/types';
import type { RootState } from '@store';
import { startSessionSuccess } from '@store/slice/gameSlice';
import type { LoadGameResult, SaveGameResult } from '@store/slice/gameSlice';

const STORAGE_KEY = 'fls-save-v1';

export const saveSessionToStorage =
  (): ThunkAction<SaveGameResult, RootState, unknown, AnyAction> =>
  (_dispatch, getState) => {
    const session = getState().game.session;
    if (!session) {
      return { success: false, reason: 'NO_SESSION' };
    }
    if (typeof localStorage === 'undefined') {
      return { success: false, reason: 'STORAGE_UNAVAILABLE' };
    }
    const payload = {
      version: 1 as const,
      savedAt: Date.now(),
      session: {
        ...session,
        clock: {
          ...session.clock,
          lastUpdate: null,
        },
      },
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      return { success: true };
    } catch (error) {
      console.error('Failed to write save', error);
      return { success: false, reason: 'WRITE_FAILED' };
    }
  };

export const loadSessionFromStorage =
  (): ThunkAction<LoadGameResult, RootState, unknown, AnyAction> =>
  (dispatch) => {
    if (typeof localStorage === 'undefined') {
      return { success: false, reason: 'STORAGE_UNAVAILABLE' };
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { success: false, reason: 'NOT_FOUND' };
    }
    try {
      const payload = JSON.parse(raw) as {
        version: number;
        session: GameSession;
      };
      if (payload?.version !== 1 || !payload.session) {
        return { success: false, reason: 'PARSE_ERROR' };
      }
      const hydrated: GameSession = {
        ...payload.session,
        clock: {
          ...payload.session.clock,
          lastUpdate: Date.now(),
        },
      };
      dispatch(startSessionSuccess(hydrated));
      return { success: true };
    } catch (error) {
      console.error('Failed to parse save', error);
      return { success: false, reason: 'PARSE_ERROR' };
    }
  };

export const hasSavedSession = () =>
  typeof localStorage !== 'undefined' &&
  Boolean(localStorage.getItem(STORAGE_KEY));

