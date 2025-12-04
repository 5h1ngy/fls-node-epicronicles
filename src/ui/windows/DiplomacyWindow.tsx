import { useMemo, useState } from 'react';
import { useAppSelector, useGameStore } from '@store/gameStore';
import type { Empire, WarStatus } from '@domain/types';
import { selectEmpires } from '@store/selectors';
import './DiplomacyWindow.scss';

const statusLabel: Record<WarStatus, string> = {
  peace: 'Pace',
  war: 'Guerra',
};

const sentimentLabel = (opinion: number) => {
  if (opinion >= 25) return 'Amichevole';
  if (opinion <= -25) return 'Ostile';
  return 'Neutro';
};

const sentimentTone = (opinion: number) => {
  if (opinion >= 25) return 'sentiment-positive';
  if (opinion <= -25) return 'sentiment-negative';
  return 'sentiment-neutral';
};

const actionErrors: Record<string, string> = {
  NO_SESSION: 'Nessuna sessione attiva.',
  EMPIRE_NOT_FOUND: 'Impero non trovato.',
  INVALID_TARGET: 'Bersaglio non valido.',
  ALREADY_IN_STATE: 'Stato diplomatico invariato.',
  ALREADY_GRANTED: 'Confini gia aperti.',
};

const diplomacyActionMessage = (
  empire: Empire,
  targetState: WarStatus,
): string =>
  targetState === 'war'
    ? `Guerra dichiarata a ${empire.name}.`
    : `Pace proposta a ${empire.name}.`;

export const DiplomacyWindow = () => {
  const hasSession = useGameStore((state) => Boolean(state.session));
  const empires = useAppSelector(selectEmpires);
  const declareWar = useGameStore((state) => state.declareWarOnEmpire);
  const proposePeace = useGameStore((state) => state.proposePeaceWithEmpire);
  const requestBorders = useGameStore((state) => state.requestBorderAccess);
  const [message, setMessage] = useState<string | null>(null);

  const aiEmpires = useMemo(
    () => empires.filter((empire) => empire.kind === 'ai'),
    [empires],
  );
  const warCount = aiEmpires.filter((empire) => empire.warStatus === 'war').length;
  const peaceCount = aiEmpires.length - warCount;

  if (!hasSession) {
    return <p className="text-muted">Nessuna sessione attiva.</p>;
  }

  const handleAction = (empire: Empire, targetState: WarStatus) => {
    const result =
      targetState === 'war'
        ? declareWar(empire.id)
        : proposePeace(empire.id);
    if (result.success) {
      setMessage(diplomacyActionMessage(empire, targetState));
    } else {
      setMessage(actionErrors[result.reason] ?? 'Azione non disponibile.');
    }
  };

  const handleBorders = (empire: Empire) => {
    const result = requestBorders(empire.id);
    if (result.success) {
      setMessage(`${empire.name} apre i confini al giocatore.`);
    } else {
      setMessage(actionErrors[result.reason] ?? 'Richiesta non accettata.');
    }
  };

  return (
    <section className="diplomacy-panel">
      <header className="diplomacy-panel__header">
        <div>
          <p className="diplomacy-panel__eyebrow">Relazioni tra imperi</p>
          <h2>Diplomazia</h2>
          <p className="text-muted">
            Gestisci stati di guerra, pace e accesso ai confini con gli imperi conosciuti.
          </p>
        </div>
        <div className="diplomacy-panel__summary">
          <span className="pill pill--success">
            Pace: <strong>{peaceCount}</strong>
          </span>
          <span className="pill pill--alert">
            Guerre: <strong>{warCount}</strong>
          </span>
        </div>
      </header>
      {message ? <p className="panel-message">{message}</p> : null}
      {aiEmpires.length === 0 ? (
        <p className="text-muted">Nessun altro impero conosciuto.</p>
      ) : (
        <div className="diplomacy-grid">
          {aiEmpires.map((empire) => (
            <div className="diplomacy-card" key={empire.id}>
              <div className="diplomacy-card__head">
                <div>
                  <p className="diplomacy-card__eyebrow">Impero</p>
                  <h3>{empire.name}</h3>
                  <span className={`diplomacy-status status-${empire.warStatus}`}>
                    {statusLabel[empire.warStatus]}
                  </span>
                </div>
                <div className="diplomacy-card__sentiment">
                  <span className={`sentiment-badge ${sentimentTone(empire.opinion)}`}>
                    {sentimentLabel(empire.opinion)}
                  </span>
                  <small>Opinione: {empire.opinion}</small>
                </div>
              </div>
              <div className="diplomacy-card__body">
                <div className="diplomacy-meta">
                  <span>
                    Personalità:{' '}
                    <strong>{empire.personality ?? 'Sconosciuta'}</strong>
                  </span>
                  <span>
                    Confini:{' '}
                    <strong>{empire.accessToPlayer ? 'Aperti' : 'Chiusi'}</strong>
                  </span>
                </div>
                <div className="diplomacy-actions">
                  {empire.warStatus === 'peace' ? (
                    <button
                      className="panel__action panel__action--compact"
                      onClick={() => handleAction(empire, 'war')}
                    >
                      Dichiara guerra
                    </button>
                  ) : (
                    <button
                      className="panel__action panel__action--compact"
                      onClick={() => handleAction(empire, 'peace')}
                    >
                      Proponi pace
                    </button>
                  )}
                  {empire.warStatus === 'peace' ? (
                    <button
                      className="panel__action panel__action--compact"
                      onClick={() => handleBorders(empire)}
                      disabled={empire.accessToPlayer}
                    >
                      Richiedi accesso confini
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
