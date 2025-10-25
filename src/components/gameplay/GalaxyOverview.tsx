import { useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import type {
  ScienceShip,
  StarClass,
  SystemVisibility,
} from '../../domain/types';

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

export const GalaxyOverview = () => {
  const systems = useGameStore((state) => state.session?.galaxy.systems ?? []);
  const scienceShips = useGameStore(
    (state) => state.session?.scienceShips ?? [],
  );

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
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Tipo</th>
              <th>Stato</th>
            </tr>
          </thead>
          <tbody>
            {systems.map((system) => (
              <tr key={system.id}>
                <td>{system.name}</td>
                <td>{system.starClass}</td>
                <td>{visibilityLabel[system.visibility]}</td>
              </tr>
            ))}
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
