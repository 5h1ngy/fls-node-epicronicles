import type { SimulationClock } from './types';

export interface AdvanceClockArgs {
  clock: SimulationClock;
  elapsedMs: number;
  tickDurationMs: number;
  now: number;
}

export const advanceClock = ({
  clock,
  elapsedMs,
  tickDurationMs,
  now,
}: AdvanceClockArgs): SimulationClock => {
  if (!clock.isRunning) {
    return {
      ...clock,
      lastUpdate: now,
    };
  }

  const effectiveElapsed = elapsedMs * clock.speedMultiplier;
  const totalElapsed = clock.elapsedMs + effectiveElapsed;
  const ticksToAdd = Math.floor(totalElapsed / tickDurationMs);
  const remainingMs = totalElapsed % tickDurationMs;

  return {
    ...clock,
    elapsedMs: remainingMs,
    tick: clock.tick + ticksToAdd,
    lastUpdate: now,
  };
};

export const setClockRunning = (
  clock: SimulationClock,
  isRunning: boolean,
  now: number,
): SimulationClock => ({
  ...clock,
  isRunning,
  lastUpdate: now,
});

export const setClockSpeed = (
  clock: SimulationClock,
  speedMultiplier: number,
): SimulationClock => ({
  ...clock,
  speedMultiplier,
});
