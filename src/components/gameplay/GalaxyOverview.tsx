import { useMemo, useState } from 'react';
import { useGameStore, type ColonizationError } from '../../store/gameStore';
import type {
  ResourceCost,
  ScienceShip,
  StarClass,
  SystemVisibility,
} from '../../domain/types';
import { resourceLabels } from '../../domain/resourceMetadata';

const VIEWPORT_SIZE = 320;

const systemClassColor: Record<StarClass, string> = {
  mainSequence: '#70c1ff',
  giant: '#ffa94d',
  dwarf: '#d8b4ff',
};

const visibilityOpacity: Record<SystemVisibility, number> = {
  unknown: 0.25,
  revealed: 0.65,
  surveyed: 1,
};

const visibilityRadius: Record<SystemVisibility, number> = {
  unknown: 4,
  revealed: 5,
  surveyed: 6,
};

const visibilityLabel: Record<SystemVisibility, string> = {
  unknown: 'Inesplorato',
  revealed: 'Rivelato',
  surveyed: 'Sondato',
};

const shipStatusLabel: Record<ScienceShip['status'], string> = {
  idle: 'In attesa',
  traveling: 'In viaggio',
  surveying: 'Analisi',
};

const colonizationErrors: Record<ColonizationError, string> = {
  NO_SESSION: 'Nessuna sessione attiva.',
  SYSTEM_NOT_FOUND: 'Sistema non trovato.',
  SYSTEM_NOT_SURVEYED: 'Sonda prima il sistema.',
  NO_HABITABLE_WORLD: 'Nessun mondo abitabile disponibile.',
  ALREADY_COLONIZED: 'Sistema gia colonizzato.',
  TASK_IN_PROGRESS: 'Colonizzazione gia in corso.',
  INSUFFICIENT_RESOURCES: 'Risorse insufficienti.',
};

const formatCost = (cost: ResourceCost) =>
  Object.entries(cost)
    .filter(([, amount]) => typeof amount === 'number' && amount > 0)
    .map(
      ([type, amount]) => `${resourceLabels[type as keyof typeof resourceLabels]} ${amount}`,
    )
    .join(' | ');

