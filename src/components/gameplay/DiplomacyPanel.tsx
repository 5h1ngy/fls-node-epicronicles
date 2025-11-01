import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { Empire, WarStatus } from '../../domain/types';

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
  const session = useGameStore((state) => state.session);
  const empires = session?.empires ?? [];
  const declareWar = useGameStore((state) => state.declareWarOnEmpire);
  const proposePeace = useGameStore((state) => state.proposePeaceWithEmpire);
  const [message, setMessage] = useState<string | null>(null);

  const aiEmpires = empires.filter((empire) => empire.kind === 'ai');

  if (!session) {
    return <p className="text-muted">Nessuna sessione attiva.</p>;
  }

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

  return (
    <section className="diplomacy-panel">
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
                    Personalit&#224;: {empire.personality ?? 'Sconosciuta'}
                  </span>
                  <span
                    className={`text-muted sentiment-${sentiment(empire.opinion)}`}
                  >
                    Opinione: {empire.opinion}
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
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
