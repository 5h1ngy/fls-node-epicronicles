/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react';
import type { GameSession } from '@domain/types';

const WAR_SEEN_KEY = 'warSeen';

const loadWarSeen = (sessionId: string): string | null => {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  try {
    const raw = localStorage.getItem(WAR_SEEN_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed[sessionId] ?? null;
  } catch {
    return null;
  }
};

const saveWarSeen = (sessionId: string, eventId: string | null) => {
  if (typeof localStorage === 'undefined') {
    return;
  }
  try {
    const raw = localStorage.getItem(WAR_SEEN_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    if (eventId) {
      parsed[sessionId] = eventId;
    } else {
      delete parsed[sessionId];
    }
    localStorage.setItem(WAR_SEEN_KEY, JSON.stringify(parsed));
  } catch {
    /* ignore */
  }
};

export const useWarEvents = (session: GameSession | null) => {
  const [lastSeenWarId, setLastSeenWarId] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      setLastSeenWarId(null);
      return;
    }
    const storedSeen = loadWarSeen(session.id);
    setLastSeenWarId(storedSeen);
  }, [session]);

  const unreadWarIds = useMemo(() => {
    if (!session) {
      return new Set<string>();
    }
    if (!lastSeenWarId) {
      return new Set(session.warEvents.map((event) => event.id));
    }
    const markerIndex = session.warEvents.findIndex(
      (event) => event.id === lastSeenWarId,
    );
    const slice =
      markerIndex >= 0
        ? session.warEvents.slice(markerIndex + 1)
        : session.warEvents;
    return new Set(slice.map((event) => event.id));
  }, [session, lastSeenWarId]);

  const warUnread = unreadWarIds.size;

  const markWarsRead = () => {
    if (!session?.warEvents?.length) {
      setLastSeenWarId(null);
      return;
    }
    const lastId = session.warEvents.at(-1)?.id ?? null;
    setLastSeenWarId(lastId);
    if (session) {
      saveWarSeen(session.id, lastId);
    }
  };

  return {
    warUnread,
    lastSeenWarId,
    setLastSeenWarId,
    unreadWarIds,
    markWarsRead,
    persistLastSeen: (eventId: string | null) => {
      if (session) {
        saveWarSeen(session.id, eventId);
      }
    },
  };
};
