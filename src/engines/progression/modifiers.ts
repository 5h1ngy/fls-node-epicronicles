import type { ResearchState, TraditionState, ResourceType } from '@domain/types';
import type { ResearchConfig, TraditionConfig } from '@config';

export interface ProgressionModifiers {
  incomeMultipliers: Partial<Record<ResourceType, number>>;
  influenceFlat: number;
}

const emptyModifiers = (): ProgressionModifiers => ({
  incomeMultipliers: {},
  influenceFlat: 0,
});

const applyEffect = (effect: string, acc: ProgressionModifiers) => {
  const [kind, rawValue] = effect.split(':');
  const value = Number(rawValue);
  if (Number.isNaN(value)) {
    return;
  }
  switch (kind) {
    case 'energyIncome':
    case 'mineralsIncome':
    case 'foodIncome':
    case 'researchIncome': {
      const key = kind.replace('Income', '') as ResourceType;
      const current = acc.incomeMultipliers[key] ?? 0;
      acc.incomeMultipliers[key] = current + value;
      break;
    }
    case 'influenceFlat': {
      acc.influenceFlat += value;
      break;
    }
    default:
      break;
  }
};

export const deriveProgressionModifiers = ({
  research,
  traditions,
  researchConfig,
  traditionConfig,
}: {
  research: ResearchState;
  traditions: TraditionState;
  researchConfig: ResearchConfig;
  traditionConfig: TraditionConfig;
}): ProgressionModifiers => {
  const modifiers = emptyModifiers();
  const completedTechs = researchConfig.techs.filter(
    (tech) => research.branches[tech.branch].completed.includes(tech.id),
  );
  completedTechs.forEach((tech) => {
    (tech.effects ?? []).forEach((effect) => applyEffect(effect, modifiers));
  });

  const perks = traditionConfig.perks.filter((perk) =>
    traditions.unlocked.includes(perk.id),
  );
  perks.forEach((perk) => {
    (perk.effects ?? []).forEach((effect) => applyEffect(effect, modifiers));
  });

  return modifiers;
};
