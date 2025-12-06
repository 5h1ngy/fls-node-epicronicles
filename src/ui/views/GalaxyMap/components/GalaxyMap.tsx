import { useEffect, useRef, useCallback } from 'react';
import { useGalaxyMapData } from '../hooks/useGalaxyMapData';
import { GalaxyMapProvider } from '../providers/GalaxyMapContext';
import { useGalaxyMapRefs } from '../hooks/useGalaxyMapRefs';
import { useGalaxyScene, type GalaxySceneContext } from '../hooks/useGalaxyScene';
import { updateScene } from '../entities/Scene';
import { AnchorsResolver } from '../entities/Anchors';
import { GalaxyMapScene } from './GalaxyMapScene';
import { useGalaxyMapContextValue } from '../hooks/useGalaxyMapContextValue';
import './GalaxyMap.scss';

interface GalaxyMapProps {
  focusSystemId?: string | null;
  focusTrigger?: number;
  onSystemSelect?: (
    systemId: string,
    anchor: { x: number; y: number },
  ) => void;
  onShipyardSelect?: (
    systemId: string,
    anchor: { x: number; y: number },
  ) => void;
  onClearFocus?: () => void;
}

export const GalaxyMap = ({
  focusSystemId,
  focusTrigger = 0,
  onSystemSelect,
  onShipyardSelect,
  onClearFocus,
}: GalaxyMapProps) => {
  const refs = useGalaxyMapRefs();
  const onSelectRef = useRef(onSystemSelect);
  const onClearRef = useRef(onClearFocus);
  useEffect(() => {
    onSelectRef.current = onSystemSelect;
    onClearRef.current = onClearFocus;
  }, [onClearFocus, onSystemSelect]);

  const data = useGalaxyMapData();
  const {
    containerRef,
    systemGroupRef,
    offsetTargetRef,
    zoomTargetRef,
    zoomTargetDirtyRef,
    tiltStateRef,
    tempSphericalRef,
    tempOffsetRef,
    systemPositionRef,
    scienceAnchorsRef,
    fleetAnchorsRef,
    anchorResolverRef,
    syncSceneContext,
  } = refs;

  const handleFrame = useCallback(
    (ctx: GalaxySceneContext, delta: number, elapsed: number) => {
      if (!anchorResolverRef.current) {
        anchorResolverRef.current = new AnchorsResolver(
          systemPositionRef.current,
        );
      }
      if (!anchorResolverRef.current || !systemGroupRef.current) {
        return;
      }
      updateScene({
        ctx,
        delta,
        elapsed,
        minZoom: data.minZoom,
        maxZoom: data.maxZoom,
        offsetTargetRef,
        zoomTargetRef,
        tiltStateRef,
        tempSphericalRef,
        tempOffsetRef,
        scienceAnchors: scienceAnchorsRef.current,
        fleetAnchors: fleetAnchorsRef.current,
        updateAnchors: anchorResolverRef.current.updateAnchors.bind(anchorResolverRef.current),
        zoomTargetDirtyRef,
      });
    },
    [
      data.maxZoom,
      data.minZoom,
      anchorResolverRef,
      systemPositionRef,
      offsetTargetRef,
      zoomTargetRef,
      zoomTargetDirtyRef,
      tiltStateRef,
      tempSphericalRef,
      tempOffsetRef,
      scienceAnchorsRef,
      fleetAnchorsRef,
      systemGroupRef,
    ],
  );

  const sceneContext = useGalaxyScene({
    containerRef,
    minZoom: data.minZoom,
    maxZoom: data.maxZoom,
    onFrame: handleFrame,
  });

  useEffect(() => {
    if (!sceneContext) {
      return;
    }
    syncSceneContext(sceneContext);
  }, [sceneContext, syncSceneContext]);

  const contextValue = useGalaxyMapContextValue({
    data,
    refs,
    sceneContext,
  });

  return (
    <GalaxyMapProvider value={contextValue}>
      <GalaxyMapScene
        data={data}
        focusSystemId={focusSystemId ?? null}
        focusTrigger={focusTrigger}
        onShipyardSelect={onShipyardSelect}
        onClearFocus={onClearFocus}
        onSelectRef={onSelectRef}
        onClearRef={onClearRef}
      />
    </GalaxyMapProvider>
  );
};
