import { useMemo } from "react";
import { useGameStore } from "@store/gameStore";
import type { ScienceShip, StarClass, SystemVisibility } from "@domain/types";
import "../styles/components/GalaxyOverview.scss";

const MAP_SIZE = 360;

const systemClassColor: Record<StarClass, string> = {
  mainSequence: "#70c1ff",
  giant: "#ffa94d",
  dwarf: "#d8b4ff",
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

const shipStatusLabel: Record<ScienceShip["status"], string> = {
  idle: "In attesa",
  traveling: "In viaggio",
  surveying: "Analisi",
};

interface GalaxyOverviewProps {
  onFocusSystem?: (systemId: string) => void;
}

export const GalaxyOverview = ({ onFocusSystem }: GalaxyOverviewProps) => {
  const systems = useGameStore((state) => state.session?.galaxy.systems ?? []);
  const scienceShips = useGameStore(
    (state) => state.session?.scienceShips ?? [],
  );
  const planets = useGameStore((state) => state.session?.economy.planets ?? []);

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
      screenX: ((system.position.x - minX) / spanX) * (MAP_SIZE - 30) + 15,
      screenY: ((system.position.y - minY) / spanY) * (MAP_SIZE - 30) + 15,
    }));
  }, [systems]);

  const mappedById = useMemo(() => {
    const map = new Map<string, (typeof mappedSystems)[number]>();
    mappedSystems.forEach((system) => map.set(system.id, system));
    return map;
  }, [mappedSystems]);

  const surveyedCount = systems.filter(
    (system) => system.visibility === "surveyed",
  ).length;
  const revealedCount = systems.filter(
    (system) => system.visibility !== "unknown",
  ).length;
  const hostile = systems.filter((system) => (system.hostilePower ?? 0) > 0);

  const shipCards = scienceShips.map((ship) => {
    const currentSystem = mappedById.get(ship.currentSystemId) ?? null;
    const target = ship.targetSystemId
      ? mappedById.get(ship.targetSystemId) ?? null
      : null;
    return {
      ship,
      currentSystem,
      target,
    };
  });

  return (
    <section className="galaxy-modal">
      <header className="galaxy-modal__header">
        <div>
          <p className="galaxy-modal__eyebrow">Situazione galattica</p>
          <h2>Panoramica galassia</h2>
          <p className="text-muted">
            Stato di sistemi, colonie e navi scientifiche. Clicca su un sistema noto per centrare la mappa.
          </p>
        </div>
        <div className="galaxy-modal__summary">
          <span className="pill">
            Sistemi: <strong>{systems.length}</strong>
          </span>
          <span className="pill pill--success">
            Sondati: <strong>{surveyedCount}</strong>
          </span>
          <span className="pill">
            Rivelati: <strong>{revealedCount}</strong>
          </span>
          <span className="pill pill--alert">
            Ostili: <strong>{hostile.length}</strong>
          </span>
          <span className="pill">
            Colonie: <strong>{planets.length}</strong>
          </span>
        </div>
      </header>

      <div className="galaxy-modal__content">
        <div className="galaxy-modal__map" aria-label="Mappa galattica">
          <svg viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`} role="presentation">
            <rect
              width={MAP_SIZE}
              height={MAP_SIZE}
              fill="rgba(255,255,255,0.02)"
              stroke="rgba(255,255,255,0.1)"
            />
            {mappedSystems.map((system) => (
              <g key={system.id} className="galaxy-modal__system">
                {system.hostilePower && system.hostilePower > 0 ? (
                  <circle
                    cx={system.screenX}
                    cy={system.screenY}
                    r={visibilityRadius[system.visibility] + 5}
                    className="galaxy-modal__hostile"
                  />
                ) : null}
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
                  className="galaxy-modal__label"
                >
                  {system.name}
                </text>
                {onFocusSystem ? (
                  <circle
                    cx={system.screenX}
                    cy={system.screenY}
                    r={visibilityRadius[system.visibility] + 8}
                    className="galaxy-modal__focus"
                    onClick={() =>
                      system.visibility !== "unknown"
                        ? onFocusSystem(system.id)
                        : null
                    }
                  />
                ) : null}
              </g>
            ))}
            {shipCards.map(({ ship, currentSystem }) => {
              if (!currentSystem) return null;
              return (
                <circle
                  key={ship.id}
                  cx={currentSystem.screenX}
                  cy={currentSystem.screenY}
                  r={4}
                  className="galaxy-modal__ship"
                />
              );
            })}
          </svg>
        </div>
        <div className="galaxy-modal__lists">
          <div className="galaxy-modal__block">
            <h3>Sistemi ostili</h3>
            <ul className="galaxy-modal__list">
              {hostile.length === 0 ? (
                <li className="text-muted">Nessuna minaccia rilevata.</li>
              ) : (
                hostile.map((system) => (
                  <li key={system.id}>
                    <div className="galaxy-list__row">
                      <span>{system.name}</span>
                      <span className="galaxy-list__tag">{system.hostilePower} forza</span>
                    </div>
                    <small className="text-muted">Stato: {system.visibility}</small>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="galaxy-modal__block">
            <h3>Navi scientifiche</h3>
            <ul className="galaxy-modal__list">
              {shipCards.length === 0 ? (
                <li className="text-muted">Nessuna nave scientifica attiva.</li>
              ) : (
                shipCards.map(({ ship, currentSystem, target }) => (
                  <li key={ship.id}>
                    <div className="galaxy-list__row">
                      <span>{ship.name}</span>
                      <span className={`ship-status ship-status--${ship.status}`}>
                        {shipStatusLabel[ship.status]}
                      </span>
                    </div>
                    <small className="text-muted">
                      Presente in: {currentSystem ? currentSystem.name : "???"}
                    </small>
                    <small className="text-muted">
                      Obiettivo: {target ? `${target.name} (${ship.ticksRemaining} tick)` : "Nessuno"}
                    </small>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
