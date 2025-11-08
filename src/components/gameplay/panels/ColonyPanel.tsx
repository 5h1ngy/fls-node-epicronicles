import { useMemo, useState } from 'react';
import { useGameStore, type ColonizationError, useAppSelector } from '@store/gameStore';
import type { ColonizationStatus, ColonizationTask } from '@domain/types';
import { formatCost } from './shared/formatters';
import {
  selectColonizationTasks,
  selectColonizedSystems,
  selectPlanets,
  selectResources,
} from '@store/selectors';
import { selectSystemsMap } from '@store/selectors';

const colonizationErrors: Record<ColonizationError, string> = {
  NO_SESSION: 'Nessuna sessione.',
  SYSTEM_NOT_FOUND: 'Sistema non trovato.',
  SYSTEM_UNKNOWN: 'Devi prima rivelare il sistema.',
  SYSTEM_NOT_SURVEYED: 'Sonda prima il sistema.',
  NO_HABITABLE_WORLD: 'Nessun mondo abitabile.',
  ALREADY_COLONIZED: 'Sistema gia colonizzato.',
  TASK_IN_PROGRESS: 'Colonizzazione gia attiva.',
  INSUFFICIENT_RESOURCES: 'Risorse insufficienti.',
  NO_COLONY_SHIP: 'Serve una nave colonia disponibile.',
};

const statusLabels: Record<ColonizationStatus, string> = {
  preparing: 'Allestimento',
  traveling: 'In viaggio',
  colonizing: 'Insediamento',
};
const statusBadgeClass: Record<ColonizationStatus, string> = {
  preparing: 'is-preparing',
  traveling: 'is-traveling',
  colonizing: 'is-colonizing',
};

interface ColonyPanelProps {
  onSelectPlanet: (planetId: string, systemId: string) => void;
  onFocusSystem: (systemId: string) => void;
}

