import { useMemo } from 'react';
import { useGameStore } from '@store/gameStore';
import '../styles/components/EventLogPanels.scss';

type LogEntry =
  | { kind: 'notification'; tick: number; message: string; label: string }
  | { kind: 'war'; tick: number; message: string; label: string };

export const LogPanel = () => {
  const session = useGameStore((state) => state.session);

  const entries = useMemo<LogEntry[]>(() => {
    if (!session) return [];
    const notificationEntries: LogEntry[] = session.notifications.map((notif) => ({
      kind: 'notification',
      tick: notif.tick,
      message: notif.message,
      label: notif.kind,
    }));
    const warEntries: LogEntry[] = session.warEvents.map((event) => ({
      kind: 'war',
      tick: event.tick,
      message: event.message,
      label: 'evento guerra',
    }));
    return [...notificationEntries, ...warEntries].sort((a, b) => b.tick - a.tick);
  }, [session]);

  if (!session) {
    return <p className="text-muted">Nessuna sessione attiva.</p>;
  }

  return (
    <section className="log-panel">
      <header className="panel-section__header">
        <div>
          <p className="economy-modal__eyebrow">Log di sessione</p>
          <h2>Eventi & Notifiche</h2>
          <p className="text-muted">Tutte le notifiche di gioco, incluse anomalie, eventi e guerre.</p>
        </div>
        <span className="pill">Totale: {entries.length}</span>
      </header>
      <div className="log-panel__list">
        {entries.length === 0 ? (
          <p className="text-muted">Nessuna notifica registrata.</p>
        ) : (
          <ul>
            {entries.map((entry, index) => (
              <li key={`${entry.kind}-${index}-${entry.tick}`}>
                <div className="log-row">
                  <span className={`log-badge log-badge--${entry.kind}`}>
                    {entry.label}
                  </span>
                  <span className="log-tick">t{entry.tick}</span>
                  <span className="log-message">{entry.message}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};
