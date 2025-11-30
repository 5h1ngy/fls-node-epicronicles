import { useEffect, useRef, useMemo, useCallback } from 'react';
import { useGalaxyMapData } from '../hooks/useGalaxyMapData';
import { GalaxyMapProvider, useGalaxyMapContext } from '../providers/GalaxyMapContext';
import { useGalaxyMapRefs } from '../hooks/useGalaxyMapRefs';
import { useGalaxyScene, type GalaxySceneContext } from '../hooks/useGalaxyScene';
import { updateFrame } from '../scene/frameUpdate';
import { useMapInteractions } from '../hooks/useMapInteractions';
import { useSceneRebuild } from '../hooks/useSceneRebuild';
import { useBlackHole } from '../hooks/useBlackHole';
import { useMapFocus } from '../hooks/useMapFocus';
import { createAnchorResolver } from '../scene/anchors';
import {
  scienceMaterials,
  scienceLineMaterials,
  fleetMaterials,
} from '@three/materials';
import './GalaxyMap.scss';

const BASE_TILT = Math.PI / 2;
const MAX_TILT_DOWN = BASE_TILT + Math.PI / 6;

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
    cameraRef,
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
    systemsSignatureRef,
    blackHoleRef,
    nebulaRef,
    anchorResolverRef,
    syncSceneContext,
  } = useGalaxyMapRefs();

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

  const cameraState = useMemo(
    () => ({
      systemGroupRef,
      cameraRef,
      offsetTargetRef,
      zoomTargetRef,
      zoomTargetDirtyRef,
      tiltStateRef,
      tempSphericalRef,
      tempOffsetRef,
    }),
    [
      systemGroupRef,
      cameraRef,
      offsetTargetRef,
      zoomTargetRef,
      zoomTargetDirtyRef,
      tiltStateRef,
      tempSphericalRef,
      tempOffsetRef,
    ],
  );

  const anchorState = useMemo(
    () => ({
      systemPositionRef,
      scienceAnchorsRef,
      fleetAnchorsRef,
      planetAngleRef,
      planetLookupRef,
      systemsSignatureRef,
      blackHoleRef,
      nebulaRef,
      anchorResolverRef,
    }),
    [
      systemPositionRef,
      scienceAnchorsRef,
      fleetAnchorsRef,
      planetAngleRef,
      planetLookupRef,
      systemsSignatureRef,
      blackHoleRef,
      nebulaRef,
      anchorResolverRef,
    ],
  );

  const contextValue = useMemo(
    () => ({
      cameraState,
      anchorState,
      refs: {
        containerRef,
        systemGroupRef,
        cameraRef,
        offsetTargetRef,
        zoomTargetRef,
        tiltStateRef,
        tempSphericalRef,
        tempOffsetRef,
        systemPositionRef,
        scienceAnchorsRef,
        fleetAnchorsRef,
        planetAngleRef,
        planetLookupRef,
        systemsSignatureRef,
        blackHoleRef,
        nebulaRef,
        anchorResolverRef,
        zoomTargetDirtyRef,
        syncSceneContext,
      },
      sceneContext,
      minZoom: data.minZoom,
      maxZoom: data.maxZoom,
      baseTilt: BASE_TILT,
      maxTiltDown: MAX_TILT_DOWN,
    }),
    [
      cameraState,
      anchorState,
      containerRef,
      systemGroupRef,
      cameraRef,
      offsetTargetRef,
      zoomTargetRef,
      tiltStateRef,
      tempSphericalRef,
      tempOffsetRef,
      systemPositionRef,
      scienceAnchorsRef,
      fleetAnchorsRef,
      planetAngleRef,
      planetLookupRef,
      systemsSignatureRef,
      blackHoleRef,
      nebulaRef,
      anchorResolverRef,
      zoomTargetDirtyRef,
      sceneContext,
      data.minZoom,
      data.maxZoom,
      syncSceneContext,
    ],
  );

  return (
    <GalaxyMapProvider value={contextValue}>
      <GalaxyMapInner
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

type GalaxyMapInnerProps = {
  data: ReturnType<typeof useGalaxyMapData>;
  focusSystemId: string | null;
  focusPlanetId: string | null;
  focusTrigger: number;
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
  onSelectRef: React.MutableRefObject<
    ((systemId: string, anchor: { x: number; y: number }) => void) | undefined
  >;
  onClearRef: React.MutableRefObject<(() => void) | undefined>;
};

const GalaxyMapInner = ({
  data,
  focusSystemId,
  focusPlanetId,
  focusTrigger,
  onPlanetSelect,
  onShipyardSelect,
  onClearFocus,
  onSelectRef,
  onClearRef,
}: GalaxyMapInnerProps) => {
  const { refs } = useGalaxyMapContext();
  const { containerRef } = refs;

  useBlackHole();

  useMapInteractions({
    onSelectRef,
    onClearRef,
    onPlanetSelect,
    onShipyardSelect,
  });

  useSceneRebuild({
    systems: data.systems,
    galaxyShape: data.galaxyShape,
    galaxySeed: data.galaxySeed,
    maxSystemRadius: data.maxSystemRadius,
    orbitBaseSpeed: data.orbitBaseSpeed,
    colonizedLookup: data.colonizedLookup,
    recentCombatSystems: data.recentCombatSystems,
    activeBattles: data.activeBattles,
    starVisuals: data.starVisuals,
    scienceShips: data.scienceShips,
    fleets: data.fleets,
    empireWar: data.empireWar,
    systemsSignature: data.systemsSignature,
    scienceMaterials,
    scienceLineMaterials,
    fleetMaterials,
  });

  useMapFocus({
    focusSystemId,
    focusPlanetId,
    focusTrigger,
    systems: data.systems,
    onClearFocus,
  });

  return <div className="galaxy-map" ref={containerRef} />;
};
