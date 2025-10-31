import { useGameStore } from '../../store/gameStore';
import { RESOURCE_TYPES } from '../../domain/economy';
import { resourceLabels } from '../../domain/resourceMetadata';

export const ResourceBar = () => {
  const resources = useGameStore((state) => state.session?.economy.resources);

  if (!resources) {
    return null;
  }

  return (
    <div className="resource-bar">
      {RESOURCE_TYPES.map((type) => {
        const entry = resources[type];
        const net = entry.income - entry.upkeep;
        const isPositive = net >= 0;
        return (
          <div className="resource-bar__item" key={type}>
            <div className="resource-bar__label-row">
              <span className="resource-bar__label">{resourceLabels[type]}</span>
            </div>
            <div className="resource-bar__value-row">
              <span className="resource-bar__value">
                {entry.amount.toFixed(0)}
              </span>
              <div className="resource-bar__trend">
                <span
                  className={`resource-bar__delta ${
                    isPositive ? 'is-positive' : 'is-negative'
                  }`}
                >
                  {isPositive ? '+' : '-'}
                  {Math.abs(net).toFixed(1)}
                </span>
                <small className="text-muted">
                  {isPositive ? 'surplus' : 'deficit'}/tick
                </small>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
