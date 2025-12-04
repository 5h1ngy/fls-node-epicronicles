import type { ScienceShip, StarSystem } from '@domain/types';
import { Activity, PauseCircle, MapPin, Radar, Target } from 'lucide-react';

import './FleetWindowsShared.scss';

interface ScienceShipDetailWindowProps {
  ship: ScienceShip;
  systems: StarSystem[];
  onOrder: (systemId: string) => void;
  onAnchorChange: (planetId: string | null) => void;
  onToggleAuto: (auto: boolean) => void;
  onStop: () => void;
  onCenter?: (systemId: string) => void;
  onClose: () => void;
}

const statusLabel: Record<ScienceShip['status'], string> = {
  idle: 'In stazione',
  traveling: 'In viaggio',
  surveying: 'Sondando',
};

export const ScienceShipDetailWindow = ({
  ship,
  systems,
  onOrder,
  onAnchorChange,
  onToggleAuto,
  onStop,
  onCenter,
  onClose,
}: ScienceShipDetailWindowProps) => {
  const resolveName = (systemId: string | null | undefined) =>
    systemId
      ? systems.find((system) => system.id === systemId)?.name ?? systemId
      : 'N/D';

  const revealedSystems = systems.filter((system) => system.visibility !== 'unknown');
  const currentSystem = systems.find((system) => system.id === ship.currentSystemId);
  const anchorOptions =
    currentSystem?.orbitingPlanets?.map((planet) => ({
      id: planet.id,
      name: planet.name ?? planet.id,
    })) ?? [];

  return (
    <div className="science-detail">
      <header className="science-detail__header">
        <div className="science-detail__titleblock">
          <p className="fleet-detail__eyebrow">Dettagli nave scientifica</p>
          <h3 className="fleet-detail__title">{ship.name ?? ship.id}</h3>
          <div className="science-detail__meta">
            <span className={`pill ${ship.status !== 'idle' ? 'pill--success' : ''}`}>
              <Activity size={14} /> {statusLabel[ship.status]}
            </span>
            <span className="pill pill--glass">
              {ship.anchorPlanetId ? 'Agganciata a pianeta' : 'Agganciata a stella'}
            </span>
            <label className="science-detail__toggle">
              <input
                type="checkbox"
                checked={ship.autoExplore}
                onChange={(e) => onToggleAuto(e.target.checked)}
              />
              <span>Auto esplorazione</span>
            </label>
          </div>
        </div>
        <button className="dock-detail__close" onClick={onClose} aria-label="Chiudi dettaglio">
          ×
        </button>
      </header>

      <section className="science-detail__section">
        <div className="science-detail__row science-detail__row--split">
          <div className="science-detail__card">
            <span className="text-muted">Sistema attuale</span>
            <p className="science-detail__value">{resolveName(ship.currentSystemId)}</p>
            <small className="text-muted">ID: {ship.currentSystemId}</small>
          </div>
          <div className="science-detail__card">
            <span className="text-muted">Destinazione</span>
            <p className="science-detail__value">
              {ship.targetSystemId ? resolveName(ship.targetSystemId) : 'Nessuna'}
            </p>
            <small className="text-muted">
              {ship.ticksRemaining > 0 ? `${ship.ticksRemaining} tick` : 'N/D'}
            </small>
          </div>
        </div>

        <div className="science-detail__actions">
          <button
            className="hud-icon-btn"
            onClick={() => onCenter?.(ship.currentSystemId)}
            data-tooltip="Centra sulla nave"
            aria-label="Centra nave"
          >
            <Target size={14} />
          </button>
          {ship.targetSystemId ? (
            <button
              className="hud-icon-btn"
              onClick={() => onCenter?.(ship.targetSystemId ?? ship.currentSystemId)}
              data-tooltip="Centra destinazione"
              aria-label="Centra destinazione"
            >
              <MapPin size={14} />
            </button>
          ) : null}
          <button className="hud-icon-btn" onClick={onStop} data-tooltip="Ferma nave" aria-label="Ferma">
            <PauseCircle size={14} />
          </button>
        </div>

        <div className="science-detail__controls">
          <label className="science-detail__field">
            <span>Ordina su sistema</span>
            <select
              value={ship.targetSystemId ?? ''}
              onChange={(e) => onOrder(e.target.value)}
            >
              <option value="">Seleziona sistema</option>
              {revealedSystems.map((system) => (
                <option key={system.id} value={system.id}>
                  {system.name}
                </option>
              ))}
            </select>
          </label>
          <label className="science-detail__field">
            <span>Aggancio (sistema attuale)</span>
            <select
              value={ship.anchorPlanetId ?? ''}
              onChange={(e) =>
                onAnchorChange(e.target.value ? e.target.value : null)
              }
            >
              <option value="">Stella</option>
              {anchorOptions.map((planet) => (
                <option key={planet.id} value={planet.id}>
                  {planet.name}
                </option>
              ))}
            </select>
          </label>
          <div className="science-detail__hint">
            <Radar size={14} />
            <span>
              Ordina verso un sistema rivelato per sondare o visualizzare i dettagli. Usa Auto
              esplorazione per farla pattugliare automaticamente.
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
