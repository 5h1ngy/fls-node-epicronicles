import type { RootState } from '../index';
import { createSelector } from '@reduxjs/toolkit';

export const selectSystems = (state: RootState) =>
  state.game.session?.galaxy.systems ?? [];

export const selectScienceShips = (state: RootState) =>
  state.game.session?.scienceShips ?? [];

export const selectFleets = (state: RootState) =>
  state.game.session?.fleets ?? [];

export const selectSystemsMap = createSelector([selectSystems], (systems) =>
  new Map(systems.map((system) => [system.id, system])),
);
