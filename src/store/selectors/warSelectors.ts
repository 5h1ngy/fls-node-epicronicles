import type { RootState } from '../index';

export const selectWarEvents = (state: RootState) =>
  state.game.session?.warEvents ?? [];

export const selectUnreadWarIds = (
  state: RootState,
  lastSeenId: string | null,
) => {
  const events = selectWarEvents(state);
  if (!lastSeenId) {
    return new Set(events.map((e) => e.id));
  }
  const idx = events.findIndex((event) => event.id === lastSeenId);
  const slice = idx >= 0 ? events.slice(idx + 1) : events;
  return new Set(slice.map((event) => event.id));
};
