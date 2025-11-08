import { useState } from 'react';
import { useAppSelector, useGameStore } from '@store/gameStore';
import type { Empire, WarStatus } from '@domain/types';
import { selectEmpires } from '@store/selectors';

const statusLabel: Record<WarStatus, string> = {
  peace: 'Pace',
  war: 'Guerra',
};

const sentiment = (opinion: number) => {
  if (opinion >= 25) return 'positive';
  if (opinion <= -25) return 'negative';
  return 'neutral';
};

export const DiplomacyPanel = () => {
  const hasSession = useGameStore((state) => Boolean(state.session));
  const empires = useAppSelector(selectEmpires);
  const declareWar = useGameStore((state) => state.declareWarOnEmpire);
  const proposePeace = useGameStore((state) => state.proposePeaceWithEmpire);
  const requestBorders = useGameStore((state) => state.requestBorderAccess);
  const [message, setMessage] = useState<string | null>(null);

  const aiEmpires = empires.filter((empire) => empire.kind === 'ai');

  if (!hasSession) {
    return <p className="text-muted">Nessuna sessione attiva.</p>;
  }

  const warCount = aiEmpires.filter((empire) => empire.warStatus === 'war').length;

  const changeMessage = (text: string | null) => setMessage(text);

  const handleAction = (empire: Empire, targetState: WarStatus) => {
    const result =
      targetState === 'war'
        ? declareWar(empire.id)
        : proposePeace(empire.id);
    if (result.success) {
      changeMessage(
        targetState === 'war'
          ? `Guerra dichiarata a ${empire.name}.`
          : `Pace proposta a ${empire.name}.`,
      );
    } else {
      const reasons: Record<string, string> = {
        NO_SESSION: 'Nessuna sessione attiva.',
        EMPIRE_NOT_FOUND: 'Impero non trovato.',
        INVALID_TARGET: 'Bersaglio non valido.',
        ALREADY_IN_STATE: 'Stato diplomatico invariato.',
      };
      changeMessage(reasons[result.reason] ?? 'Azione non disponibile.');
    }
  };

  const handleBorders = (empire: Empire) => {
    const result = requestBorders(empire.id);
    if (result.success) {
      changeMessage(`${empire.name} apre i confini al giocatore.`);
    } else {
      const reasons: Record<string, string> = {
        NO_SESSION: 'Nessuna sessione attiva.',
        EMPIRE_NOT_FOUND: 'Impero non trovato.',
        INVALID_TARGET: 'Bersaglio non valido.',
        ALREADY_GRANTED: 'Confini gia aperti.',
      };
      changeMessage(reasons[result.reason] ?? 'Richiesta non accettata.');
    }
  };

  return (
    <section className="diplomacy-panel">
      <header className="panel-section__header">
        <h3>Diplomazia</h3>
        <span className="text-muted">{warCount} guerre attive</span>
      </header>
      {message ? <p className="panel-message">{message}</p> : null}
      {aiEmpires.length === 0 ? (
        <p className="text-muted">Nessun altro impero conosciuto.</p>
      ) : (
        <ul className="panel-section">
          {aiEmpires.map((empire) => (
            <li key={empire.id}>
              <div className="fleet-row">
                <div>
                  <strong>{empire.name}</strong>
                  <span className="text-muted">
                    Personalita: {empire.personality ?? 'Sconosciuta'}
                  </span>
                  <span
                    className={`text-muted sentiment-${sentiment(empire.opinion)}`}
                  >
                    Opinione: {empire.opinion}
                  </span>
                  <span className="text-muted">
                    Confini: {empire.accessToPlayer ? 'Aperti' : 'Chiusi'}
                  </span>
                </div>
                <span className="text-muted">
                  Stato: {statusLabel[empire.warStatus]}
                </span>
              </div>
              <div className="district-queue__actions">
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
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
