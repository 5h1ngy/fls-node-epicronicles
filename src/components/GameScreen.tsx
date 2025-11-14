/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from 'react';
import type { PopulationJobId, StarSystem } from '@domain/types';
import { useAppSelector, useGameStore } from '@store/gameStore';
import { DraggablePanel } from '@panels/shared/DraggablePanel';
import { useGameLoop } from '@shared/useGameLoop';
import { DebugConsole } from './DebugConsole';
import { HudBottomBar } from './HudBottomBar';
import { HudTopBar } from './HudTopBar';
import { MapLayer } from './MapLayer';
import { MapPanels } from './MapPanels';
import { PlanetDetail } from '@panels/PlanetDetail';
import { useWarEvents } from '@hooks/useWarEvents';
import { MissionsPanel } from '@panels/MissionsPanel';
import { SideDock } from './SideDock';
import { DiplomacyPanel } from '@panels/DiplomacyPanel';
import { EconomyPanel } from '@panels/EconomyPanel';
import { EventPanel } from '@panels/EventPanel';
import { TechPanel } from '@panels/TechPanel';
import { GalaxyOverview } from '@panels/GalaxyOverview';
import { ColonizationPanel } from '@panels/ColonizationPanel';
import { BattlesPanel } from '@panels/BattlesPanel';
import { LogPanel } from '@panels/LogPanel';
import { SideEntityDock } from './SideEntityDock';
import { FleetList } from '@panels/fleet/FleetList';
import { selectScienceShips } from '@store/selectors';
import {
  selectColonizedSystems,
  selectDistrictQueue,
  selectPlanets,
  selectSystems,
} from '@store/selectors';

