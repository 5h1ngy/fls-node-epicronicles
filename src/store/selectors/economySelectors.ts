import type { RootState } from '../index';
import { createSelector } from '@reduxjs/toolkit';
import type { ResourceType } from '@domain/types';

export const selectResources = (state: RootState) =>
  state.game.session?.economy.resources;

export const selectPlanets = (state: RootState) =>
  state.game.session?.economy.planets ?? [];

export const selectColonizedSystems = createSelector(
  [selectPlanets],
  (planets) => new Set(planets.map((planet) => planet.systemId)),
);

export const selectNetResources = createSelector(
  [selectResources],
  (resources) => {
    if (!resources) {
      return null;
    }
    const net: Record<ResourceType, number> = {
      energy: 0,
      minerals: 0,
      food: 0,
      research: 0,
      influence: 0,
    };
    (Object.keys(net) as ResourceType[]).forEach((type) => {
      const ledger = resources[type];
      if (!ledger) {
        return;
      }
      net[type] = ledger.income - ledger.upkeep;
    });
    return net;
  },
);

export const selectDistrictQueue = (state: RootState) =>
  state.game.session?.districtConstructionQueue ?? [];

export const selectDistrictDefinitions = (state: RootState) =>
  state.game.config.economy.districts;

export const selectColonizationTasks = (state: RootState) =>
  state.game.session?.colonizationTasks ?? [];