export const GalaxyOverview = () => {
  const systems = useGameStore((state) => state.session?.galaxy.systems ?? []);
  const scienceShips = useGameStore(
    (state) => state.session?.scienceShips ?? [],
  );
  const planets = useGameStore((state) => state.session?.economy.planets ?? []);
  const resources = useGameStore(
    (state) => state.session?.economy.resources ?? null,
  );
  const colonizationTasks = useGameStore(
    (state) => state.session?.colonizationTasks ?? [],
  );
  const colonizationConfig = useGameStore(
    (state) => state.config.colonization,
  );
  const startColonization = useGameStore((state) => state.startColonization);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const mappedSystems = useMemo(() => {
    if (systems.length === 0) {
      return [];
    }

    const xs = systems.map((system) => system.position.x);
    const ys = systems.map((system) => system.position.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const spanX = maxX - minX || 1;
    const spanY = maxY - minY || 1;

    return systems.map((system) => ({
      ...system,
      screenX:
        ((system.position.x - minX) / spanX) * (VIEWPORT_SIZE - 20) + 10,
      screenY:
        ((system.position.y - minY) / spanY) * (VIEWPORT_SIZE - 20) + 10,
    }));
  }, [systems]);

  const systemById = useMemo(() => {
    const map = new Map<string, (typeof mappedSystems)[number]>();
    mappedSystems.forEach((system) => map.set(system.id, system));
    return map;
  }, [mappedSystems]);

  const colonizedSystems = useMemo(
    () => new Set(planets.map((planet) => planet.systemId)),
    [planets],
  );
  const pendingSystems = useMemo(
    () => new Set(colonizationTasks.map((task) => task.systemId)),
    [colonizationTasks],
  );

  const canAffordCost = () => {
    if (!resources) {
      return false;
    }
    return Object.entries(colonizationConfig.cost).every(([type, amount]) => {
      if (!amount || amount <= 0) {
        return true;
      }
      const ledger = resources[type as keyof typeof resources];
      return (ledger?.amount ?? 0) >= amount;
    });
  };

  const handleColonize = (systemId: string, systemName: string) => {
    const result = startColonization(systemId);
    if (result.success) {
      setActionMessage(`Colonizzazione avviata nel sistema ${systemName}.`);
    } else {
      setActionMessage(colonizationErrors[result.reason]);
    }
  };

  return (
    <section className="galaxy-overview">
      <div className="galaxy-overview__map" aria-label="Mappa galattica">
        <svg viewBox={`0 0 ${VIEWPORT_SIZE} ${VIEWPORT_SIZE}`} role="presentation">
          <rect
            width={VIEWPORT_SIZE}
            height={VIEWPORT_SIZE}
            fill="rgba(255,255,255,0.02)"
            stroke="rgba(255,255,255,0.1)"
          />
          {mappedSystems.map((system) => (
            <g key={system.id}>
              <circle
                cx={system.screenX}
                cy={system.screenY}
                r={visibilityRadius[system.visibility]}
                fill={systemClassColor[system.starClass]}
                opacity={visibilityOpacity[system.visibility]}
              />
              <text
                x={system.screenX + 8}
                y={system.screenY + 4}
                className="galaxy-overview__label"
              >
                {system.name}
              </text>
            </g>
          ))}
          {scienceShips.map((ship) => {
            const currentSystem = systemById.get(ship.currentSystemId);
            if (!currentSystem) {
              return null;
            }

            return (
              <g key={ship.id}>
                <circle
                  cx={currentSystem.screenX}
                  cy={currentSystem.screenY}
                  r={3}
                  className="galaxy-overview__ship"
                />
              </g>
            );
          })}
        </svg>
      </div>
      <div className="galaxy-overview__list">
        <header className="galaxy-overview__header">
          <h3>Sistemi stellari</h3>
          <p className="galaxy-overview__hint">
            Costo colonizzazione: {formatCost(colonizationConfig.cost)}
          </p>
          {actionMessage ? (
            <p className="colonization-message">{actionMessage}</p>
          ) : null}
        </header>
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Tipo</th>
              <th>Stato</th>
              <th>Mondo</th>
              <th>Colonizzazione</th>
            </tr>
          </thead>
          <tbody>
            {systems.map((system) => {
              const habitable = system.habitableWorld;
              const colonized = colonizedSystems.has(system.id);
              const pending = pendingSystems.has(system.id);
              const affordability = canAffordCost();
              let disabledReason: string | null = null;
              if (!habitable) {
                disabledReason = 'Nessun mondo abitabile';
              } else if (system.visibility !== 'surveyed') {
                disabledReason = 'Esplora e sonda il sistema';
              } else if (colonized) {
                disabledReason = 'Già colonizzato';
              } else if (pending) {
                disabledReason = 'In corso';
              } else if (!affordability) {
                disabledReason = 'Risorse insufficienti';
              }

              return (
                <tr key={system.id}>
                  <td>{system.name}</td>
                  <td>{system.starClass}</td>
                  <td>{visibilityLabel[system.visibility]}</td>
                  <td>{habitable ? habitable.kind : '—'}</td>
                  <td>
                    {habitable ? (
                      <button
                        className="panel__action panel__action--compact"
                        disabled={Boolean(disabledReason)}
                        title={disabledReason ?? 'Avvia colonizzazione'}
                        onClick={() => handleColonize(system.id, system.name)}
                      >
                        {colonized
                          ? 'Colonia attiva'
                          : pending
                            ? 'In corso'
                            : 'Colonizza'}
                      </button>
                    ) : (
                      <span className="text-muted">N/A</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="galaxy-overview__ships">
          <h3>Navi scientifiche</h3>
          <ul>
            {scienceShips.map((ship) => {
              const currentSystem = systems.find(
                (system) => system.id === ship.currentSystemId,
              );
              const target = ship.targetSystemId
                ? systems.find((system) => system.id === ship.targetSystemId)
                : null;
              return (
                <li key={ship.id}>
                  <div className="ship-row">
                    <span className="ship-name">{ship.name}</span>
                    <span className={`ship-status ship-status--${ship.status}`}>
                      {shipStatusLabel[ship.status]}
                    </span>
                  </div>
                  <p>
                    Sistema attuale: {currentSystem ? currentSystem.name : '???'}
                  </p>
                  {target ? (
                    <p className="ship-target">
                      Obiettivo: {target.name} ({ship.ticksRemaining} tick)
                    </p>
                  ) : (
                    <p className="ship-target">Nessun obiettivo attivo</p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
};


