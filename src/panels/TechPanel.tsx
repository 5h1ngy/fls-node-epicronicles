import { useMemo, useState } from 'react';
import { useAppSelector, useGameStore } from '@store/gameStore';
import { getResearchOffers } from '@domain/research/research';
import { listTraditionChoices } from '@domain/traditions/traditions';
import { selectResearch, selectTraditions } from '@store/selectors';
import '../styles/components/TechPanel.scss';

const kindLabels: Record<string, string> = {
  foundation: 'Fondamenta',
  feature: 'Feature',
  rare: 'Rara',
};

function groupBy<T, K extends string>(
  items: T[],
  key: (item: T) => K,
): Record<K, T[]> {
  const acc = {} as Record<K, T[]>;
  items.forEach((item) => {
    const k = key(item);
    if (!acc[k]) {
      acc[k] = [];
    }
    acc[k].push(item);
  });
  return acc;
}

export const TechPanel = () => {
  const research = useAppSelector(selectResearch);
  const traditions = useAppSelector(selectTraditions);
  const config = useGameStore((state) => state.config);
  const beginResearch = useGameStore((state) => state.beginResearch);
  const unlockTraditionPerk = useGameStore((state) => state.unlockTraditionPerk);
  const [message, setMessage] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showRareOnly, setShowRareOnly] = useState(false);
  const [showAllEras, setShowAllEras] = useState(false);

  const branches = config.research.branches;
  const availablePerks = useMemo(
    () => (traditions ? listTraditionChoices(traditions, config.traditions) : []),
    [traditions, config.traditions],
  );
  const exclusiveTechChoices = useMemo(() => {
    if (!research?.exclusivePicks) return [];
    return Object.entries(research.exclusivePicks).map(([group, techId]) => ({
      group,
      name: config.research.techs.find((t) => t.id === techId)?.name ?? techId,
    }));
  }, [config.research.techs, research]);
  const exclusivePerkChoices = useMemo(() => {
    if (!traditions?.exclusivePicks) return [];
    return Object.entries(traditions.exclusivePicks).map(([group, perkId]) => ({
      group,
      name: config.traditions.perks.find((t) => t.id === perkId)?.name ?? perkId,
    }));
  }, [config.traditions.perks, traditions]);

  if (!research || !traditions) {
    return <p className="text-muted">Nessuna sessione attiva.</p>;
  }

  const handleStartTech = (branchId: typeof branches[number]['id'], techId: string) => {
    const result = beginResearch(branchId, techId);
    setMessage(
      result.success
        ? 'Ricerca avviata.'
        : 'Impossibile avviare: requisiti o risorse mancanti.',
    );
  };

  const handleUnlockPerk = (perkId: string) => {
    const result = unlockTraditionPerk(perkId);
    setMessage(
      result.success
        ? 'Tradizione sbloccata.'
        : 'Punti insufficienti o prerequisiti mancanti.',
    );
  };

  const renderBadges = (
    era?: number,
    kind?: string,
    origin?: string,
    exclusive?: string,
  ) => {
    const originClass =
      origin === 'relic'
        ? 'tech-card__badge--relic'
        : origin === 'anomaly'
          ? 'tech-card__badge--anomaly'
          : origin === 'faction'
            ? 'tech-card__badge--faction'
            : 'tech-card__badge--muted';
    return (
      <span className="tech-card__badges">
        <span className="tech-card__badge tech-card__badge--muted">
          Era {era ? era : 1}
        </span>
        {kind ? (
          <span className="tech-card__badge tech-card__badge--muted">
            {kindLabels[kind] ? kindLabels[kind] : kind}
          </span>
        ) : null}
        {origin && origin !== 'standard' ? (
          <span className={`tech-card__badge ${originClass}`}>{origin}</span>
        ) : null}
        {exclusive ? (
          <span className="tech-card__badge tech-card__badge--warning">
            Esclusiva{exclusive ? `: ${exclusive}` : ''}
          </span>
        ) : null}
      </span>
    );
  };

  const branchOffers = branches.map((branch) => ({
    branch,
    offers: getResearchOffers(branch.id, research, config.research),
    state: research.branches[branch.id],
  }));

  const perksByTree = groupBy(availablePerks, (perk) => perk.tree);

  return (
    <div className="tech-panel tech-panel__grid">
      <div className="tech-panel__column">
        <div className="tech-panel__section">
          <header className="panel-section__header tech-panel__header">
            <div>
              <h4>Ricerca</h4>
              {message ? <span className="panel-message">{message}</span> : null}
            </div>
            <div className="tech-panel__summary">
              <span className="pill pill--glass">Era: {research.currentEra}</span>
              <span className="text-muted">
                Ere sbloccate: {research.unlockedEras.join(', ') || '1'}
              </span>
            </div>
          </header>
          <div className="tech-panel__toolbar">
            <div className="tech-panel__filters">
              <label>
                <input
                  type="checkbox"
                  checked={showCompleted}
                  onChange={(e) => setShowCompleted(e.target.checked)}
                />{' '}
                Mostra completate
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={showRareOnly}
                  onChange={(e) => setShowRareOnly(e.target.checked)}
                />{' '}
                Solo rare
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={showAllEras}
                  onChange={(e) => setShowAllEras(e.target.checked)}
                />{' '}
                Tutte le ere
              </label>
            </div>
            <div className="tech-panel__legend">
              <span className="text-muted">Origine:</span>
              <span className="tech-card__badge tech-card__badge--muted">standard</span>
              <span className="tech-card__badge tech-card__badge--relic">relic</span>
              <span className="tech-card__badge tech-card__badge--anomaly">anomaly</span>
              <span className="tech-card__badge tech-card__badge--faction">faction</span>
            </div>
          </div>
          {exclusiveTechChoices.length > 0 ? (
            <div className="tech-panel__exclusive">
              <span className="text-muted">Percorsi esclusivi scelti:</span>
              <div className="tech-panel__exclusive-list">
                {exclusiveTechChoices.map((entry) => (
                  <span key={entry.group} className="pill pill--glass">
                    {entry.group}: {entry.name}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          <div className="tech-panel__scroll">
            {branchOffers.map(({ branch, offers, state }) => {
              const currentTech = state.currentTechId
                ? config.research.techs.find((t) => t.id === state.currentTechId)
                : null;
              const filteredOffers = offers.filter((tech) => {
                const completed = state.completed.includes(tech.id);
                if (!showCompleted && completed) {
                  return false;
                }
                if (showRareOnly && tech.kind !== 'rare') {
                  return false;
                }
                if (!showAllEras && tech.era && tech.era > research.currentEra) {
                  return false;
                }
                return true;
              });
              const clusters = groupBy(filteredOffers, (tech) =>
                tech.clusterId ? tech.clusterId : 'Generiche',
              );
              const totalBranchTechs = config.research.techs.filter(
                (entry) => entry.branch === branch.id,
              ).length;
              const progressRatio =
                totalBranchTechs > 0 ? state.completed.length / totalBranchTechs : 0;
              return (
                <div key={branch.id} className="tech-branch">
                  <div className="tech-branch__header">
                    <div>
                      <div className="tech-branch__title">{branch.label}</div>
                      <p className="text-muted">{branch.description}</p>
                    </div>
                    <div className="tech-branch__status">
                      {currentTech ? (
                        <span>
                          In corso: {currentTech.name}{' '}
                          {Math.round((state.progress / currentTech.cost) * 100)}%
                        </span>
                      ) : (
                        <span className="text-muted">Nessuna ricerca attiva</span>
                      )}
                    </div>
                  </div>
                  <div className="tech-branch__progress">
                    <div className="tech-branch__progress-bar">
                      <span
                        className="tech-branch__progress-fill"
                        style={{ width: `${Math.min(100, progressRatio * 100)}%` }}
                      />
                    </div>
                    <small className="text-muted">
                      Completate: {state.completed.length}/{totalBranchTechs || '?'}
                    </small>
                  </div>
                  <div className="tech-branch__clusters">
                    {Object.entries(clusters).map(([clusterId, techs]) => {
                      return (
                        <div key={clusterId} className="tech-cluster">
                          <div className="tech-cluster__header">
                            <span className="text-muted">Cluster: {clusterId}</span>
                          </div>
                          <div className="tech-branch__techs">
                            {techs.map((tech) => {
                              const completed = state.completed.includes(tech.id);
                              const active = state.currentTechId === tech.id;
                              const exclusiveLocked = Boolean(
                                tech.mutuallyExclusiveGroup &&
                                  research.exclusivePicks &&
                                  research.exclusivePicks[tech.mutuallyExclusiveGroup] &&
                                  research.exclusivePicks[tech.mutuallyExclusiveGroup] !== tech.id,
                              );
                              const exclusiveGroup = tech.mutuallyExclusiveGroup;
                              return (
                                <div key={tech.id} className="tech-card">
                                  <div className="tech-card__title">
                                    {tech.name}{' '}
                                    {completed ? (
                                      <span className="tech-card__badge">Completata</span>
                                    ) : null}
                                    {renderBadges(
                                      tech.era,
                                      tech.kind,
                                      tech.origin,
                                      tech.mutuallyExclusiveGroup,
                                    )}
                                  </div>
                                  {exclusiveGroup ? (
                                    <p className="text-muted">
                                      Percorso esclusivo: {exclusiveGroup}
                                      {exclusiveLocked ? ' (bloccato)' : ''}
                                    </p>
                                  ) : null}
                                  {exclusiveLocked ? (
                                    <p className="text-muted">
                                      Bloccata: scelta esclusiva già effettuata.
                                    </p>
                                  ) : null}
                                  <p className="text-muted">{tech.description}</p>
                                  <div className="tech-card__meta">
                                    <span>Costo: {tech.cost}</span>
                                    {active ? (
                                      <span className="tech-card__badge tech-card__badge--active">
                                        In corso
                                      </span>
                                    ) : (
                                      <button
                                        className="panel__action panel__action--compact"
                                        onClick={() => handleStartTech(branch.id, tech.id)}
                                        disabled={completed || exclusiveLocked}
                                        title={
                                          exclusiveLocked
                                            ? 'Bloccata da un percorso esclusivo già scelto.'
                                            : undefined
                                        }
                                      >
                                        Avvia
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                    {offers.length === 0 ? (
                      <p className="text-muted">Nessuna tecnologia disponibile.</p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="tech-panel__column">
        <div className="tech-panel__section">
          <header className="panel-section__header tech-panel__header">
            <div>
              <h4>Tradizioni</h4>
            </div>
            <div className="tech-panel__summary">
              <span className="pill pill--glass">
                Punti: {traditions.availablePoints.toFixed(2)}
              </span>
              <span className="text-muted">Alberi: {Object.keys(perksByTree).length}</span>
            </div>
          </header>
          <div className="tech-panel__toolbar">
            <div className="tech-panel__legend">
              <span className="text-muted">Origine:</span>
              <span className="tech-card__badge tech-card__badge--muted">standard</span>
              <span className="tech-card__badge tech-card__badge--relic">relic</span>
              <span className="tech-card__badge tech-card__badge--anomaly">anomaly</span>
              <span className="tech-card__badge tech-card__badge--faction">faction</span>
            </div>
          </div>
          {exclusivePerkChoices.length > 0 ? (
            <div className="tech-panel__exclusive tech-panel__exclusive--compact">
              <span className="text-muted">Percorsi esclusivi (tradizioni):</span>
              <div className="tech-panel__exclusive-list">
                {exclusivePerkChoices.map((entry) => (
                  <span key={entry.group} className="pill pill--glass">
                    {entry.group}: {entry.name}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          <div className="tech-panel__scroll">
            <div className="tech-branch__techs">
              {Object.entries(perksByTree).map(([tree, perks]) => (
                <div key={tree} className="tech-branch">
                  <div className="tech-branch__header">
                    <div>
                      <div className="tech-branch__title">{tree}</div>
                    </div>
                  </div>
              <div className="tech-branch__clusters">
                {perks.map((perk) => {
                  const unlocked = traditions.unlocked.includes(perk.id);
                  const exclusiveLocked = Boolean(
                    perk.mutuallyExclusiveGroup &&
                          traditions.exclusivePicks &&
                          traditions.exclusivePicks[perk.mutuallyExclusiveGroup] &&
                          traditions.exclusivePicks[perk.mutuallyExclusiveGroup] !== perk.id,
                      );
                      const exclusiveGroup = perk.mutuallyExclusiveGroup;
                      return (
                        <div key={perk.id} className="tech-card">
                          <div className="tech-card__title">
                            {perk.name}{' '}
                            {unlocked ? <span className="tech-card__badge">Sbloccata</span> : null}
                            {renderBadges(
                              perk.era,
                              undefined,
                              undefined,
                              perk.mutuallyExclusiveGroup,
                            )}
                          </div>
                          {exclusiveGroup ? (
                            <p className="text-muted">
                              Percorso esclusivo: {exclusiveGroup}
                              {exclusiveLocked ? ' (bloccato)' : ''}
                            </p>
                          ) : null}
                          {exclusiveLocked ? (
                            <p className="text-muted">
                              Bloccata: scelta esclusiva già effettuata.
                            </p>
                          ) : null}
                          <p className="text-muted">{perk.description}</p>
                          <div className="tech-card__meta">
                            <span>Costo: {perk.cost}</span>
                            <button
                              className="panel__action panel__action--compact"
                              onClick={() => handleUnlockPerk(perk.id)}
                              disabled={unlocked || exclusiveLocked}
                              title={
                                exclusiveLocked
                                  ? 'Bloccata da un percorso esclusivo già scelto.'
                                  : undefined
                              }
                            >
                              Sblocca
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              {availablePerks.length === 0 ? (
                <p className="text-muted">Nessun perk disponibile ora.</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
