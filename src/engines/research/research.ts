import type {
  ResearchBranch,
  ResearchBranchState,
  ResearchState,
  ResearchTech,
} from '@domain/types';
import type { ResearchConfig } from '@config/gameConfig';

export type StartResearchResult =
  | { success: true; state: ResearchState }
  | {
      success: false;
      reason: 'INVALID_TECH' | 'PREREQ_NOT_MET' | 'ALREADY_COMPLETED' | 'BRANCH_MISMATCH';
    };

const createBranchState = (): ResearchBranchState => ({
  currentTechId: null,
  progress: 0,
  completed: [],
});

export const createInitialResearch = (config: ResearchConfig): ResearchState => {
  const branches = config.branches.reduce<Record<ResearchBranch, ResearchBranchState>>(
    (acc, branch) => ({
      ...acc,
      [branch.id]: createBranchState(),
    }),
    {
      physics: createBranchState(),
      society: createBranchState(),
      engineering: createBranchState(),
    },
  );
  return {
    branches,
    backlog: config.techs,
    currentEra: config.eras?.[0]?.id ?? 1,
    unlockedEras: config.eras?.length ? [config.eras[0].id] : [1],
    exclusivePicks: {},
  };
};

const getTech = (config: ResearchConfig, techId: string): ResearchTech | undefined =>
  config.techs.find((tech) => tech.id === techId);

export const startResearch = (
  branch: ResearchBranch,
  techId: string,
  state: ResearchState,
  config: ResearchConfig,
): StartResearchResult => {
  const tech = getTech(config, techId);
  if (!tech) {
    return { success: false, reason: 'INVALID_TECH' };
  }
  if (tech.branch !== branch) {
    return { success: false, reason: 'BRANCH_MISMATCH' };
  }
  const eraAllowed = tech.era ?? 1;
  if (eraAllowed > state.currentEra) {
    return { success: false, reason: 'PREREQ_NOT_MET' };
  }
  const branchState = state.branches[branch];
  if (branchState.completed.includes(techId)) {
    return { success: false, reason: 'ALREADY_COMPLETED' };
  }
  const prerequisites = tech.prerequisites ?? [];
  const prerequisitesMet = prerequisites.every((id) =>
    branchState.completed.includes(id),
  );
  if (!prerequisitesMet) {
    return { success: false, reason: 'PREREQ_NOT_MET' };
  }
  if (
    tech.mutuallyExclusiveGroup &&
    state.exclusivePicks &&
    state.exclusivePicks[tech.mutuallyExclusiveGroup] &&
    state.exclusivePicks[tech.mutuallyExclusiveGroup] !== tech.id
  ) {
    return { success: false, reason: 'PREREQ_NOT_MET' };
  }
  const updatedBranch: ResearchBranchState = {
    ...branchState,
    currentTechId: techId,
    progress: 0,
  };
  return {
    success: true,
    state: {
      ...state,
      branches: { ...state.branches, [branch]: updatedBranch },
    },
  };
};

export const advanceResearch = ({
  state,
  researchIncome,
  config,
}: {
  state: ResearchState;
  researchIncome: number;
  config: ResearchConfig;
}): { research: ResearchState; completed: ResearchTech[] } => {
  if (researchIncome <= 0) {
    return { research: state, completed: [] };
  }
  const perBranch = researchIncome * config.pointsPerResearchIncome / 3;
  const completed: ResearchTech[] = [];
  const branches = { ...state.branches };
  const exclusivePicks = { ...(state.exclusivePicks ?? {}) };

  (Object.entries(branches) as Array<[ResearchBranch, ResearchBranchState]>).forEach(
    ([branch, branchState]) => {
      if (!branchState.currentTechId) {
        return;
      }
        const tech = getTech(config, branchState.currentTechId);
        if (!tech) {
          return;
        }
        const progress = branchState.progress + perBranch;
        if (progress >= tech.cost) {
          if (tech.mutuallyExclusiveGroup && !exclusivePicks[tech.mutuallyExclusiveGroup]) {
            exclusivePicks[tech.mutuallyExclusiveGroup] = tech.id;
          }
          branches[branch] = {
            ...branchState,
            currentTechId: null,
            progress: 0,
            completed: [...branchState.completed, tech.id],
        };
        completed.push(tech);
      } else {
        branches[branch] = {
          ...branchState,
          progress,
        };
      }
    },
  );

  const nextState: ResearchState = {
    ...state,
    branches,
    exclusivePicks,
  };
  const eraState = computeEraUnlocks(nextState, config);
  return {
    research: { ...nextState, ...eraState },
    completed,
  };
};

