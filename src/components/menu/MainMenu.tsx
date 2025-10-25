import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';

export const MainMenu = () => {
  const startNewSession = useGameStore((state) => state.startNewSession);
  const config = useGameStore((state) => state.config);
  const [seed, setSeed] = useState(config.defaultGalaxy.seed);

  return (
    <div className="panel">
      <h1>FLS Node Epicrnoicles</h1>
      <p className="panel__subtitle">Prototype build &ndash; Phase 0</p>

      <label className="panel__field">
        <span>Galaxy seed</span>
        <input
          value={seed}
          onChange={(event) => setSeed(event.target.value)}
          aria-label="Galaxy seed"
        />
      </label>

      <button
        className="panel__action"
        onClick={() => startNewSession({ seed })}
      >
        Start simulation
      </button>

      <button className="panel__action" disabled>
        Load save (coming soon)
      </button>
    </div>
  );
};
