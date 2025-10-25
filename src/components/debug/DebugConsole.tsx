import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';

export const DebugConsole = () => {
  const [isOpen, setIsOpen] = useState(false);
  const session = useGameStore((state) => state.session);

  if (!session) {
    return null;
  }

  return (
    <div className={`debug-console ${isOpen ? 'is-open' : ''}`}>
      <button
        className="panel__action"
        onClick={() => setIsOpen((value) => !value)}
      >
        {isOpen ? 'Hide debug' : 'Show debug'}
      </button>
      {isOpen ? (
        <pre>
          {JSON.stringify(
            {
              sessionId: session.id,
              tick: session.clock.tick,
              speed: session.clock.speedMultiplier,
              running: session.clock.isRunning,
              elapsedMs: session.clock.elapsedMs,
              systems: session.galaxy.systemCount,
            },
            null,
            2,
          )}
        </pre>
      ) : null}
    </div>
  );
};
