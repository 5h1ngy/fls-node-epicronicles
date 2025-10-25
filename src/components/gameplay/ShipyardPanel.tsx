import { useMemo, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { resourceLabels } from '../../domain/resourceMetadata';
import type { ShipClassId } from '../../domain/types';

const buildMessages = {
  NO_SESSION: 'Nessuna sessione.',
  INVALID_DESIGN: 'Progetto nave non valido.',
  QUEUE_FULL: 'Coda cantieri piena.',
  INSUFFICIENT_RESOURCES: 'Risorse insufficienti.',
} as const;

export const ShipyardPanel = () => {
  const session = useGameStore((state) => state.session);
  const designs = useGameStore((state) => state.config.military.shipDesigns);
  const queueLimit = useGameStore(
    (state) => state.config.military.shipyard.queueSize,
  );
  const queueShipBuild = useGameStore((state) => state.queueShipBuild);
  const [message, setMessage] = useState<string | null>(null);

  const resources = session?.economy.resources;
  const queue = session?.shipyardQueue ?? [];

  const canAfford = (designCost: Record<string, number | undefined>) => {
    if (!resources) {
      return false;
    }
    return Object.entries(designCost).every(([type, amount]) => {
      if (!amount) {
        return true;
      }
      const ledger = resources[type as keyof typeof resources];
      return (ledger?.amount ?? 0) >= amount;
    });
  };

  const queueUsage = `${queue.length}/${queueLimit}`;

  const handleBuild = (designId: ShipClassId, designName: string) => {
    const result = queueShipBuild(designId);
    if (result.success) {
      setMessage(`Costruzione ${designName} avviata.`);
    } else {
      setMessage(buildMessages[result.reason]);
    }
  };

  if (!session) {
    return null;
  }

  const queueWithProgress = useMemo(
    () =>
      queue.map((task) => ({
        ...task,
        progress:
          1 - task.ticksRemaining / Math.max(1, task.totalTicks),
      })),
    [queue],
  );

  return (
    <section className="shipyard-panel">
      <header>
        <h3>Cantieri</h3>
        <span className="text-muted">Coda: {queueUsage}</span>
      </header>
      {message ? <p className="panel-message">{message}</p> : null}
      <div className="shipyard-panel__designs">
        {designs.map((design) => {
          const affordable = canAfford(design.buildCost);
          const disabled = queue.length >= queueLimit || !affordable;
          return (
            <div key={design.id} className="shipyard-panel__card">
              <strong>{design.name}</strong>
              <span className="text-muted">
                Tempo: {design.buildTime} tick
              </span>
              <p>
                Costi:{' '}
                {Object.entries(design.buildCost)
                  .filter(([, amount]) => amount && amount > 0)
                  .map(
                    ([type, amount]) =>
                      `${resourceLabels[type as keyof typeof resourceLabels]} ${amount}`,
                  )
                  .join(' | ')}
              </p>
              <button
                className="panel__action panel__action--compact"
                disabled={disabled}
                onClick={() => handleBuild(design.id, design.name)}
              >
                Costruisci
              </button>
            </div>
          );
        })}
      </div>
      <div className="shipyard-panel__queue">
        <h4>Coda costruzione</h4>
        {queueWithProgress.length === 0 ? (
          <p className="text-muted">Nessuna nave in costruzione.</p>
        ) : (
          <ul>
            {queueWithProgress.map((task) => (
              <li key={task.id}>
                <span>{task.designId}</span>
                <span className="text-muted">
                  {task.ticksRemaining} tick
                </span>
                <div className="progress-bar">
                  <div
                    className="progress-bar__fill"
                    style={{ width: `${Math.round(task.progress * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};
