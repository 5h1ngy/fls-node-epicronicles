import { useState } from 'react';
import { useGameStore } from '@store/gameStore';

interface DebugConsoleProps {
  variant?: 'panel' | 'inline';
}

export const DebugConsole = ({ variant = 'panel' }: DebugConsoleProps) => {
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

  const data = {
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
      status: task.status,
      ticksRemaining: task.ticksRemaining,
      totalTicks: task.totalTicks,
      missionElapsedTicks: task.missionElapsedTicks,
      missionTotalTicks: task.missionTotalTicks,
    })),
    shipyardQueue: session.shipyardQueue.map((task) => ({
      id: task.id,
      designId: task.designId,
      ticksRemaining: task.ticksRemaining,
    })),
    fleets: session.fleets.map((fleet) => ({
      id: fleet.id,
      systemId: fleet.systemId,
      targetSystemId: fleet.targetSystemId,
      ticksToArrival: fleet.ticksToArrival,
      ships: fleet.ships.length,
    })),
  };

  const content = (
    <pre>
      {JSON.stringify(
        data,
        null,
        2,
      )}
    </pre>
  );

  if (variant === 'inline') {
    return (
      <div
        className={`debug-console debug-console--inline ${
          isOpen ? 'is-open' : ''
        }`}
      >
        <button
          className="panel__action panel__action--compact"
          onClick={() => setIsOpen((value) => !value)}
        >
          {isOpen ? 'Hide debug' : 'Debug'}
        </button>
        {isOpen ? <div className="debug-console__overlay">{content}</div> : null}
      </div>
    );
  }

  return (
    <div className={`debug-console ${isOpen ? 'is-open' : ''}`}>
      <button
        className="panel__action"
        onClick={() => setIsOpen((value) => !value)}
      >
        {isOpen ? 'Nascondi debug' : 'Mostra debug'}
      </button>
      {isOpen ? content : null}
    </div>
  );
};
