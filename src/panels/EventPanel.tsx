import { useMemo, useState } from 'react';
import { useAppSelector, useGameStore } from '@store/gameStore';
import { selectEvents, selectSessionTick } from '@store/selectors';
import type { GameEvent, EventOption } from '@domain/types';
import { canAffordOption, formatOptionCost } from '@domain/events/events';
import './EventLogPanels.scss';
import './EventPanel.scss';

const kindLabel = (kind: GameEvent['kind']) =>
  kind === 'crisis' ? 'Crisi' : kind === 'anomaly' ? 'Anomalia' : 'Evento';

const OptionCard = ({
  option,
  affordable,
  onSelect,
}: {
  option: EventOption;
  affordable: boolean;
  onSelect: (option: EventOption) => void;
}) => {
  const costLabel = formatOptionCost(option);
  return (
    <button
      key={option.id}
      className={`event-option ${affordable ? '' : 'is-disabled'}`}
      onClick={() => onSelect(option)}
      disabled={!affordable}
    >
      <div className="event-option__header">
        <span className="event-option__title">{option.label}</span>
        {costLabel ? <span className="event-option__cost">{costLabel}</span> : null}
      </div>
      <p className="event-option__desc">{option.description}</p>
    </button>
  );
};

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
    setMessage(result.success ? 'Evento risolto.' : 'Azione non disponibile.');
  };

  return (
    <div className="event-panel-modern">
      <div className="event-panel-modern__body">
        <section className="event-panel-modern__active">
          <header className="event-panel-modern__header">
            <div className="pill pill--muted">In corso</div>
            <div className="event-panel-modern__meta">
              <span className="pill">Tick {tick}</span>
              {message ? <span className="pill pill--success">{message}</span> : null}
            </div>
          </header>
          {activeEvent ? (
            <div className="event-hero">
              <div className="event-hero__badge">{kindLabel(activeEvent.kind)}</div>
              <div className="event-hero__title">{activeEvent.title}</div>
              <p className="event-hero__desc">{activeEvent.description}</p>
              <div className="event-hero__options">
                {activeEvent.options.map((option) => (
                  <OptionCard
                    key={option.id}
                    option={option}
                    affordable={canAffordOption(session, option)}
                    onSelect={handleResolve}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="event-empty">
              <p className="eyebrow">Nessun evento attivo</p>
              <p className="text-muted">Attendi l'arrivo di nuove anomalie o notifiche.</p>
            </div>
          )}
        </section>

        <section className="event-panel-modern__log">
          <header className="event-log__header">
            <p className="eyebrow">Registro</p>
          </header>
          <div className="event-timeline">
            {log.length === 0 ? (
              <p className="text-muted">Ancora nessun evento risolto.</p>
            ) : (
              <ul>
                {log
                  .slice()
                  .reverse()
                  .map((entry) => (
                    <li key={entry.id} className="event-timeline__item">
                      <div className="event-timeline__meta">
                        <span className="pill">Tick {entry.tick}</span>
                        <span className="event-timeline__title">{entry.title}</span>
                      </div>
                      <p className="event-timeline__result">{entry.result}</p>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
