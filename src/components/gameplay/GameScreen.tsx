import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { DebugConsole } from '../debug/DebugConsole';
import { useGameLoop } from '../../utils/useGameLoop';
import { GalaxyMap } from './GalaxyMap';
import { ColonyPanel } from './ColonyPanel';
import { ShipyardPanel } from './ShipyardPanel';
import { FleetAndCombatPanel } from './FleetAndCombatPanel';
import { SciencePanel } from './SciencePanel';
import { SystemPanel } from './SystemPanel';
import { GalaxyOverview } from './GalaxyOverview';
import { EconomyPanel } from './EconomyPanel';
import { HudTopBar } from './HudTopBar';
import { HudBottomBar } from './HudBottomBar';
import { DraggablePanel } from '../ui/DraggablePanel';
import { resourceLabels } from '../../domain/resourceMetadata';
import type { StarSystem, PopulationJobId } from '../../domain/types';

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
  const focusedSessionRef = useRef<string | null>(null);

  const clearFocusTargets = () => {
    setFocusSystemId(null);
    setShipyardSystemId(null);
    setSelectedPlanetId(null);
    setFocusPlanetId(null);
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

  if (!session) {
    return (
      <div className="panel">
        <p>No active session.</p>
        <button className="panel__action" onClick={returnToMenu}>
          Back to menu
        </button>
      </div>
    );
  }

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
  const systems = session.galaxy.systems;
  const shipyardSystem: StarSystem | null = shipyardSystemId
    ? systems.find((system) => system.id === shipyardSystemId) ?? null
    : null;
  const selectedPlanet =
    session.economy.planets.find((planet) => planet.id === selectedPlanetId) ?? null;
  const selectedPlanetSystem = selectedPlanet
    ? systems.find((system) => system.id === selectedPlanet.systemId) ?? null
    : null;
  const districtDefinitions = useGameStore(
    (state) => state.config.economy.districts,
  );
  const populationJobs = useGameStore(
    (state) => state.config.economy.populationJobs,
  );
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
    ? districtQueue.filter((task) => task.planetId === selectedPlanet.id)
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

  const formatCost = (cost: Record<string, number | undefined>) => {
    const entries = Object.entries(cost).filter(
      ([, amount]) => amount && amount > 0,
    );
    if (entries.length === 0) {
      return 'N/A';
    }
    return entries
      .map(
        ([type, amount]) =>
          `${resourceLabels[type as keyof typeof resourceLabels]} ${amount}`,
      )
      .join(' | ');
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
      <div className="game-map-layer">
        <GalaxyMap
          focusSystemId={focusSystemId}
          focusPlanetId={focusPlanetId}
          onSystemSelect={(systemId, _anchor) => {
            setShipyardSystemId(systemId);
            setSelectedPlanetId(null);
            setFocusSystemId(systemId);
            setFocusPlanetId(null);
          }}
          onClearFocus={clearFocusTargets}
        />
      </div>
      <HudBottomBar
        onToggleDebug={() => setDebugOpen((value) => !value)}
        debugOpen={debugOpen}
      />
      <div className="floating-panels">
        <DraggablePanel
          title="Colonie"
          initialX={12}
          initialY={80}
          initialHeight={320}
          initialWidth={320}
        >
          <ColonyPanel
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
          />
        </DraggablePanel>
        <DraggablePanel
          title="Panoramica galassia"
          initialX={12}
          initialY={340}
          initialWidth={360}
          initialHeight={280}
        >
          <GalaxyOverview
            onFocusSystem={(systemId) => {
              setFocusSystemId(systemId);
              setFocusPlanetId(null);
            }}
          />
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
          title="Navi scientifiche"
          initialX={Math.max(12, viewportWidth - 360)}
          initialY={80}
          initialWidth={320}
          initialHeight={260}
        >
          <SciencePanel
            onFocusSystem={(systemId) => {
              setFocusSystemId(systemId);
              setFocusPlanetId(null);
            }}
          />
        </DraggablePanel>
        {focusSystemId ? (
          <DraggablePanel
            title="Dettagli sistema"
            initialX={Math.max(12, viewportWidth - 340)}
            initialY={100}
            onClose={clearFocusTargets}
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
          <FleetAndCombatPanel />
        </DraggablePanel>
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
        {shipyardSystem ? (
          <DraggablePanel
            title={`Cantieri - ${shipyardSystem.name}`}
            initialX={viewportWidth / 2 - 180}
            initialY={viewportHeight / 2 - 200}
            onClose={closeShipyardPanel}
          >
            <ShipyardPanel system={shipyardSystem} />
          </DraggablePanel>
        ) : null}
        {selectedPlanet && selectedPlanetSystem ? (
          <DraggablePanel
            title={`${selectedPlanet.name} (${selectedPlanet.id})`}
            initialX={viewportWidth / 2 - 180}
            initialY={viewportHeight / 2 - 140}
            onClose={closePlanetPanel}
          >
            <div className="planet-detail">
              <p>Sistema: {selectedPlanetSystem.name}</p>
              <p>
                Popolazione: {selectedPlanet.population.workers} lavoratori /
                {selectedPlanet.population.specialists} specialisti /
                {selectedPlanet.population.researchers} ricercatori
              </p>
              <p>Tipo stella: {selectedPlanetSystem.starClass}</p>
              <div className="planet-list__yields">
                {Object.entries(selectedPlanet.baseProduction).map(
                  ([type, amount]) => (
                    <div key={type} className="planet-list__yield">
                      <span>
                        {resourceLabels[type as keyof typeof resourceLabels]}
                      </span>
                      <span className="is-positive">+{amount}</span>
                    </div>
                  ),
                )}
              </div>
              <div className="planet-population">
                <h4>Ruoli popolazione</h4>
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
                    {planetDistrictQueue.map((task) => {
                      const definition = districtDefinitions.find(
                        (entry) => entry.id === task.districtId,
                      );
                      return (
                        <li key={task.id}>
                          <span>{definition?.label ?? task.districtId}</span>
                          <span className="text-muted">
                            Tick rimanenti: {task.ticksRemaining}/
                            {task.totalTicks}
                          </span>
                        </li>
                      );
                    })}
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
