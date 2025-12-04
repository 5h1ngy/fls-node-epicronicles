import { type AnyAction, type ThunkAction } from '@reduxjs/toolkit';
import { calculateTravelTicks } from '@domain/fleet';
import type { RootState } from '@store';
import { setSessionState } from '@store/slice/gameSlice';
import type {
  FleetMergeResult,
  FleetMoveResult,
  FleetSplitResult,
} from '@store/slice/gameSlice';
import { createFleetFromShip } from '@store/thunks/common/helpers';

export const orderFleetMove =
  (fleetId: string, systemId: string): ThunkAction<FleetMoveResult, RootState, unknown, AnyAction> =>
  (dispatch, getState) => {
    const state = getState().game;
    const session = state.session;
    if (!session) {
      return { success: false, reason: 'NO_SESSION' };
    }
    const fleet = session.fleets.find((entry) => entry.id === fleetId);
    if (!fleet) {
      return { success: false, reason: 'FLEET_NOT_FOUND' };
    }
    const system = session.galaxy.systems.find(
      (candidate) => candidate.id === systemId,
    );
    if (!system) {
      return { success: false, reason: 'SYSTEM_NOT_FOUND' };
    }
    if (
      system.ownerId &&
      system.ownerId !== 'player' &&
      system.ownerId.startsWith('ai')
    ) {
      const empire = session.empires.find((e) => e.id === system.ownerId);
      if (empire && empire.warStatus === 'peace' && !empire.accessToPlayer) {
        return { success: false, reason: 'BORDER_CLOSED' };
      }
    }
    if (fleet.systemId === systemId && fleet.targetSystemId === null) {
      return { success: false, reason: 'ALREADY_IN_SYSTEM' };
    }
    if (fleet.ships.length === 0) {
      return { success: false, reason: 'NO_SHIPS' };
    }

    const travelTicks = calculateTravelTicks(
      fleet.systemId,
      systemId,
      session.galaxy,
      state.config.military.fleet,
    );

    dispatch(
      setSessionState({
        ...session,
        fleets: session.fleets.map((entry) =>
          entry.id === fleetId
            ? {
                ...entry,
                targetSystemId: systemId,
                ticksToArrival: travelTicks,
                anchorPlanetId: null,
              }
            : entry,
        ),
      }),
    );

    return { success: true };
  };

export const mergeFleets =
  (sourceId: string, targetId: string): ThunkAction<FleetMergeResult, RootState, unknown, AnyAction> =>
  (dispatch, getState) => {
    const session = getState().game.session;
    if (!session) {
      return { success: false, reason: 'NO_SESSION' };
    }
    if (sourceId === targetId) {
      return { success: false, reason: 'SAME_FLEET' };
    }
    const source = session.fleets.find((fleet) => fleet.id === sourceId);
    const target = session.fleets.find((fleet) => fleet.id === targetId);
    if (!source) {
      return { success: false, reason: 'FLEET_NOT_FOUND' };
    }
    if (!target) {
      return { success: false, reason: 'TARGET_NOT_FOUND' };
    }
    if (source.systemId !== target.systemId) {
      return { success: false, reason: 'DIFFERENT_SYSTEM' };
    }
    const merged = session.fleets
      .filter((fleet) => fleet.id !== sourceId)
      .map((fleet) =>
        fleet.id === targetId
          ? { ...fleet, ships: [...fleet.ships, ...source.ships] }
          : fleet,
      );
    dispatch(
      setSessionState({
        ...session,
        fleets: merged,
      }),
    );
    return { success: true };
  };

export const splitFleet =
  (fleetId: string): ThunkAction<FleetSplitResult, RootState, unknown, AnyAction> =>
  (dispatch, getState) => {
    const session = getState().game.session;
    if (!session) {
      return { success: false, reason: 'NO_SESSION' };
    }
    const fleet = session.fleets.find((candidate) => candidate.id === fleetId);
    if (!fleet) {
      return { success: false, reason: 'FLEET_NOT_FOUND' };
    }
    if (fleet.ships.length <= 1) {
      return { success: false, reason: 'INSUFFICIENT_SHIPS' };
    }
    const ship = fleet.ships[fleet.ships.length - 1];
    const remaining = fleet.ships.slice(0, -1);
    const newFleet = createFleetFromShip({
      ship,
      systemId: fleet.systemId,
      ownerId: fleet.ownerId,
    });
    const updatedFleets = session.fleets.map((f) =>
      f.id === fleetId ? { ...f, ships: remaining } : f,
    );
    dispatch(
      setSessionState({
        ...session,
        fleets: [...updatedFleets, newFleet],
      }),
    );
    return { success: true, newFleetId: newFleet.id };
  };

export const setFleetPosition =
  (
    fleetId: string,
    planetId: string | null,
  ): ThunkAction<FleetMoveResult, RootState, unknown, AnyAction> =>
  (dispatch, getState) => {
    const session = getState().game.session;
    if (!session) {
      return { success: false, reason: 'NO_SESSION' };
    }
    const fleet = session.fleets.find((entry) => entry.id === fleetId);
    if (!fleet) {
      return { success: false, reason: 'FLEET_NOT_FOUND' };
    }
    const fleets = session.fleets.map((entry) =>
      entry.id === fleetId
        ? {
            ...entry,
            anchorPlanetId: planetId,
          }
        : entry,
    );
    dispatch(
      setSessionState({
        ...session,
        fleets,
      }),
    );
    return { success: true };
  };

export const stopFleet =
  (fleetId: string): ThunkAction<void, RootState, unknown, AnyAction> =>
  (dispatch, getState) => {
    const session = getState().game.session;
    if (!session) {
      return;
    }
    const fleets = session.fleets.map((entry) =>
      entry.id === fleetId
        ? { ...entry, targetSystemId: null, ticksToArrival: 0 }
        : entry,
    );
    dispatch(
      setSessionState({
        ...session,
        fleets,
      }),
    );
  };

