import { useMemo } from 'react';
import { useGameStore } from '@store/gameStore';

export const DebugConsole = () => {
  const session = useGameStore((state) => state.session);

  const rawJson = useMemo(() => {
    if (!session) return null;
    return JSON.stringify(session, null, 2);
  }, [session]);

  if (!rawJson) {
    return <p className="text-muted">Nessuna sessione attiva.</p>;
  }

  return <pre className="debug-json">{rawJson}</pre>;
};
