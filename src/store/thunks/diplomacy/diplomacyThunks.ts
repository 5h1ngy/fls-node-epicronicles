import { type AnyAction, type ThunkAction } from '@reduxjs/toolkit';
import { applyWarPressureToGalaxy } from '@domain/diplomacy';
import type { RootState } from '@store';
import { setSessionState } from '@store/slice/gameSlice';
import type { DiplomacyActionResult } from '@store/slice/gameSlice';
import { appendNotification, appendWarEvent } from '@store/common';
import { setEmpireWarStatus } from '@store/thunks/common/helpers';

export const declareWarOnEmpire =
  (empireId: string): ThunkAction<DiplomacyActionResult, RootState, unknown, AnyAction> =>
  (dispatch, getState) => {
    const state = getState().game;
    const session = state.session;
    if (!session) {
      return { success: false, reason: 'NO_SESSION' };
    }
    const target = session.empires.find((empire) => empire.id === empireId);
    if (!target) {
      return { success: false, reason: 'EMPIRE_NOT_FOUND' };
    }
    if (target.kind === 'player') {
      return { success: false, reason: 'INVALID_TARGET' };
    }
    if (target.warStatus === 'war') {
      return { success: false, reason: 'ALREADY_IN_STATE' };
    }
    const currentTick = session.clock.tick + 1;
    const empires = setEmpireWarStatus(
      session.empires,
      empireId,
      'war',
      -15,
      currentTick,
    );
    const galaxyWithPressure = applyWarPressureToGalaxy({
      galaxy: session.galaxy,
      warsStarted: [empireId],
      tick: currentTick,
      config: state.config.diplomacy.warZones,
    });
    const sessionWithWar = appendWarEvent(
      { ...session, empires, galaxy: galaxyWithPressure },
      'warStart',
      empireId,
      currentTick,
      `Guerra dichiarata contro ${target.name}.`,
    );
    const updatedSession = appendNotification(
      sessionWithWar,
      `Guerra dichiarata contro ${target.name}.`,
      'warDeclared',
    );
    dispatch(setSessionState(updatedSession));
    return { success: true };
  };

export const proposePeaceWithEmpire =
  (empireId: string): ThunkAction<DiplomacyActionResult, RootState, unknown, AnyAction> =>
  (dispatch, getState) => {
    const session = getState().game.session;
    if (!session) {
      return { success: false, reason: 'NO_SESSION' };
    }
    const target = session.empires.find((empire) => empire.id === empireId);
    if (!target) {
      return { success: false, reason: 'EMPIRE_NOT_FOUND' };
    }
    if (target.kind === 'player') {
      return { success: false, reason: 'INVALID_TARGET' };
    }
    if (target.warStatus === 'peace') {
      return { success: false, reason: 'ALREADY_IN_STATE' };
    }
    const empires = setEmpireWarStatus(
      session.empires,
      empireId,
      'peace',
      10,
      null,
    );
    const sessionWithWar = appendWarEvent(
      { ...session, empires },
      'warEnd',
      empireId,
      session.clock.tick,
      `Pace raggiunta con ${target.name}.`,
    );
    const updatedSession = appendNotification(
      sessionWithWar,
      `Tregua firmata con ${target.name}.`,
      'peaceAccepted',
    );
    dispatch(setSessionState(updatedSession));
    return { success: true };
  };

export const requestBorderAccess =
  (empireId: string): ThunkAction<DiplomacyActionResult, RootState, unknown, AnyAction> =>
  (dispatch, getState) => {
    const session = getState().game.session;
    if (!session) {
      return { success: false, reason: 'NO_SESSION' };
    }
    const target = session.empires.find((empire) => empire.id === empireId);
    if (!target) {
      return { success: false, reason: 'EMPIRE_NOT_FOUND' };
    }
    if (target.kind === 'player') {
      return { success: false, reason: 'INVALID_TARGET' };
    }
    if (target.accessToPlayer) {
      return { success: false, reason: 'ALREADY_GRANTED' };
    }
    const updatedEmpires = session.empires.map((empire) =>
      empire.id === empireId
        ? { ...empire, accessToPlayer: true, opinion: empire.opinion + 5 }
        : empire,
    );
    dispatch(
      setSessionState(
        appendNotification(
          { ...session, empires: updatedEmpires },
          `${target.name} apre i confini.`,
          'peaceAccepted',
        ),
      ),
    );
    return { success: true };
  };

