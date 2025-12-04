import type { GameSession, ResourceCost, ResourceType } from '@domain/types';

export const refundResourceCost = (
  economy: GameSession['economy'],
  cost: ResourceCost,
) => {
  const resources = { ...economy.resources };
  Object.entries(cost).forEach(([type, amount]) => {
    if (!amount) {
      return;
    }
    const resourceType = type as ResourceType;
    const ledger = resources[resourceType];
    resources[resourceType] = {
      amount: (ledger?.amount ?? 0) + amount,
      income: ledger?.income ?? 0,
      upkeep: ledger?.upkeep ?? 0,
    };
  });
  return {
    ...economy,
    resources,
  };
};
