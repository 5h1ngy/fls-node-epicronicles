import { useEffect, useRef, useCallback } from 'react';
import { useGalaxyMapData } from '../hooks/useGalaxyMapData';
import { GalaxyMapProvider } from '../providers/GalaxyMapContext';
import { useGalaxyMapRefs } from '../hooks/useGalaxyMapRefs';
import { useGalaxyScene, type GalaxySceneContext } from '../hooks/useGalaxyScene';
import { updateFrame } from '../lib/frame';
import { createAnchorResolver } from '../lib/anchors';
import { GalaxyMapScene } from './GalaxyMapScene';
import { useGalaxyMapContextValue } from '../hooks/useGalaxyMapContextValue';
import './GalaxyMap.scss';

interface GalaxyMapProps {
  focusSystemId?: string | null;
  focusPlanetId?: string | null;
  focusTrigger?: number;
  onSystemSelect?: (
    systemId: string,
    anchor: { x: number; y: number },
  ) => void;
  onPlanetSelect?: (
    planetId: string,
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
  focusPlanetId,
  focusTrigger = 0,
  onSystemSelect,
  onPlanetSelect,
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
    planetAngleRef,
    planetLookupRef,
    blackHoleRef,
    nebulaRef,
    anchorResolverRef,
    syncSceneContext,
  } = refs;

  const handleFrame = useCallback(
    (ctx: GalaxySceneContext, delta: number, elapsed: number) => {
      if (!anchorResolverRef.current) {
        anchorResolverRef.current = createAnchorResolver(
          systemPositionRef.current,
          planetLookupRef.current,
        );
      }
      if (!anchorResolverRef.current || !systemGroupRef.current) {
        return;
      }
      updateFrame({
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
        planetAngleRef,
        nebulaRef,
        blackHoleRef,
        scienceAnchors: scienceAnchorsRef.current,
        fleetAnchors: fleetAnchorsRef.current,
        updateAnchors: anchorResolverRef.current.updateAnchors,
        zoomTargetDirtyRef,
      });
    },
    [
      data.maxZoom,
      data.minZoom,
      anchorResolverRef,
      systemPositionRef,
      planetLookupRef,
      offsetTargetRef,
      zoomTargetRef,
      zoomTargetDirtyRef,
      tiltStateRef,
      tempSphericalRef,
      tempOffsetRef,
      planetAngleRef,
      nebulaRef,
      blackHoleRef,
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
        focusPlanetId={focusPlanetId ?? null}
        focusTrigger={focusTrigger}
        onPlanetSelect={onPlanetSelect}
        onShipyardSelect={onShipyardSelect}
        onClearFocus={onClearFocus}
        onSelectRef={onSelectRef}
        onClearRef={onClearRef}
      />
    </GalaxyMapProvider>
  );
};

