import type { GameConfig } from '@config/gameConfig';
import type { Empire, GameSession, WarStatus } from '@domain/types';

export const tickDurationMs = (cfg: GameConfig) =>
  Math.max(16, Math.round(1000 / cfg.ticksPerSecond));

export const detachColonyShip = (
  fleets: GameSession['fleets'],
  colonyDesignId: string,
) => {
  for (const fleet of fleets) {
    if (fleet.ownerId && fleet.ownerId !== 'player') {
      continue;
    }
    const shipIndex = fleet.ships.findIndex(
      (ship) => ship.designId === colonyDesignId,
    );
    if (shipIndex < 0) {
      continue;
    }
    const ship = fleet.ships[shipIndex];
    const remainingShips = fleet.ships.filter((_, idx) => idx !== shipIndex);
    const updatedFleets =
      remainingShips.length > 0
        ? fleets.map((entry) =>
            entry.id === fleet.id ? { ...entry, ships: remainingShips } : entry,
          )
        : fleets.filter((entry) => entry.id !== fleet.id);
    return { shipId: ship.id, fleets: updatedFleets };
  }
  return null;
};

export const setEmpireWarStatus = (
  empires: Empire[],
  targetId: string,
  status: WarStatus,
  opinionDelta = 0,
  warSince?: number | null,
): Empire[] => {
  let changed = false;
  const updated = empires.map((empire) => {
    if (empire.id !== targetId) {
      return empire;
    }
    changed = true;
    const nextWarSince =
      status === 'war' ? warSince ?? empire.warSince ?? 0 : null;
    return {
      ...empire,
      warStatus: status,
      warSince: nextWarSince,
      opinion: empire.opinion + opinionDelta,
    };
  });
  return changed ? updated : empires;
};

export const createFleetFromShip = ({
  ship,
  systemId,
  ownerId,
}: {
  ship: GameSession['fleets'][number]['ships'][number];
  systemId: string;
  ownerId?: string;
}) => ({
  id: `FLEET-${crypto.randomUUID()}`,
  name: 'Nuova flotta',
  ownerId,
  systemId,
  targetSystemId: null,
  ticksToArrival: 0,
  ships: [ship],
});