export const ColonyPanel = ({
  onSelectPlanet,
  onFocusSystem,
}: ColonyPanelProps) => {
  const session = useGameStore((state) => state.session);
  const systems = useAppSelector(selectSystemsMap);
  const planets = useAppSelector(selectPlanets);
  const resources = useAppSelector(selectResources);
  const colonizationTasks = useAppSelector(selectColonizationTasks);
  const colonizedSystems = useAppSelector(selectColonizedSystems);
  const startColonization = useGameStore((state) => state.startColonization);
  const colonizationConfig = useGameStore(
    (state) => state.config.colonization,
  );
  const colonyShipDesignId = useGameStore(
    (state) => state.config.military.colonyShipDesignId,
  );
  const [message, setMessage] = useState<string | null>(null);

  const tasksBySystem = useMemo(() => {
    const map = new Map<string, ColonizationTask>();
    colonizationTasks.forEach((task) => {
      map.set(task.systemId, task);
    });
    return map;
  }, [colonizationTasks]);
  const colonyShipsAvailable = useMemo(() => {
    if (!session) {
      return 0;
    }
    return session.fleets.reduce((total, fleet) => {
      const ships = fleet.ships.filter(
        (ship) => ship.designId === colonyShipDesignId,
      ).length;
      return total + ships;
    }, 0);
  }, [session, colonyShipDesignId]);

  const canAffordColonization = () => {
    if (!resources) {
      return false;
    }
    return Object.entries(colonizationConfig.cost).every(([type, amount]) => {
      if (!amount) {
        return true;
      }
      const ledger = resources[type as keyof typeof resources];
      return (ledger?.amount ?? 0) >= amount;
    });
  };

  const handleColonize = (systemId: string) => {
    const result = startColonization(systemId);
    if (result.success) {
      setMessage('Colonizzazione avviata.');
    } else {
      setMessage(colonizationErrors[result.reason]);
    }
  };

  const missionProgressPercent = (task: ColonizationTask) => {
    if (task.missionTotalTicks <= 0) {
      return 0;
    }
    return Math.round(
      Math.min(1, task.missionElapsedTicks / task.missionTotalTicks) * 100,
    );
  };

  const stageProgressLabel = (task: ColonizationTask) => {
    if (task.totalTicks <= 0) {
      return '0/0 tick';
    }
    const completed = Math.max(0, task.totalTicks - task.ticksRemaining);
    return `${completed}/${task.totalTicks} tick`;
  };

  return (
    <section className="colony-panel">
      <div className="panel-section">
        <div className="panel-section__header">
          <h3>Colonie attive</h3>
        </div>
        {planets.length === 0 ? (
          <p className="text-muted">Nessuna colonia attiva.</p>
        ) : (
          <ul className="colony-list">
            {planets.map((planet) => (
              <li key={planet.id}>
                <button
                  type="button"
                  className="colony-chip"
                  onClick={() => onSelectPlanet(planet.id, planet.systemId)}
                >
                  <span>{planet.name}</span>
                  <small>{planet.id}</small>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="panel-section">
        <div className="panel-section__header">
          <h3>Missioni in corso</h3>
        </div>
              {colonizationTasks.length === 0 ? (
                <p className="text-muted">Nessuna missione attiva.</p>
              ) : (
                <ul>
                  {colonizationTasks.map((task) => {
                    const system = systems.get(task.systemId);
                    const missionProgress = missionProgressPercent(task);
                    return (
                      <li key={task.id}>
                        <div className="colonization-row">
                          <div>
                            <strong>{system?.name ?? task.systemId}</strong>
                            <span className="colonization-mission__status">
                              <span
                                className={`colonization-status ${statusBadgeClass[task.status]}`}
                              >
                                {statusLabels[task.status]}
                              </span>
                              {stageProgressLabel(task)}
                            </span>
                          </div>
                          <span className="colonization-mission__ticks">
                            {missionProgress}% missione
                          </span>
                  </div>
                  <div className="colonization-progress">
                    <div
                      className="colonization-progress__bar"
                      style={{ width: `${missionProgress}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="panel-section">
        <div className="panel-section__header">
          <h3>Colonizzazione</h3>
          {message ? <p className="panel-message">{message}</p> : null}
        </div>
        <p className="text-muted">
          Navi colonia disponibili: {colonyShipsAvailable}
        </p>
        <p className="text-muted">
          Costi:{' '}
          {formatCost(colonizationConfig.cost)}
        </p>
        <div className="colonization-panel__table">
          <table>
            <thead>
              <tr>
                <th>Sistema</th>
                <th>Mondo</th>
                <th>Stato</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {systems.map((system) => {
                const habitable = system.habitableWorld;
                const colonized = colonizedSystems.has(system.id);
                const task = tasksBySystem.get(system.id);
                const afford = canAffordColonization();
                const disabledReason = !habitable
                  ? 'Nessun mondo'
                  : system.visibility !== 'surveyed'
                    ? 'Serve sondaggio'
                    : colonized
                      ? 'Colonia attiva'
                      : task
                        ? `Missione in corso (${statusLabels[task.status]})`
                        : !afford
                          ? 'Risorse insufficienti'
                          : colonyShipsAvailable <= 0
                            ? 'Nessuna nave colonia disponibile'
                            : null;
                return (
                  <tr key={system.id}>
                    <td>
                      <div className="colony-table__system">
                        <span>{system.name}</span>
                        <button
                          type="button"
                          className="colony-table__link"
                          onClick={() => onFocusSystem(system.id)}
                        >
                          Vai
                        </button>
                      </div>
                    </td>
                    <td>{habitable ? habitable.kind : 'â€”'}</td>
                    <td>
                      {colonized
                        ? 'Colonia attiva'
                        : task
                          ? statusLabels[task.status]
                          : '-'}
                    </td>
                    <td>
                      <button
                        className="panel__action panel__action--compact"
                        disabled={Boolean(disabledReason)}
                        title={disabledReason ?? 'Avvia colonizzazione'}
                        onClick={() => handleColonize(system.id)}
                      >
                        Colonizza
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

