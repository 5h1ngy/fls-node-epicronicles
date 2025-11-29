import { type AnyAction, type ThunkAction } from '@reduxjs/toolkit';
import type { PopulationJobId } from '@domain/types';
import type { RootState } from '@store';
import { setSessionState } from '@store/slice/gameSlice';
import type { PopulationAdjustResult } from '@store/slice/gameSlice';
import { updatePopulationCounts } from '@store/common';

export const promotePopulation =
  (planetId: string, jobId: PopulationJobId): ThunkAction<PopulationAdjustResult, RootState, unknown, AnyAction> =>
  (dispatch, getState) => {
    if (jobId === 'workers') {
      return { success: false, reason: 'INVALID_JOB' };
    }
    const session = getState().game.session;
    if (!session) {
      return { success: false, reason: 'NO_SESSION' };
    }
    const planet = session.economy.planets.find(
      (candidate) => candidate.id === planetId,
    );
    if (!planet) {
      return { success: false, reason: 'PLANET_NOT_FOUND' };
    }
    if (planet.population.workers <= 0) {
      return { success: false, reason: 'NO_WORKERS' };
    }

    const updatedPlanets = session.economy.planets.map((p) =>
      p.id === planetId
        ? updatePopulationCounts(p, { workers: -1, [jobId]: 1 })
        : p,
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

export const demotePopulation =
  (planetId: string, jobId: PopulationJobId): ThunkAction<PopulationAdjustResult, RootState, unknown, AnyAction> =>
  (dispatch, getState) => {
    if (jobId === 'workers') {
      return { success: false, reason: 'INVALID_JOB' };
    }
    const session = getState().game.session;
    if (!session) {
      return { success: false, reason: 'NO_SESSION' };
    }
    const planet = session.economy.planets.find(
      (candidate) => candidate.id === planetId,
    );
    if (!planet) {
      return { success: false, reason: 'PLANET_NOT_FOUND' };
    }
    if ((planet.population[jobId] ?? 0) <= 0) {
      return { success: false, reason: 'NO_POPULATION' };
    }

    const updatedPlanets = session.economy.planets.map((p) =>
      p.id === planetId
        ? updatePopulationCounts(p, { workers: 1, [jobId]: -1 })
        : p,
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

