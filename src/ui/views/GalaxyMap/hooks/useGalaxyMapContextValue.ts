import { useMemo } from 'react';
import type { GalaxySceneContext } from './useGalaxyScene';
import type { useGalaxyMapData } from './useGalaxyMapData';
import type { GalaxyMapContextValue } from '../providers/GalaxyMapContext';
import type { GalaxyMapRefs } from './useGalaxyMapRefs';

type UseGalaxyMapContextValueParams = {
  data: ReturnType<typeof useGalaxyMapData>;
  refs: GalaxyMapRefs;
  sceneContext: GalaxySceneContext | null;
};

export const useGalaxyMapContextValue = ({
  data,
  refs,
  sceneContext,
}: UseGalaxyMapContextValueParams): GalaxyMapContextValue => {
  const { cameraState, anchorState } = refs;

  return useMemo(
    () => ({
      cameraState,
      anchorState,
      refs,
      sceneContext,
      minZoom: data.minZoom,
      maxZoom: data.maxZoom,
      baseTilt: Math.PI / 2,
      maxTiltDown: Math.PI / 2 + Math.PI / 6,
    }),
    [anchorState, cameraState, refs, sceneContext, data.minZoom, data.maxZoom],
  );
};
