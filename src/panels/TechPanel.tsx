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

const groupBy = <T, K extends string | number | symbol>(
  items: T[],
  key: (item: T) => K,
): Record<K, T[]> =>
  items.reduce((acc, item) => {
    const k = key(item);
    if (!acc[k]) {
      acc[k] = [];
    }
    acc[k].push(item);
    return acc;
  }, {} as Record<K, T[]>);

export const TechPanel = () => {
  const research = useAppSelector(selectResearch);
  const traditions = useAppSelector(selectTraditions);
  const config = useGameStore((state) => state.config);
  const beginResearch = useGameStore((state) => state.beginResearch);
  const unlockTraditionPerk = useGameStore((state) => state.unlockTraditionPerk);
  const [message, setMessage] = useState<string | null>(null);

  const branches = config.research.branches;
  const availablePerks = useMemo(
    () => (traditions ? listTraditionChoices(traditions, config.traditions) : []),
    [traditions, config.traditions],
  );

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
  ) => (
    <span className="tech-card__badges">
      <span className="tech-card__badge tech-card__badge--muted">Era {era ?? 1}</span>
      {kind ? (
        <span className="tech-card__badge tech-card__badge--muted">
          {kindLabels[kind] ?? kind}
        </span>
      ) : null}
      {origin && origin !== 'standard' ? (
        <span className="tech-card__badge tech-card__badge--muted">{origin}</span>
      ) : null}
      {exclusive ? (
        <span className="tech-card__badge tech-card__badge--warning">Esclusiva</span>
      ) : null}
    </span>
  );

  const branchOffers = branches.map((branch) => ({
    branch,
    offers: getResearchOffers(branch.id, research, config.research),
    state: research.branches[branch.id],
  }));

  const perksByTree = groupBy(availablePerks, (perk) => perk.tree);

  return (
    <div className="panel tech-panel tech-panel__grid">
      <div className="tech-panel__column">
        <header className="panel-section__header tech-panel__header">
          <div>
            <h4>Ricerca</h4>
            {message ? <span className="panel-message">{message}</span> : null}
          </div>
          <div className="tech-panel__eras">
            <span className="pill pill--glass">Era: {research.currentEra}</span>
            <span className="text-muted">
              Ere sbloccate: {research.unlockedEras.join(', ') || '1'}
            </span>
          </div>
        </header>
        <div className="tech-panel__branches">
          {branchOffers.map(({ branch, offers, state }) => {
            const currentTech = state.currentTechId
              ? config.research.techs.find((t) => t.id === state.currentTechId)
              : null;
            const clusters = groupBy(
              offers,
              (tech) => tech.clusterId ?? 'Generiche',
            );
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
                <div className="tech-branch__clusters">
                  {Object.entries(clusters).map(([clusterId, techs]) => (
                    <div key={clusterId} className="tech-cluster">
                      <div className="tech-cluster__header">
                        <span className="text-muted">Cluster: {clusterId}</span>
                      </div>
                      <div className="tech-branch__techs">
                        {techs.map((tech) => {
                          const completed = state.completed.includes(tech.id);
                          const active = state.currentTechId === tech.id;
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
                                    disabled={completed}
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

      <div className="tech-panel__column">
        <header className="panel-section__header">
          <div>
            <h4>Tradizioni</h4>
            <p className="text-muted">
              Punti disponibili: {traditions.availablePoints.toFixed(2)}
            </p>
          </div>
        </header>
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
                  return (
                    <div key={perk.id} className="tech-card">
                      <div className="tech-card__title">
                        {perk.name}{' '}
                        {unlocked ? <span className="tech-card__badge">Sbloccata</span> : null}
                        {renderBadges(perk.era, undefined, undefined, perk.mutuallyExclusiveGroup)}
                      </div>
                      <p className="text-muted">{perk.description}</p>
                      <div className="tech-card__meta">
                        <span>Costo: {perk.cost}</span>
                        <button
                          className="panel__action panel__action--compact"
                          onClick={() => handleUnlockPerk(perk.id)}
                          disabled={unlocked}
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
  );
};
