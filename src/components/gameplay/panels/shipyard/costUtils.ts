import { resourceLabels } from '@domain/shared/resourceMetadata';

export const formatCost = (cost: Record<string, number | undefined>) =>
  Object.entries(cost)
    .filter(([, amount]) => amount && amount > 0)
    .map(
      ([type, amount]) =>
        `${resourceLabels[type as keyof typeof resourceLabels]} ${amount}`,
    )
    .join(' | ');
