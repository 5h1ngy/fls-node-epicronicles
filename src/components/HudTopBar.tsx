import { Pause, Play, Gauge, Clock3, Activity, PauseCircle } from 'lucide-react';
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

  const { clock } = session;
  const StatusIcon = clock.isRunning ? Activity : PauseCircle;
  const statusLabel = clock.isRunning ? 'Running' : 'Paused';

  return (
    <div className="hud-top-bar">
      <div className="hud-top-bar__left">
        <ResourceBar />
      </div>
      <div className="hud-top-bar__right">
        <div className="hud-top-bar__meta">
          <div className="hud-chip" data-tooltip="Tick di simulazione">
            <Clock3 size={14} />
            <span>{clock.tick}</span>
          </div>
          <div
            className="hud-chip"
            data-tooltip={clock.isRunning ? 'Simulazione in esecuzione' : 'Simulazione in pausa'}
          >
            <StatusIcon size={14} />
            <span>{statusLabel}</span>
          </div>
        </div>
        <div className="hud-top-bar__controls">
          <button
            className="hud-icon-btn"
            onClick={() => setSimulationRunning(!clock.isRunning, Date.now())}
            data-tooltip={clock.isRunning ? 'Pausa simulazione' : 'Riprendi simulazione'}
            aria-label="Toggle pausa"
          >
            {clock.isRunning ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <div className="speed-options">
            {speedOptions.map((option) => (
              <button
                key={option}
                className={`hud-icon-btn ${option === clock.speedMultiplier ? 'is-active' : ''}`}
                onClick={() => setSpeedMultiplier(option)}
                data-tooltip={`Velocità ${option}x`}
                aria-label={`Velocità ${option}x`}
              >
                <Gauge size={14} />
                <span className="speed-label">{option}x</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
