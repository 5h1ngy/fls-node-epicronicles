import { DraggablePanel } from '@windows/common/DraggablePanel';
import { Suspense, lazy } from 'react';
import type { StarSystem, Planet, OrbitingPlanet } from '@domain/types';
import { SystemMiniPanel } from '@panels/SystemMiniPanel';
import { PlanetMiniPanel } from '@panels/PlanetMiniPanel';
import './MapPanels.scss';

const ShipyardWindow = lazy(() =>
  import('@windows/ShipyardWindow').then((m) => ({
    default: m.ShipyardWindow,
  })),
);

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
      {focusedSystem && !focusedPlanet ? (
        <SystemMiniPanel
          system={focusedSystem}
          ownerLabel={ownerLabel}
          shipyardLabel={shipyardLabel}
          onClose={onClearFocusTargets}
        />
      ) : null}
      {focusedPlanet || focusedOrbitingPlanet ? (
        <PlanetMiniPanel
          planet={focusedPlanet}
          orbitingPlanet={focusedOrbitingPlanet}
          system={focusedPlanetSystem}
          onClose={onClearFocusTargets}
        />
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
            <ShipyardWindow system={shipyardSystem} />
          </Suspense>
        </DraggablePanel>
      ) : null}
    </div>
  );
};
