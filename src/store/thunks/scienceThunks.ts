import { type AnyAction, type ThunkAction } from '@reduxjs/toolkit';
import type { ScienceShipStatus } from '@domain/types';
import type { RootState } from '../index';
import { setSessionState } from '../slice/gameSlice';
import type { ScienceShipOrderResult } from '../slice/gameSlice';

export const orderScienceShip =
  (shipId: string, systemId: string): ThunkAction<ScienceShipOrderResult, RootState, unknown, AnyAction> =>
  (dispatch, getState) => {
    const state = getState().game;
    const session = state.session;
    if (!session) {
      return { success: false, reason: 'NO_SESSION' };
    }
    const shipIndex = session.scienceShips.findIndex(
      (ship) => ship.id === shipId,
    );
    if (shipIndex < 0) {
      return { success: false, reason: 'SHIP_NOT_FOUND' };
    }
    const targetSystem = session.galaxy.systems.find(
      (system) => system.id === systemId,
    );
    if (!targetSystem) {
      return { success: false, reason: 'SYSTEM_NOT_FOUND' };
    }
    if (targetSystem.visibility === 'unknown') {
      return { success: false, reason: 'SYSTEM_UNKNOWN' };
    }

    const travelTicks = Math.max(1, state.config.exploration.travelTicks);
    const updatedShips = session.scienceShips.map((ship) =>
      ship.id === shipId
        ? {
            ...ship,
            autoExplore: false,
            status: 'traveling' as ScienceShipStatus,
            targetSystemId: systemId,
            ticksRemaining: travelTicks,
          }
        : ship,
    );

    const visibilityRank: Record<'unknown' | 'revealed' | 'surveyed', number> = {
      unknown: 0,
      revealed: 1,
      surveyed: 2,
    };
    const updatedSystems = session.galaxy.systems.map((system) => {
      if (system.id !== systemId) {
        return system;
      }
      if (visibilityRank[system.visibility] >= visibilityRank.revealed) {
        return system;
      }
      return {
        ...system,
        visibility: 'revealed' as const,
      };
    });

    dispatch(
      setSessionState({
        ...session,
        scienceShips: updatedShips,
        galaxy:
          updatedSystems === session.galaxy.systems
            ? session.galaxy
            : { ...session.galaxy, systems: updatedSystems },
      }),
    );

    return { success: true };
  };

export const setScienceAutoExplore =
  (shipId: string, auto: boolean): ThunkAction<void, RootState, unknown, AnyAction> =>
  (dispatch, getState) => {
    const session = getState().game.session;
    if (!session) {
      return;
    }
    const updatedShips = session.scienceShips.map((ship) =>
      ship.id === shipId
        ? {
            ...ship,
            autoExplore: auto,
          }
        : ship,
    );
    dispatch(
      setSessionState({
        ...session,
        scienceShips: updatedShips,
      }),
    );
  };
