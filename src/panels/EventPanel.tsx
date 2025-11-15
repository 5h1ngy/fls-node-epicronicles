import { useMemo, useState } from 'react';
import { useAppSelector, useGameStore } from '@store/gameStore';
import {
  selectEvents,
  selectSessionTick,
} from '@store/selectors';
import type { GameEvent, EventOption } from '@domain/types';
import { canAffordOption, formatOptionCost } from '@domain/events/events';
import '../styles/components/EventLogPanels.scss';

export const EventPanel = () => {
  const events = useAppSelector(selectEvents);
  const tick = useAppSelector(selectSessionTick);
  const session = useGameStore((state) => state.session);
  const resolveActiveEvent = useGameStore((state) => state.resolveActiveEvent);
  const [message, setMessage] = useState<string | null>(null);

  const activeEvent: GameEvent | null = events?.active ?? null;
  const log = useMemo(() => events?.log ?? [], [events]);

  if (!session) {
    return <p className="text-muted">Nessuna sessione attiva.</p>;
  }

  const handleResolve = (option: EventOption) => {
    if (!activeEvent) {
      return;
    }
    const result = resolveActiveEvent(option.id);
    if (result.success) {
      setMessage('Evento risolto.');
    } else {
      setMessage('Azione non disponibile.');
    }
  };

  return (
    <div className="panel event-panel">
      <header className="panel-section__header">
        <h4>Eventi & Anomalie</h4>
        {message ? <span className="panel-message">{message}</span> : null}
      </header>
      {activeEvent ? (
        <div className="event-card">
          <div className="event-card__header">
            <div>
              <div className="event-card__title">{activeEvent.title}</div>
              <p className="text-muted">{activeEvent.description}</p>
            </div>
            <span className="event-card__badge">
              {activeEvent.kind === 'crisis'
                ? 'Crisi'
                : activeEvent.kind === 'anomaly'
                  ? 'Anomalia'
                  : 'Evento'}
            </span>
          </div>
          <div className="event-card__options">
            {activeEvent.options.map((option) => {
              const affordable = canAffordOption(session, option);
              const costLabel = formatOptionCost(option);
              return (
                <button
                  key={option.id}
                  className="panel__action"
                  onClick={() => handleResolve(option)}
                  disabled={!affordable}
                >
                  <div className="event-card__option-title">{option.label}</div>
                  <p className="text-muted">{option.description}</p>
                  {costLabel ? (
                    <small className="text-muted">Costo: {costLabel}</small>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-muted">Nessun evento attivo.</p>
      )}

      <div className="panel-section">
        <strong>Registro</strong>
        <div className="event-log">
          {log.length === 0 ? (
            <p className="text-muted">Ancora nessun evento risolto.</p>
          ) : (
            <ul>
              {log
                .slice()
                .reverse()
                .map((entry) => (
                  <li key={entry.id}>
                    <div className="event-log__row">
                      <span className="event-log__title">{entry.title}</span>
                      <span className="text-muted">Tick {entry.tick}</span>
                    </div>
                    <div className="text-muted">{entry.result}</div>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
      <div className="text-muted" style={{ fontSize: '0.75rem' }}>
        Tick: {tick}
      </div>
    </div>
  );
};
