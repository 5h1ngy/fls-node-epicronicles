import { useMemo, useState } from 'react';
import { useGameStore, type ColonizationError } from '../../store/gameStore';
import { RESOURCE_TYPES } from '../../domain/economy';
import { resourceLabels } from '../../domain/resourceMetadata';

const colonizationErrors: Record<ColonizationError, string> = {
  NO_SESSION: 'Nessuna sessione.',
  SYSTEM_NOT_FOUND: 'Sistema non trovato.',
  SYSTEM_NOT_SURVEYED: 'Sonda prima il sistema.',
  NO_HABITABLE_WORLD: 'Nessun mondo abitabile.',
  ALREADY_COLONIZED: 'Sistema gia colonizzato.',
  TASK_IN_PROGRESS: 'Colonizzazione gia attiva.',
  INSUFFICIENT_RESOURCES: 'Risorse insufficienti.',
};

export const ColonyPanel = () => {
  const session = useGameStore((state) => state.session);
  const systems = session?.galaxy.systems ?? [];
  const planets = session?.economy.planets ?? [];
  const resources = session?.economy.resources ?? null;
  const colonizationTasks = session?.colonizationTasks ?? [];
  const startColonization = useGameStore((state) => state.startColonization);
  const colonizationConfig = useGameStore(
    (state) => state.config.colonization,
  );
  const [message, setMessage] = useState<string | null>(null);

  const colonizedSystems = useMemo(
    () => new Set(planets.map((planet) => planet.systemId)),
    [planets],
  );
  const pendingSystems = useMemo(
    () => new Set(colonizationTasks.map((task) => task.systemId)),
    [colonizationTasks],
  );

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

  return (
    <section className="colony-panel">
      <div className="panel-section">
        <div className="panel-section__header">
          <h3>Pianeti colonizzati</h3>
        </div>
        <ul>
          {planets.map((planet) => {
            const systemName =
              systems.find((system) => system.id === planet.systemId)?.name ??
              '???';
            return (
              <li key={planet.id}>
                <header>
                  <div>
                    <strong>{planet.name}</strong>
                    <span className="planet-list__system">{systemName}</span>
                  </div>
                  <span className="planet-list__meta">
                    Popolazione: {planet.population}
                  </span>
                </header>
                <div className="planet-list__yields">
                  {RESOURCE_TYPES.map((type) => {
                    const production = planet.baseProduction[type] ?? 0;
                    const upkeep = planet.upkeep[type] ?? 0;
                    if (production === 0 && upkeep === 0) {
                      return null;
                    }
                    const net = production - upkeep;
                    return (
                      <div key={type} className="planet-list__yield">
                        <span>{resourceLabels[type]}</span>
                        <span className={net >= 0 ? 'is-positive' : 'is-negative'}>
                          {net >= 0 ? '+' : '-'}
                          {Math.abs(net)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="panel-section">
        <div className="panel-section__header">
          <h3>Colonizzazione</h3>
          {message ? <p className="panel-message">{message}</p> : null}
        </div>
        <p className="text-muted">
          Costi:{' '}
          {Object.entries(colonizationConfig.cost)
            .filter(([, amount]) => amount && amount > 0)
            .map(
              ([type, amount]) =>
                `${resourceLabels[type as keyof typeof resourceLabels]} ${amount}`,
            )
            .join(' | ')}
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
                const pending = pendingSystems.has(system.id);
                const afford = canAffordColonization();
                const disabledReason = !habitable
                  ? 'Nessun mondo'
                  : system.visibility !== 'surveyed'
                    ? 'Serve sondaggio'
                    : colonized
                      ? 'Colonia attiva'
                      : pending
                        ? 'In corso'
                        : !afford
                          ? 'Risorse insufficienti'
                          : null;
                return (
                  <tr key={system.id}>
                    <td>{system.name}</td>
                    <td>{habitable ? habitable.kind : '—'}</td>
                    <td>
                      {colonized ? 'Colonia attiva' : pending ? 'In corso' : '-'}
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
        {colonizationTasks.length > 0 ? (
          <>
            <h4>Colonizzazioni in corso</h4>
            <ul>
              {colonizationTasks.map((task) => {
                const systemName =
                  systems.find((system) => system.id === task.systemId)?.name ??
                  '???';
                const progress =
                  1 - task.ticksRemaining / Math.max(1, task.totalTicks);
                return (
                  <li key={task.id}>
                    <div className="colonization-row">
                      <div>
                        <strong>
                          {task.planetTemplate.name} ({systemName})
                        </strong>
                        <span className="text-muted">
                          {task.ticksRemaining} tick rimanenti
                        </span>
                      </div>
                      <span className="colonization-status">{task.status}</span>
                    </div>
                    <div className="colonization-progress">
                      <div
                        className="colonization-progress__bar"
                        style={{ width: `${Math.round(progress * 100)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        ) : null}
      </div>
    </section>
  );
};
