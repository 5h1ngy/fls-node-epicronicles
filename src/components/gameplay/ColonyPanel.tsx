import { useMemo, useState } from 'react';
import { useGameStore, type ColonizationError } from '../../store/gameStore';
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

interface ColonyPanelProps {
  onSelectPlanet: (planetId: string, systemId: string) => void;
  onFocusSystem: (systemId: string) => void;
}

export const ColonyPanel = ({
  onSelectPlanet,
  onFocusSystem,
}: ColonyPanelProps) => {
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
      </div>
    </section>
  );
};
