import { useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
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

  return (
    <div className="game-layout">
      <HudTopBar />
      <div className="game-map-layer">
        <GalaxyMap />
      </div>
      <HudBottomBar />
      <div className="floating-panels">
        <DraggablePanel title="Colonie" initialX={20} initialY={140}>
          <ColonyPanel />
        </DraggablePanel>
        <DraggablePanel title="Cantieri" initialX={viewportWidth - 340} initialY={140}>
          <ShipyardPanel />
        </DraggablePanel>
        <DraggablePanel title="Flotte & Battaglie" initialX={viewportWidth - 340} initialY={420}>
          <FleetAndCombatPanel />
        </DraggablePanel>
      </div>
    </div>
  );
};
