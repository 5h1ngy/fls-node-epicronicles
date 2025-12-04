import type { GameSession, WarEvent, WarEventType } from '@domain/types';

export const appendWarEvent = (
  session: GameSession,
  type: WarEventType,
  empireId: string,
  tick: number,
  message: string,
): GameSession => {
  const event: WarEvent = {
    id: `war-${crypto.randomUUID()}`,
    type,
    empireId,
    tick,
    message,
  };
  return {
    ...session,
    warEvents: [...session.warEvents, event].slice(-12),
  };
};
