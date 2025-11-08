import { useState, type RefObject } from 'react';
import type { Empire, WarEvent, WarEventType, WarStatus } from '@domain/types';

const warStatusLabel: Record<WarStatus, string> = {
  peace: 'Pace',
  war: 'Guerra',
};

interface WarOverviewProps {
  empires: Empire[];
  sessionTick: number;
}

export const WarOverview = ({ empires, sessionTick }: WarOverviewProps) => {
  const warLog = empires.filter((empire) => empire.kind === 'ai');
  return (
    <div className="panel-section">
      <div className="panel-section__header">
        <h3>Guerre attive</h3>
      </div>
      <ul>
        {warLog.map((empire) => {
          const duration =
            empire.warSince !== null
              ? Math.max(0, sessionTick - (empire.warSince ?? 0))
              : 0;
          return (
            <li key={empire.id}>
              <div className="fleet-row">
                <div>
                  <strong>{empire.name}</strong>
                  <span className="text-muted">
                    Opinione: {empire.opinion}
                  </span>
                  <span className="text-muted">
                    Durata: {duration} tick
                  </span>
                </div>
                <span
                  className={
                    empire.warStatus === 'war'
                      ? 'sentiment-negative'
                      : 'sentiment-positive'
                  }
                >
                  {warStatusLabel[empire.warStatus]}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

interface WarEventsProps {
  warEvents: WarEvent[];
  empires: Empire[];
  unreadWarIds?: Set<string>;
  onMarkWarRead?: () => void;
  warEventsRef?: RefObject<HTMLDivElement>;
}

export const WarEvents = ({
  warEvents,
  empires,
  unreadWarIds,
  onMarkWarRead,
  warEventsRef,
}: WarEventsProps) => {
  const [warFilter, setWarFilter] = useState<'all' | WarEventType>('all');

  const filtered =
    warFilter === 'all'
      ? warEvents
      : warEvents.filter((event) => event.type === warFilter);

  return (
    <div className="panel-section">
      <div className="panel-section__header">
        <h3>Eventi di guerra</h3>
        <label className="fleet-panel__order">
          <span className="text-muted">Filtro</span>
          <select
            value={warFilter}
            onChange={(event) =>
              setWarFilter(event.target.value as 'all' | WarEventType)
            }
          >
            <option value="all">Tutti</option>
            <option value="warStart">Inizio guerra</option>
            <option value="warEnd">Pace</option>
          </select>
        </label>
        {onMarkWarRead ? (
          <button
            className="panel__action panel__action--compact panel__action--inline"
            onClick={onMarkWarRead}
          >
            Segna letti
          </button>
        ) : null}
      </div>
      <ul ref={warEventsRef}>
        {filtered.length === 0 ? (
          <li className="text-muted">Nessun evento registrato.</li>
        ) : (
          filtered.map((event) => {
            const empire = empires.find((e) => e.id === event.empireId);
            const isUnread = unreadWarIds?.has(event.id);
            return (
              <li
                key={event.id}
                className={isUnread ? 'war-event war-event--new' : 'war-event'}
              >
                <div className="fleet-row">
                  <strong>{empire?.name ?? event.empireId}</strong>
                  <span className="text-muted">Tick {event.tick}</span>
                </div>
                <p className="text-muted">{event.message}</p>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
};
