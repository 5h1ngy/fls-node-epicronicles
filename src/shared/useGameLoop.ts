import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

export const useGameLoop = () => {
  const advanceClockBy = useGameStore((state) => state.advanceClockBy);
  const sessionId = useGameStore((state) => state.session?.id);
  const isRunning = useGameStore(
    (state) => state.session?.clock.isRunning ?? false,
  );
  const frameRef = useRef<number | null>(null);
  const previousTimestampRef = useRef<number | null>(null);
  const isRunningRef = useRef(isRunning);

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    if (!sessionId) {
      return undefined;
    }

    const loop = (timestamp: number) => {
      const previous = previousTimestampRef.current ?? timestamp;
      const elapsed = timestamp - previous;
      previousTimestampRef.current = timestamp;
      if (isRunningRef.current) {
        advanceClockBy(elapsed, Date.now());
      }
      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
      frameRef.current = null;
      previousTimestampRef.current = null;
    };
  }, [advanceClockBy, sessionId]);
};
