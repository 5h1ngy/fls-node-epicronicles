import { useMemo, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { ShipClassId } from '../../domain/types';

const fleetOrderErrors = {
  NO_SESSION: 'Nessuna sessione.',
  FLEET_NOT_FOUND: 'Flotta non trovata.',
  SYSTEM_NOT_FOUND: 'Sistema non valido.',
  ALREADY_IN_SYSTEM: 'La flotta e gia nel sistema.',
  NO_SHIPS: 'La flotta non ha navi.',
} as const;

export const FleetPanel = () => {
  const fleets = useGameStore((state) => state.session?.fleets ?? []);
  const systems = useGameStore((state) => state.session?.galaxy.systems ?? []);
  const orderFleetMove = useGameStore((state) => state.orderFleetMove);
  const designs = useGameStore((state) => state.config.military.shipDesigns);
  const [message, setMessage] = useState<string | null>(null);

  const systemName = (id: string | null) =>
    systems.find((system) => system.id === id)?.name ?? '???';

  const designLookup = useMemo(
    () => new Map(designs.map((design) => [design.id, design])),
    [designs],
  );

  const describeFleetShips = (ships: typeof fleets[number]['ships']) => {
    const counts = ships.reduce<Record<ShipClassId, number>>((acc, ship) => {
      const key = ship.designId;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {} as Record<ShipClassId, number>);

    return Object.entries(counts)
      .map(([designId, count]) => {
        const id = designId as ShipClassId;
        return `${designLookup.get(id)?.name ?? id} x${count}`;
      })
      .join(', ');
  };

  const surveyedSystems = systems.filter(
    (system) => system.visibility === 'surveyed',
  );

  const handleOrder = (fleetId: string, systemId: string) => {
    const result = orderFleetMove(fleetId, systemId);
    if (result.success) {
      setMessage('Rotta aggiornata.');
    } else {
      setMessage(fleetOrderErrors[result.reason]);
    }
  };

  if (fleets.length === 0) {
    return null;
  }

  return (
    <section className="fleet-panel">
      <header>
        <h3>Flotte</h3>
        {message ? <p className="panel-message">{message}</p> : null}
      </header>
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
    </section>
  );
};
