import type { MutableRefObject } from 'react';
import type { StarSystem, ScienceShip, Fleet } from '@domain/types';

export interface GalaxyMapControllerParams {
  data: {
    systems: StarSystem[];
    scienceShips: ScienceShip[];
    fleets: Fleet[];
    galaxyShape: 'circle' | 'spiral';
    galaxySeed: string;
    starVisuals: Record<string, unknown>;
    empireWar: boolean;
    recentCombatSystems: Set<string>;
    activeBattles: Set<string>;
    orbitBaseSpeed: number;
    colonizedLookup: Map<string, { id: string; name: string }>;
    maxSystemRadius: number;
    minZoom: number;
    maxZoom: number;
    systemsSignature: string;
  };
  focus: {
    focusSystemId: string | null | undefined;
    focusPlanetId: string | null | undefined;
    focusTrigger: number;
  };
  callbacks: {
    onPlanetSelect?: (planetId: string, systemId: string, anchor: { x: number; y: number }) => void;
    onShipyardSelect?: (systemId: string, anchor: { x: number; y: number }) => void;
    onSelectRef: MutableRefObject<((systemId: string, anchor: { x: number; y: number }) => void) | undefined>;
    onClearRef: MutableRefObject<(() => void) | undefined>;
  };
}
