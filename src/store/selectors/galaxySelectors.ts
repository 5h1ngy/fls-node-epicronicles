import type { RootState } from '../index';

export const selectSystems = (state: RootState) =>
  state.game.session?.galaxy.systems ?? [];

export const selectScienceShips = (state: RootState) =>
  state.game.session?.scienceShips ?? [];

export const selectFleets = (state: RootState) =>
  state.game.session?.fleets ?? [];

export const selectSystemsMap = (state: RootState) => {
  const systems = selectSystems(state);
  return new Map(systems.map((system) => [system.id, system]));
};
