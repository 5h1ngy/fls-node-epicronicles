import { advanceSimulation } from '@domain/session';
import type { GameSession } from '@domain/types';
import type { GameConfig } from '@config/gameConfig';

export type SimulationWorkerMessage =
  | {
      type: 'simulate';
      id: number;
      session: GameSession;
      ticks: number;
      config: GameConfig;
    };

export type SimulationWorkerResponse =
  | { type: 'result'; id: number; session: GameSession }
  | { type: 'ready' };

// Minimal declaration to avoid TS DOM lib dependency in worker build
type WorkerScope = typeof self;
const ctx: WorkerScope = self as unknown as WorkerScope;

ctx.onmessage = (event: MessageEvent<SimulationWorkerMessage>) => {
  const data = event.data;
  if (data.type !== 'simulate') {
    return;
  }
  const { id, session, ticks, config } = data;
  const result = advanceSimulation(session, ticks, config);
  const response: SimulationWorkerResponse = { type: 'result', id, session: result };
  ctx.postMessage(response);
};

ctx.postMessage({ type: 'ready' } satisfies SimulationWorkerResponse);
