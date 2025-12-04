import { useMemo, useState } from 'react';
import type { Fleet, ShipDesign, StarSystem } from '@domain/types';
import type { BuildShipyardReason } from '@store/slice/gameSlice';
import { Target, PauseCircle } from 'lucide-react';
import './ConstructionDetailWindow.scss';

const shipyardReasonLabel: Record<BuildShipyardReason, string> = {
  NO_SESSION: 'Nessuna sessione attiva.',
  SYSTEM_NOT_FOUND: 'Sistema non valido.',
  SYSTEM_NOT_SURVEYED: 'Serve sondare il sistema.',
  TECH_MISSING: 'Richiede tecnologia Cantiere orbitale.',
  IN_PROGRESS: 'Costruzione gia in corso.',
  ALREADY_BUILT: 'Cantiere gia presente.',
  NO_CONSTRUCTOR: 'Serve una nave costruttrice nel sistema.',
  INSUFFICIENT_RESOURCES: 'Risorse insufficienti.',
};

type ConstructionDetailProps = {
  fleet: Fleet;
  systems: StarSystem[];
  designs: ShipDesign[];
  completedTechs: string[];
  onOrder: (fleetId: string, systemId: string) => { success: boolean; reason?: string };
  onAnchorChange: (fleetId: string, planetId: string | null) => void;
  onBuildShipyard?: (
    systemId: string,
    anchorPlanetId: string | null,
  ) => { success: boolean; reason?: BuildShipyardReason };
  onStop?: (fleetId: string) => void;
  onCenter?: (systemId: string) => void;
};

