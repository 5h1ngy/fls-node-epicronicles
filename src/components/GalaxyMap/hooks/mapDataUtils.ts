import type { Fleet, StarSystem } from '@domain/types';

export const computeZoomBounds = (maxSystemRadius: number) => {
  const rawMin = Math.min(120, maxSystemRadius * 0.18);
  const minZoom = Math.max(10, rawMin);
  const maxZoom = Math.max(220, maxSystemRadius * 1.5);
  return { minZoom, maxZoom };
};

export const buildFleetSignature = (fleets: Fleet[]) =>
  fleets
    .map(
      (fleet) =>
        `${fleet.id}:${fleet.systemId}:${fleet.targetSystemId ?? ''}:${fleet.anchorPlanetId ?? ''}:${fleet.ticksToArrival ?? 0}`,
    )
    .join('|');

export const buildSystemsSignature = ({
  systems,
  galaxyShape,
  galaxySeed,
  fleetSignature,
}: {
  systems: StarSystem[];
  galaxyShape: 'circle' | 'spiral';
  galaxySeed: string;
  fleetSignature: string;
}) =>
  `${galaxyShape}:${galaxySeed}|` +
  systems
    .map(
      (system) =>
        `${system.id}:${system.visibility}:${system.ownerId ?? ''}:${system.hostilePower ?? 0}:${system.orbitingPlanets.length}:${system.hasShipyard ? 1 : 0}:${system.shipyardAnchorPlanetId ?? ''}:${system.shipyardBuild ? system.shipyardBuild.ticksRemaining : 0}`,
    )
    .join('|') +
  `|F:${fleetSignature}`;
