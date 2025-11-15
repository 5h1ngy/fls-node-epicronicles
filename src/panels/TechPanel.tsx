import { useMemo, useState } from 'react';
import { useAppSelector, useGameStore } from '@store/gameStore';
import { listAvailableTechs } from '@domain/research/research';
import { listTraditionChoices } from '@domain/traditions/traditions';
import { selectResearch, selectTraditions } from '@store/selectors';
import '../styles/components/TechPanel.scss';

export const TechPanel = () => {
  const research = useAppSelector(selectResearch);
  const traditions = useAppSelector(selectTraditions);
  const config = useGameStore((state) => state.config);
  const beginResearch = useGameStore((state) => state.beginResearch);
  const unlockTraditionPerk = useGameStore((state) => state.unlockTraditionPerk);
  const [message, setMessage] = useState<string | null>(null);

  const branches = config.research.branches;
  const availablePerks = useMemo(
    () =>
      traditions
        ? listTraditionChoices(traditions, config.traditions)
        : [],
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

  return (
    <div className="panel tech-panel">
      <header className="panel-section__header">
        <h4>Ricerca & Tradizioni</h4>
        {message ? <span className="panel-message">{message}</span> : null}
      </header>
      <div className="panel-section">
        <strong>Ricerca</strong>
        <div className="tech-panel__branches">
          {branches.map((branch) => {
            const state = research.branches[branch.id];
            const currentTech = state.currentTechId
              ? config.research.techs.find((t) => t.id === state.currentTechId)
              : null;
            const available = listAvailableTechs(branch.id, research, config.research);
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
                <div className="tech-branch__techs">
                  {available.map((tech) => {
                    const completed = state.completed.includes(tech.id);
                    const active = state.currentTechId === tech.id;
                    return (
                      <div key={tech.id} className="tech-card">
                        <div className="tech-card__title">
                          {tech.name}{' '}
                          {completed ? (
                            <span className="tech-card__badge">Completata</span>
                          ) : null}
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
                  {available.length === 0 ? (
                    <p className="text-muted">Nessuna tecnologia disponibile.</p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="panel-section">
        <div className="tech-branch__header">
          <div>
            <strong>Tradizioni</strong>
            <p className="text-muted">
              Punti disponibili: {traditions.availablePoints.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="tech-branch__techs">
          {availablePerks.map((perk) => {
            const unlocked = traditions.unlocked.includes(perk.id);
            return (
              <div key={perk.id} className="tech-card">
                <div className="tech-card__title">
                  {perk.name}{' '}
                  {unlocked ? (
                    <span className="tech-card__badge">Sbloccata</span>
                  ) : null}
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
          {availablePerks.length === 0 ? (
            <p className="text-muted">Nessun perk disponibile ora.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
};
