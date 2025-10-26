import { useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';

const visibilityLabel = {
  unknown: 'Sconosciuto',
  revealed: 'Rivelato',
  surveyed: 'Sondato',
} as const;

interface SystemPanelProps {
  systemId: string | null;
  onFocusPlanet: (planetId: string) => void;
}

export const SystemPanel = ({
  systemId,
  onFocusPlanet,
}: SystemPanelProps) => {
  const session = useGameStore((state) => state.session);

  const system = useMemo(() => {
    if (!systemId || !session) {
      return null;
    }
    return session.galaxy.systems.find((entry) => entry.id === systemId) ?? null;
  }, [session, systemId]);

  if (!system) {
    return <p className="text-muted">Seleziona un sistema sulla mappa.</p>;
  }

  const isSurveyed = system.visibility === 'surveyed';

  return (
    <section className="system-panel">
      <header className="system-panel__header">
        <div>
          <h3>{system.name}</h3>
          <span className="text-muted">
            Stato: {visibilityLabel[system.visibility]}
          </span>
        </div>
        <div className="system-panel__stats">
          <span>Classe stella: {system.starClass}</span>
          {system.hostilePower && system.hostilePower > 0 ? (
            <span className="text-danger">
              Minaccia: {system.hostilePower}
            </span>
          ) : (
            <span className="text-muted">Nessuna minaccia rilevata</span>
          )}
        </div>
      </header>
      <div className="system-panel__section">
        <h4>Pianeti</h4>
        {isSurveyed ? (
          <ul className="system-panel__planets">
            {system.orbitingPlanets.map((planet) => (
              <li key={planet.id}>
                <div>
                  <strong>{planet.name}</strong>
                  <span className="text-muted">
                    Orbita: {planet.orbitRadius.toFixed(1)} AU
                  </span>
                </div>
                <div className="system-panel__planet-meta">
                  <span>Diametro: {planet.size.toFixed(1)}</span>
                  <button
                    className="panel__action panel__action--compact"
                    onClick={() => onFocusPlanet(planet.id)}
                  >
                    Focus
                  </button>
                </div>
              </li>
            ))}
            {system.orbitingPlanets.length === 0 ? (
              <li className="text-muted">Nessun pianeta registrato.</li>
            ) : null}
          </ul>
        ) : (
          <p className="text-muted">
            Sonda il sistema per ottenere dati sugli orbitali.
          </p>
        )}
      </div>
      {system.habitableWorld ? (
        <div className="system-panel__section">
          <h4>Mondo abitabile</h4>
          <div className="system-panel__habitable">
            <strong>{system.habitableWorld.name}</strong>
            <span>Tipo: {system.habitableWorld.kind}</span>
            <span>Dimensione: {system.habitableWorld.size}</span>
          </div>
        </div>
      ) : null}
    </section>
  );
};
