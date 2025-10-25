import { useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';

export const ColonizationPanel = () => {
  const tasks = useGameStore((state) => state.session?.colonizationTasks ?? []);
  const systems = useGameStore((state) => state.session?.galaxy.systems ?? []);

  const systemMap = useMemo(() => {
    const map = new Map<string, string>();
    systems.forEach((system) => map.set(system.id, system.name));
    return map;
  }, [systems]);

  if (tasks.length === 0) {
    return null;
  }

  return (
    <section className="colonization-panel">
      <h3>Colonizzazioni in corso</h3>
      <ul>
        {tasks.map((task) => {
          const progress =
            1 - task.ticksRemaining / Math.max(1, task.totalTicks);
          return (
            <li key={task.id}>
              <div className="colonization-row">
                <div>
                  <strong>
                    {task.planetTemplate.name} ({systemMap.get(task.systemId)})
                  </strong>
                  <span className="text-muted">
                    {task.ticksRemaining} tick rimanenti
                  </span>
                </div>
                <span className="colonization-status">{task.status}</span>
              </div>
              <div className="colonization-progress">
                <div
                  className="colonization-progress__bar"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
