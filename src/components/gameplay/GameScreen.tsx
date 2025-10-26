import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { DebugConsole } from '../debug/DebugConsole';
import { useGameLoop } from '../../utils/useGameLoop';
import { GalaxyMap } from './GalaxyMap';
import { ColonyPanel } from './ColonyPanel';
import { ShipyardPanel } from './ShipyardPanel';
import { FleetAndCombatPanel } from './FleetAndCombatPanel';
import { HudTopBar } from './HudTopBar';
import { HudBottomBar } from './HudBottomBar';
import { DraggablePanel } from '../ui/DraggablePanel';
import { resourceLabels } from '../../domain/resourceMetadata';
import type { StarSystem } from '../../domain/types';

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
        <DraggablePanel title="Colonie" initialX={12} initialY={100}>
          <ColonyPanel
            onSelectPlanet={(planetId, systemId) => {
              setFocusSystemId(systemId);
              setSelectedPlanetId(planetId);
              setShipyardSystemId(null);
              setFocusPlanetId(planetId);
            }}
          />
        </DraggablePanel>
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
              <p>Popolazione: {selectedPlanet.population}</p>
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
            </div>
          </DraggablePanel>
        ) : null}
      </div>
    </div>
  );
};
