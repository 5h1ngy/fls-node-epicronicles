import { useGalaxyMapData } from '../hooks/useGalaxyMapData';
import { useGalaxyMapContext } from '../providers/GalaxyMapContext';
import { useMapInteractions } from '../hooks/useMapInteractions';
import { useSceneRebuild } from '../hooks/useSceneRebuild';
import { useMapFocus } from '../hooks/useMapFocus';
import {
  scienceMaterials,
  scienceLineMaterials,
  fleetMaterials,
} from '@three/materials';

type GalaxyMapSceneProps = {
  data: ReturnType<typeof useGalaxyMapData>;
  focusSystemId: string | null;
  focusTrigger: number;
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
  focusTrigger,
  onShipyardSelect,
  onClearFocus,
  onSelectRef,
  onClearRef,
}: GalaxyMapSceneProps) => {
  const { refs } = useGalaxyMapContext();
  const { containerRef } = refs;

  useMapInteractions({
    onSelectRef,
    onClearRef,
    onShipyardSelect,
  });

  useSceneRebuild({
    systems: data.systems,
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
    focusTrigger,
    systems: data.systems,
    onClearFocus,
  });

  return <div className="galaxy-map" ref={containerRef} />;
};
