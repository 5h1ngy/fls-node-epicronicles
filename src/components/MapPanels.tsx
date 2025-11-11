import { DraggablePanel } from '@panels/shared/DraggablePanel';
import { ColonyPanel } from '@panels/ColonyPanel';
import { GalaxyOverview } from '@panels/GalaxyOverview';
import { EconomyPanel } from '@panels/EconomyPanel';
import { DistrictQueuePanel } from '@panels/DistrictQueuePanel';
import { SciencePanel } from '@panels/SciencePanel';
import { SystemPanel } from '@panels/SystemPanel';
import React, { Suspense, lazy } from 'react';
import type { StarSystem } from '@domain/types';

const FleetAndCombatPanel = lazy(() =>
  import('@panels/FleetAndCombatPanel').then((m) => ({
    default: m.FleetAndCombatPanel,
  })),
);
const ShipyardPanel = lazy(() =>
  import('@panels/ShipyardPanel').then((m) => ({
    default: m.ShipyardPanel,
  })),
);
const TechPanel = lazy(() =>
  import('@panels/TechPanel').then((m) => ({ default: m.TechPanel })),
);
const EventPanel = lazy(() =>
  import('@panels/EventPanel').then((m) => ({ default: m.EventPanel })),
);

interface MapPanelsProps {
  focusSystemId: string | null;
  leftOffset: number;
  viewportWidth: number;
  viewportHeight: number;
  warEventsRef: React.RefObject<HTMLUListElement | null>;
  unreadWarIds: Set<string>;
  onMarkWarRead: () => void;
  onSelectPlanet: (planetId: string, systemId: string) => void;
  onFocusSystem: (systemId: string) => void;
  onClearFocusTargets: () => void;
  shipyardSystem: StarSystem | null;
  closeShipyard: () => void;
  setFocusPlanetId: (id: string) => void;
}

export const MapPanels = ({
  focusSystemId,
  leftOffset,
  viewportWidth,
  viewportHeight,
  warEventsRef,
  unreadWarIds,
  onMarkWarRead,
  onSelectPlanet,
  onFocusSystem,
  onClearFocusTargets,
  shipyardSystem,
  closeShipyard,
  setFocusPlanetId,
}: MapPanelsProps) => (
  <div className="floating-panels">
    <DraggablePanel
      title="Colonie"
      initialX={leftOffset}
      initialY={80}
      initialHeight={320}
      initialWidth={320}
    >
      <ColonyPanel
        onSelectPlanet={onSelectPlanet}
        onFocusSystem={onFocusSystem}
      />
    </DraggablePanel>
    <DraggablePanel
      title="Panoramica galassia"
      initialX={leftOffset}
      initialY={340}
      initialWidth={360}
      initialHeight={280}
    >
      <GalaxyOverview onFocusSystem={onFocusSystem} />
    </DraggablePanel>
    <DraggablePanel
      title="Bilancio economico"
      initialX={leftOffset}
      initialY={640}
      initialWidth={320}
      initialHeight={260}
    >
      <EconomyPanel />
    </DraggablePanel>
    <DraggablePanel
      title="Coda distretti"
      initialX={Math.max(12, viewportWidth - 360)}
      initialY={520}
      initialWidth={320}
      initialHeight={260}
    >
      <DistrictQueuePanel />
    </DraggablePanel>
    <DraggablePanel
      title="Navi scientifiche"
      initialX={Math.max(12, viewportWidth - 360)}
      initialY={80}
      initialWidth={320}
      initialHeight={260}
    >
      <SciencePanel onFocusSystem={onFocusSystem} />
    </DraggablePanel>
    {focusSystemId ? (
      <DraggablePanel
        title="Dettagli sistema"
        initialX={Math.max(12, viewportWidth - 340)}
        initialY={100}
        onClose={onClearFocusTargets}
      >
        <SystemPanel
          systemId={focusSystemId}
          onFocusPlanet={(planetId) => setFocusPlanetId(planetId)}
        />
      </DraggablePanel>
    ) : null}
    <DraggablePanel
      title="Flotte & Battaglie"
      initialX={Math.max(12, viewportWidth - 320)}
      initialY={320}
    >
      <Suspense fallback={<p className="text-muted">Caricamento...</p>}>
        <FleetAndCombatPanel
          warEventsRef={warEventsRef}
          unreadWarIds={unreadWarIds}
          onMarkWarRead={onMarkWarRead}
        />
      </Suspense>
    </DraggablePanel>
    <DraggablePanel
      title="Ricerca & Tradizioni"
      initialX={Math.max(12, viewportWidth - 640)}
      initialY={600}
      initialWidth={360}
      initialHeight={320}
    >
      <Suspense fallback={<p className="text-muted">Caricamento...</p>}>
        <TechPanel />
      </Suspense>
    </DraggablePanel>
    <DraggablePanel
      title="Eventi & Anomalie"
      initialX={Math.max(12, viewportWidth - 320)}
      initialY={Math.max(120, viewportHeight - 380)}
      initialWidth={340}
      initialHeight={320}
    >
      <Suspense fallback={<p className="text-muted">Caricamento...</p>}>
        <EventPanel />
      </Suspense>
    </DraggablePanel>
    {shipyardSystem ? (
      <DraggablePanel
        title={`Cantieri - ${shipyardSystem.name}`}
        initialX={viewportWidth / 2 - 180}
        initialY={viewportHeight / 2 - 200}
        onClose={closeShipyard}
      >
        <Suspense fallback={<p className="text-muted">Caricamento...</p>}>
          <ShipyardPanel system={shipyardSystem} />
        </Suspense>
      </DraggablePanel>
    ) : null}
  </div>
);
