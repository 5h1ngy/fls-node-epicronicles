import { useMemo, useState } from 'react';
import { useGameStore } from '@store/gameStore';

import '../styles/components/MainMenu.scss';

const BACKGROUNDS = [
  '/pages/main-menu/backgrounds/main-menu-background-1.png',
  '/pages/main-menu/backgrounds/main-menu-background-2.png',
  '/pages/main-menu/backgrounds/main-menu-background-3.png',
  '/pages/main-menu/backgrounds/main-menu-background-4.png',
  '/pages/main-menu/backgrounds/main-menu-background-5.png',
  '/pages/main-menu/backgrounds/main-menu-background-6.png',
  '/pages/main-menu/backgrounds/main-menu-background-7.png',
  '/pages/main-menu/backgrounds/main-menu-background-8.png',
  '/pages/main-menu/backgrounds/main-menu-background-9.png',
  '/pages/main-menu/backgrounds/main-menu-background-10.png',
];

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
  const [showSetup, setShowSetup] = useState(false);

  const background = useMemo(
    () => BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)],
    [],
  );

  const handleLoad = () => {
    const result = loadSession();
    setMessage(
      result.success
        ? 'Ultimo salvataggio caricato.'
        : 'Nessun salvataggio disponibile o file non valido.',
    );
  };

  const handleStart = () => {
    startNewSession({ seed, presetId });
    setMessage(null);
  };

  return (
    <div
      className="main-menu"
      style={{ backgroundImage: `url(${background})` }}
    >
      <div className="main-menu__overlay" />

      <header className="main-menu__brand">
        <img
          src="/pages/main-menu/logo-full.png"
          alt="FLS Node Epicrnoicles logo"
          className="main-menu__logo"
        />
      </header>

      <div className="main-menu__dock">
        <button
          className="main-menu__action"
          onClick={() => setShowSetup(true)}
        >
          Inizia partita
        </button>
        <button
          className="main-menu__action"
          onClick={handleLoad}
          disabled={!hasSavedSession()}
        >
          Carica
        </button>
      </div>

      {showSetup ? (
        <div className="main-menu__card">
          <div className="main-menu__card-head">
            <div>
              <p className="main-menu__eyebrow">Nuova partita</p>
              <h1 className="main-menu__title">Configura la sessione</h1>
              <p className="main-menu__subtitle">
                Scegli seed e preset della galassia, poi avvia.
              </p>
            </div>
            <button
              className="main-menu__close"
              onClick={() => setShowSetup(false)}
              aria-label="Chiudi configurazione"
            >
              ×
            </button>
          </div>

          <div className="main-menu__form">
            <label className="main-menu__field">
              <span>Galaxy seed</span>
              <input
                value={seed}
                onChange={(event) => setSeed(event.target.value)}
                aria-label="Galaxy seed"
              />
            </label>

            <label className="main-menu__field">
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
          </div>

          <div className="main-menu__actions">
            <button className="main-menu__primary" onClick={handleStart}>
              Avvia sessione
            </button>
            <button
              className="main-menu__ghost"
              onClick={() => setShowSetup(false)}
            >
              Annulla
            </button>
          </div>

          {message ? <p className="panel-message">{message}</p> : null}
        </div>
      ) : null}

      {message && !showSetup ? (
        <div className="main-menu__toast">{message}</div>
      ) : null}
    </div>
  );
};
