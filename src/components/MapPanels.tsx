import { DraggablePanel } from '@panels/shared/DraggablePanel';
import { SystemPanel } from '@panels/SystemPanel';
import { Suspense, lazy } from 'react';
import type { StarSystem } from '@domain/types';

import '../styles/components/MapPanels.scss';

const ShipyardPanel = lazy(() =>
  import('@panels/ShipyardPanel').then((m) => ({
    default: m.ShipyardPanel,
  })),
);

interface MapPanelsProps {
  focusSystemId: string | null;
  viewportWidth: number;
  viewportHeight: number;
  onClearFocusTargets: () => void;
  shipyardSystem: StarSystem | null;
  closeShipyard: () => void;
}

export const MapPanels = ({
  focusSystemId,
  viewportWidth,
  viewportHeight,
  onClearFocusTargets,
  shipyardSystem,
  closeShipyard,
}: MapPanelsProps) => {
  const modalWidth = Math.min(840, viewportWidth - 40);
  const modalHeight = Math.min(620, viewportHeight - 80);
  const modalX = Math.max(20, (viewportWidth - modalWidth) / 2);
  const modalY = Math.max(20, (viewportHeight - modalHeight) / 2);
  return (
    <div className="floating-panels">
      {focusSystemId ? (
        <DraggablePanel
          title="Dettagli sistema"
          initialX={Math.max(12, viewportWidth - 340)}
          initialY={100}
          onClose={onClearFocusTargets}
        >
          <SystemPanel
            systemId={focusSystemId}
            onFocusPlanet={() => undefined}
          />
        </DraggablePanel>
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
