import { useMemo, useState } from 'react';
import { useAppSelector, useGameStore } from '@store/gameStore';
import {
  selectDistrictDefinitions,
  selectDistrictQueue,
  selectPlanets,
} from '@store/selectors';

import '../styles/components/DistrictQueuePanel.scss';

const manageErrors = {
  NO_SESSION: 'Nessuna sessione.',
  TASK_NOT_FOUND: 'Attivita non trovata.',
  PLANET_NOT_FOUND: 'Pianeta non trovato.',
} as const;

export const DistrictQueuePanel = () => {
  const session = useGameStore((state) => state.session);
  const districts = useAppSelector(selectDistrictDefinitions);
  const districtQueue = useAppSelector(selectDistrictQueue);
  const planets = useAppSelector(selectPlanets);
  const cancelTask = useGameStore((state) => state.cancelDistrictTask);
  const prioritizeTask = useGameStore((state) => state.prioritizeDistrictTask);
  const [message, setMessage] = useState<string | null>(null);

  const entries = useMemo(() => {
    if (!session) {
      return [];
    }
    const planetLookup = new Map(planets.map((planet) => [planet.id, planet.name]));
    const districtLookup = new Map(
      districts.map((definition) => [definition.id, definition.label]),
    );
    return districtQueue.map((task) => ({
      ...task,
      planetName: planetLookup.get(task.planetId) ?? task.planetId,
      districtLabel: districtLookup.get(task.districtId) ?? task.districtId,
      progress: 1 - task.ticksRemaining / Math.max(1, task.totalTicks),
    }));
  }, [session, districts, districtQueue, planets]);

  if (!session) {
    return <p className="text-muted">Nessuna informazione disponibile.</p>;
  }

  const handleAction = (
    taskId: string,
    action: 'cancel' | 'prioritize',
  ) => {
    const result =
      action === 'cancel'
        ? cancelTask(taskId)
        : prioritizeTask(taskId);
    if (result.success) {
      setMessage(
        action === 'cancel'
          ? 'Costruzione rimossa dalla coda.'
          : 'Costruzione portata in cima alla coda.',
      );
    } else {
      setMessage(manageErrors[result.reason]);
    }
  };

  return (
    <section className="district-queue-panel">
      {message ? <p className="panel-message">{message}</p> : null}
      {entries.length === 0 ? (
        <p className="text-muted">Nessuna costruzione in coda.</p>
      ) : (
        <ul>
          {entries.map((entry) => (
            <li key={entry.id} className="district-queue__item">
              <div className="district-queue__row">
                <div className="district-queue__meta">
                  <strong>{entry.districtLabel}</strong>
                  <span className="text-muted">{entry.planetName}</span>
                </div>
                <span className="text-muted">
                  Tick: {entry.ticksRemaining}/{entry.totalTicks}
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-bar__fill"
                  style={{ width: `${Math.round(entry.progress * 100)}%` }}
                />
              </div>
              <div className="district-queue__actions">
                <button
                  className="panel__action panel__action--compact"
                  onClick={() => handleAction(entry.id, 'prioritize')}
                >
                  Priorita
                </button>
                <button
                  className="panel__action panel__action--compact"
                  onClick={() => handleAction(entry.id, 'cancel')}
                >
                  Annulla
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
