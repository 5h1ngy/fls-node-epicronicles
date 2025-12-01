import { DraggablePanel } from '@panels/shared/DraggablePanel';
import { Suspense, lazy } from 'react';
import type {
  StarSystem,
  Planet,
  OrbitingPlanet,
  StarClass,
} from '@domain/types';

import './MapPanels.scss';

const ShipyardPanel = lazy(() =>
  import('@panels/ShipyardPanel').then((m) => ({
    default: m.ShipyardPanel,
  })),
);

const starMeta: Record<
  StarClass,
  { label: string; temperature: string }
> = {
  O: { label: 'Gigante blu (Classe O)', temperature: '30.000–50.000 K' },
  B: { label: 'Blu-bianca (Classe B)', temperature: '10.000–30.000 K' },
  A: { label: 'Bianca (Classe A)', temperature: '7.500–10.000 K' },
  F: { label: 'Bianco-gialla (Classe F)', temperature: '6.000–7.500 K' },
  G: { label: 'Gialla (Classe G)', temperature: '5.200–6.000 K' },
  K: { label: 'Arancio (Classe K)', temperature: '3.700–5.200 K' },
  M: { label: 'Rossa (Classe M)', temperature: '2.400–3.700 K' },
};

interface MapPanelsProps {
  focusedSystem: StarSystem | null;
  focusedPlanet: Planet | null;
  focusedOrbitingPlanet: OrbitingPlanet | null;
  focusedPlanetSystem: StarSystem | null;
  viewportWidth: number;
  viewportHeight: number;
  onClearFocusTargets: () => void;
  shipyardSystem: StarSystem | null;
  closeShipyard: () => void;
}

export const MapPanels = ({
  focusedSystem,
  focusedPlanet,
  focusedOrbitingPlanet,
  focusedPlanetSystem,
  viewportWidth,
  viewportHeight,
  onClearFocusTargets,
  shipyardSystem,
  closeShipyard,
}: MapPanelsProps) => {
  const modalWidth = Math.min(1280, viewportWidth - 60);
  const modalHeight = Math.min(780, viewportHeight - 80);
  const modalX = Math.max(20, (viewportWidth - modalWidth) / 2);
  const modalY = Math.max(20, (viewportHeight - modalHeight) / 2);

  const ownerLabel = (ownerId?: string | null) => {
    if (!ownerId) return 'Indefinito';
    if (ownerId === 'player') return 'Noi';
    return ownerId;
  };

  const shipyardLabel = (system?: StarSystem | null) => {
    if (!system) return '';
    if (system.shipyardBuild) {
      const progress = Math.round(
        (1 -
          system.shipyardBuild.ticksRemaining /
            Math.max(1, system.shipyardBuild.totalTicks)) *
          100,
      );
      return `In costruzione (${progress}%)`;
    }
    if (system.hasShipyard) return 'Presente';
    return 'Assente';
  };

  return (
    <div className="floating-panels">
      {(() => {
        if (!focusedSystem || focusedPlanet) return null;
        const meta =
          starMeta[focusedSystem.starClass] ?? {
            label: `Classe ${focusedSystem.starClass}`,
            temperature: '—',
          };
        return (
          <div className="system-mini-panel">
            <header className="system-mini-panel__header">
              <div>
                <p className="system-mini-panel__eyebrow">Stella</p>
                <h4 className="system-mini-panel__title">
                  {focusedSystem.name}
                </h4>
              </div>
              <button
                className="system-mini-panel__close"
                onClick={onClearFocusTargets}
              >
                ×
              </button>
            </header>
            <div className="system-mini-panel__rows">
              <div className="system-mini-panel__row">
                <span className="text-muted">Tipologia</span>
                <span>{meta.label}</span>
              </div>
              <div className="system-mini-panel__row">
                <span className="text-muted">Temperatura</span>
                <span>{meta.temperature}</span>
              </div>
              <div className="system-mini-panel__row">
                <span className="text-muted">Stato</span>
                <span>
                  {focusedSystem.visibility === 'surveyed'
                    ? 'Sondato'
                    : focusedSystem.visibility === 'revealed'
                      ? 'Rivelato'
                      : 'Sconosciuto'}
                </span>
              </div>
              <div className="system-mini-panel__row">
                <span className="text-muted">Proprietario</span>
                <span>{ownerLabel(focusedSystem.ownerId)}</span>
              </div>
              <div className="system-mini-panel__row">
                <span className="text-muted">Minaccia</span>
                <span>{focusedSystem.hostilePower ?? 0}</span>
              </div>
              <div className="system-mini-panel__row">
                <span className="text-muted">Cantiere</span>
                <span>{shipyardLabel(focusedSystem)}</span>
              </div>
              <div className="system-mini-panel__row">
                <span className="text-muted">Pianeti</span>
                <span>{focusedSystem.orbitingPlanets?.length ?? 0}</span>
              </div>
            </div>
          </div>
        );
      })()}
      {focusedPlanet || focusedOrbitingPlanet ? (
        <div className="planet-mini-panel">
          <header className="system-mini-panel__header">
            <div>
              <p className="system-mini-panel__eyebrow">Pianeta</p>
              <h4 className="system-mini-panel__title">
                {focusedPlanet?.name ?? focusedOrbitingPlanet?.name ?? 'Pianeta'}
              </h4>
              <small className="text-muted">
                {focusedPlanetSystem?.name ?? 'Sistema sconosciuto'}
              </small>
            </div>
            <button
              className="system-mini-panel__close"
              onClick={onClearFocusTargets}
            >
              ×
            </button>
          </header>
          <div className="system-mini-panel__rows">
            <div className="system-mini-panel__row">
              <span className="text-muted">Tipo</span>
              <span>{focusedPlanet?.kind ?? 'Sconosciuto'}</span>
            </div>
            <div className="system-mini-panel__row">
              <span className="text-muted">Abitabilità</span>
              <span>
                {focusedPlanet
                  ? `${Math.round(focusedPlanet.habitability)}%`
                  : 'Sconosciuta'}
              </span>
            </div>
            <div className="system-mini-panel__row">
              <span className="text-muted">Dimensione</span>
              <span>{focusedPlanet?.size ?? focusedOrbitingPlanet?.size ?? '?'}</span>
            </div>
            <div className="system-mini-panel__row">
              <span className="text-muted">Popolazione</span>
              <span>{focusedPlanet?.population?.total ?? 0}</span>
            </div>
            <div className="system-mini-panel__row">
              <span className="text-muted">Distretto</span>
              <span>
                {focusedPlanet
                  ? Object.values(focusedPlanet.districts ?? {}).reduce(
                      (acc, n) => acc + (n ?? 0),
                      0,
                    )
                  : 0}
              </span>
            </div>
          </div>
        </div>
      ) : null}
      {shipyardSystem ? (
        <DraggablePanel
          title={`Cantieri - ${shipyardSystem.name}`}
          initialX={modalX}
          initialY={modalY}
          initialWidth={modalWidth}
          initialHeight={modalHeight}
          onClose={closeShipyard}
        >
          <Suspense fallback={<p className="text-muted">Caricamento...</p>}>
            <ShipyardPanel system={shipyardSystem} />
          </Suspense>
        </DraggablePanel>
      ) : null}
    </div>
  );
};
