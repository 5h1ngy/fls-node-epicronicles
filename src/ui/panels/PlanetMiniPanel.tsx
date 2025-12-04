import type { OrbitingPlanet, Planet, StarSystem } from '@domain/types';
type PlanetMiniPanelProps = {
  planet: Planet | null;
  orbitingPlanet: OrbitingPlanet | null;
  system: StarSystem | null;
  onClose: () => void;
};

export const PlanetMiniPanel = ({
  planet,
  orbitingPlanet,
  system,
  onClose,
}: PlanetMiniPanelProps) => {
  return (
    <div className="planet-mini-panel">
      <header className="system-mini-panel__header">
        <div>
          <p className="system-mini-panel__eyebrow">Pianeta</p>
          <h4 className="system-mini-panel__title">
            {planet?.name ?? orbitingPlanet?.name ?? 'Pianeta'}
          </h4>
          <small className="text-muted">{system?.name ?? 'Sistema sconosciuto'}</small>
        </div>
        <button className="system-mini-panel__close" onClick={onClose}>
          X
        </button>
      </header>
      <div className="system-mini-panel__rows">
        <div className="system-mini-panel__row">
          <span className="text-muted">Tipo</span>
          <span>{planet?.kind ?? 'Sconosciuto'}</span>
        </div>
        <div className="system-mini-panel__row">
          <span className="text-muted">Abitabilità</span>
          <span>
            {planet ? `${Math.round(planet.habitability)}%` : 'Sconosciuta'}
          </span>
        </div>
        <div className="system-mini-panel__row">
          <span className="text-muted">Dimensione</span>
          <span>{planet?.size ?? orbitingPlanet?.size ?? '?'}</span>
        </div>
        <div className="system-mini-panel__row">
          <span className="text-muted">Popolazione</span>
          <span>{planet?.population?.total ?? 0}</span>
        </div>
        <div className="system-mini-panel__row">
          <span className="text-muted">Distretto</span>
          <span>
            {planet
              ? Object.values(planet.districts ?? {}).reduce(
                  (acc, n) => acc + (n ?? 0),
                  0,
                )
              : 0}
          </span>
        </div>
      </div>
    </div>
  );
};
