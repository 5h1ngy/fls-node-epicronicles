import type { GameNotification, GameSession } from '@domain/types';

export const appendNotification = (
  session: GameSession,
  message: string,
  kind: GameNotification['kind'],
  tick?: number,
): GameSession => {
  const entry: GameNotification = {
    id: `notif-${crypto.randomUUID()}`,
    tick: tick ?? session.clock.tick,
    kind,
    message,
  };
  return {
    ...session,
    notifications: [...session.notifications, entry].slice(-6),
  };
};
