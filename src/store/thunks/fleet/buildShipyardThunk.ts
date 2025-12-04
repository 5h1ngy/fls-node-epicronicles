import { type AnyAction, type ThunkAction } from '@reduxjs/toolkit';
import { spendResources, canAffordCost } from '@domain/economy/economy';
import { getShipDesign } from '@domain/fleet/ships';
import type { RootState } from '@store';
import { setSessionState } from '@store/slice/gameSlice';
import type { BuildShipyardResult } from '@store/slice/gameSlice';

export const buildShipyard =
  (
    systemId: string,
    anchorPlanetId: string | null = null,
  ): ThunkAction<BuildShipyardResult, RootState, unknown, AnyAction> =>
  (dispatch, getState) => {
    const state = getState().game;
    const session = state.session;
    if (!session) {
      return { success: false, reason: 'NO_SESSION' };
    }
    const system = session.galaxy.systems.find((s) => s.id === systemId);
    if (!system) {
      return { success: false, reason: 'SYSTEM_NOT_FOUND' };
    }
    if (system.visibility !== 'surveyed') {
      return { success: false, reason: 'SYSTEM_NOT_SURVEYED' };
    }
    if (system.shipyardBuild) {
      return { success: false, reason: 'IN_PROGRESS' };
    }
    if (system.hasShipyard) {
      return { success: false, reason: 'ALREADY_BUILT' };
    }
    const hasTech = Object.values(session.research.branches).some((branch) =>
      branch.completed.includes('orbital-shipyard'),
    );
    if (!hasTech) {
      return { success: false, reason: 'TECH_MISSING' };
    }
    const constructionRole = 'construction';
    const hasConstructor = session.fleets.some(
      (fleet) =>
        fleet.systemId === systemId &&
        fleet.ships.some((ship) => {
          const design = getShipDesign(state.config.military, ship.designId);
          return design?.role === constructionRole;
        }),
    );
    if (!hasConstructor) {
      return { success: false, reason: 'NO_CONSTRUCTOR' };
    }
    const buildCost = state.config.military.shipyard.buildCost ?? {};
    if (!canAffordCost(session.economy, buildCost)) {
      return { success: false, reason: 'INSUFFICIENT_RESOURCES' };
    }
    const updatedEconomy = spendResources(session.economy, buildCost);
    const constructorFleet = session.fleets.find(
      (fleet) =>
        fleet.systemId === systemId &&
        fleet.ships.some((ship) => {
          const design = getShipDesign(state.config.military, ship.designId);
          return design?.role === constructionRole;
        }),
    );
    const resolvedAnchor =
      anchorPlanetId ??
      constructorFleet?.anchorPlanetId ??
      null;
    const updatedSystems = session.galaxy.systems.map((s) =>
      s.id === systemId
        ? {
            ...s,
            ownerId: 'player',
            shipyardBuild: {
              ticksRemaining: 10,
              totalTicks: 10,
              anchorPlanetId: resolvedAnchor,
            },
          }
        : s,
    );
    dispatch(
      setSessionState({
        ...session,
        economy: updatedEconomy,
        galaxy: { ...session.galaxy, systems: updatedSystems },
      }),
    );
    return { success: true };
  };

