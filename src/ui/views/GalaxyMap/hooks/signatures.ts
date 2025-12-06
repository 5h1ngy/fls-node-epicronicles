import type { Fleet, StarSystem } from '@domain/types';

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
  galaxyShape: import('@domain/galaxy/galaxy').GalaxyShape;
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
