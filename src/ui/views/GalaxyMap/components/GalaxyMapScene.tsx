import { useGalaxyMapData } from '../hooks/useGalaxyMapData';
import { useGalaxyMapContext } from '../providers/GalaxyMapContext';
import { useMapInteractions } from '../hooks/useMapInteractions';
import { useSceneRebuild } from '../hooks/useSceneRebuild';
import { useBlackHole } from '../hooks/useBlackHole';
import { useMapFocus } from '../hooks/useMapFocus';
import {
  scienceMaterials,
  scienceLineMaterials,
  fleetMaterials,
} from '@three/materials';

type GalaxyMapSceneProps = {
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

export const GalaxyMapScene = ({
  data,
  focusSystemId,
  focusPlanetId,
  focusTrigger,
  onPlanetSelect,
  onShipyardSelect,
  onClearFocus,
  onSelectRef,
  onClearRef,
}: GalaxyMapSceneProps) => {
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
    shipDesignLookup: data.shipDesignLookup,
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
