import type { GalaxyState, Fleet, GameSession } from './types';
import { createInitialFleet } from './ships';
import { calculateTravelTicks } from './fleets';
import type { MilitaryConfig } from '../config/gameConfig';

const chooseTargetSystem = (
  galaxy: GalaxyState,
  avoidSystemId: string,
): string | null => {
  const hostile = galaxy.systems.filter(
    (system) =>
      system.hostilePower && system.hostilePower > 0 && system.id !== avoidSystemId,
  );
  if (hostile.length === 0) {
    return null;
  }
  return hostile[Math.floor(Math.random() * hostile.length)]?.id ?? null;
};

export const ensureAiFleet = (
  session: GameSession,
  military: MilitaryConfig,
): GameSession => {
  const aiFleet = session.fleets.find(
    (fleet) => fleet.ownerId && fleet.ownerId !== 'player',
  );
  if (aiFleet) {
    return session;
  }
  const homeSystem = session.galaxy.systems[1]?.id ?? session.galaxy.systems[0]?.id;
  if (!homeSystem) {
    return session;
  }
  const newFleet = createInitialFleet(homeSystem, military, 'ai-1');
  return {
    ...session,
    fleets: [...session.fleets, newFleet],
  };
};

export const advanceAiWarMoves = ({
  session,
  military,
}: {
  session: GameSession;
  military: MilitaryConfig;
}): GameSession => {
  const aiEmpires = session.empires.filter(
    (empire) => empire.kind === 'ai' && empire.warStatus === 'war',
  );
  if (aiEmpires.length === 0) {
    return session;
  }
  const fleets = session.fleets.map((fleet) => ({ ...fleet }));
  let changed = false;
  aiEmpires.forEach((empire) => {
    const fleet = fleets.find((entry) => entry.ownerId === empire.id);
    if (!fleet || fleet.targetSystemId) {
      return;
    }
    const target = chooseTargetSystem(
      session.galaxy,
      fleet.systemId,
    );
    if (!target) {
      return;
    }
    const travelTicks = calculateTravelTicks(
      fleet.systemId,
      target,
      session.galaxy,
      { ...military, fleet: military.fleet },
    );
    fleet.targetSystemId = target;
    fleet.ticksToArrival = Math.max(1, travelTicks);
    changed = true;
  });
  if (!changed) {
    return session;
  }
  return { ...session, fleets };
};
