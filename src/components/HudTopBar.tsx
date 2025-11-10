import { ResourceBar } from './ResourceBar';
import { useGameStore } from '@store/gameStore';

const speedOptions = [0.5, 1, 2, 4];

export const HudTopBar = () => {
  const session = useGameStore((state) => state.session);
  const setSimulationRunning = useGameStore(
    (state) => state.setSimulationRunning,
  );
  const setSpeedMultiplier = useGameStore((state) => state.setSpeedMultiplier);

  if (!session) {
    return null;
  }

  const { clock, label, galaxy } = session;

  return (
    <div className="hud-top-bar">
      <div className="hud-top-bar__left">
        <ResourceBar />
      </div>
      <div className="hud-top-bar__right">
        <div className="hud-session-pill">
          <div>
            <span className="hud-session-pill__label">{label}</span>
            <span className="hud-session-pill__seed">Seed: {galaxy.seed}</span>
          </div>
          <div className="hud-session-pill__elapsed">
            <span>Elapsed</span>
            <strong>{clock.elapsedMs.toFixed(0)} ms</strong>
          </div>
        </div>

        <div className="hud-top-bar__controls">
          <button
            className="panel__action panel__action--compact hud-top-bar__pause"
            onClick={() => setSimulationRunning(!clock.isRunning, Date.now())}
          >
            {clock.isRunning ? 'Pausa' : 'Play'}
          </button>
          <div className="speed-options">
            {speedOptions.map((option) => (
              <button
                key={option}
                className={`panel__action panel__action--compact ${
                  option === clock.speedMultiplier ? 'is-active' : ''
                }`}
                onClick={() => setSpeedMultiplier(option)}
              >
                {option}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
