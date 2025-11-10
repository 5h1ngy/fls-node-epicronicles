import { resourceLabels } from '@domain/shared/resourceMetadata';

export const formatCost = (cost: Record<string, number | undefined>) =>
  Object.entries(cost)
    .filter(([, amount]) => amount && amount > 0)
    .map(
      ([type, amount]) =>
        `${resourceLabels[type as keyof typeof resourceLabels]} ${amount}`,
    )
    .join(' | ');

export const formatSigned = (value: number) => {
  if (Math.abs(value) < 0.001) {
    return '+0';
  }
  const magnitude = Math.abs(value);
  const isInteger = Math.abs(Math.round(magnitude) - magnitude) < 0.01;
  const formatted = isInteger
    ? Math.round(magnitude).toString()
    : magnitude.toFixed(1);
  return `${value >= 0 ? '+' : '-'}${formatted}`;
};
