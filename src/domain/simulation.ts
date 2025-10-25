import type { GameSession } from './types';
import type { GameConfig } from '../config/gameConfig';
import { advanceExploration } from './exploration';

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
    const { galaxy, scienceShips } = advanceExploration(
      updatedSession.galaxy,
      updatedSession.scienceShips,
      config.exploration,
    );

    updatedSession = {
      ...updatedSession,
      galaxy,
      scienceShips,
    };
  }

  return updatedSession;
};
