import { useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { DebugConsole } from '../debug/DebugConsole';
import { useGameLoop } from '../../utils/useGameLoop';
import { GalaxyOverview } from './GalaxyOverview';
import { ResourceBar } from './ResourceBar';
import { PlanetList } from './PlanetList';
import { ColonizationPanel } from './ColonizationPanel';
import { ShipyardPanel } from './ShipyardPanel';
import { FleetPanel } from './FleetPanel';
import { CombatLogPanel } from './CombatLogPanel';

const speedOptions = [0.5, 1, 2, 4];

export const GameScreen = () => {
  useGameLoop();
  const session = useGameStore((state) => state.session);
  const sessionId = session?.id;
  const returnToMenu = useGameStore((state) => state.returnToMenu);
  const setSimulationRunning = useGameStore(
    (state) => state.setSimulationRunning,
  );
  const setSpeedMultiplier = useGameStore((state) => state.setSpeedMultiplier);

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

  const { clock, galaxy, scienceShips } = session;
  const revealedCount = galaxy.systems.filter(
    (system) => system.visibility !== 'unknown',
  ).length;
  const surveyedCount = galaxy.systems.filter(
    (system) => system.visibility === 'surveyed',
  ).length;

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    setSimulationRunning(true, Date.now());
  }, [sessionId, setSimulationRunning]);

  return (
    <div className="game-screen">
      <ResourceBar />
      <header className="game-screen__header">
        <div>
          <h2>{session.label}</h2>
          <p>Galaxy seed: {galaxy.seed}</p>
        </div>

        <div className="game-screen__controls">
          <button
            className="panel__action"
            onClick={() => setSimulationRunning(!clock.isRunning, Date.now())}
          >
            {clock.isRunning ? 'Pause' : 'Resume'}
          </button>
          <span>Speed:</span>
          <div className="speed-options">
            {speedOptions.map((option) => (
              <button
                key={option}
                className={`panel__action ${
                  option === clock.speedMultiplier ? 'is-active' : ''
                }`}
                onClick={() => setSpeedMultiplier(option)}
              >
                {option}x
              </button>
            ))}
          </div>
          <button className="panel__action" onClick={returnToMenu}>
            Quit to menu
          </button>
        </div>
      </header>

      <section className="game-screen__status">
        <dl>
          <div>
            <dt>Tick</dt>
            <dd>{clock.tick}</dd>
          </div>
          <div>
            <dt>Elapsed (ms)</dt>
            <dd>{clock.elapsedMs.toFixed(0)}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{clock.isRunning ? 'Running' : 'Paused'}</dd>
          </div>
          <div>
            <dt>Sistemi totali</dt>
            <dd>{galaxy.systems.length}</dd>
          </div>
          <div>
            <dt>Rivelati</dt>
            <dd>
              {revealedCount}/{galaxy.systems.length}
            </dd>
          </div>
          <div>
            <dt>Sondati</dt>
            <dd>
              {surveyedCount}/{galaxy.systems.length}
            </dd>
          </div>
          <div>
            <dt>Navi scientifiche</dt>
            <dd>{scienceShips.length}</dd>
          </div>
        </dl>
      </section>
      <GalaxyOverview />
      <PlanetList />
      <ColonizationPanel />
      <ShipyardPanel />
      <FleetPanel />
      <CombatLogPanel />
      <DebugConsole />
    </div>
  );
};
