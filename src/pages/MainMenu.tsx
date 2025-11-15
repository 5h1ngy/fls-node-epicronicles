import { useState } from 'react';
import { useGameStore } from '@store/gameStore';

import '../styles/components/MainMenu.scss';

export const MainMenu = () => {
  const startNewSession = useGameStore((state) => state.startNewSession);
  const loadSession = useGameStore((state) => state.loadSession);
  const hasSavedSession = useGameStore((state) => state.hasSavedSession);
  const config = useGameStore((state) => state.config);
  const [seed, setSeed] = useState(config.defaultGalaxy.seed);
  const defaultPresetId =
    config.galaxyPresets.find((preset) => preset.id === 'standard')?.id ??
    config.galaxyPresets[0]?.id ??
    'standard';
  const [presetId, setPresetId] = useState(defaultPresetId);
  const [message, setMessage] = useState<string | null>(null);

  const handleLoad = () => {
    const result = loadSession();
    setMessage(
      result.success
        ? 'Partita caricata.'
        : 'Nessun salvataggio disponibile o file non valido.',
    );
  };

  return (
    <div className="main-menu">
      <div className="panel main-menu__panel">
        <h1 className="main-menu__title">FLS Node Epicrnoicles</h1>
      <p className="panel__subtitle">Prototype build &ndash; Phase 0</p>

      <label className="panel__field">
        <span>Galaxy seed</span>
        <input
          value={seed}
          onChange={(event) => setSeed(event.target.value)}
          aria-label="Galaxy seed"
        />
      </label>

      <label className="panel__field">
        <span>Galaxy preset</span>
        <select
          value={presetId}
          onChange={(event) => setPresetId(event.target.value)}
          aria-label="Galaxy preset"
        >
          {config.galaxyPresets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label} ({preset.systemCount} sistemi)
            </option>
          ))}
        </select>
      </label>

      <button
        className="panel__action"
        onClick={() => startNewSession({ seed, presetId })}
      >
        Start simulation
      </button>

      <button
        className="panel__action"
        onClick={handleLoad}
        disabled={!hasSavedSession()}
      >
        Load save
      </button>
      {message ? <p className="panel-message">{message}</p> : null}
      </div>
    </div>
  );
};
