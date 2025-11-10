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

  return {
    research: { ...state, branches },
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
    if (branchState.completed.includes(tech.id)) {
      return false;
    }
    if (tech.prerequisites && tech.prerequisites.length > 0) {
      return tech.prerequisites.every((id) => branchState.completed.includes(id));
    }
    return true;
  });
};
