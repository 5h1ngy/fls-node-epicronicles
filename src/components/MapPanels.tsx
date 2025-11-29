import { DraggablePanel } from '@panels/shared/DraggablePanel';
import { Suspense, lazy } from 'react';
import type { StarSystem } from '@domain/types';

import '../styles/components/MapPanels.scss';

const ShipyardPanel = lazy(() =>
  import('@panels/ShipyardPanel').then((m) => ({
    default: m.ShipyardPanel,
  })),
);

interface MapPanelsProps {
  focusedSystem: StarSystem | null;
  viewportWidth: number;
  viewportHeight: number;
  onClearFocusTargets: () => void;
  shipyardSystem: StarSystem | null;
  closeShipyard: () => void;
}

export const MapPanels = ({
  focusedSystem,
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
      {focusedSystem ? (
        <div className="system-mini-panel">
          <header className="system-mini-panel__header">
            <div>
              <p className="system-mini-panel__eyebrow">Stella</p>
              <h4 className="system-mini-panel__title">{focusedSystem.name}</h4>
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
              <span className="text-muted">Stato</span>
              <span>
                {focusedSystem.visibility === 'surveyed'
                  ? 'Sondato'
                  : focusedSystem.visibility === 'scanned'
                    ? 'Scansionato'
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
