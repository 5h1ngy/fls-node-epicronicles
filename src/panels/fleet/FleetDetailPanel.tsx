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
import type { BuildShipyardReason } from '@store/slice/gameSlice';
import { Target, PauseCircle } from 'lucide-react';
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

const describeFleetShips = (ships: Fleet['ships'], designLookup: Map<string, ShipDesign>) => {
  const counts = new Map<string, number>();
  ships.forEach((ship) => {
    const key = String(ship.designId);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return Array.from(counts.entries())
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
  completedTechs: string[];
  onOrder: (fleetId: string, systemId: string) => {
    success: boolean;
    reason?: keyof typeof fleetOrderErrors;
  };
  showConstructionActions?: boolean;
  onAnchorChange: (fleetId: string, planetId: string | null) => void;
  onCenter?: (systemId: string) => void;
  onStop?: (fleetId: string) => void;
  onMerge: (sourceId: string, targetId: string) => FleetMergeResult;
  onSplit: (fleetId: string) => FleetSplitResult;
  onBuildShipyard?: (
    systemId: string,
    anchorPlanetId: string | null,
  ) => { success: boolean; reason?: BuildShipyardReason };
  onClose: () => void;
}

export const FleetDetailPanel = ({
  fleet,
  fleets,
  systems,
  scienceShips,
  designs,
  completedTechs,
  onOrder,
  showConstructionActions = true,
  onAnchorChange,
  onCenter,
  onStop,
  onMerge,
  onSplit,
  onBuildShipyard,
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
  const currentSystem = systems.find((system) => system.id === fleet.systemId);
  const anchorOptions =
    currentSystem?.orbitingPlanets?.map((planet) => ({
      id: planet.id,
      name: planet.name ?? planet.id,
    })) ?? [];
  const shipyardBuild = currentSystem?.shipyardBuild;
  const buildInProgress = Boolean(shipyardBuild);
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
  const hasConstructor = fleet.ships.some(
    (ship) => designLookup.get(ship.designId)?.role === 'construction',
  );
  const canBuildYard =
    hasConstructor &&
    completedTechs.includes('orbital-shipyard') &&
    currentSystem?.visibility === 'surveyed' &&
    !buildInProgress &&
    !currentSystem?.hasShipyard;
  const yardLockedReason = !hasConstructor
    ? 'Serve una nave costruttrice.'
    : currentSystem?.visibility !== 'surveyed'
      ? 'Il sistema deve essere ispezionato.'
      : buildInProgress
        ? 'Costruzione già in corso.'
        : currentSystem?.hasShipyard
          ? 'Cantiere già presente nel sistema.'
          : !completedTechs.includes('orbital-shipyard')
            ? 'Richiede tecnologia Cantiere orbitale.'
            : null;
  const constructorActions = (() => {
    if (!hasConstructor) return [];
    const actions: Array<{ id: string; label: string }> = [];
    if (completedTechs.includes('orbital-shipyard')) {
      actions.push({ id: 'build-shipyard', label: 'Costruisci cantiere orbitale' });
    }
    return actions;
  })();
  const shipyardBuilt = Boolean(currentSystem?.hasShipyard);
  const handleBuildShipyard = () => {
    if (!onBuildShipyard || !currentSystem) {
      return;
    }
    const result = onBuildShipyard(currentSystem.id, fleet.anchorPlanetId ?? null);
    if (result.success) {
      setMessage('Costruzione cantiere avviata (10 tick).');
    } else if (result.reason) {
      const reason = result.reason as BuildShipyardReason;
      const labels: Record<BuildShipyardReason, string> = {
        NO_SESSION: 'Nessuna sessione attiva.',
        SYSTEM_NOT_FOUND: 'Sistema non valido.',
        SYSTEM_NOT_SURVEYED: 'Il sistema deve essere ispezionato.',
        TECH_MISSING: 'Richiede la tecnologia Cantiere orbitale.',
        IN_PROGRESS: 'Costruzione già in corso.',
        ALREADY_BUILT: 'Cantiere già presente nel sistema.',
        NO_CONSTRUCTOR: 'Serve una nave costruttrice nel sistema.',
        INSUFFICIENT_RESOURCES: 'Risorse insufficienti.',
      };
      if (reason === 'IN_PROGRESS') {
        setMessage('Costruzione cantiere già in corso.');
      } else {
        setMessage(labels[reason] ?? 'Azione non disponibile.');
      }
    }
  };

  return (
    <div className="fleet-detail fleet-detail--split">
      <div className="fleet-detail__left">
        <header className="fleet-detail__header">
          <div>
            <p className="fleet-detail__eyebrow">Dettagli flotta</p>
            <h3 className="fleet-detail__title">{fleet.name ?? fleet.id}</h3>
            <div className="fleet-detail__meta">
              <span>{resolveName(fleet.systemId)}</span>
              <span>• Navi: {fleet.ships.length}</span>
            </div>
            <div className="fleet-detail__tags">
              {fleet.targetSystemId ? (
                <span className="pill pill--glass">
                  In rotta verso {resolveName(fleet.targetSystemId)}
                  {typeof fleet.ticksToArrival === 'number'
                    ? ` (${fleet.ticksToArrival} tick)`
                    : ''}
                </span>
              ) : (
                <span className="pill pill--glass">In stazione</span>
              )}
              {fleet.anchorPlanetId ? (
                <span className="pill pill--glass">Agganciata a pianeta</span>
              ) : (
                <span className="pill pill--glass">Agganciata a stella</span>
              )}
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
          <div className="fleet-detail__actions">
            <button
              className="hud-icon-btn"
              data-tooltip="Centra sulla flotta"
              onClick={() => onCenter?.(fleet.systemId)}
            >
              <Target size={14} />
            </button>
            <button
              className="hud-icon-btn"
              data-tooltip="Ferma la flotta"
              onClick={() => onStop?.(fleet.id)}
            >
              <PauseCircle size={14} />
            </button>
          </div>
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
              <label className="text-muted">Aggancio (sistema attuale)</label>
              <select
                value={fleet.anchorPlanetId ?? ''}
                onChange={(event) => {
                  onAnchorChange(
                    fleet.id,
                    event.target.value ? event.target.value : null,
                  );
                }}
              >
                <option value="">Stella</option>
                {anchorOptions.map((planet) => (
                  <option key={planet.id} value={planet.id}>
                    {planet.name}
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

      {hasConstructor && showConstructionActions ? (
        <aside className="fleet-detail__aside">
          <div className="fleet-detail__section">
            <h4>Costruzione</h4>
            {buildInProgress && shipyardBuild ? (
              <div className="fleet-construction-card">
                <div>
                  <p className="fleet-construction__title">Cantiere in costruzione</p>
                  <small className="text-muted">
                    Progresso:{' '}
                    {Math.round(
                      (1 -
                        shipyardBuild.ticksRemaining /
                          Math.max(1, shipyardBuild.totalTicks)) *
                        100,
                    )}
                    %
                  </small>
                </div>
                <button className="panel__action panel__action--compact" disabled>
                  In corso
                </button>
              </div>
            ) : shipyardBuilt ? (
              <p className="text-muted">Cantiere orbitale già presente nel sistema.</p>
            ) : constructorActions.length > 0 ? (
              constructorActions.map((action) => (
                <div key={action.id} className="fleet-construction-card">
                  <div>
                    <p className="fleet-construction__title">{action.label}</p>
                    <small className="text-muted">
                      {yardLockedReason ?? 'Richiede costruttrice nel sistema e risorse.'}
                    </small>
                  </div>
                  <button
                    className="panel__action panel__action--compact"
                    onClick={handleBuildShipyard}
                    disabled={!canBuildYard}
                  >
                    Costruisci
                  </button>
                </div>
              ))
            ) : (
              <p className="text-muted">{yardLockedReason ?? 'Nessuna azione disponibile.'}</p>
            )}
          </div>
        </aside>
      ) : null}
    </div>
  );
};
