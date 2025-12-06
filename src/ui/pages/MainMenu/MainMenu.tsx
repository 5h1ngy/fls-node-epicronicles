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
  const availableShapes =
    config.galaxyShapes && config.galaxyShapes.length > 0
      ? config.galaxyShapes
      : Array.from(
          new Set(
            config.galaxyPresets.map((preset) => preset.galaxyShape ?? 'circle'),
          ),
        );
  const [galaxyShape, setGalaxyShape] = useState(
    config.defaultGalaxy.galaxyShape ?? availableShapes[0] ?? 'circle',
  );
  const availableSystemCounts =
    config.galaxySystemCounts && config.galaxySystemCounts.length > 0
      ? config.galaxySystemCounts
      : Array.from(
          new Set(
            config.galaxyPresets.map((preset) => preset.systemCount ?? config.defaultGalaxy.systemCount),
          ),
        ).filter((val): val is number => typeof val === 'number');
  const availableRadii =
    config.galaxyRadii && config.galaxyRadii.length > 0
      ? config.galaxyRadii
      : Array.from(
          new Set(
            config.galaxyPresets.map((preset) => preset.galaxyRadius ?? config.defaultGalaxy.galaxyRadius),
          ),
        ).filter((val): val is number => typeof val === 'number');
  const [systemCount, setSystemCount] = useState(
    config.defaultGalaxy.systemCount ?? availableSystemCounts[0] ?? 18,
  );
  const [galaxyRadius, setGalaxyRadius] = useState(
    config.defaultGalaxy.galaxyRadius ?? availableRadii[0] ?? 256,
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
    startNewSession({
      seed,
      presetId,
      galaxyShape,
      systemCount,
      galaxyRadius,
    });
    setMessage(null);
  }, [startNewSession, seed, presetId, galaxyShape, systemCount, galaxyRadius]);

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
      galaxyShapes={availableShapes}
      systemCount={systemCount}
      systemCountOptions={availableSystemCounts}
      galaxyRadius={galaxyRadius}
      galaxyRadii={availableRadii}
      onSeedChange={setSeed}
      onPresetChange={setPresetId}
      onShapeChange={setGalaxyShape}
      onSystemCountChange={setSystemCount}
      onRadiusChange={setGalaxyRadius}
      onConfirm={handleStart}
      onBack={() => setStage('landing')}
    />
  );
};
