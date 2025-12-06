/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { OrbitingPlanet, Planet, StarSystem } from '@domain/types';
import { canAffordCost } from '@domain/economy/economy';
import { useAppSelector, useGameStore } from '@store/gameStore';
import { DraggablePanel } from '@windows/common/DraggablePanel';
import { useGameLoop } from '@shared/useGameLoop';
import { DebugConsoleWindow } from '@windows/DebugConsoleWindow';
import { BottomBar } from '@hud/BottomBar';
import { TopBar } from '@hud/TopBar';
import { MapLayer } from './MapLayer';
import { MapPanels } from './MapPanels';
import { useWarEvents } from '@hooks/useWarEvents';
import { MissionsWindow } from '@windows/MissionsWindow';
import { MainDock } from '@docks/MainDock';
import { DiplomacyWindow } from '@windows/DiplomacyWindow';
import { EconomyWindow } from '@windows/EconomyWindow';
import { EventWindow } from '@windows/EventWindow';
import { TechWindow } from '@windows/TechWindow';
import { GalaxyOverviewWindow } from '@windows/GalaxyOverviewWindow';
import { ColonizationWindow } from '@windows/ColonizationWindow';
import { BattlesWindow } from '@windows/BattlesWindow';
import { PlanetDetailWindow } from '@windows/PlanetDetailWindow';
import { LogWindow } from '@windows/LogWindow';
import { EntityDock } from '@docks/EntityDock';
import { FleetDetailWindow } from '@windows/FleetDetailWindow';
import { ConstructionDetailWindow } from '@windows/ConstructionDetailWindow';
import { ScienceShipDetailWindow } from '@windows/ScienceShipDetailWindow';
import { selectScienceShips, selectResearch } from '@store/selectors';
import {
  selectColonizedSystems,
  selectPlanets,
  selectSystems,
} from '@store/selectors';
import './GameScreen.scss';

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
  const scienceShips = useAppSelector(selectScienceShips);
  const researchState = useAppSelector(selectResearch);
  const completedTechs = useMemo(
    () =>
      researchState
        ? Object.values(researchState.branches).flatMap((b) => b.completed)
        : [],
    [researchState],
  );
  const colonizationUnlocked = useMemo(() => {
    if (!researchState) {
      return false;
    }
    return Object.values(researchState.branches).some((branch) =>
      branch.completed.includes('colony-foundations'),
    );
  }, [researchState]);
  const [focusSystemId, setFocusSystemId] = useState<string | null>(null);
  const [focusTrigger, setFocusTrigger] = useState(0);
  const [shipyardSystemId, setShipyardSystemId] = useState<string | null>(null);
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  const [selectedPlanetId, setSelectedPlanetId] = useState<string | null>(null);
  const [planetDetailId, setPlanetDetailWindowId] = useState<string | null>(null);
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
    | {
        kind: 'fleet';
        fleetId: string;
        systemId: string;
        source?: 'fleet' | 'colonization' | 'construction';
      }
    | { kind: 'science'; shipId: string; systemId: string }
    | null
  >(null);
  const orderFleetMove = useGameStore((state) => state.orderFleetMove);
  const setFleetPosition = useGameStore((state) => state.setFleetPosition);
  const mergeFleets = useGameStore((state) => state.mergeFleets);
  const splitFleet = useGameStore((state) => state.splitFleet);
  const stopFleet = useGameStore((state) => state.stopFleet);
  const buildShipyard = useGameStore((state) => state.buildShipyard);
  const shipDesigns = useGameStore((state) => state.config.military.shipDesigns);
  const orderScienceShip = useGameStore((state) => state.orderScienceShip);
  const setScienceShipPosition = useGameStore(
    (state) => state.setScienceShipPosition,
  );
  const setScienceAutoExplore = useGameStore((state) => state.setScienceAutoExplore);
  const stopScienceShip = useGameStore((state) => state.stopScienceShip);
  const queueDistrictConstruction = useGameStore(
    (state) => state.queueDistrictConstruction,
  );
  const removeDistrict = useGameStore((state) => state.removeDistrict);
  const promotePopulation = useGameStore((state) => state.promotePopulation);
  const demotePopulation = useGameStore((state) => state.demotePopulation);
  const economyConfig = useGameStore((state) => state.config.economy);
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
    setSelectedSystemId(null);
    setSelectedPlanetId(null);
    setPlanetDetailWindowId(null);
    setMapMessage(null);
  };

  const closeShipyardPanel = () => {
    setShipyardSystemId(null);
    setFocusSystemId(null);
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
      setSelectedSystemId(null);
      setSelectedPlanetId(null);
      setMapMessage(null);
    }
    focusedSessionRef.current = session.id;
  }, [session, setFocusSystemId]);

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

  if (!session) {
    return (
      <div className="game-layout">
        <TopBar />
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
  const focusedSystem: StarSystem | null = selectedSystemId
    ? systems.find((system) => system.id === selectedSystemId) ?? null
    : null;
  const focusedPlanet: Planet | null = selectedPlanetId
    ? planets.find((planet) => planet.id === selectedPlanetId) ?? null
    : null;
  const focusedOrbitingPlanet: OrbitingPlanet | null =
    selectedPlanetId && focusSystemId
      ? systems
          .find((system) => system.id === focusSystemId)
          ?.orbitingPlanets.find((planet) => planet.id === selectedPlanetId) ?? null
      : null;
  const focusedPlanetSystem: StarSystem | null =
    focusedPlanet
      ? systems.find((system) => system.id === focusedPlanet.systemId) ?? null
      : focusSystemId
        ? systems.find((system) => system.id === focusSystemId) ?? null
        : null;
  const selectedFleet =
    dockSelection?.kind === 'fleet'
      ? session.fleets.find((fleet) => fleet.id === dockSelection.fleetId) ?? null
      : null;
  const isConstructionSelection =
    dockSelection?.kind === 'fleet' && dockSelection.source === 'construction';
  const selectedScienceShip =
    dockSelection?.kind === 'science'
      ? session.scienceShips.find((ship) => ship.id === dockSelection.shipId) ?? null
      : null;
  const planetDetail =
    planetDetailId && session
      ? session.economy.planets.find((planet) => planet.id === planetDetailId) ?? null
      : null;

  return (
    <div className="game-layout">
      <TopBar />
      <MainDock
        onOpenMissions={() => setMissionsOpen(true)}
        onOpenEvents={() => setEventsOpen(true)}
        onOpenDiplomacy={() => setDiplomacyOpen(true)}
        onOpenEconomy={() => setEconomyOpen(true)}
        onOpenResearch={() => setResearchOpen(true)}
        onOpenGalaxy={() => setGalaxyOpen(true)}
        onOpenColonization={() => setColonizationOpen(true)}
        onOpenBattles={() => setBattlesOpen(true)}
        onOpenLog={() => setLogOpen(true)}
        showColonization={colonizationUnlocked}
      />
      <div className="side-entity-stack">
        <EntityDock
          variant="colonies"
          onCenter={(systemId, _planetId) => {
            void _planetId;
            setFocusSystemId(systemId);
            setFocusTrigger((value) => value + 1);
            setSelectedSystemId(null);
            setSelectedPlanetId(null);
            setDockSelection(null);
          }}
          onSelect={(selection) => {
            if (selection.kind === 'colony') {
              setSelectedPlanetId(null);
              setPlanetDetailWindowId(selection.planetId);
              setDockSelection(null);
            }
          }}
        />
        <EntityDock
          variant="fleets"
          onCenter={(systemId) => {
            setFocusSystemId(systemId);
            setFocusTrigger((value) => value + 1);
            setSelectedSystemId(null);
            setSelectedPlanetId(null);
            setDockSelection(null);
          }}
          onSelect={(selection) => {
            setDockSelection(selection);
          }}
        />
        <EntityDock
          variant="colonization"
          onCenter={(systemId) => {
            setFocusSystemId(systemId);
            setFocusTrigger((value) => value + 1);
            setSelectedSystemId(null);
            setSelectedPlanetId(null);
            setDockSelection(null);
          }}
          onSelect={(selection) => {
            setDockSelection(selection);
          }}
        />
        <EntityDock
          variant="construction"
          onCenter={(systemId) => {
            setFocusSystemId(systemId);
            setFocusTrigger((value) => value + 1);
            setSelectedSystemId(null);
            setSelectedPlanetId(null);
            setDockSelection(null);
          }}
          onSelect={(selection) => {
            setDockSelection(selection);
          }}
        />
        <EntityDock
          variant="science"
          onCenter={(systemId) => {
            setFocusSystemId(systemId);
            setFocusTrigger((value) => value + 1);
            setSelectedSystemId(null);
            setSelectedPlanetId(null);
            setDockSelection(null);
          }}
          onSelect={(selection) => {
            setDockSelection(selection);
          }}
        />
      </div>
      <MapLayer
        focusSystemId={focusSystemId}
        focusTrigger={focusTrigger}
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
          setSelectedPlanetId(null);
          setSelectedSystemId(isAccessible ? systemId : null);
          setFocusSystemId(systemId);
          setMapMessage(
            isAccessible
              ? null
              : 'Sistema non sondato: esplora con una nave scientifica per ottenere i dettagli.',
          );
        }}
        onClearFocus={clearFocusTargets}
        onSelectShipyard={(systemId) => {
          const targetSystem = systems.find((entry) => entry.id === systemId);
          if (!targetSystem) return;
          const isAccessible =
            targetSystem.visibility === 'surveyed' ||
            colonizedSystems.has(targetSystem.id);
          const hasShipyardStructure =
            targetSystem.hasShipyard || Boolean(targetSystem.shipyardBuild);
          setShipyardSystemId(isAccessible && hasShipyardStructure ? systemId : null);
          setSelectedSystemId(null);
          setSelectedPlanetId(null);
          setFocusSystemId(systemId);
        }}
      />
      <BottomBar
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
          focusedSystem={focusedSystem}
          focusedPlanet={focusedPlanet}
          focusedOrbitingPlanet={focusedOrbitingPlanet}
          focusedPlanetSystem={focusedPlanetSystem ?? null}
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
            <MissionsWindow />
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
            <EventWindow />
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
            <DiplomacyWindow />
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
            <EconomyWindow />
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
            <TechWindow />
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
            <GalaxyOverviewWindow
              onFocusSystem={(systemId) => {
                setGalaxyOpen(false);
                setFocusSystemId(systemId);
                setSelectedSystemId(null);
                setSelectedPlanetId(null);
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
            <ColonizationWindow
              onFocusSystem={(systemId) => {
                setColonizationOpen(false);
                setFocusSystemId(systemId);
                setSelectedSystemId(null);
                setSelectedPlanetId(null);
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
            <BattlesWindow
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
            <LogWindow />
          </DraggablePanel>
        ) : null}
        {planetDetail ? (
          <DraggablePanel
            title={`Gestione - ${planetDetail.name}`}
            initialX={large.initialX}
            initialY={large.initialY}
            initialWidth={large.width}
            initialHeight={large.height}
            onClose={() => setPlanetDetailWindowId(null)}
          >
            <PlanetDetailWindow
              planet={planetDetail}
              systemName={
                systems.find((system) => system.id === planetDetail.systemId)?.name ??
                planetDetail.systemId
              }
              onPromote={(jobId) => promotePopulation(planetDetail.id, jobId)}
              onDemote={(jobId) => demotePopulation(planetDetail.id, jobId)}
              automationConfig={economyConfig.populationAutomation}
              populationJobs={economyConfig.populationJobs}
              districtDefinitions={economyConfig.districts}
              canAffordDistricts={Object.fromEntries(
                economyConfig.districts.map((definition) => [
                  definition.id,
                  canAffordCost(session.economy, definition.cost),
                ]),
              )}
              planetDistrictQueue={session.districtConstructionQueue
                .filter((task) => task.planetId === planetDetail.id)
                .map((task) => {
                  const definition = economyConfig.districts.find(
                    (entry) => entry.id === task.districtId,
                  );
                  return {
                    ...task,
                    label: definition?.label ?? task.districtId,
                    progress: 1 - task.ticksRemaining / Math.max(1, task.totalTicks),
                  };
                })}
              populationMessage={null}
              onQueueDistrict={(districtId) =>
                queueDistrictConstruction(planetDetail.id, districtId)
              }
              onRemoveDistrict={(districtId) => removeDistrict(planetDetail.id, districtId)}
            />
          </DraggablePanel>
        ) : null}
        {dockSelection && dockSelection.kind === 'fleet' ? (
          isConstructionSelection ? (
            <DraggablePanel
              title="Nave costruttrice"
              initialX={large.initialX}
              initialY={large.initialY}
              initialWidth={large.width}
              initialHeight={large.height}
              onClose={() => setDockSelection(null)}
            >
              {selectedFleet ? (
                <ConstructionDetailWindow
                  fleet={selectedFleet}
                  systems={systems}
                  designs={shipDesigns}
                  completedTechs={completedTechs}
                  onOrder={(fleetId, systemId) => orderFleetMove(fleetId, systemId)}
                  onAnchorChange={(fleetId, planetId) => setFleetPosition(fleetId, planetId)}
                  onBuildShipyard={(systemId, anchorPlanetId) =>
                    buildShipyard(systemId, anchorPlanetId)
                  }
                  onCenter={(systemId) => {
                    setFocusSystemId(systemId);
                    setSelectedSystemId(null);
                    setSelectedPlanetId(null);
                    setFocusTrigger((value) => value + 1);
                  }}
                  onStop={(fleetId) => stopFleet(fleetId)}
                />
              ) : (
                <div className="dock-detail__content">
                  <p className="text-muted">Flotta non trovata.</p>
                </div>
              )}
            </DraggablePanel>
          ) : (
            <div className="dock-detail-modal">
              {selectedFleet ? (
                <FleetDetailWindow
                  fleet={selectedFleet}
                  fleets={session.fleets}
                  systems={systems}
                  scienceShips={scienceShips}
                  designs={shipDesigns}
                  completedTechs={completedTechs}
                  onOrder={(fleetId, systemId) => orderFleetMove(fleetId, systemId)}
                  onAnchorChange={(fleetId, planetId) =>
                    setFleetPosition(fleetId, planetId)
                  }
                  onCenter={(systemId) => {
                    setFocusSystemId(systemId);
                    setSelectedSystemId(null);
                    setSelectedPlanetId(null);
                    setFocusTrigger((value) => value + 1);
                  }}
                  onStop={(fleetId) => stopFleet(fleetId)}
                  onMerge={(sourceId, targetId) => mergeFleets(sourceId, targetId)}
                  onSplit={(fleetId) => splitFleet(fleetId)}
                  showConstructionActions={dockSelection?.source === 'construction'}
                  onBuildShipyard={(systemId, anchorPlanetId) => {
                    return buildShipyard(systemId, anchorPlanetId);
                  }}
                  onClose={() => setDockSelection(null)}
                />
              ) : (
                <div className="dock-detail__content">
                  <p className="text-muted">Flotta non trovata.</p>
                </div>
              )}
            </div>
          )
        ) : null}
        {dockSelection && dockSelection.kind === 'science' ? (
          <div className="dock-detail-modal">
            {selectedScienceShip ? (
              <ScienceShipDetailWindow
                ship={selectedScienceShip}
                systems={systems}
                onOrder={(systemId) => orderScienceShip(selectedScienceShip.id, systemId)}
                onAnchorChange={(planetId) =>
                  setScienceShipPosition(selectedScienceShip.id, planetId)
                }
                onToggleAuto={(auto) => setScienceAutoExplore(selectedScienceShip.id, auto)}
                onStop={() => stopScienceShip(selectedScienceShip.id)}
                onCenter={(systemId) => {
                  setFocusSystemId(systemId);
                  setSelectedSystemId(null);
                  setSelectedPlanetId(null);
                  setFocusTrigger((value) => value + 1);
                }}
                onClose={() => setDockSelection(null)}
              />
            ) : (
              <div className="dock-detail__content">
                <p className="text-muted">Nave non trovata.</p>
              </div>
            )}
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
            <DebugConsoleWindow />
          </DraggablePanel>
        ) : null}
      </div>
    </div>
  );
};
