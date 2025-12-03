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

import '../../FleetWindowsShared.scss';

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

interface FleetListProps {
  fleets: Fleet[];
  systems: StarSystem[];
  scienceShips: ScienceShip[];
  designs: ShipDesign[];
  onOrder: (fleetId: string, systemId: string) => { success: boolean; reason?: keyof typeof fleetOrderErrors };
  onMerge: (sourceId: string, targetId: string) => FleetMergeResult;
  onSplit: (fleetId: string) => FleetSplitResult;
}

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

const FleetScience = ({
  ships,
}: {
  ships: ScienceShip[];
}) => {
  if (ships.length === 0) {
    return null;
  }
  return (
    <div className="fleet-science">
      {ships.map((ship) => (
        <span key={ship.id} className="fleet-chip">
          <span>{ship.name}</span>
          <small>{scienceStatusLabel[ship.status]}</small>
        </span>
      ))}
    </div>
  );
};

export const FleetList = ({
  fleets,
  systems,
  scienceShips,
  designs,
  onOrder,
  onMerge,
  onSplit,
}: FleetListProps) => {
  const [message, setMessage] = useState<string | null>(null);
  const designLookup = useMemo(
    () => new Map(designs.map((design) => [design.id, design])),
    [designs],
  );
  const surveyedSystems = systems.filter(
    (system) => system.visibility === 'surveyed',
  );
  const resolveName = (systemId: string) =>
    systems.find((system) => system.id === systemId)?.name ?? systemId;

  const handleOrder = (fleetId: string, systemId: string) => {
    const result = onOrder(fleetId, systemId);
    if (result.success) {
      setMessage('Rotta aggiornata.');
    } else if (result.reason) {
      setMessage(fleetOrderErrors[result.reason]);
    }
  };

  return (
    <div className="panel-section">
      <div className="panel-section__header">
        <h3>Flotte</h3>
        {message ? <p className="panel-message">{message}</p> : null}
      </div>
      <ul>
        {fleets.map((fleet) => {
          const relatedScience = scienceShips.filter(
            (ship) =>
              ship.currentSystemId === fleet.systemId ||
              ship.targetSystemId === fleet.systemId,
          );
          return (
            <li key={fleet.id}>
              <div className="fleet-row">
                <div>
                  <strong>{fleet.name}</strong>
                  <span className="text-muted">
                    Sistema: {resolveName(fleet.systemId)}
                  </span>
                  {fleet.targetSystemId ? (
                    <span className="text-muted">
                      {' -> '}
                      {resolveName(fleet.targetSystemId)} ({fleet.ticksToArrival}{' '}
                      tick)
                    </span>
                  ) : null}
                </div>
                <span className="text-muted">Navi: {fleet.ships.length}</span>
              </div>
              <p className="fleet-ships">
                {fleet.ships.length > 0
                  ? describeFleetShips(fleet.ships, designLookup)
                  : 'Nessuna nave attiva'}
              </p>
              <FleetScience ships={relatedScience} />
              <label className="fleet-panel__order">
                Destinazione
                <select
                  value={fleet.targetSystemId ?? fleet.systemId}
                  onChange={(event) => handleOrder(fleet.id, event.target.value)}
                >
                  {surveyedSystems.map((system) => (
                    <option key={system.id} value={system.id}>
                      {system.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="fleet-panel__order">
                <span className="text-muted">Gestione flotta</span>
                <div className="fleet-panel__actions">
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
                    <option value="">Unisci con...</option>
                    {fleets
                      .filter(
                        (candidate) =>
                          candidate.id !== fleet.id &&
                          candidate.systemId === fleet.systemId,
                      )
                      .map((candidate) => (
                        <option key={candidate.id} value={candidate.id}>
                          {candidate.name}
                        </option>
                      ))}
                  </select>
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
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
