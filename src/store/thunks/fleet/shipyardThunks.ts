import { type AnyAction, type ThunkAction } from '@reduxjs/toolkit';
import { canAffordCost, spendResources } from '@domain/economy/economy';
import { createShipyardTask } from '@domain/fleet';
import type { ShipClassId } from '@domain/types';
import type { RootState } from '@store';
import { setSessionState } from '@store/slice/gameSlice';
import type { QueueShipBuildResult } from '@store/slice/gameSlice';

export const queueShipBuild =
  (
    designId: ShipClassId,
    templateId?: string,
    customization?: {
      attackBonus: number;
      defenseBonus: number;
      hullBonus: number;
      costMultiplier: number;
      name?: string;
    },
  ): ThunkAction<QueueShipBuildResult, RootState, unknown, AnyAction> =>
  (dispatch, getState) => {
    const state = getState().game;
    const session = state.session;
    if (!session) {
      return { success: false, reason: 'NO_SESSION' };
    }

    const design = state.config.military.shipDesigns.find(
      (entry) => entry.id === designId,
    );
    if (!design) {
      return { success: false, reason: 'INVALID_DESIGN' };
    }

    if (
      session.shipyardQueue.length >= state.config.military.shipyard.queueSize
    ) {
      return { success: false, reason: 'QUEUE_FULL' };
    }

    const template = templateId
      ? state.config.military.templates.find((entry) => entry.id === templateId)
      : undefined;
    const effectiveDesign =
      template && template.base === design.id
        ? {
            ...design,
            attack: design.attack + template.attack,
            defense: design.defense + template.defense,
            hullPoints: design.hullPoints + template.hull,
            buildCost: Object.fromEntries(
              Object.entries(design.buildCost).map(([key, value]) => [
                key,
                Math.round((value ?? 0) * template.costMultiplier),
              ]),
            ) as typeof design.buildCost,
          }
        : design;
    const customizedCost = customization
      ? Object.fromEntries(
          Object.entries(effectiveDesign.buildCost).map(([key, value]) => [
            key,
            Math.round((value ?? 0) * customization.costMultiplier),
          ]),
        )
      : effectiveDesign.buildCost;

    if (!canAffordCost(session.economy, customizedCost)) {
      return { success: false, reason: 'INSUFFICIENT_RESOURCES' };
    }

    const updatedEconomy = spendResources(session.economy, customizedCost);
    const task = createShipyardTask(
      design.id,
      design.buildTime,
      templateId,
      customization,
    );

    dispatch(
      setSessionState({
        ...session,
        economy: updatedEconomy,
        shipyardQueue: [...session.shipyardQueue, task],
      }),
    );

    return { success: true };
  };

