import { useMemo, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { ShipClassId } from '../../domain/types';

const fleetOrderErrors = {
  NO_SESSION: 'Nessuna sessione.',
  FLEET_NOT_FOUND: 'Flotta non trovata.',
  SYSTEM_NOT_FOUND: 'Sistema non valido.',
  ALREADY_IN_SYSTEM: 'La flotta è già nel sistema.',
  NO_SHIPS: 'La flotta non ha navi.',
} as const;

const resultLabel = {
  playerVictory: 'Vittoria',
  playerDefeat: 'Sconfitta',
  mutualDestruction: 'Mutua distruzione',
} as const;

export const FleetAndCombatPanel = () => {
  const session = useGameStore((state) => state.session);
  const fleets = session?.fleets ?? [];
  const systems = session?.galaxy.systems ?? [];
  const orderFleetMove = useGameStore((state) => state.orderFleetMove);
  const designs = useGameStore((state) => state.config.military.shipDesigns);
  const reports = (session?.combatReports ?? []).slice().reverse();
  const scienceShips = session?.scienceShips ?? [];
  const [message, setMessage] = useState<string | null>(null);

  const systemName = (id: string | null) =>
    systems.find((system) => system.id === id)?.name ?? '???';

  const designLookup = useMemo(
    () =>
      new Map<ShipClassId, (typeof designs)[number]>(
        designs.map((design) => [design.id, design]),
      ),
    [designs],
  );

  const describeFleetShips = (ships: typeof fleets[number]['ships']) => {
    const counts = ships.reduce<Record<string, number>>((acc, ship) => {
      const key: string = ship.designId;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts)
      .map(([designId, count]) => {
        const typedId = designId as ShipClassId;
        const design = designLookup.get(typedId);
        return `${design?.name ?? designId} x${count}`;
      })
      .join(', ');
  };

  const handleOrder = (fleetId: string, systemId: string) => {
    const result = orderFleetMove(fleetId, systemId);
    if (result.success) {
      setMessage('Rotta aggiornata.');
    } else {
      setMessage(fleetOrderErrors[result.reason]);
    }
  };

  const surveyedSystems = systems.filter(
    (system) => system.visibility === 'surveyed',
  );

  const resolveName = (systemId: string) =>
    systems.find((system) => system.id === systemId)?.name ?? systemId;

  const renderShipsList = (fleetId: string) => {
    const ships = scienceShips.filter(
      (ship) => ship.currentSystemId === fleets.find((fleet) => fleet.id === fleetId)?.systemId,
    );
    if (ships.length === 0) {
      return null;
    }
    return (
      <div className="fleet-ships">
        <span>Navi scientifiche:</span>{' '}
        {ships.map((ship) => ship.name).join(', ')}
      </div>
    );
  };

  return (
    <section className="fleet-combat-panel">
      <div className="panel-section">
        <div className="panel-section__header">
          <h3>Flotte</h3>
          {message ? <p className="panel-message">{message}</p> : null}
        </div>
        <ul>
          {fleets.map((fleet) => (
            <li key={fleet.id}>
              <div className="fleet-row">
                <div>
                  <strong>{fleet.name}</strong>
                  <span className="text-muted">
                    Sistema: {systemName(fleet.systemId)}
                  </span>
                  {fleet.targetSystemId ? (
                    <span className="text-muted">
                      {' -> '}
                      {systemName(fleet.targetSystemId)} ({fleet.ticksToArrival}{' '}
                      tick)
                    </span>
                  ) : null}
                </div>
                <span className="text-muted">Navi: {fleet.ships.length}</span>
              </div>
              <p className="fleet-ships">
                {fleet.ships.length > 0
                  ? describeFleetShips(fleet.ships)
                  : 'Nessuna nave attiva'}
              </p>
              {renderShipsList(fleet.id)}
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
            </li>
          ))}
        </ul>
      </div>
      <div className="panel-section">
        <div className="panel-section__header">
          <h3>Rapporti di combattimento</h3>
        </div>
        <ul>
          {reports.map((report) => (
            <li key={report.id}>
              <div className="combat-log__header">
                <strong>{resultLabel[report.result]}</strong>
                <span className="text-muted">
                  Tick {report.tick} &mdash; {resolveName(report.systemId)}
                </span>
              </div>
              <p>
                Potenza flotta: {report.playerPower} | Minaccia: {report.hostilePower}
              </p>
              {report.losses.map((loss) => (
                <p key={`${report.id}-${loss.fleetId}`} className="text-muted">
                  Perdite flotta {loss.fleetId.slice(0, 6)}: {loss.shipsLost}
                </p>
              ))}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
