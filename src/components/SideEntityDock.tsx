import { useMemo } from 'react';
import { useAppSelector, useGameStore } from '@store/gameStore';
import {
  selectColonizedSystems,
  selectPlanets,
  selectSystems,
  selectScienceShips,
} from '@store/selectors';
import { Crosshair, Info } from 'lucide-react';
import '../styles/components/SideEntityDock.scss';

type DockSelection =
  | { kind: 'colony'; planetId: string; systemId: string }
  | { kind: 'fleet'; fleetId: string; systemId: string; source?: 'fleet' | 'colonization' | 'construction' }
  | { kind: 'science'; shipId: string; systemId: string };

interface SideEntityDockProps {
  variant: 'colonies' | 'fleets' | 'science' | 'colonization' | 'construction';
  onSelect: (selection: DockSelection) => void;
  onCenter: (systemId: string, planetId?: string | null) => void;
}

export const SideEntityDock = ({ variant, onSelect, onCenter }: SideEntityDockProps) => {
  useAppSelector(selectPlanets);
  useAppSelector(selectColonizedSystems);
  const systems = useAppSelector(selectSystems);
  const scienceShips = useAppSelector(selectScienceShips);
  const session = useGameStore((state) => state.session);
  const designs = useGameStore((state) => state.config.military.shipDesigns);

  const designLookup = useMemo(
    () => new Map(designs.map((design) => [design.id, design])),
    [designs],
  );

  const playerFleets =
    useMemo(
      () => session?.fleets.filter((fleet) => !fleet.ownerId || fleet.ownerId === 'player') ?? [],
      [session],
    );

  const getRole = (
    designId: string,
  ): 'military' | 'colony' | 'construction' | 'science' =>
    (designLookup.get(designId)?.role as
      | 'military'
      | 'colony'
      | 'construction'
      | 'science'
      | undefined) ?? 'military';

  const colonyEntries =
    session?.economy.planets.map((planet) => ({
      id: planet.id,
      name: planet.name,
      systemId: planet.systemId,
    })) ?? [];

  const getSystemName = (id: string) =>
    systems.find((s) => s.id === id)?.name ?? id;

  if (variant === 'colonies') {
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
      </aside>
    );
  }

  if (variant === 'fleets') {
    const militaryFleets = playerFleets.filter((fleet) => {
      const roles = fleet.ships.map((ship) => getRole(ship.designId));
      if (roles.includes('military')) return true;
      // Se la flotta ha solo ruoli sconosciuti, considerala comunque militare per non perderla dal dock
      const known = roles.some((r) => r === 'construction' || r === 'colony' || r === 'science');
      return !known && fleet.ships.length > 0;
    });
    return (
      <aside className="side-entity-dock">
        <section>
          <h4>Flotte militari</h4>
          <ul>
            {militaryFleets.length === 0 ? (
              <li className="text-muted">Nessuna flotta.</li>
            ) : (
              militaryFleets.map((fleet) => (
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
                          source: 'fleet',
                        })
                      }
                    >
                        <Info size={14} />
                      </button>
                    </div>
                  </div>
                  <small className="text-muted">
                    {getSystemName(fleet.systemId)} - Navi: {fleet.ships.length}
                  </small>
                </li>
              ))
            )}
          </ul>
        </section>
      </aside>
    );
  }

  if (variant === 'colonization' || variant === 'construction') {
    const targetRole = variant === 'colonization' ? 'colony' : 'construction';
    const ships = playerFleets.flatMap((fleet) =>
      fleet.ships
        .filter((ship) => getRole(ship.designId) === targetRole)
        .map((ship) => ({
          shipId: ship.id,
          fleetId: fleet.id,
          systemId: fleet.systemId,
          designId: ship.designId,
          fleetName: fleet.name ?? fleet.id,
        })),
    );
    const title = variant === 'colonization' ? 'Navi colonia' : 'Navi costruttrici';
    const labelFor = (designId: string) =>
      designLookup.get(designId)?.name ?? designId;
    return (
      <aside className="side-entity-dock">
        <section>
          <h4>{title}</h4>
          <ul>
            {ships.length === 0 ? (
              <li className="text-muted">Nessuna nave.</li>
            ) : (
              ships.map((entry) => (
                <li key={entry.shipId}>
                  <div className="dock-row">
                    <span className="dock-name">{labelFor(entry.designId)}</span>
                    <div className="dock-actions">
                      <button
                        className="hud-icon-btn"
                        data-tooltip="Centra"
                        onClick={() => onCenter(entry.systemId)}
                      >
                        <Crosshair size={14} />
                      </button>
                      <button
                        className="hud-icon-btn"
                        data-tooltip="Dettagli flotta"
                        onClick={() =>
                          onSelect({
                            kind: 'fleet',
                            fleetId: entry.fleetId,
                            systemId: entry.systemId,
                            source: variant === 'construction' ? 'construction' : 'colonization',
                          })
                        }
                      >
                        <Info size={14} />
                      </button>
                    </div>
                  </div>
                  <small className="text-muted">
                    {getSystemName(entry.systemId)} - {entry.fleetName}
                  </small>
                </li>
              ))
            )}
          </ul>
        </section>
      </aside>
    );
  }

  return (
    <aside className="side-entity-dock">
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
                  {getSystemName(ship.currentSystemId)} - {ship.status}
                </small>
              </li>
            ))
          )}
        </ul>
      </section>
    </aside>
  );
};
