import type { RootState } from '../index';

export const selectSession = (state: RootState) => state.game.session;
export const selectConfig = (state: RootState) => state.game.config;
export const selectView = (state: RootState) => state.game.view;
export const selectEmpires = (state: RootState) =>
  state.game.session?.empires ?? [];
export const selectCombatReports = (state: RootState) =>
  state.game.session?.combatReports ?? [];
export const selectSessionTick = (state: RootState) =>
  state.game.session?.clock.tick ?? 0;
export const selectPlayerEmpire = (state: RootState) =>
  state.game.session?.empires.find((empire) => empire.kind === 'player') ?? null;
