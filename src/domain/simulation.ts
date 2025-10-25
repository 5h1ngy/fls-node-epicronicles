import type { GameSession } from './types';
import type { GameConfig } from '../config/gameConfig';
import { advanceExploration } from './exploration';
import { advanceEconomy } from './economy';
import { advanceColonization } from './colonization';

export const advanceSimulation = (
  session: GameSession,
  ticks: number,
  config: GameConfig,
): GameSession => {
  if (ticks <= 0) {
    return session;
  }

  let updatedSession = session;

  for (let iteration = 0; iteration < ticks; iteration += 1) {
    const colonization = advanceColonization(
      updatedSession.colonizationTasks,
      updatedSession.economy,
    );
    const { galaxy, scienceShips } = advanceExploration(
      updatedSession.galaxy,
      updatedSession.scienceShips,
      config.exploration,
    );
    const { economy } = advanceEconomy(colonization.economy, config.economy);

    updatedSession = {
      ...updatedSession,
      galaxy,
      scienceShips,
      colonizationTasks: colonization.tasks,
      economy,
    };
  }

  return updatedSession;
};
