import { useMemo } from 'react';
import { useAppSelector } from '@store/gameStore';
import {
  selectColonizationTasks,
  selectSystems,
} from '@store/selectors';
import type { ColonizationStatus, ColonizationTask } from '@domain/types';
import './MissionsWindow.scss';

const statusLabels: Record<ColonizationStatus, string> = {
  preparing: 'Allestimento',
  traveling: 'In viaggio',
  colonizing: 'Insediamento',
};

const statusBadgeClass: Record<ColonizationStatus, string> = {
  preparing: 'is-preparing',
  traveling: 'is-traveling',
  colonizing: 'is-colonizing',
};

const missionProgressPercent = (task: ColonizationTask) => {
  if (task.missionTotalTicks <= 0) {
    return 0;
  }
  return Math.round(
    Math.min(1, task.missionElapsedTicks / task.missionTotalTicks) * 100,
  );
};

const stageProgressLabel = (task: ColonizationTask) => {
  if (task.totalTicks <= 0) {
    return '0/0 tick';
  }
  const completed = Math.max(0, task.totalTicks - task.ticksRemaining);
  return `${completed}/${task.totalTicks} tick`;
};

export const MissionsWindow = () => {
  const colonizationTasks = useAppSelector(selectColonizationTasks);
  const systems = useAppSelector(selectSystems);

  const tasks = useMemo(
    () =>
      colonizationTasks.map((task) => ({
        task,
        system: systems.find((entry) => entry.id === task.systemId) ?? null,
        missionProgress: missionProgressPercent(task),
        stageProgress: stageProgressLabel(task),
      })),
    [colonizationTasks, systems],
  );

  return (
    <div className="missions-panel">
      <header className="missions-panel__header">
        <div>
          <p className="missions-panel__eyebrow">Riepilogo missioni</p>
          <h2>Missioni in corso</h2>
        </div>
        <div className="missions-panel__summary">
          <span className="pill">
            Totali: <strong>{colonizationTasks.length}</strong>
          </span>
          <span className="pill pill--success">
            In corso: <strong>{colonizationTasks.filter((t) => t.status !== 'preparing').length}</strong>
          </span>
        </div>
      </header>
      {tasks.length === 0 ? (
        <p className="text-muted">Nessuna missione attiva.</p>
      ) : (
        <div className="missions-grid">
          {tasks.map(({ task, system, missionProgress, stageProgress }) => (
            <div className="mission-card" key={task.id}>
              <div className="mission-card__head">
                <div>
                  <p className="mission-card__eyebrow">Colonizzazione</p>
                  <h3>{system?.name ?? task.systemId}</h3>
                  <span
                    className={`colonization-status ${statusBadgeClass[task.status]}`}
                  >
                    {statusLabels[task.status]}
                  </span>
                </div>
                <div className="mission-card__progress">
                  <span className="mission-card__percent">{missionProgress}%</span>
                  <small>
                    Missione {task.missionElapsedTicks}/{task.missionTotalTicks}{' '}
                    tick
                  </small>
                </div>
              </div>
              <div className="mission-card__body">
                <div className="mission-card__bar">
                  <div
                    className="mission-card__bar-fill"
                    style={{ width: `${missionProgress}%` }}
                  />
                </div>
                <div className="mission-card__meta">
                  <span>Stadio: {stageProgress}</span>
                  <span>Durata stimata: {task.totalTicks} tick</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
