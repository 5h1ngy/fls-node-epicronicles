/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from 'react';
import type { PopulationJobId, StarSystem } from '@domain/types';
import { useAppSelector, useGameStore } from '@store/gameStore';
import { DraggablePanel } from '@components/ui/DraggablePanel';
import { useGameLoop } from '../../utils/useGameLoop';
import { DebugConsole } from '../debug/DebugConsole';
import { HudBottomBar } from './HudBottomBar';
import { HudTopBar } from './HudTopBar';
import { MapLayer } from './MapLayer';
import { MapPanels } from './MapPanels';
import { PlanetDetail } from './panels/PlanetDetail';
import { useWarEvents } from './hooks/useWarEvents';
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
  const [debugOpen, setDebugOpen] = useState(false);
  const [focusSystemId, setFocusSystemId] = useState<string | null>(null);
  const [shipyardSystemId, setShipyardSystemId] = useState<string | null>(null);
  const [selectedPlanetId, setSelectedPlanetId] = useState<string | null>(null);
  const [focusPlanetId, setFocusPlanetId] = useState<string | null>(null);
  const [districtMessage, setDistrictMessage] = useState<string | null>(null);
  const [populationMessage, setPopulationMessage] = useState<string | null>(null);
  const [mapMessage, setMapMessage] = useState<string | null>(null);
  const focusedSessionRef = useRef<string | null>(null);
  const warEventsRef = useRef<HTMLDivElement | null>(null);
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
        onToggleDebug={() => setDebugOpen((value) => !value)}
        debugOpen={debugOpen}
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
          warEventsRef={warEventsRef}
          unreadWarIds={unreadWarIds}
          onMarkWarRead={markWarsRead}
          onSelectPlanet={(planetId, systemId) => {
            setFocusSystemId(systemId);
            setSelectedPlanetId(planetId);
            setShipyardSystemId(null);
            setFocusPlanetId(planetId);
          }}
          onFocusSystem={(systemId) => {
            setFocusSystemId(systemId);
            setFocusPlanetId(null);
          }}
          onClearFocusTargets={clearFocusTargets}
          shipyardSystem={shipyardSystem}
          selectedPlanet={
            selectedPlanet
              ? { id: selectedPlanet.id, name: selectedPlanet.name }
              : null
          }
          selectedPlanetSystem={selectedPlanetSystem}
          closeShipyard={closeShipyardPanel}
          closePlanet={closePlanetPanel}
        />
        {debugOpen ? (
          <div className="debug-modal">
            <div className="debug-modal__header">
              <h3>Console debug</h3>
              <button
                className="panel__action panel__action--compact"
                onClick={() => setDebugOpen(false)}
              >
                Chiudi
              </button>
            </div>
            <div className="debug-modal__content">
              <DebugConsole />
            </div>
          </div>
        ) : null}
        {selectedPlanet && selectedPlanetSystem ? (
          <DraggablePanel
            title={`${selectedPlanet.name} (${selectedPlanetSystem.name})`}
            initialX={viewportWidth / 2 - 180}
            initialY={viewportHeight / 2 - 140}
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
