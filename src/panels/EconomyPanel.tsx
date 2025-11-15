import { useMemo } from "react";
import { useAppSelector } from "@store/gameStore";
import { resourceLabels } from "@domain/shared/resourceMetadata";
import type { ResourceType } from "@domain/types";
import { formatSigned } from "./shared/formatters";
import { selectNetResources, selectPlanets, selectResources } from "@store/selectors";
import "../styles/components/EconomyPanel.scss";
import "../styles/components/EconomyCards.scss";

const RESOURCE_DISPLAY_ORDER: ResourceType[] = [
  "energy",
  "minerals",
  "food",
  "research",
  "influence",
];

const trendClass = (value: number) =>
  value >= 0 ? "economy-pill is-positive" : "economy-pill is-negative";

export const EconomyPanel = () => {
  const resources = useAppSelector(selectResources);
  const planets = useAppSelector(selectPlanets);
  const net = useAppSelector(selectNetResources);

  const aggregate = useMemo(() => {
    if (!resources || !net) {
      return null;
    }
    return { net, resources };
  }, [resources, net]);

  if (!aggregate) {
    return <p className="text-muted">Nessuna informazione economica.</p>;
  }

  const totalStock = RESOURCE_DISPLAY_ORDER.reduce(
    (sum, type) => sum + aggregate.resources[type].amount,
    0,
  );

  return (
    <section className="economy-modal">
      <header className="economy-modal__header">
        <div>
          <p className="economy-modal__eyebrow">Risorse & flussi</p>
          <h2>Bilancio economico</h2>
          <p className="text-muted">
            Produzione, consumi e riserve aggregate. Colonie attive: {planets.length}
          </p>
        </div>
        <div className="economy-modal__summary">
          <span className="pill pill--success">
            Riserve totali: <strong>{totalStock.toFixed(0)}</strong>
          </span>
          <span className="pill">
            Risorse monitorate: <strong>{RESOURCE_DISPLAY_ORDER.length}</strong>
          </span>
        </div>
      </header>
      <div className="economy-grid">
        {RESOURCE_DISPLAY_ORDER.map((type) => {
          const ledger = aggregate.resources[type];
          const netValue = aggregate.net[type];
          return (
            <div className="economy-card" key={type}>
              <div className="economy-card__head">
                <div>
                  <p className="economy-card__eyebrow">{resourceLabels[type]}</p>
                  <h3>{ledger.amount.toFixed(1)}</h3>
                  <span className={trendClass(netValue)}>
                    Net {formatSigned(netValue)}
                  </span>
                </div>
              </div>
              <div className="economy-card__body">
                <div className="economy-meta">
                  <span>Produzione: +{ledger.income.toFixed(1)}</span>
                  <span>Consumo: -{ledger.upkeep.toFixed(1)}</span>
                </div>
                <div className="economy-progress">
                  <div
                    className="economy-progress__fill"
                    style={{
                      width: `${Math.min(100, Math.max(0, ledger.income))}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