export const listAvailableTechs = (
  branch: ResearchBranch,
  state: ResearchState,
  config: ResearchConfig,
): ResearchTech[] => {
  const branchState = state.branches[branch];
  return config.techs.filter((tech) => {
    if (tech.branch !== branch) {
      return false;
    }
    if ((tech.era ?? 1) > state.currentEra) {
      return false;
    }
    if (branchState.completed.includes(tech.id)) {
      return false;
    }
    if (
      tech.mutuallyExclusiveGroup &&
      state.exclusivePicks &&
      state.exclusivePicks[tech.mutuallyExclusiveGroup] &&
      state.exclusivePicks[tech.mutuallyExclusiveGroup] !== tech.id
    ) {
      return false;
    }
    if (tech.prerequisites && tech.prerequisites.length > 0) {
      return tech.prerequisites.every((id) => branchState.completed.includes(id));
    }
    return true;
  });
};

const scoreKind = (kind?: ResearchTech['kind']) => {
  switch (kind) {
    case 'foundation':
      return 2;
    case 'feature':
      return 1;
    case 'rare':
      return 0.5;
    default:
      return 1;
  }
};

export const getResearchOffers = (
  branch: ResearchBranch,
  state: ResearchState,
  config: ResearchConfig,
  count = 3,
): ResearchTech[] => {
  const available = listAvailableTechs(branch, state, config);
  if (available.length <= count) {
    return available;
  }
  const era = state.currentEra;
  const pool = available
    .filter((tech) => (tech.era ?? 1) <= era)
    .sort((a, b) => scoreKind(b.kind) - scoreKind(a.kind));
  const foundations = pool.filter((t) => t.kind === 'foundation');
  const features = pool.filter((t) => t.kind === 'feature');
  const rares = pool.filter((t) => t.kind === 'rare');

  const picks: ResearchTech[] = [];
  // Prefer almeno una feature se esiste
  if (features.length > 0) {
    picks.push(features.shift() as ResearchTech);
  }
  // Riempire con fondazioni
  while (picks.length < count && foundations.length > 0) {
    picks.push(foundations.shift() as ResearchTech);
  }
  // Aggiungi altre feature se servono
  while (picks.length < count && features.length > 0) {
    picks.push(features.shift() as ResearchTech);
  }
  // Aggiungi rare solo se ancora spazio
  while (picks.length < count && rares.length > 0) {
    picks.push(rares.shift() as ResearchTech);
  }
  // Fallback con qualsiasi disponibile
  while (picks.length < count && pool.length > 0) {
    picks.push(pool.shift() as ResearchTech);
  }

  return picks;
};

const computeEraUnlocks = (state: ResearchState, config: ResearchConfig) => {
  const completedAll = Object.values(state.branches).flatMap((b) => b.completed);
  const unlocked = new Set(state.unlockedEras);
  const eras = [...(config.eras ?? [])].sort((a, b) => a.id - b.id);
  eras.forEach((era) => {
    if (unlocked.has(era.id)) {
      return;
    }
    const gateways = era.gatewayTechs ?? [];
    if (gateways.length === 0 || gateways.every((id) => completedAll.includes(id))) {
      unlocked.add(era.id);
    }
  });
  const currentEra = Math.max(...Array.from(unlocked));
  return {
    unlockedEras: Array.from(unlocked).sort((a, b) => a - b),
    currentEra,
  };
};
