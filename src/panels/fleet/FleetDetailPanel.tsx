import { useMemo, useState } from 'react';
import type {
  Fleet,
  FleetMergeResult,
  FleetSplitResult,
  ScienceShip,
  ScienceShipStatus,
  ShipDesign,
  StarSystem,
} from '@domain/types';

import '../../styles/components/FleetShared.scss';

const fleetOrderErrors = {
  NO_SESSION: 'Nessuna sessione.',
  FLEET_NOT_FOUND: 'Flotta non trovata.',
  SYSTEM_NOT_FOUND: 'Sistema non valido.',
  ALREADY_IN_SYSTEM: 'La flotta è già nel sistema.',
  NO_SHIPS: 'La flotta non ha navi.',
  BORDER_CLOSED: 'Confini chiusi: richiedi accesso o dichiara guerra.',
} as const;

const fleetManageErrors: Record<string, string> = {
  NO_SESSION: 'Nessuna sessione attiva.',
  FLEET_NOT_FOUND: 'Flotta non trovata.',
  TARGET_NOT_FOUND: 'Flotta bersaglio non trovata.',
  SAME_FLEET: 'Seleziona una flotta diversa.',
  DIFFERENT_SYSTEM: 'Le flotte devono essere nello stesso sistema.',
  INSUFFICIENT_SHIPS: 'Servono almeno 2 navi per dividere.',
};

const scienceStatusLabel: Record<ScienceShipStatus, string> = {
  idle: 'In stazione',
  traveling: 'In viaggio',
  surveying: 'Sondando',
};

const describeFleetShips = (
  ships: Fleet['ships'],
  designLookup: Map<string, ShipDesign>,
) => {
  const counts = ships.reduce<Record<string, number>>((acc, ship) => {
    const key: string = ship.designId;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts)
    .map(([designId, count]) => {
      const design = designLookup.get(designId);
      return `${design?.name ?? designId} x${count}`;
    })
    .join(', ');
};

interface FleetDetailPanelProps {
  fleet: Fleet;
  fleets: Fleet[];
  systems: StarSystem[];
  scienceShips: ScienceShip[];
  designs: ShipDesign[];
  onOrder: (fleetId: string, systemId: string) => {
    success: boolean;
    reason?: keyof typeof fleetOrderErrors;
  };
  onMerge: (sourceId: string, targetId: string) => FleetMergeResult;
  onSplit: (fleetId: string) => FleetSplitResult;
  onClose: () => void;
}

export const FleetDetailPanel = ({
  fleet,
  fleets,
  systems,
  scienceShips,
  designs,
  onOrder,
  onMerge,
  onSplit,
  onClose,
}: FleetDetailPanelProps) => {
  const [message, setMessage] = useState<string | null>(null);
  const designLookup = useMemo(
    () => new Map(designs.map((design) => [design.id, design])),
    [designs],
  );
  const resolveName = (systemId: string) =>
    systems.find((system) => system.id === systemId)?.name ?? systemId;
  const surveyedSystems = systems.filter(
    (system) => system.visibility === 'surveyed',
  );
  const relatedScience = scienceShips.filter(
    (ship) =>
      ship.currentSystemId === fleet.systemId ||
      ship.targetSystemId === fleet.systemId,
  );

  const handleOrder = (systemId: string) => {
    const result = onOrder(fleet.id, systemId);
    if (result.success) {
      setMessage('Rotta aggiornata.');
    } else if (result.reason) {
      setMessage(fleetOrderErrors[result.reason]);
    }
  };

  const mergeOptions = fleets.filter(
    (candidate) =>
      candidate.id !== fleet.id && candidate.systemId === fleet.systemId,
  );

  return (
    <div className="fleet-detail">
      <header className="fleet-detail__header">
        <div>
          <p className="fleet-detail__eyebrow">Dettagli flotta</p>
          <h3 className="fleet-detail__title">{fleet.name ?? fleet.id}</h3>
          <div className="fleet-detail__meta">
            <span>{resolveName(fleet.systemId)}</span>
            <span>• Navi: {fleet.ships.length}</span>
            {fleet.targetSystemId ? (
              <span>
                • In rotta verso {resolveName(fleet.targetSystemId)}
                {typeof fleet.ticksToArrival === 'number'
                  ? ` (${fleet.ticksToArrival} tick)`
                  : ''}
              </span>
            ) : null}
          </div>
        </div>
        <button className="dock-detail__close" onClick={onClose}>
          ×
        </button>
      </header>

      <section className="fleet-detail__section">
        <h4>Composizione</h4>
        <p className="fleet-detail__ships">
          {fleet.ships.length > 0
            ? describeFleetShips(fleet.ships, designLookup)
            : 'Nessuna nave attiva'}
        </p>
        {relatedScience.length > 0 ? (
          <div className="fleet-detail__science">
            <span className="text-muted">Supporto scientifico:</span>
            <div className="fleet-detail__chips">
              {relatedScience.map((ship) => (
                <span key={ship.id} className="fleet-chip">
                  <span>{ship.name}</span>
                  <small>{scienceStatusLabel[ship.status]}</small>
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="fleet-detail__section">
        <div className="fleet-detail__row">
          <div className="fleet-detail__field">
            <label className="text-muted">Destinazione</label>
            <select
              value={fleet.targetSystemId ?? fleet.systemId}
              onChange={(event) => handleOrder(event.target.value)}
            >
              {surveyedSystems.map((system) => (
                <option key={system.id} value={system.id}>
                  {system.name}
                </option>
              ))}
            </select>
          </div>
          <div className="fleet-detail__field">
            <label className="text-muted">Unisci con</label>
            <select
              value=""
              onChange={(event) => {
                if (!event.target.value) {
                  return;
                }
                const result = onMerge(fleet.id, event.target.value);
                setMessage(
                  result.success
                    ? 'Flotte unite.'
                    : fleetManageErrors[result.reason],
                );
              }}
            >
              <option value="">Seleziona flotta...</option>
              {mergeOptions.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name ?? candidate.id}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="fleet-detail__actions">
          <button
            className="panel__action panel__action--compact"
            onClick={() => {
              const result = onSplit(fleet.id);
              setMessage(
                result.success
                  ? 'Nuova flotta creata.'
                  : fleetManageErrors[result.reason],
              );
            }}
            disabled={fleet.ships.length <= 1}
          >
            Dividi 1 nave
          </button>
        </div>
        {message ? <p className="panel-message">{message}</p> : null}
      </section>
    </div>
  );
};
