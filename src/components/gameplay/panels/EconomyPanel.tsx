import { useMemo } from 'react';
import { useGameStore } from '@store/gameStore';
import { resourceLabels } from '@domain/shared/resourceMetadata';
import type { ResourceType } from '@domain/types';
import { formatSigned } from './shared/formatters';

const RESOURCE_DISPLAY_ORDER: ResourceType[] = [
  'energy',
  'minerals',
  'food',
  'research',
  'influence',
];

export const EconomyPanel = () => {
  const resources = useGameStore((state) => state.session?.economy.resources);
  const planets = useGameStore((state) => state.session?.economy.planets ?? []);

  const aggregate = useMemo(() => {
    if (!resources) {
      return null;
    }
    const net: Record<ResourceType, number> = {
      energy: 0,
      minerals: 0,
      food: 0,
      research: 0,
    };
    RESOURCE_DISPLAY_ORDER.forEach((type) => {
      const ledger = resources[type];
      if (!ledger) {
        return;
      }
      net[type] = ledger.income - ledger.upkeep;
    });
    return { net, resources };
  }, [resources]);

  if (!aggregate) {
    return <p className="text-muted">Nessuna informazione economica.</p>;
  }

  return (
    <section className="economy-panel">
      <header>
        <h3>Bilancio risorse</h3>
        <p className="text-muted">Colonie attive: {planets.length}</p>
      </header>
      <ul>
        {RESOURCE_DISPLAY_ORDER.map((type) => {
          const ledger = aggregate.resources[type];
          return (
            <li key={type}>
              <div>
                <strong>{resourceLabels[type]}</strong>
                <span className="text-muted">
                  In magazzino: {ledger.amount.toFixed(1)}
                </span>
              </div>
              <div className="economy-panel__values">
                <span>Produzione: +{ledger.income.toFixed(1)}</span>
                <span>Consumo: -{ledger.upkeep.toFixed(1)}</span>
                <span
                  className={
                    aggregate.net[type] >= 0
                      ? 'economy-panel__net is-positive'
                      : 'economy-panel__net is-negative'
                  }
                >
                  Net: {formatSigned(aggregate.net[type])}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

