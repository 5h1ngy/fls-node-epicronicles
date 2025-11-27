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
  currentEra: 1,
  unlockedEras: [1],
  exclusivePicks: {},
});

const getPerk = (config: TraditionConfig, perkId: string): TraditionPerk | undefined =>
  config.perks.find((perk) => perk.id === perkId);

const computeEraUnlocks = (state: TraditionState, config: TraditionConfig) => {
  const eraList = Array.from(
    new Set(config.perks.map((perk) => perk.era ?? 1)),
  ).sort((a, b) => a - b);
  if (eraList.length === 0) {
    return { currentEra: 1, unlockedEras: [1] };
  }
  const unlockedEras = new Set<number>([eraList[0]]);
  const unlockedPerks = new Set(state.unlocked);
  for (let i = 1; i < eraList.length; i += 1) {
    const prevEra = eraList[i - 1];
    const prevEraPerks = config.perks.filter((perk) => (perk.era ?? 1) === prevEra);
    if (prevEraPerks.length === 0) {
      continue;
    }
    const completedPrev = prevEraPerks.filter((perk) => unlockedPerks.has(perk.id)).length;
    const requiredPrev = Math.max(1, Math.ceil(prevEraPerks.length * 0.6));
    if (completedPrev >= requiredPrev) {
      unlockedEras.add(eraList[i]);
    }
  }
  return {
    currentEra: Math.max(...Array.from(unlockedEras)),
    unlockedEras: Array.from(unlockedEras).sort((a, b) => a - b),
  };
};

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
  const nextState: TraditionState = {
    ...state,
    availablePoints: state.availablePoints + gained,
  };
  const eraState = computeEraUnlocks(nextState, config);
  return { ...nextState, ...eraState };
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
  const eraAllowed = perk.era ?? 1;
  if (eraAllowed > state.currentEra) {
    return { success: false, reason: 'PREREQ_NOT_MET' };
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
  if (
    perk.mutuallyExclusiveGroup &&
    state.exclusivePicks &&
    state.exclusivePicks[perk.mutuallyExclusiveGroup] &&
    state.exclusivePicks[perk.mutuallyExclusiveGroup] !== perk.id
  ) {
    return { success: false, reason: 'PREREQ_NOT_MET' };
  }
  return {
    success: true,
    state: (() => {
      const updated: TraditionState = {
        ...state,
        availablePoints: state.availablePoints - perk.cost,
        unlocked: [...state.unlocked, perk.id],
        exclusivePicks: {
          ...(state.exclusivePicks ?? {}),
          ...(perk.mutuallyExclusiveGroup
            ? { [perk.mutuallyExclusiveGroup]: perk.id }
            : {}),
        },
      };
      const eraState = computeEraUnlocks(updated, config);
      return { ...updated, ...eraState };
    })(),
  };
};

export const listTraditionChoices = (
  state: TraditionState,
  config: TraditionConfig,
): TraditionPerk[] =>
  config.perks.filter((perk) => {
    if ((perk.era ?? 1) > state.currentEra) {
      return false;
    }
    if (state.unlocked.includes(perk.id)) {
      return false;
    }
    if (!perk.prerequisites || perk.prerequisites.length === 0) {
      return !(
        perk.mutuallyExclusiveGroup &&
        state.exclusivePicks &&
        state.exclusivePicks[perk.mutuallyExclusiveGroup]
      );
    }
    const prereqOk = perk.prerequisites.every((id) => state.unlocked.includes(id));
    const notExcluded =
      !perk.mutuallyExclusiveGroup ||
      !state.exclusivePicks ||
      !state.exclusivePicks[perk.mutuallyExclusiveGroup];
    return prereqOk && notExcluded;
  });
