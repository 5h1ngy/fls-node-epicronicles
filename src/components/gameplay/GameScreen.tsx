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

export const GameScreen = () => {
  useGameLoop();
  const session = useGameStore((state) => state.session);
  const sessionId = session?.id;
  const returnToMenu = useGameStore((state) => state.returnToMenu);
  const setSimulationRunning = useGameStore(
    (state) => state.setSimulationRunning,
  );
  const [debugOpen, setDebugOpen] = useState(false);
  const [shipyardAnchor, setShipyardAnchor] = useState<{
    systemId: string;
    x: number;
    y: number;
  } | null>(null);

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

  return (
    <div className="game-layout">
      <HudTopBar />
      <div className="game-map-layer">
        <GalaxyMap
          onSystemFocus={({ systemId, screenX, screenY }) =>
            setShipyardAnchor({ systemId, x: screenX, y: screenY })
          }
        />
      </div>
      <HudBottomBar
        onToggleDebug={() => setDebugOpen((value) => !value)}
        debugOpen={debugOpen}
      />
      <div className="floating-panels">
        <DraggablePanel title="Colonie" initialX={20} initialY={140}>
          <ColonyPanel />
        </DraggablePanel>
        <DraggablePanel title="Flotte & Battaglie" initialX={viewportWidth - 340} initialY={420}>
          <FleetAndCombatPanel />
        </DraggablePanel>
        {debugOpen ? (
          <DraggablePanel
            title="Debug"
            initialX={viewportWidth - 420}
            initialY={viewportHeight - 380}
            onClose={() => setDebugOpen(false)}
          >
            <DebugConsole />
          </DraggablePanel>
        ) : null}
        {shipyardAnchor ? (
          <div
            className="shipyard-popover"
            style={{
              left: shipyardAnchor.x,
              top: shipyardAnchor.y,
            }}
          >
            <div className="shipyard-popover__header">
              <strong>Cantieri ({shipyardAnchor.systemId})</strong>
              <button
                className="draggable-panel__close"
                onClick={() => setShipyardAnchor(null)}
              >
                ×
              </button>
            </div>
            <ShipyardPanel />
          </div>
        ) : null}
      </div>
    </div>
  );
};
