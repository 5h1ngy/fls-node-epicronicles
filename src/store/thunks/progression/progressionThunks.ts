import { type AnyAction, type ThunkAction } from '@reduxjs/toolkit';
import { startResearch } from '@domain/research/research';
import { unlockTradition } from '@domain/traditions/traditions';
import type { ResearchBranch } from '@domain/types';
import type {
  StartResearchResult,
  UnlockTraditionResult,
} from '@store/slice/gameSlice';
import { setSessionState } from '@store/slice/gameSlice';
import type { RootState } from '@store';

export const beginResearch =
  (
    branch: ResearchBranch,
    techId: string,
  ): ThunkAction<StartResearchResult, RootState, unknown, AnyAction> =>
  (dispatch, getState) => {
    const state = getState().game;
    const session = state.session;
    if (!session) {
      return { success: false, reason: 'NO_SESSION' };
    }
    const result = startResearch(branch, techId, session.research, state.config.research);
    if (!result.success) {
      return { success: false, reason: result.reason };
    }
    dispatch(
      setSessionState({
        ...session,
        research: result.state,
      }),
    );
    return { success: true };
  };

export const unlockTraditionPerk =
  (perkId: string): ThunkAction<UnlockTraditionResult, RootState, unknown, AnyAction> =>
  (dispatch, getState) => {
    const state = getState().game;
    const session = state.session;
    if (!session) {
      return { success: false, reason: 'NO_SESSION' };
    }
    const result = unlockTradition(perkId, session.traditions, state.config.traditions);
    if (!result.success) {
      return { success: false, reason: result.reason };
    }
    dispatch(
      setSessionState({
        ...session,
        traditions: result.state,
      }),
    );
    return { success: true };
  };

