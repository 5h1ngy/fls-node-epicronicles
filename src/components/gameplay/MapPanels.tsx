import { DraggablePanel } from '@components/ui/DraggablePanel';
import { ColonyPanel } from './panels/ColonyPanel';
import { GalaxyOverview } from './panels/GalaxyOverview';
import { EconomyPanel } from './panels/EconomyPanel';
import { DistrictQueuePanel } from './panels/DistrictQueuePanel';
import { SciencePanel } from './panels/SciencePanel';
import { SystemPanel } from './panels/SystemPanel';
import { FleetAndCombatPanel } from './panels/FleetAndCombatPanel';
import { DiplomacyPanel } from './panels/DiplomacyPanel';
import { ShipyardPanel } from './panels/ShipyardPanel';
import type { StarSystem } from '@domain/types';

interface MapPanelsProps {
  focusSystemId: string | null;
  viewportWidth: number;
  viewportHeight: number;
  warEventsRef: React.RefObject<HTMLDivElement>;
  unreadWarIds: Set<string>;
  onMarkWarRead: () => void;
  onSelectPlanet: (planetId: string, systemId: string) => void;
  onFocusSystem: (systemId: string) => void;
  onClearFocusTargets: () => void;
  shipyardSystem: StarSystem | null;
  selectedPlanet: { id: string; name: string } | null;
  selectedPlanetSystem: StarSystem | null;
  closeShipyard: () => void;
  closePlanet: () => void;
}

export const MapPanels = ({
  focusSystemId,
  viewportWidth,
  viewportHeight,
  warEventsRef,
  unreadWarIds,
  onMarkWarRead,
  onSelectPlanet,
  onFocusSystem,
  onClearFocusTargets,
  shipyardSystem,
  selectedPlanet,
  selectedPlanetSystem,
  closeShipyard,
  closePlanet,
}: MapPanelsProps) => (
  <div className="floating-panels">
    <DraggablePanel
      title="Colonie"
      initialX={12}
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
      initialX={12}
      initialY={340}
      initialWidth={360}
      initialHeight={280}
    >
      <GalaxyOverview onFocusSystem={onFocusSystem} />
    </DraggablePanel>
    <DraggablePanel
      title="Bilancio economico"
      initialX={12}
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
      <FleetAndCombatPanel
        warEventsRef={warEventsRef}
        unreadWarIds={unreadWarIds}
        onMarkWarRead={onMarkWarRead}
      />
    </DraggablePanel>
    <DraggablePanel
      title="Diplomazia"
      initialX={Math.max(12, viewportWidth - 640)}
      initialY={360}
      initialWidth={300}
      initialHeight={220}
    >
      <DiplomacyPanel />
    </DraggablePanel>
    {shipyardSystem ? (
      <DraggablePanel
        title={`Cantieri - ${shipyardSystem.name}`}
        initialX={viewportWidth / 2 - 180}
        initialY={viewportHeight / 2 - 200}
        onClose={closeShipyard}
      >
        <ShipyardPanel system={shipyardSystem} />
      </DraggablePanel>
    ) : null}
    {selectedPlanet && selectedPlanetSystem ? (
      <DraggablePanel
        title={`${selectedPlanet.name} (${selectedPlanet.id})`}
        initialX={viewportWidth / 2 - 180}
        initialY={viewportHeight / 2 - 140}
        onClose={closePlanet}
      >
        {/* Planet detail content remains in GameScreen for now */}
      </DraggablePanel>
    ) : null}
  </div>
);
