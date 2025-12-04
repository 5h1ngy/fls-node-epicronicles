import type { RootState } from '../index';

export const selectSession = (state: RootState) => state.game.session;
export const selectConfig = (state: RootState) => state.game.config;
export const selectView = (state: RootState) => state.game.view;
export const selectEmpires = (state: RootState) =>
  state.game.session?.empires ?? [];
export const selectResearch = (state: RootState) =>
  state.game.session?.research;
export const selectTraditions = (state: RootState) =>
  state.game.session?.traditions;
export const selectEvents = (state: RootState) => state.game.session?.events;
export const selectCombatReports = (state: RootState) =>
  state.game.session?.combatReports ?? [];
export const selectSessionTick = (state: RootState) =>
  state.game.session?.clock.tick ?? 0;
export const selectPlayerEmpire = (state: RootState) =>
  state.game.session?.empires.find((empire) => empire.kind === 'player') ?? null;
export const selectShipyardQueue = (state: RootState) =>
  state.game.session?.shipyardQueue ?? [];
