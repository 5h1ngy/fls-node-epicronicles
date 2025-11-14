import { useAppSelector, useGameStore } from '@store/gameStore';
import {
  selectColonizedSystems,
  selectPlanets,
  selectSystems,
  selectScienceShips,
} from '@store/selectors';
import { Crosshair, Info } from 'lucide-react';

type DockSelection =
  | { kind: 'colony'; planetId: string; systemId: string }
  | { kind: 'fleet'; fleetId: string; systemId: string }
  | { kind: 'science'; shipId: string; systemId: string };

interface SideEntityDockProps {
  onSelect: (selection: DockSelection) => void;
  onCenter: (systemId: string, planetId?: string | null) => void;
}

export const SideEntityDock = ({ onSelect, onCenter }: SideEntityDockProps) => {
  const planets = useAppSelector(selectPlanets);
  const colonized = useAppSelector(selectColonizedSystems);
  const systems = useAppSelector(selectSystems);
  const scienceShips = useAppSelector(selectScienceShips);
  const session = useGameStore((state) => state.session);

  const colonyEntries = planets
    .filter((planet) => colonized.has(planet.systemId))
    .map((planet) => ({
      id: planet.id,
      name: planet.name,
      systemId: planet.systemId,
    }));

  const getSystemName = (id: string) =>
    systems.find((s) => s.id === id)?.name ?? id;

  return (
    <aside className="side-entity-dock">
      <section>
        <h4>Colonie</h4>
        <ul>
          {colonyEntries.length === 0 ? (
            <li className="text-muted">Nessuna colonia.</li>
          ) : (
            colonyEntries.map((colony) => (
              <li key={colony.id}>
                <div className="dock-row">
                  <span className="dock-name">{colony.name}</span>
                  <div className="dock-actions">
                    <button
                      className="hud-icon-btn"
                      data-tooltip="Centra"
                      onClick={() => onCenter(colony.systemId, colony.id)}
                    >
                      <Crosshair size={14} />
                    </button>
                    <button
                      className="hud-icon-btn"
                      data-tooltip="Dettagli"
                      onClick={() =>
                        onSelect({
                          kind: 'colony',
                          planetId: colony.id,
                          systemId: colony.systemId,
                        })
                      }
                    >
                      <Info size={14} />
                    </button>
                  </div>
                </div>
                <small className="text-muted">{getSystemName(colony.systemId)}</small>
              </li>
            ))
          )}
        </ul>
      </section>
      <section>
        <h4>Flotte</h4>
        <ul>
          {session?.fleets.length === 0 ? (
            <li className="text-muted">Nessuna flotta.</li>
          ) : (
            session?.fleets.map((fleet) => (
              <li key={fleet.id}>
                <div className="dock-row">
                  <span className="dock-name">{fleet.name ?? fleet.id}</span>
                  <div className="dock-actions">
                    <button
                      className="hud-icon-btn"
                      data-tooltip="Centra"
                      onClick={() => onCenter(fleet.systemId)}
                    >
                      <Crosshair size={14} />
                    </button>
                    <button
                      className="hud-icon-btn"
                      data-tooltip="Dettagli"
                      onClick={() =>
                        onSelect({
                          kind: 'fleet',
                          fleetId: fleet.id,
                          systemId: fleet.systemId,
                        })
                      }
                    >
                      <Info size={14} />
                    </button>
                  </div>
                </div>
                <small className="text-muted">
                  {getSystemName(fleet.systemId)} • Navi: {fleet.ships.length}
                </small>
              </li>
            ))
          )}
        </ul>
      </section>
      <section>
        <h4>Navi scientifiche</h4>
        <ul>
          {scienceShips.length === 0 ? (
            <li className="text-muted">Nessuna nave scientifica.</li>
          ) : (
            scienceShips.map((ship) => (
              <li key={ship.id}>
                <div className="dock-row">
                  <span className="dock-name">{ship.name ?? ship.id}</span>
                  <div className="dock-actions">
                    <button
                      className="hud-icon-btn"
                      data-tooltip="Centra"
                      onClick={() => onCenter(ship.currentSystemId)}
                    >
                      <Crosshair size={14} />
                    </button>
                    <button
                      className="hud-icon-btn"
                      data-tooltip="Dettagli"
                      onClick={() =>
                        onSelect({
                          kind: 'science',
                          shipId: ship.id,
                          systemId: ship.currentSystemId,
                        })
                      }
                    >
                      <Info size={14} />
                    </button>
                  </div>
                </div>
                <small className="text-muted">
                  {getSystemName(ship.currentSystemId)} • {ship.status}
                </small>
              </li>
            ))
          )}
        </ul>
      </section>
    </aside>
  );
};
