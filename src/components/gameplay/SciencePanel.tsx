import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { ScienceShipStatus } from '../../domain/types';

const statusLabel: Record<ScienceShipStatus, string> = {
  idle: 'In stazione',
  traveling: 'In viaggio',
  surveying: 'Sondando',
};

const orderErrors = {
  NO_SESSION: 'Nessuna sessione attiva.',
  SHIP_NOT_FOUND: 'Nave scientifica non trovata.',
  SYSTEM_NOT_FOUND: 'Sistema non valido.',
} as const;

interface SciencePanelProps {
  onFocusSystem: (systemId: string) => void;
}

export const SciencePanel = ({ onFocusSystem }: SciencePanelProps) => {
  const session = useGameStore((state) => state.session);
  const ships = session?.scienceShips ?? [];
  const systems = session?.galaxy.systems ?? [];
  const orderScienceShip = useGameStore((state) => state.orderScienceShip);
  const setScienceAutoExplore = useGameStore(
    (state) => state.setScienceAutoExplore,
  );
  const [message, setMessage] = useState<string | null>(null);

  if (!session || ships.length === 0) {
    return (
      <p className="text-muted">
        Nessuna nave scientifica disponibile in questa sessione.
      </p>
    );
  }

  const resolveSystemName = (id: string | null): string => {
    if (!id) {
      return '-';
    }
    return systems.find((system) => system.id === id)?.name ?? id;
  };

  const handleOrder = (shipId: string, systemId: string) => {
    const result = orderScienceShip(shipId, systemId);
    if (result.success) {
      setMessage('Rotta scientifica impostata.');
    } else {
      setMessage(orderErrors[result.reason]);
    }
  };

  const handleAutoToggle = (shipId: string, auto: boolean) => {
    setScienceAutoExplore(shipId, auto);
    setMessage(auto ? 'Auto-esplorazione attivata.' : 'Controllo manuale attivo.');
  };

  const systemOptions = systems.map((system) => ({
    id: system.id,
    label: `${system.name} (${system.visibility})`,
  }));

  return (
    <section className="science-panel">
      {message ? <p className="panel-message">{message}</p> : null}
      <ul className="science-panel__list">
        {ships.map((ship) => (
          <li key={ship.id}>
            <div className="science-panel__header">
              <div>
                <strong>{ship.name}</strong>
                <span className="text-muted">
                  Stato: {statusLabel[ship.status]}
                </span>
                <span className="text-muted">
                  Sistema: {resolveSystemName(ship.currentSystemId)}
                </span>
                {ship.targetSystemId ? (
                  <span className="text-muted">
                    Destinazione: {resolveSystemName(ship.targetSystemId)} (
                    {ship.ticksRemaining} tick)
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                className="panel__action panel__action--compact"
                onClick={() =>
                  ship.currentSystemId
                    ? onFocusSystem(ship.currentSystemId)
                    : undefined
                }
                disabled={!ship.currentSystemId}
              >
                Centra
              </button>
            </div>
            <label className="science-panel__order">
              Destinazione
              <select
                value={ship.targetSystemId ?? ship.currentSystemId ?? ''}
                onChange={(event) => handleOrder(ship.id, event.target.value)}
              >
                {systemOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="science-panel__auto">
              <input
                type="checkbox"
                checked={ship.autoExplore}
                onChange={(event) =>
                  handleAutoToggle(ship.id, event.target.checked)
                }
              />
              Auto-esplorazione
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
};
