import { type AnyAction, type ThunkAction } from '@reduxjs/toolkit';
import { canAffordCost, spendResources } from '@domain/economy/economy';
import { createDistrictConstructionTask } from '@domain/economy';
import type { RootState } from '@store';
import { setSessionState } from '@store/slice/gameSlice';
import type {
  DistrictQueueManageResult,
  QueueDistrictBuildResult,
  RemoveDistrictResult,
} from '@store/slice/gameSlice';
import { appendNotification, refundResourceCost } from '@store/common';

export const queueDistrictConstruction =
  (
    planetId: string,
    districtId: string,
  ): ThunkAction<QueueDistrictBuildResult, RootState, unknown, AnyAction> =>
  (dispatch, getState) => {
    const state = getState().game;
    const session = state.session;
    if (!session) {
      return { success: false, reason: 'NO_SESSION' };
    }
    const planet = session.economy.planets.find(
      (candidate) => candidate.id === planetId,
    );
    if (!planet) {
      return { success: false, reason: 'PLANET_NOT_FOUND' };
    }
    const definition = state.config.economy.districts.find(
      (entry) => entry.id === districtId,
    );
    if (!definition) {
      return { success: false, reason: 'INVALID_DISTRICT' };
    }
    if (!canAffordCost(session.economy, definition.cost)) {
      dispatch(
        setSessionState(
          appendNotification(
            session,
            `Costruzione ${definition.label} sospesa: risorse insufficienti.`,
            'districtSuspended',
          ),
        ),
      );
      return { success: false, reason: 'INSUFFICIENT_RESOURCES' };
    }

    const updatedEconomy = spendResources(session.economy, definition.cost);
    const task = createDistrictConstructionTask({
      planetId,
      districtId,
      buildTime: Math.max(1, definition.buildTime),
    });

    dispatch(
      setSessionState({
        ...session,
        economy: updatedEconomy,
        districtConstructionQueue: [
          ...session.districtConstructionQueue,
          task,
        ],
      }),
    );

    return { success: true };
  };

export const removeBuiltDistrict =
  (
    planetId: string,
    districtId: string,
  ): ThunkAction<RemoveDistrictResult, RootState, unknown, AnyAction> =>
  (dispatch, getState) => {
    const state = getState().game;
    const session = state.session;
    if (!session) {
      return { success: false, reason: 'NO_SESSION' };
    }
    const planetIndex = session.economy.planets.findIndex(
      (entry) => entry.id === planetId,
    );
    if (planetIndex < 0) {
      return { success: false, reason: 'PLANET_NOT_FOUND' };
    }
    const definition = state.config.economy.districts.find(
      (entry) => entry.id === districtId,
    );
    if (!definition) {
      return { success: false, reason: 'INVALID_DISTRICT' };
    }
    const planet = session.economy.planets[planetIndex];
    const currentCount = planet.districts[districtId] ?? 0;
    if (currentCount <= 0) {
      return { success: false, reason: 'NONE_BUILT' };
    }
    const updatedPlanets = session.economy.planets.map((entry, idx) =>
      idx === planetIndex
        ? {
            ...entry,
            districts: {
              ...entry.districts,
              [districtId]: Math.max(0, currentCount - 1),
            },
          }
        : entry,
    );

    dispatch(
      setSessionState({
        ...session,
        economy: {
          ...session.economy,
          planets: updatedPlanets,
        },
      }),
    );

    return { success: true };
  };

export const cancelDistrictTask =
  (taskId: string): ThunkAction<DistrictQueueManageResult, RootState, unknown, AnyAction> =>
  (dispatch, getState) => {
    const state = getState().game;
    const session = state.session;
    if (!session) {
      return { success: false, reason: 'NO_SESSION' };
    }
    const queue = session.districtConstructionQueue;
    const task = queue.find((entry) => entry.id === taskId);
    if (!task) {
      return { success: false, reason: 'TASK_NOT_FOUND' };
    }
    const planet = session.economy.planets.find(
      (entry) => entry.id === task.planetId,
    );
    if (!planet) {
      return { success: false, reason: 'PLANET_NOT_FOUND' };
    }
    const definition = state.config.economy.districts.find(
      (entry) => entry.id === task.districtId,
    );
    const refundedEconomy = definition
      ? refundResourceCost(session.economy, definition.cost)
      : session.economy;

    dispatch(
      setSessionState({
        ...session,
        economy: refundedEconomy,
        districtConstructionQueue: queue.filter(
          (entry) => entry.id !== taskId,
        ),
      }),
    );
    return { success: true };
  };

export const prioritizeDistrictTask =
  (taskId: string): ThunkAction<DistrictQueueManageResult, RootState, unknown, AnyAction> =>
  (dispatch, getState) => {
    const session = getState().game.session;
    if (!session) {
      return { success: false, reason: 'NO_SESSION' };
    }
    const queue = [...session.districtConstructionQueue];
    const index = queue.findIndex((entry) => entry.id === taskId);
    if (index < 0) {
      return { success: false, reason: 'TASK_NOT_FOUND' };
    }
    const [task] = queue.splice(index, 1);
    queue.unshift(task);
    dispatch(
      setSessionState({
        ...session,
        districtConstructionQueue: queue,
      }),
    );
    return { success: true };
  };

