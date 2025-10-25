import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';

export const DebugConsole = () => {
  const [isOpen, setIsOpen] = useState(false);
  const session = useGameStore((state) => state.session);

  if (!session) {
    return null;
  }

  const revealed = session.galaxy.systems.filter(
    (system) => system.visibility !== 'unknown',
  ).length;
  const surveyed = session.galaxy.systems.filter(
    (system) => system.visibility === 'surveyed',
  ).length;

  return (
    <div className={`debug-console ${isOpen ? 'is-open' : ''}`}>
      <button
        className="panel__action"
        onClick={() => setIsOpen((value) => !value)}
      >
        {isOpen ? 'Nascondi debug' : 'Mostra debug'}
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
              systems: {
                total: session.galaxy.systems.length,
                revealed,
                surveyed,
              },
              ships: session.scienceShips.map((ship) => ({
                id: ship.id,
                status: ship.status,
                currentSystemId: ship.currentSystemId,
                targetSystemId: ship.targetSystemId,
                ticksRemaining: ship.ticksRemaining,
              })),
              colonizationTasks: session.colonizationTasks.map((task) => ({
                id: task.id,
                systemId: task.systemId,
                ticksRemaining: task.ticksRemaining,
                totalTicks: task.totalTicks,
              })),
            },
            null,
            2,
          )}
        </pre>
      ) : null}
    </div>
  );
};
