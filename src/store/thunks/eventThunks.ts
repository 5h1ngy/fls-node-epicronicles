import { type AnyAction, type ThunkAction } from '@reduxjs/toolkit';
import { canAffordOption, resolveEvent, applyOptionCost } from '@domain/events/events';
import type { RootState } from '../index';
import { setSessionState } from '../slice/gameSlice';
import type { ResolveEventResult } from '../slice/gameSlice';

export const resolveActiveEvent =
  (optionId: string): ThunkAction<ResolveEventResult, RootState, unknown, AnyAction> =>
  (dispatch, getState) => {
    const state = getState().game;
    const session = state.session;
    if (!session || !session.events.active) {
      return { success: false, reason: 'NO_EVENT' };
    }
    const active = session.events.active;
    const option = active.options.find((entry) => entry.id === optionId);
    if (!option) {
      return { success: false, reason: 'OPTION_NOT_FOUND' };
    }
    if (!canAffordOption(session, option)) {
      return { success: false, reason: 'INSUFFICIENT_RESOURCES' };
    }
    const economyAfterCost = applyOptionCost(session, option);
    const { session: resolvedSession, logEntry, queued } = resolveEvent({
      session: { ...session, economy: economyAfterCost },
      option,
      activeEvent: active,
      tick: session.clock.tick,
      config: state.config,
    });
    dispatch(
      setSessionState({
        ...resolvedSession,
        events: {
          active: null,
          queue: [...resolvedSession.events.queue, ...queued],
          log: [...resolvedSession.events.log, logEntry].slice(-20),
        },
        notifications: [
          ...resolvedSession.notifications,
          {
            id: `notif-evt-resolved-${active.id}`,
            tick: session.clock.tick,
            kind: 'eventResolved' as const,
            message: `${active.title}: ${option.label}`,
          },
        ].slice(-6),
      }),
    );
    return { success: true };
  };
