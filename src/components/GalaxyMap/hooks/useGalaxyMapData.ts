import { useMemo } from 'react';
import { useGameStore } from '@store/gameStore';
import type { StarSystem, ScienceShip, Fleet } from '@domain/types';

export interface GalaxyMapData {
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
}

export const useGalaxyMapData = (): GalaxyMapData => {
  const systems = useGameStore((state) => state.session?.galaxy.systems ?? []);
  const colonies = useGameStore((state) => state.session?.economy.planets ?? []);
  const scienceShips = useGameStore(
    (state) => state.session?.scienceShips ?? [],
  );
  const fleets = useGameStore((state) => state.session?.fleets ?? []);
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
  const orbitBaseSpeed = useGameStore((state) => state.config.map.orbitSpeed);

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
      const r = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
      return Math.max(max, r);
    }, 0);
  }, [systems]);

  const minZoom = useMemo(
    () => Math.max(0, Math.min(10, maxSystemRadius * 0.18)),
    [maxSystemRadius],
  );
  const maxZoom = useMemo(
    () => Math.max(220, maxSystemRadius * 1.5),
    [maxSystemRadius],
  );

  const fleetSignature = useMemo(
    () =>
      fleets
        .map(
          (fleet) =>
            `${fleet.id}:${fleet.systemId}:${fleet.targetSystemId ?? ''}:${fleet.anchorPlanetId ?? ''}:${fleet.ticksToArrival ?? 0}`,
        )
        .join('|'),
    [fleets],
  );

  const systemsSignature = useMemo(
    () =>
      `${galaxyShape}:${galaxySeed}|` +
      systems
        .map(
          (system) =>
            `${system.id}:${system.visibility}:${system.ownerId ?? ''}:${system.hostilePower ?? 0}:${system.orbitingPlanets.length}:${system.hasShipyard ? 1 : 0}:${system.shipyardAnchorPlanetId ?? ''}:${system.shipyardBuild ? system.shipyardBuild.ticksRemaining : 0}`,
        )
        .join('|') +
      `|F:${fleetSignature}`,
    [systems, galaxyShape, galaxySeed, fleetSignature],
  );

  return {
    systems,
    scienceShips,
    fleets,
    galaxyShape,
    galaxySeed,
    starVisuals,
    empireWar,
    recentCombatSystems,
    activeBattles,
    orbitBaseSpeed,
    colonizedLookup,
    maxSystemRadius,
    minZoom,
    maxZoom,
    systemsSignature,
  };
};
