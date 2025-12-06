import { useMemo } from 'react';
import { useGameStore } from '@store/gameStore';
import type { StarSystem, ScienceShip, Fleet, ShipDesign } from '@domain/types';
import { computeZoomBounds } from './mapDataUtils';
import { buildFleetSignature, buildSystemsSignature } from './signatures';

export interface GalaxyMapData {
  systems: StarSystem[];
  scienceShips: ScienceShip[];
  fleets: Fleet[];
  shipDesignLookup: Map<string, ShipDesign>;
  galaxyShape: import('@domain/galaxy/galaxy').GalaxyShape;
  galaxySeed: string;
  starVisuals: Record<string, unknown>;
  empireWar: boolean;
  recentCombatSystems: Set<string>;
  activeBattles: Set<string>;
  colonizedLookup: Map<string, { id: string; name: string }>;
  maxSystemRadius: number;
  minZoom: number;
  maxZoom: number;
  systemsSignature: string;
}

export const useGalaxyMapData = (): GalaxyMapData => {
  const systems = useGameStore((state) => state.session?.galaxy.systems ?? []);
  const colonies = useGameStore((state) => state.session?.economy.planets ?? []);
  const scienceShips = useGameStore(
    (state) => state.session?.scienceShips ?? [],
  );
  const fleets = useGameStore((state) => state.session?.fleets ?? []);
  const shipDesigns = useGameStore(
    (state) => state.config.military.shipDesigns,
  );
  const galaxyShape = useGameStore(
    (state) => state.session?.galaxy.galaxyShape ?? 'circle',
  );
  const galaxySeed = useGameStore(
    (state) => state.session?.galaxy.seed ?? 'default',
  );
  const starVisuals = useGameStore((state) => state.config.starVisuals);
  const empireWar = useGameStore(
    (state) =>
      state.session?.empires.some(
        (empire) => empire.kind === 'ai' && empire.warStatus === 'war',
      ) ?? false,
  );

  const combatReports = useGameStore(
    (state) => state.session?.combatReports ?? [],
  );

  const recentCombatSystems = useMemo(
    () =>
      new Set(
        combatReports.slice(-3).map((report) => report.systemId),
      ),
    [combatReports],
  );

  const activeBattles = useMemo(() => {
    const hostileSet = new Set(
      systems
        .filter((system) => (system.hostilePower ?? 0) > 0)
        .map((system) => system.id),
    );
    const current = fleets
      .filter(
        (fleet) =>
          hostileSet.has(fleet.systemId) && fleet.targetSystemId === null,
      )
      .map((fleet) => fleet.systemId);
    return new Set(current);
  }, [fleets, systems]);

  const colonizedLookup = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    colonies.forEach((planet) => {
      if (planet.systemId) {
        map.set(planet.systemId, { id: planet.id, name: planet.name });
      }
    });
    return map;
  }, [colonies]);

  const maxSystemRadius = useMemo(() => {
    if (!systems.length) {
      return 400;
    }
    return systems.reduce((max, system) => {
      const pos = system.mapPosition ?? system.position;
      const depth = pos.y ?? 0;
      const r = Math.sqrt(pos.x * pos.x + depth * depth);
      return Math.max(max, r);
    }, 0);
  }, [systems]);

  const { minZoom, maxZoom } = useMemo(
    () => computeZoomBounds(maxSystemRadius),
    [maxSystemRadius],
  );

  const fleetSignature = useMemo(
    () => buildFleetSignature(fleets),
    [fleets],
  );

  const shipDesignLookup = useMemo(
    () => new Map(shipDesigns.map((design) => [design.id, design])),
    [shipDesigns],
  );

  const systemsSignature = useMemo(
    () =>
      buildSystemsSignature({
        systems,
        galaxyShape,
        galaxySeed,
        fleetSignature,
      }),
    [systems, galaxyShape, galaxySeed, fleetSignature],
  );

  return {
    systems,
    scienceShips,
    fleets,
    shipDesignLookup,
    galaxyShape,
    galaxySeed,
    starVisuals,
    empireWar,
    recentCombatSystems,
    activeBattles,
    colonizedLookup,
    maxSystemRadius,
    minZoom,
    maxZoom,
    systemsSignature,
  };
};
