import { useCallback, useMemo, useState } from 'react';
import { useGameStore } from '@store/gameStore';
import { MainMenuLanding } from '../MainMenuLanding';
import { MainMenuSetup } from '../MainMenuSetup';
import { pickBackground, randomBackgroundIndex } from '../common/backgrounds';

type MenuStage = 'landing' | 'setup';

export const MainMenu = () => {
  const startNewSession = useGameStore((state) => state.startNewSession);
  const loadSession = useGameStore((state) => state.loadSession);
  const hasSavedSession = useGameStore((state) => state.hasSavedSession);
  const config = useGameStore((state) => state.config);
  const [seed, setSeed] = useState(config.defaultGalaxy.seed);
  const [galaxyShape, setGalaxyShape] = useState(
    config.defaultGalaxy.galaxyShape ?? 'circle',
  );
  const defaultPresetId =
    config.galaxyPresets.find((preset) => preset.id === 'standard')?.id ??
    config.galaxyPresets[0]?.id ??
    'standard';
  const [presetId, setPresetId] = useState(defaultPresetId);
  const [stage, setStage] = useState<MenuStage>('landing');
  const [message, setMessage] = useState<string | null>(null);
  const [backgroundIndex] = useState(() =>
    randomBackgroundIndex(),
  );

  const background = useMemo(() => pickBackground(backgroundIndex), [backgroundIndex]);

  const handleLoad = useCallback(() => {
    const result = loadSession();
    setMessage(
      result.success
        ? 'Ultimo salvataggio caricato.'
        : 'Nessun salvataggio disponibile o file non valido.',
    );
    setStage('landing');
  }, [loadSession]);

  const handleStart = useCallback(() => {
    startNewSession({ seed, presetId, galaxyShape });
    setMessage(null);
  }, [startNewSession, seed, presetId, galaxyShape]);

  return stage === 'landing' ? (
    <MainMenuLanding
      background={background}
      canLoad={hasSavedSession()}
      onStart={() => {
        setStage('setup');
        setMessage(null);
      }}
      onLoad={handleLoad}
      toast={message}
    />
  ) : (
    <MainMenuSetup
      background={background}
      seed={seed}
      presetId={presetId}
      presets={config.galaxyPresets}
      galaxyShape={galaxyShape}
      onSeedChange={setSeed}
      onPresetChange={setPresetId}
      onShapeChange={setGalaxyShape}
      onConfirm={handleStart}
      onBack={() => setStage('landing')}
    />
  );
};
