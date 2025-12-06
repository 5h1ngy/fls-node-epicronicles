import type { GameConfig } from '@config';
import { MainMenuLayout } from '../MainMenuLayout';

import './MainMenuSetup.scss';

interface MainMenuSetupProps {
  background: string;
  seed: string;
  presetId: string;
  presets: GameConfig['galaxyPresets'];
  galaxyShape: import('@domain/galaxy/galaxy').GalaxyShape;
  galaxyShapes: import('@domain/galaxy/galaxy').GalaxyShape[];
  systemCount: number;
  systemCountOptions: number[];
  galaxyRadius: number;
  galaxyRadii: number[];
  onSeedChange: (value: string) => void;
  onPresetChange: (value: string) => void;
  onShapeChange: (value: import('@domain/galaxy/galaxy').GalaxyShape) => void;
  onSystemCountChange: (value: number) => void;
  onRadiusChange: (value: number) => void;
  onConfirm: () => void;
  onBack: () => void;
}

export const MainMenuSetup = ({
  background,
  seed,
  presetId,
  presets,
  galaxyShape,
  galaxyShapes,
  systemCount,
  systemCountOptions,
  galaxyRadius,
  galaxyRadii,
  onSeedChange,
  onPresetChange,
  onShapeChange,
  onSystemCountChange,
  onRadiusChange,
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
              onChange={(event) =>
                onShapeChange(event.target.value as import('@domain/galaxy/galaxy').GalaxyShape)
              }
              aria-label="Forma galassia"
            >
              {galaxyShapes.map((shape) => (
                <option key={shape} value={shape}>
                  {shape}
                </option>
              ))}
            </select>
          </label>

          <label className="setup-card__field">
            <span>Numero sistemi</span>
            <select
              value={systemCount}
              onChange={(event) => onSystemCountChange(Number(event.target.value))}
              aria-label="Numero sistemi"
            >
              {systemCountOptions.map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </label>

          <label className="setup-card__field">
            <span>Raggio galassia</span>
            <select
              value={galaxyRadius}
              onChange={(event) => onRadiusChange(Number(event.target.value))}
              aria-label="Raggio galassia"
            >
              {galaxyRadii.map((radius) => (
                <option key={radius} value={radius}>
                  {radius}
                </option>
              ))}
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
