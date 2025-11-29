import { type AnyAction, type ThunkAction } from '@reduxjs/toolkit';
import { canAffordCost, spendResources } from '@domain/economy/economy';
import { createColonizationTask } from '@domain/session';
import type { RootState } from '@store';
import { setSessionState } from '@store/slice/gameSlice';
import type { StartColonizationResult } from '@store/slice/gameSlice';
import { appendNotification } from '@store/common';
import { detachColonyShip } from '@store/thunks/common/helpers';

export const startColonization =
  (systemId: string): ThunkAction<StartColonizationResult, RootState, unknown, AnyAction> =>
  (dispatch, getState) => {
    const state = getState().game;
    const session = state.session;
    if (!session) {
      return { success: false, reason: 'NO_SESSION' };
    }
    const system = session.galaxy.systems.find(
      (candidate) => candidate.id === systemId,
    );
    if (!system) {
      return { success: false, reason: 'SYSTEM_NOT_FOUND' };
    }
    if (system.visibility === 'unknown') {
      return { success: false, reason: 'SYSTEM_UNKNOWN' };
    }
    const planetKnown = session.economy.planets.some(
      (planet) => planet.systemId === systemId,
    );
    if (system.visibility !== 'surveyed' && !planetKnown) {
      return { success: false, reason: 'SYSTEM_NOT_SURVEYED' };
    }
    if (!system.habitableWorld) {
      return { success: false, reason: 'NO_HABITABLE_WORLD' };
    }
    const alreadyColonized = session.economy.planets.some(
      (planet) => planet.systemId === systemId,
    );
    if (alreadyColonized) {
      return { success: false, reason: 'ALREADY_COLONIZED' };
    }
    const taskInProgress = session.colonizationTasks.some(
      (task) => task.systemId === systemId,
    );
    if (taskInProgress) {
      return { success: false, reason: 'TASK_IN_PROGRESS' };
    }
    const cost = state.config.colonization.cost;
    if (!canAffordCost(session.economy, cost)) {
      return { success: false, reason: 'INSUFFICIENT_RESOURCES' };
    }

    const colonyDesignId = state.config.military.colonyShipDesignId;
    const colonyShip = detachColonyShip(session.fleets, colonyDesignId);
    if (!colonyShip) {
      return { success: false, reason: 'NO_COLONY_SHIP' };
    }

    const updatedEconomy = spendResources(session.economy, cost);
    const task = createColonizationTask(
      system,
      state.config.colonization,
      colonyShip.shipId,
    );
    const sessionWithTask = {
      ...session,
      economy: updatedEconomy,
      fleets: colonyShip.fleets,
      colonizationTasks: [...session.colonizationTasks, task],
    };
    dispatch(
      setSessionState(
        appendNotification(
          sessionWithTask,
          `Missione di colonizzazione avviata verso ${system.name}.`,
          'colonizationStarted',
        ),
      ),
    );

    return { success: true };
  };