export const GameScreen = () => {
  useGameLoop();
  const session = useGameStore((state) => state.session);
  const sessionId = session?.id;
  const returnToMenu = useGameStore((state) => state.returnToMenu);
  const setSimulationRunning = useGameStore(
    (state) => state.setSimulationRunning,
  );
  const systems = useAppSelector(selectSystems);
  const planets = useAppSelector(selectPlanets);
  const colonizedSystems = useAppSelector(selectColonizedSystems);
  const districtQueue = useAppSelector(selectDistrictQueue);
  const scienceShips = useAppSelector(selectScienceShips);
  const economyConfig = useGameStore((state) => state.config.economy);
  const districtDefinitions = economyConfig.districts;
  const populationJobs = economyConfig.populationJobs;
  const automationConfig = economyConfig.populationAutomation;
  const queueDistrictConstruction = useGameStore(
    (state) => state.queueDistrictConstruction,
  );
  const promotePopulationJob = useGameStore(
    (state) => state.promotePopulation,
  );
  const demotePopulationJob = useGameStore(
    (state) => state.demotePopulation,
  );
  const [focusSystemId, setFocusSystemId] = useState<string | null>(null);
  const [shipyardSystemId, setShipyardSystemId] = useState<string | null>(null);
  const [selectedPlanetId, setSelectedPlanetId] = useState<string | null>(null);
  const [focusPlanetId, setFocusPlanetId] = useState<string | null>(null);
  const [districtMessage, setDistrictMessage] = useState<string | null>(null);
  const [populationMessage, setPopulationMessage] = useState<string | null>(null);
  const [mapMessage, setMapMessage] = useState<string | null>(null);
  const [missionsOpen, setMissionsOpen] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(false);
  const [diplomacyOpen, setDiplomacyOpen] = useState(false);
  const [economyOpen, setEconomyOpen] = useState(false);
  const [researchOpen, setResearchOpen] = useState(false);
  const [galaxyOpen, setGalaxyOpen] = useState(false);
  const [colonizationOpen, setColonizationOpen] = useState(false);
  const [battlesOpen, setBattlesOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [debugModalOpen, setDebugModalOpen] = useState(false);
  const [dockSelection, setDockSelection] = useState<
    | { kind: 'colony'; planetId: string; systemId: string }
    | { kind: 'fleet'; fleetId: string; systemId: string }
    | { kind: 'science'; shipId: string; systemId: string }
    | null
  >(null);
  const orderFleetMove = useGameStore((state) => state.orderFleetMove);
  const mergeFleets = useGameStore((state) => state.mergeFleets);
  const splitFleet = useGameStore((state) => state.splitFleet);
  const shipDesigns = useGameStore((state) => state.config.military.shipDesigns);
  const focusedSessionRef = useRef<string | null>(null);
  const warEventsRef = useRef<HTMLUListElement | null>(null);
  const {
    warUnread,
    unreadWarIds,
    markWarsRead,
  } = useWarEvents(session ?? null);

  const clearFocusTargets = () => {
    setFocusSystemId(null);
    setShipyardSystemId(null);
    setSelectedPlanetId(null);
    setFocusPlanetId(null);
    setMapMessage(null);
  };

  const closeShipyardPanel = () => {
    setShipyardSystemId(null);
    setFocusSystemId(null);
    setFocusPlanetId(null);
  };

  const closePlanetPanel = () => {
    setSelectedPlanetId(null);
    setFocusSystemId(null);
    setFocusPlanetId(null);
  };

  useEffect(() => {
    if (!sessionId) {
      return;
    }
    setSimulationRunning(true, Date.now());
  }, [sessionId, setSimulationRunning]);

  useEffect(() => {
    const handleVisibility = () => {
      setSimulationRunning(!document.hidden, Date.now());
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [setSimulationRunning]);

  useEffect(() => {
    if (!session) {
      focusedSessionRef.current = null;
      return;
    }
    if (focusedSessionRef.current === session.id) {
      return;
    }
    const homeSystemId =
      session.economy.planets[0]?.systemId ??
      session.galaxy.systems[0]?.id ??
      null;
    if (homeSystemId) {
      setFocusSystemId(homeSystemId);
      setFocusPlanetId(null);
    }
    focusedSessionRef.current = session.id;
  }, [session, setFocusPlanetId, setFocusSystemId]);

  const viewportWidth =
    typeof window !== 'undefined' ? window.innerWidth : 1200;
  const viewportHeight =
    typeof window !== 'undefined' ? window.innerHeight : 800;

  const sizeFor = (w: number, h: number) => {
    const width = Math.min(w, viewportWidth - 40);
    const height = Math.min(h, viewportHeight - 80);
    const initialX = Math.max(20, (viewportWidth - width) / 2);
    const initialY = Math.max(20, (viewportHeight - height) / 2);
    return { width, height, initialX, initialY };
  };

  const large = sizeFor(1000, 700);
  const medium = sizeFor(840, 620);
  if (!session) {
    return (
      <div className="game-layout">
        <HudTopBar />
        <div className="floating-panels">
          <p className="text-muted">Nessuna sessione attiva.</p>
          <button className="panel__action" onClick={returnToMenu}>
            Torna al menu
          </button>
        </div>
      </div>
    );
  }
  const shipyardSystem: StarSystem | null = shipyardSystemId
    ? systems.find((system) => system.id === shipyardSystemId) ?? null
    : null;
  const selectedPlanet =
    planets.find((planet) => planet.id === selectedPlanetId) ?? null;
  const selectedPlanetSystem = selectedPlanet
    ? systems.find((system) => system.id === selectedPlanet.systemId) ?? null
    : null;
  const selectedFleet =
    dockSelection?.kind === 'fleet'
      ? session.fleets.find((fleet) => fleet.id === dockSelection.fleetId) ?? null
      : null;
  const selectedScienceShip =
    dockSelection?.kind === 'science'
      ? session.scienceShips.find((ship) => ship.id === dockSelection.shipId) ?? null
      : null;
  const planetDistrictQueue = selectedPlanet
    ? districtQueue
        .filter((task) => task.planetId === selectedPlanet.id)
        .map((task) => {
          const definition =
            districtDefinitions.find(
              (entry) => entry.id === task.districtId,
            ) ?? null;
          return {
            ...task,
            label: definition?.label ?? task.districtId,
            progress:
              1 - task.ticksRemaining / Math.max(1, task.totalTicks),
          };
        })
    : [];
  const districtErrorMessages: Record<string, string> = {
    NO_SESSION: 'Nessuna sessione attiva.',
    PLANET_NOT_FOUND: 'Pianeta non trovato.',
    INVALID_DISTRICT: 'Distretto non valido.',
    INSUFFICIENT_RESOURCES: 'Risorse insufficienti.',
  };
  const populationErrorMessages: Record<string, string> = {
    NO_SESSION: 'Nessuna sessione attiva.',
    PLANET_NOT_FOUND: 'Pianeta non trovato.',
    INVALID_JOB: 'Ruolo non valido.',
    NO_WORKERS: 'Nessun lavoratore disponibile.',
    NO_POPULATION: 'Nessun pop assegnato al ruolo.',
  };

  const handleQueueDistrict = (districtId: string) => {
    if (!selectedPlanet) {
      return;
    }
    const result = queueDistrictConstruction(selectedPlanet.id, districtId);
    setDistrictMessage(
      result.success
        ? 'Costruzione distretto avviata.'
        : districtErrorMessages[result.reason],
    );
  };

  const handlePromotePopulation = (jobId: PopulationJobId) => {
    if (!selectedPlanet) {
      return;
    }
    const result = promotePopulationJob(selectedPlanet.id, jobId);
    setPopulationMessage(
      result.success
        ? 'Pop assegnato al nuovo ruolo.'
        : populationErrorMessages[result.reason],
    );
  };

  const handleDemotePopulation = (jobId: PopulationJobId) => {
    if (!selectedPlanet) {
      return;
    }
    const result = demotePopulationJob(selectedPlanet.id, jobId);
    setPopulationMessage(
      result.success
        ? 'Pop riportato tra i lavoratori.'
        : populationErrorMessages[result.reason],
    );
  };

  return (
    <div className="game-layout">
      <HudTopBar />
      <SideDock
        onOpenMissions={() => setMissionsOpen(true)}
        onOpenEvents={() => setEventsOpen(true)}
        onOpenDiplomacy={() => setDiplomacyOpen(true)}
        onOpenEconomy={() => setEconomyOpen(true)}
        onOpenResearch={() => setResearchOpen(true)}
        onOpenGalaxy={() => setGalaxyOpen(true)}
        onOpenColonization={() => setColonizationOpen(true)}
        onOpenBattles={() => setBattlesOpen(true)}
        onOpenLog={() => setLogOpen(true)}
      />
      <div className="side-entity-stack">
        <SideEntityDock
          variant="colonies"
          onCenter={(systemId, planetId) => {
            setFocusSystemId(systemId);
            setFocusPlanetId(planetId ?? null);
            setDockSelection(null);
            setSelectedPlanetId(planetId ?? null);
          }}
          onSelect={(selection) => {
            if (selection.kind === 'colony') {
              setSelectedPlanetId(selection.planetId);
              setFocusSystemId(selection.systemId);
              setFocusPlanetId(selection.planetId);
              setDockSelection(null);
            }
          }}
        />
        <SideEntityDock
          variant="fleets"
          onCenter={(systemId) => {
            setFocusSystemId(systemId);
            setDockSelection(null);
          }}
          onSelect={(selection) => {
            setDockSelection(selection);
            setFocusSystemId(selection.systemId);
            setFocusPlanetId(null);
          }}
        />
        <SideEntityDock
          variant="science"
          onCenter={(systemId) => {
            setFocusSystemId(systemId);
            setDockSelection(null);
          }}
          onSelect={(selection) => {
            setDockSelection(selection);
            setFocusSystemId(selection.systemId);
            setFocusPlanetId(null);
          }}
        />
      </div>
      <MapLayer
        focusSystemId={focusSystemId}
        focusPlanetId={focusPlanetId}
        mapMessage={mapMessage}
        onSelectSystem={(systemId) => {
          const targetSystem = systems.find(
            (entry) => entry.id === systemId,
          );
          if (!targetSystem) {
            return;
          }
          const isAccessible =
            targetSystem.visibility === 'surveyed' ||
            colonizedSystems.has(targetSystem.id);
          setShipyardSystemId(isAccessible ? systemId : null);
          setSelectedPlanetId(null);
          setFocusSystemId(systemId);
          setFocusPlanetId(null);
          setMapMessage(
            isAccessible
              ? null
              : 'Sistema non sondato: esplora con una nave scientifica per ottenere i dettagli.',
          );
        }}
        onClearFocus={clearFocusTargets}
      />
      <HudBottomBar
        onToggleDebug={() => setDebugModalOpen(true)}
        debugOpen={debugModalOpen}
        onShowWars={() => {
          const target = warEventsRef.current;
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          markWarsRead();
        }}
        warUnread={warUnread}
      />
      <div className="floating-panels">
        <MapPanels
          focusSystemId={focusSystemId}
          viewportWidth={viewportWidth}
          viewportHeight={viewportHeight}
        onClearFocusTargets={clearFocusTargets}
        shipyardSystem={shipyardSystem}
        closeShipyard={closeShipyardPanel}
      />
        {missionsOpen ? (
          <DraggablePanel
            title="Missioni in corso"
            initialX={large.initialX}
            initialY={large.initialY}
            initialWidth={large.width}
            initialHeight={large.height}
            onClose={() => setMissionsOpen(false)}
          >
            <MissionsPanel />
          </DraggablePanel>
        ) : null}
        {eventsOpen ? (
          <DraggablePanel
            title="Eventi & Anomalie"
            initialX={large.initialX}
            initialY={large.initialY}
            initialWidth={large.width}
            initialHeight={large.height}
            onClose={() => setEventsOpen(false)}
          >
            <EventPanel />
          </DraggablePanel>
        ) : null}
        {diplomacyOpen ? (
          <DraggablePanel
            title="Diplomazia"
            initialX={large.initialX}
            initialY={large.initialY}
            initialWidth={large.width}
            initialHeight={large.height}
            onClose={() => setDiplomacyOpen(false)}
          >
            <DiplomacyPanel />
          </DraggablePanel>
        ) : null}
        {economyOpen ? (
          <DraggablePanel
            title="Bilancio economico"
            initialX={large.initialX}
            initialY={large.initialY}
            initialWidth={large.width}
            initialHeight={large.height}
            onClose={() => setEconomyOpen(false)}
          >
            <EconomyPanel />
          </DraggablePanel>
        ) : null}
        {researchOpen ? (
          <DraggablePanel
            title="Ricerca & Tradizioni"
            initialX={large.initialX}
            initialY={large.initialY}
            initialWidth={large.width}
            initialHeight={large.height}
            onClose={() => setResearchOpen(false)}
          >
            <TechPanel />
          </DraggablePanel>
        ) : null}
        {galaxyOpen ? (
          <DraggablePanel
            title="Panoramica galassia"
            initialX={large.initialX}
            initialY={large.initialY}
            initialWidth={large.width}
            initialHeight={large.height}
            onClose={() => setGalaxyOpen(false)}
          >
            <GalaxyOverview
              onFocusSystem={(systemId) => {
                setGalaxyOpen(false);
                setFocusSystemId(systemId);
                setFocusPlanetId(null);
              }}
            />
          </DraggablePanel>
        ) : null}
        {colonizationOpen ? (
          <DraggablePanel
            title="Colonizzazione"
            initialX={large.initialX}
            initialY={large.initialY}
            initialWidth={large.width}
            initialHeight={large.height}
            onClose={() => setColonizationOpen(false)}
          >
            <ColonizationPanel
              onFocusSystem={(systemId) => {
                setColonizationOpen(false);
                setFocusSystemId(systemId);
                setFocusPlanetId(null);
              }}
            />
          </DraggablePanel>
        ) : null}
        {battlesOpen ? (
          <DraggablePanel
            title="Flotte & Battaglie"
            initialX={large.initialX}
            initialY={large.initialY}
            initialWidth={large.width}
            initialHeight={large.height}
            onClose={() => setBattlesOpen(false)}
          >
            <BattlesPanel
              warEventsRef={warEventsRef}
              unreadWarIds={unreadWarIds}
              onMarkWarRead={markWarsRead}
            />
          </DraggablePanel>
        ) : null}
        {logOpen ? (
          <DraggablePanel
            title="Log eventi"
            initialX={large.initialX}
            initialY={large.initialY}
            initialWidth={large.width}
            initialHeight={large.height}
            onClose={() => setLogOpen(false)}
          >
            <LogPanel />
          </DraggablePanel>
        ) : null}
        {dockSelection && dockSelection.kind === 'fleet' ? (
          <div className="dock-detail-modal">
            <div className="dock-detail__header">
              <h4>Dettagli flotta</h4>
              <button className="dock-detail__close" onClick={() => setDockSelection(null)}>
                X
              </button>
            </div>
            <div className="dock-detail__content">
              {selectedFleet ? (
                <FleetList
                  fleets={[selectedFleet]}
                  systems={systems}
                  scienceShips={scienceShips}
                  designs={shipDesigns}
                  onOrder={(fleetId, systemId) => orderFleetMove(fleetId, systemId)}
                  onMerge={(sourceId, targetId) => mergeFleets(sourceId, targetId)}
                  onSplit={(fleetId) => splitFleet(fleetId)}
                />
              ) : (
                <p className="text-muted">Flotta non trovata.</p>
              )}
            </div>
          </div>
        ) : null}
        {dockSelection && dockSelection.kind === 'science' ? (
          <div className="dock-detail-modal">
            <div className="dock-detail__header">
              <h4>Dettagli nave scientifica</h4>
              <button className="dock-detail__close" onClick={() => setDockSelection(null)}>
                X
              </button>
            </div>
            <div className="dock-detail__content">
              {selectedScienceShip ? (
                <>
                  <p className="text-muted">Nave: {selectedScienceShip.name ?? selectedScienceShip.id}</p>
                  <p className="text-muted">Sistema: {selectedScienceShip.currentSystemId}</p>
                  <p className="text-muted">Stato: {selectedScienceShip.status}</p>
                  <p className="text-muted">
                    Destinazione: {selectedScienceShip.targetSystemId ?? 'Nessuna'}
                  </p>
                </>
              ) : (
                <p className="text-muted">Nave non trovata.</p>
              )}
            </div>
          </div>
        ) : null}
        {debugModalOpen ? (
          <DraggablePanel
            title="Console debug"
            initialX={large.initialX}
            initialY={large.initialY}
            initialWidth={large.width}
            initialHeight={large.height}
            onClose={() => setDebugModalOpen(false)}
          >
            <DebugConsole />
          </DraggablePanel>
        ) : null}
        {selectedPlanet && selectedPlanetSystem ? (
          <DraggablePanel
            title={`${selectedPlanet.name} (${selectedPlanetSystem.name})`}
            initialX={medium.initialX}
            initialY={medium.initialY}
            initialWidth={medium.width}
            initialHeight={medium.height}
            onClose={closePlanetPanel}
          >
            <PlanetDetail
              planet={selectedPlanet}
              systemName={selectedPlanetSystem.name}
              onPromote={handlePromotePopulation}
              onDemote={handleDemotePopulation}
              automationConfig={automationConfig}
              populationJobs={populationJobs}
              districtDefinitions={districtDefinitions}
              planetDistrictQueue={planetDistrictQueue}
              districtMessage={districtMessage}
              populationMessage={populationMessage}
              onQueueDistrict={handleQueueDistrict}
            />
          </DraggablePanel>
        ) : null}
      </div>
    </div>
  );
};