export const ConstructionDetailWindow = ({
  fleet,
  systems,
  designs,
  completedTechs,
  onOrder,
  onAnchorChange,
  onBuildShipyard,
  onStop,
  onCenter,
}: ConstructionDetailProps) => {
  const [message, setMessage] = useState<string | null>(null);
  const designLookup = useMemo(() => new Map(designs.map((d) => [d.id, d])), [designs]);
  const currentSystem = systems.find((system) => system.id === fleet.systemId);
  const shipyardBuild = currentSystem?.shipyardBuild;
  const buildInProgress = Boolean(shipyardBuild);
  const hasShipyard = Boolean(currentSystem?.hasShipyard);
  const canBuild = completedTechs.includes('orbital-shipyard') && !hasShipyard && !buildInProgress;
  const anchorOptions =
    currentSystem?.orbitingPlanets?.map((planet) => ({
      id: planet.id,
      name: planet.name ?? planet.id,
    })) ?? [];

  const destinationOptions = systems.filter((s) => s.visibility === 'surveyed');

  const handleBuild = () => {
    if (!onBuildShipyard || !currentSystem) return;
    const res = onBuildShipyard(currentSystem.id, fleet.anchorPlanetId ?? null);
    if (res.success) {
      setMessage('Costruzione cantiere avviata.');
    } else if (res.reason) {
      setMessage(shipyardReasonLabel[res.reason] ?? 'Azione non disponibile.');
    }
  };

  const progressPct =
    shipyardBuild && shipyardBuild.totalTicks > 0
      ? Math.round(
          (1 - shipyardBuild.ticksRemaining / Math.max(1, shipyardBuild.totalTicks)) * 100,
        )
      : 0;

  const describeFleet = () =>
    fleet.ships
      .map((ship) => designLookup.get(ship.designId)?.name ?? ship.designId)
      .join(', ');

  const buildProjects: Array<{
    id: string;
    label: string;
    description: string;
    actionLabel: string;
    enabled: boolean;
    onAction?: () => void;
    status?: string;
  }> = [
    {
      id: 'shipyard',
      label: 'Cantiere orbitale',
      description: hasShipyard
        ? 'Cantiere gia presente in questo sistema.'
        : 'Permette di produrre nuove navi direttamente nel sistema.',
      actionLabel: buildInProgress ? 'In corso' : hasShipyard ? 'Completato' : 'Costruisci',
      enabled: canBuild && !hasShipyard,
      onAction: handleBuild,
      status: buildInProgress ? `Progresso ${progressPct}%` : undefined,
    },
    {
      id: 'orbital-defense',
      label: 'Difese orbitali',
      description: 'Slot disponibile per strutture difensive (non ancora ricercate).',
      actionLabel: 'Bloccato',
      enabled: false,
      status: 'Richiede tecnologia difese orbitali',
    },
    {
      id: 'mining-hub',
      label: 'Hub minerario',
      description: 'Incrementa la raccolta risorse di sistema (prossimamente).',
      actionLabel: 'Bloccato',
      enabled: false,
      status: 'Progetto non sbloccato',
    },
  ];

  return (
    <div className="constructor-window">
      <header className="constructor-window__header">
        <div>
          <p className="eyebrow">Nave costruttrice</p>
          <h3>{fleet.name ?? fleet.id}</h3>
          <p className="text-muted">Gestione operazioni orbitali e costruzioni di sistema.</p>
          <div className="constructor-detail__tags">
            <span className="pill pill--glass">
              {currentSystem?.name ?? fleet.systemId}
            </span>
            {fleet.targetSystemId ? (
              <span className="pill pill--glass">
                In rotta verso{' '}
                {systems.find((s) => s.id === fleet.targetSystemId)?.name ?? fleet.targetSystemId}
              </span>
            ) : (
              <span className="pill pill--glass">In stazione</span>
            )}
          </div>
        </div>
        <div className="constructor-detail__actions">
          <button className="hud-icon-btn" data-tooltip="Centra" onClick={() => onCenter?.(fleet.systemId)}>
            <Target size={14} />
          </button>
          <button className="hud-icon-btn" data-tooltip="Ferma" onClick={() => onStop?.(fleet.id)}>
            <PauseCircle size={14} />
          </button>
        </div>
      </header>

      <div className="constructor-window__body">
        <div className="constructor-column">
          <section className="constructor-card constructor-card--column composition-card">
            <header className="constructor-card__header">
              <p className="eyebrow">Composizione</p>
            </header>
            <p className="text-muted">{describeFleet() || 'Nessuna nave attiva.'}</p>
          </section>

          <section className="constructor-card constructor-card--column">
            <header className="constructor-card__header">
              <p className="eyebrow">Navigazione</p>
            </header>
            <div className="constructor-controls">
              <label className="text-muted">Destinazione</label>
              <select
                value={fleet.targetSystemId ?? fleet.systemId}
                onChange={(event) => onOrder(fleet.id, event.target.value)}
              >
                {destinationOptions.map((system) => (
                  <option key={system.id} value={system.id}>
                    {system.name}
                  </option>
                ))}
              </select>
              <label className="text-muted">Aggancio</label>
              <select
                value={fleet.anchorPlanetId ?? ''}
                onChange={(event) =>
                  onAnchorChange(fleet.id, event.target.value ? event.target.value : null)
                }
              >
                <option value="">Stella</option>
                {anchorOptions.map((planet) => (
                  <option key={planet.id} value={planet.id}>
                    {planet.name}
                  </option>
                ))}
              </select>
            </div>
          </section>
        </div>

        <section className="constructor-card constructor-card--column constructor-card--projects">
          <header className="constructor-card__header">
            <p className="eyebrow">Progetti orbitali</p>
            {buildInProgress ? (
              <span className="pill">In costruzione</span>
            ) : (
              <span className="pill pill--glass">{hasShipyard ? 'Cantiere attivo' : 'Pronto'}</span>
            )}
          </header>
          {buildInProgress && shipyardBuild ? (
            <div className="build-progress">
              <div className="build-progress__bar">
                <span style={{ width: `${progressPct}%` }} />
              </div>
              <p className="text-muted">Progresso: {progressPct}%</p>
            </div>
          ) : null}
          <div className="build-projects">
            {buildProjects.map((project) => (
              <div key={project.id} className={`build-project ${project.enabled ? '' : 'is-disabled'}`}>
                <div>
                  <p className="build-project__title">{project.label}</p>
                  <small className="text-muted">{project.description}</small>
                  {project.status ? <small className="text-muted">{project.status}</small> : null}
                </div>
                <button
                  className="panel__action panel__action--compact"
                  onClick={project.onAction}
                  disabled={!project.enabled}
                >
                  {project.actionLabel}
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {message ? <p className="panel-message">{message}</p> : null}
    </div>
  );
};
