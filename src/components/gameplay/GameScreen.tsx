import { useEffect, useMemo, useRef, useState } from 'react';
import { useGameStore } from '@store/gameStore';
import { DebugConsole } from '../debug/DebugConsole';
import { useGameLoop } from '../../utils/useGameLoop';
import { MapLayer } from './MapLayer';
import { HudTopBar } from './HudTopBar';
import { HudBottomBar } from './HudBottomBar';
import type { StarSystem, PopulationJobId } from '@domain/types';
import { MapPanels } from './MapPanels';
import { PlanetDetail } from './PlanetDetail';

const WAR_SEEN_KEY = 'warSeen';

const loadWarSeen = (sessionId: string): string | null => {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  try {
    const raw = localStorage.getItem(WAR_SEEN_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed[sessionId] ?? null;
  } catch {
    return null;
  }
};

const saveWarSeen = (sessionId: string, eventId: string | null) => {
  if (typeof localStorage === 'undefined') {
    return;
  }
  try {
    const raw = localStorage.getItem(WAR_SEEN_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    if (eventId) {
      parsed[sessionId] = eventId;
    } else {
      delete parsed[sessionId];
    }
    localStorage.setItem(WAR_SEEN_KEY, JSON.stringify(parsed));
  } catch {
    /* ignore */
  }
};

export const GameScreen = () => {
  useGameLoop();
  const session = useGameStore((state) => state.session);
  const sessionId = session?.id;
  const returnToMenu = useGameStore((state) => state.returnToMenu);
  const setSimulationRunning = useGameStore(
    (state) => state.setSimulationRunning,
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
  const [warUnread, setWarUnread] = useState(0);
  const [lastSeenWarId, setLastSeenWarId] = useState<string | null>(null);
  const unreadWarIds = useMemo(() => {
    if (!session) {
      return new Set<string>();
    }
    if (!lastSeenWarId) {
      return new Set(session.warEvents.map((event) => event.id));
    }
    const markerIndex = session.warEvents.findIndex(
      (event) => event.id === lastSeenWarId,
    );
    const slice =
      markerIndex >= 0
        ? session.warEvents.slice(markerIndex + 1)
        : session.warEvents;
    return new Set(slice.map((event) => event.id));
  }, [session, lastSeenWarId]);

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

  useEffect(() => {
    if (!session) {
      setWarUnread(0);
      setLastSeenWarId(null);
      return;
    }
    const storedSeen = loadWarSeen(session.id);
    setLastSeenWarId(storedSeen);
    if (session.warEvents.length === 0) {
      setWarUnread(0);
      return;
    }
    if (!storedSeen) {
      setWarUnread(session.warEvents.length);
      return;
    }
    const markerIndex = session.warEvents.findIndex(
      (event) => event.id === storedSeen,
    );
    const unseen =
      markerIndex >= 0
        ? session.warEvents.length - markerIndex - 1
        : session.warEvents.length;
    setWarUnread(unseen);
  }, [session?.id]);

  useEffect(() => {
    if (!session) {
      return;
    }
    if (!lastSeenWarId) {
      setWarUnread(session.warEvents.length);
      return;
    }
    const markerIndex = session.warEvents.findIndex(
      (event) => event.id === lastSeenWarId,
    );
    const unseen =
      markerIndex >= 0
        ? Math.max(0, session.warEvents.length - markerIndex - 1)
        : session.warEvents.length;
    setWarUnread(unseen);
  }, [session?.warEvents.length, session?.id, lastSeenWarId]);

  const viewportWidth =
    typeof window !== 'undefined' ? window.innerWidth : 1200;
  const viewportHeight =
    typeof window !== 'undefined' ? window.innerHeight : 800;
  const systems = session.galaxy.systems;
  const colonizedSystems = useMemo(
    () => new Set(session.economy.planets.map((planet) => planet.systemId)),
    [session.economy.planets],
  );
  const shipyardSystem: StarSystem | null = shipyardSystemId
    ? systems.find((system) => system.id === shipyardSystemId) ?? null
    : null;
  const selectedPlanet =
    session.economy.planets.find((planet) => planet.id === selectedPlanetId) ?? null;
  const selectedPlanetSystem = selectedPlanet
    ? systems.find((system) => system.id === selectedPlanet.systemId) ?? null
    : null;
  const economyConfig = useGameStore((state) => state.config.economy);
  const districtDefinitions = economyConfig.districts;
  const populationJobs = economyConfig.populationJobs;
  const automationConfig = economyConfig.populationAutomation;
  const districtQueue = useGameStore(
    (state) => state.session?.districtConstructionQueue ?? [],
  );
  const queueDistrictConstruction = useGameStore(
    (state) => state.queueDistrictConstruction,
  );
  const promotePopulationJob = useGameStore(
    (state) => state.promotePopulation,
  );
  const demotePopulationJob = useGameStore(
    (state) => state.demotePopulation,
  );
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
        onSelectSystem={(systemId, _anchor) => {
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
          if (session?.warEvents?.length) {
            setLastSeenWarId(session.warEvents.at(-1)?.id ?? null);
            setWarUnread(0);
            saveWarSeen(
              session.id,
              session.warEvents.at(-1)?.id ?? null,
            );
          }
        }}
        warUnread={warUnread}
      />
      <div className="floating-panels">
        <MapPanels
          focusSystemId={focusSystemId}
          focusPlanetId={focusPlanetId}
          viewportWidth={viewportWidth}
          viewportHeight={viewportHeight}
          warEventsRef={warEventsRef}
          unreadWarIds={unreadWarIds}
          onMarkWarRead={() => {
            if (!session?.warEvents?.length) {
              setWarUnread(0);
              return;
            }
            setLastSeenWarId(session.warEvents.at(-1)?.id ?? null);
            setWarUnread(0);
            saveWarSeen(
              session.id,
              session.warEvents.at(-1)?.id ?? null,
            );
          }}
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
          setFocusSystemId={setFocusSystemId}
          setFocusPlanetId={setFocusPlanetId}
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
            title={${selectedPlanet.name} ()}
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
              <div className="planet-population">
                <h4>Ruoli popolazione</h4>
                {automationConfig?.enabled ? (
                  <p className="text-muted">
                    Bilanciamento automatico attivo (prioritÃ :{' '}
                    {automationConfig.priorities.join(' > ')})
                  </p>
                ) : null}
                {populationMessage ? (
                  <p className="panel-message">{populationMessage}</p>
                ) : null}
                <ul>
                  {populationJobs.map((job) => {
                    const assigned =
                      selectedPlanet.population[
                        job.id as keyof typeof selectedPlanet.population
                      ] ?? 0;
                    return (
                      <li key={job.id}>
                        <div className="population-job__meta">
                          <div>
                            <strong>{job.label}</strong>
                            <span className="text-muted">
                              {job.description}
                            </span>
                          </div>
                          <span>Pop assegnati: {assigned}</span>
                          <span>Produzione: {formatCost(job.production)}</span>
                          <span>Upkeep: {formatCost(job.upkeep)}</span>
                        </div>
                        <div className="population-job__actions">
                          <button
                            className="panel__action panel__action--compact"
                            onClick={() => handlePromotePopulation(job.id)}
                          >
                            Promuovi
                          </button>
                          {job.id !== 'workers' ? (
                            <button
                              className="panel__action panel__action--compact"
                              onClick={() => handleDemotePopulation(job.id)}
                            >
                              Declassa
                            </button>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
              {districtMessage ? (
                <p className="panel-message">{districtMessage}</p>
              ) : null}
              <div className="planet-districts">
                <h4>Distretti</h4>
                <ul>
                  {districtDefinitions.map((definition) => {
                    const owned =
                      selectedPlanet.districts[definition.id] ?? 0;
                    return (
                      <li key={definition.id}>
                        <div>
                          <strong>{definition.label}</strong>
                          <span className="text-muted">
                            {definition.description}
                          </span>
                        </div>
                        <div className="planet-district__meta">
                          <span>Costruiti: {owned}</span>
                          <span>Costo: {formatCost(definition.cost)}</span>
                          <span>
                            Produzione: {formatCost(definition.production)}
                          </span>
                          <button
                            className="panel__action panel__action--compact"
                            onClick={() => handleQueueDistrict(definition.id)}
                          >
                            Costruisci
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="planet-districts">
                <h4>Coda costruzione</h4>
                {planetDistrictQueue.length === 0 ? (
                  <p className="text-muted">Nessun distretto in costruzione.</p>
                ) : (
                  <ul>
                    {planetDistrictQueue.map((task) => (
                      <li key={task.id}>
                        <div className="district-queue__header">
                          <strong>{task.label}</strong>
                          <span className="text-muted">
                            Tick rimanenti: {task.ticksRemaining}/
                            {task.totalTicks}
                          </span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-bar__fill"
                            style={{ width: `${Math.round(task.progress * 100)}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </DraggablePanel>
        ) : null}
      </div>
    </div>
  );
};

