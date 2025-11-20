import { RESOURCE_TYPES, computePlanetProduction } from '@domain/economy/economy';
import type { PopulationJobId, Planet } from '@domain/types';
import type { EconomyConfig } from '@domain/economy/economy';
import { formatCost, formatSigned } from './shared/formatters';
import '../styles/components/PlanetDetail.scss';
import { resourceLabels } from '@domain/shared/resourceMetadata';

interface PlanetDetailProps {
  planet: Planet;
  systemName: string;
  onPromote: (jobId: PopulationJobId) => void;
  onDemote: (jobId: PopulationJobId) => void;
  automationConfig?: EconomyConfig['populationAutomation'];
  populationJobs: EconomyConfig['populationJobs'];
  districtDefinitions: EconomyConfig['districts'];
  planetDistrictQueue: Array<{
    id: string;
    label: string;
    ticksRemaining: number;
    totalTicks: number;
    progress: number;
  }>;
  districtMessage: string | null;
  populationMessage: string | null;
  onQueueDistrict: (districtId: string) => void;
  onRemoveDistrict: (districtId: string) => void;
}

export const PlanetDetail = ({
  planet,
  systemName,
  onPromote,
  onDemote,
  automationConfig,
  populationJobs,
  districtDefinitions,
  planetDistrictQueue,
  districtMessage,
  populationMessage,
  onQueueDistrict,
  onRemoveDistrict,
}: PlanetDetailProps) => {
  const planetProductionSummary = computePlanetProduction(planet, {
    startingResources: {},
    homeworld: {
      name: planet.name,
      kind: planet.kind,
      size: planet.size,
      population: planet.population.total,
      baseProduction: planet.baseProduction,
      upkeep: planet.upkeep,
    },
    districts: districtDefinitions,
    populationJobs,
  } as EconomyConfig);

  return (
    <div className="planet-detail">
      <aside className="planet-detail__production">
        {planetProductionSummary ? (
          <div className="planet-production planet-production--vertical">
            <h4>Produzione netta</h4>
            <div className="planet-production__stack">
              {RESOURCE_TYPES.map((type) => {
                const summary = planetProductionSummary[type];
                if (!summary) {
                  return null;
                }
                const label = resourceLabels[type as keyof typeof resourceLabels];
                return (
                  <div key={type} className="planet-production__card">
                    <div className="planet-production__header">
                      <span>{label}</span>
                      <span
                        className={
                          summary.net >= 0 ? 'is-positive' : 'is-negative'
                        }
                      >
                        {formatSigned(summary.net)}
                      </span>
                    </div>
                    <ul className="planet-production__breakdown">
                      <li>Base {formatSigned(summary.base)}</li>
                      <li>Distretti {formatSigned(summary.districts)}</li>
                      <li>Popolazione {formatSigned(summary.population)}</li>
                      <li>Upkeep {formatSigned(-summary.upkeep)}</li>
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
        <div className="planet-districts planet-districts--compact">
          <h4>Coda costruzione</h4>
          {planetDistrictQueue.length === 0 ? (
            <p className="text-muted">Nessun distretto in costruzione.</p>
          ) : (
            <ul>
              {planetDistrictQueue.map((task) => (
                <li key={task.id}>
                  <div className="district-queue__header">
                    <strong>{task.label}</strong>
                    <span className="text-muted">
                      Tick rimanenti: {task.ticksRemaining}/{task.totalTicks}
                    </span>
                  </div>
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
      </aside>

      <div className="planet-detail__body">
        <div className="planet-body__header">
          <div>
            <p className="planet-detail__eyebrow">Dettagli pianeta</p>
            <h3 className="planet-detail__title">
              {planet.name} <span className="planet-detail__system">({systemName})</span>
            </h3>
          </div>
          <div className="planet-body__meta">
            <span className="planet-detail__pill">
              Stabilita {Math.round(planet.stability)}
            </span>
            <span className="planet-detail__pill">
              Felicita {Math.round(planet.happiness)}
            </span>
            <span className="planet-detail__pill">Tipo: {planet.kind}</span>
            <span className="planet-detail__pill">
              Pop: {planet.population.workers} L / {planet.population.specialists} S / {planet.population.researchers} R
            </span>
          </div>
        </div>

        <div className="planet-meta">
          <span>
            Popolazione: {planet.population.workers} L / {planet.population.specialists} S /{' '}
            {planet.population.researchers} R
          </span>
          <span>Tipo pianeta: {planet.kind}</span>
        </div>

        {districtMessage ? <p className="panel-message">{districtMessage}</p> : null}

        <div className="planet-districts">
          <h4>Distretti</h4>
          <ul className="district-card-list">
            {districtDefinitions.map((definition) => {
              const owned = planet.districts[definition.id] ?? 0;
              const capacityHint = Math.min(owned, 12);
              const fillWidth = `${(capacityHint / 12) * 100}%`;
              return (
                <li key={definition.id} className="district-card">
                  <div className="district-card__header">
                    <div>
                      <strong>{definition.label}</strong>
                      <span className="text-muted">{definition.description}</span>
                    </div>
                    <div className="district-card__count">
                      <span className="pill">{owned} costruiti</span>
                      <div className="district-bar">
                        <div className="district-bar__fill" style={{ width: fillWidth }} />
                      </div>
                    </div>
                  </div>
                  <div className="district-card__meta">
                    <div>
                      <span className="text-muted">Costo</span>
                      <div className="district-card__chip">{formatCost(definition.cost)}</div>
                    </div>
                    <div>
                      <span className="text-muted">Produzione</span>
                      <div className="district-card__chip">{formatCost(definition.production)}</div>
                    </div>
                    <div className="district-card__actions">
                      <button
                        className="panel__action panel__action--compact"
                        onClick={() => onQueueDistrict(definition.id)}
                      >
                        Costruisci
                      </button>
                      <button
                        className="panel__action panel__action--compact panel__action--danger"
                        disabled={owned <= 0}
                        onClick={() => onRemoveDistrict(definition.id)}
                      >
                        Rimuovi
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <aside className="planet-detail__roles">
        <div className="planet-population">
          <h4>Ruoli popolazione</h4>
          {automationConfig?.enabled ? (
            <p className="text-muted">
              Bilanciamento automatico attivo (priorita: {automationConfig.priorities.join(' > ')})
            </p>
          ) : null}
          {populationMessage ? (
            <p className="panel-message">{populationMessage}</p>
          ) : null}
          <ul>
            {populationJobs.map((job) => {
              const assigned =
                planet.population[job.id as keyof typeof planet.population] ?? 0;
              return (
                <li key={job.id}>
                  <div className="population-job__meta">
                    <div>
                      <strong>{job.label}</strong>
                      <span className="text-muted">{job.description}</span>
                    </div>
                    <span>Pop assegnati: {assigned}</span>
                    <span>Produzione: {formatCost(job.production)}</span>
                    <span>Upkeep: {formatCost(job.upkeep)}</span>
                  </div>
                  <div className="population-job__actions">
                    <button
                      className="panel__action panel__action--compact"
                      onClick={() => onPromote(job.id)}
                    >
                      Promuovi
                    </button>
                    {job.id !== 'workers' ? (
                      <button
                        className="panel__action panel__action--compact"
                        onClick={() => onDemote(job.id)}
                      >
                        Declassa
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </div>
  );
};
