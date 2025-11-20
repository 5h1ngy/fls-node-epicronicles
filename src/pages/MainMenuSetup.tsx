import type { GameConfig } from '@config/gameConfig';
import { MainMenuLayout } from './MainMenuLayout';

import '../styles/pages/MainMenuSetup.scss';

interface MainMenuSetupProps {
  background: string;
  seed: string;
  presetId: string;
  presets: GameConfig['galaxyPresets'];
  galaxyShape: 'circle' | 'spiral';
  onSeedChange: (value: string) => void;
  onPresetChange: (value: string) => void;
  onShapeChange: (value: 'circle' | 'spiral') => void;
  onConfirm: () => void;
  onBack: () => void;
}

export const MainMenuSetup = ({
  background,
  seed,
  presetId,
  presets,
  galaxyShape,
  onSeedChange,
  onPresetChange,
  onShapeChange,
  onConfirm,
  onBack,
}: MainMenuSetupProps) => (
  <MainMenuLayout background={background} showBrand={false}>
    <div className="session-setup">
      <div className="setup-card">
        <div className="setup-card__header">
          <div>
            <p className="setup-card__eyebrow">Nuova sessione</p>
            <h1 className="setup-card__title">Configura la partita</h1>
            <p className="setup-card__subtitle">
              Imposta seed e preset della galassia prima di partire.
            </p>
          </div>
          <button
            className="setup-card__link"
            type="button"
            onClick={onBack}
            aria-label="Torna alla schermata principale"
          >
            Torna indietro
          </button>
        </div>

        <div className="setup-card__form">
          <label className="setup-card__field">
            <span>Galaxy seed</span>
            <input
              value={seed}
              onChange={(event) => onSeedChange(event.target.value)}
              aria-label="Galaxy seed"
            />
          </label>

          <label className="setup-card__field">
            <span>Galaxy preset</span>
            <select
              value={presetId}
              onChange={(event) => onPresetChange(event.target.value)}
              aria-label="Galaxy preset"
            >
              {presets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label} ({preset.systemCount} sistemi)
                </option>
              ))}
            </select>
          </label>

          <label className="setup-card__field">
            <span>Forma galassia</span>
            <select
              value={galaxyShape}
              onChange={(event) => onShapeChange(event.target.value as 'circle' | 'spiral')}
              aria-label="Forma galassia"
            >
              <option value="circle">Tonda</option>
              <option value="spiral">Spirale</option>
            </select>
          </label>
        </div>

        <div className="setup-card__footer">
          <button
            className="setup-card__primary"
            type="button"
            onClick={onConfirm}
          >
            Avvia sessione
          </button>
        </div>
      </div>
    </div>
  </MainMenuLayout>
);
