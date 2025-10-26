import { useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useGameLoop } from '../../utils/useGameLoop';
import { GalaxyMap } from './GalaxyMap';
import { PlanetList } from './PlanetList';
import { ColonizationPanel } from './ColonizationPanel';
import { ShipyardPanel } from './ShipyardPanel';
import { FleetPanel } from './FleetPanel';
import { CombatLogPanel } from './CombatLogPanel';
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
        <DraggablePanel title="Pianeti" initialX={20} initialY={120}>
          <PlanetList />
        </DraggablePanel>
        <DraggablePanel title="Colonizzazione" initialX={20} initialY={360}>
          <ColonizationPanel />
        </DraggablePanel>
        <DraggablePanel title="Cantieri" initialX={viewportWidth - 360} initialY={120}>
          <ShipyardPanel />
        </DraggablePanel>
        <DraggablePanel title="Flotte" initialX={viewportWidth - 360} initialY={360}>
          <FleetPanel />
        </DraggablePanel>
        <DraggablePanel title="Battaglie" initialX={viewportWidth - 360} initialY={600}>
          <CombatLogPanel />
        </DraggablePanel>
      </div>
    </div>
  );
};
