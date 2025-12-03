/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { GalaxySceneContext } from '../hooks/useGalaxyScene';
import type { GalaxyMapRefs } from '../hooks/useGalaxyMapRefs';

export interface GalaxyMapContextValue {
  cameraState: GalaxyMapRefs['cameraState'];
  anchorState: GalaxyMapRefs['anchorState'];
  refs: GalaxyMapRefs;
  sceneContext: GalaxySceneContext | null;
  minZoom: number;
  maxZoom: number;
  baseTilt: number;
  maxTiltDown: number;
}

const GalaxyMapContext = createContext<GalaxyMapContextValue | null>(null);

export const GalaxyMapProvider = ({
  value,
  children,
}: {
  value: GalaxyMapContextValue;
  children: ReactNode;
}) => <GalaxyMapContext.Provider value={value}>{children}</GalaxyMapContext.Provider>;

export const useGalaxyMapContext = (): GalaxyMapContextValue => {
  const ctx = useContext(GalaxyMapContext);
  if (!ctx) {
    throw new Error('GalaxyMapContext not found');
  }
  return ctx;
};
