import type { TraditionPerk, TraditionState } from '@domain/types';
import type { TraditionConfig } from '@config/gameConfig';

export type UnlockTraditionResult =
  | { success: true; state: TraditionState }
  | { success: false; reason: 'INVALID_PERK' | 'ALREADY_UNLOCKED' | 'PREREQ_NOT_MET' | 'INSUFFICIENT_POINTS' };

export const createInitialTraditions = (
  config: TraditionConfig,
): TraditionState => ({
  availablePoints: 0,
  unlocked: [],
  backlog: config.perks,
});

const getPerk = (config: TraditionConfig, perkId: string): TraditionPerk | undefined =>
  config.perks.find((perk) => perk.id === perkId);

export const advanceTraditions = ({
  state,
  influenceIncome,
  config,
}: {
  state: TraditionState;
  influenceIncome: number;
  config: TraditionConfig;
}): TraditionState => {
  const gained = Math.max(0, influenceIncome * config.pointsPerInfluenceIncome);
  if (gained <= 0) {
    return state;
  }
  return {
    ...state,
    availablePoints: state.availablePoints + gained,
  };
};

export const unlockTradition = (
  perkId: string,
  state: TraditionState,
  config: TraditionConfig,
): UnlockTraditionResult => {
  const perk = getPerk(config, perkId);
  if (!perk) {
    return { success: false, reason: 'INVALID_PERK' };
  }
  if (state.unlocked.includes(perk.id)) {
    return { success: false, reason: 'ALREADY_UNLOCKED' };
  }
  if (
    perk.prerequisites &&
    !perk.prerequisites.every((id) => state.unlocked.includes(id))
  ) {
    return { success: false, reason: 'PREREQ_NOT_MET' };
  }
  if (state.availablePoints < perk.cost) {
    return { success: false, reason: 'INSUFFICIENT_POINTS' };
  }
  return {
    success: true,
    state: {
      ...state,
      availablePoints: state.availablePoints - perk.cost,
      unlocked: [...state.unlocked, perk.id],
    },
  };
};

export const listTraditionChoices = (
  state: TraditionState,
  config: TraditionConfig,
): TraditionPerk[] =>
  config.perks.filter((perk) => {
    if (state.unlocked.includes(perk.id)) {
      return false;
    }
    if (!perk.prerequisites || perk.prerequisites.length === 0) {
      return true;
    }
    return perk.prerequisites.every((id) => state.unlocked.includes(id));
  });
