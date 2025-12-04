import type { ReactElement } from 'react';
import { useGameStore } from '@store/gameStore';
import { RESOURCE_TYPES } from '@domain/economy/economy';
import { resourceLabels } from '@domain/shared/resourceMetadata';
import { Zap, Pickaxe, Sandwich, FlaskConical, Star } from 'lucide-react';

import './ResourcesBar.scss';

const resourceIcons: Record<string, ReactElement> = {
  energy: <Zap size={16} />,
  minerals: <Pickaxe size={16} />,
  food: <Sandwich size={16} />,
  research: <FlaskConical size={16} />,
  influence: <Star size={16} />,
};

const resourceDesc: Record<string, string> = {
  energy: "Energia accumulata e produzione per tick.",
  minerals: "Minerali disponibili e produzione per tick.",
  food: "Cibo disponibile e produzione per tick.",
  research: "Punti ricerca e produzione per tick.",
  influence: "Influenza accumulata e produzione per tick.",
};

export const ResourcesBar = () => {
  const resources = useGameStore((state) => state.session?.economy.resources);

  if (!resources) {
    return null;
  }

  return (
    <div className="resource-bar">
      {RESOURCE_TYPES.map((type) => {
        const entry = resources[type];
        const net = entry.income - entry.upkeep;
        const deltaClass = net > 0 ? "is-positive" : net < 0 ? "is-negative" : "is-zero";
        const deltaSign = net > 0 ? "+" : net < 0 ? "-" : "0";
        return (
          <div
            className="resource-chip"
            key={type}
            data-tooltip={`${resourceLabels[type]}: ${resourceDesc[type] ?? ""}`}
          >
            <div className="resource-chip__icon">{resourceIcons[type] ?? null}</div>
            <div className="resource-chip__meta">
              <span className="resource-chip__label">{resourceLabels[type]}</span>
              <div className="resource-chip__values">
                <span className="resource-chip__value">{entry.amount.toFixed(0)}</span>
                <span className={`resource-chip__delta ${deltaClass}`}>
                  {deltaSign}
                  {Math.abs(net).toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
