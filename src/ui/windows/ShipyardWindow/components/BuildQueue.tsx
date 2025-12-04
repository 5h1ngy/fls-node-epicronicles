import '../ShipyardWindow.scss';

interface BuildQueueProps {
  queue: Array<{
    id: string;
    designId: string;
    ticksRemaining: number;
    totalTicks: number;
    progress: number;
  }>;
}

export const BuildQueue = ({ queue }: BuildQueueProps) => (
  <div className="shipyard-panel__queue">
    <h4>Coda costruzione</h4>
    {queue.length === 0 ? (
      <p className="text-muted">Nessuna nave in costruzione.</p>
    ) : (
      <>
        <div className="shipyard-queue__stack">
          {queue.map((task, idx) => {
            const percent = Math.round(task.progress * 100);
            const isCurrent = idx === 0;
            return (
              <div key={task.id} className={`shipyard-queue__item${isCurrent ? ' shipyard-queue__item--current' : ''}`}>
                <div className="shipyard-queue__top">
                  <span className="shipyard-queue__label">{task.designId}</span>
                  <span className="pill pill--glass" title="Tick rimanenti">
                    ⏱ {task.ticksRemaining}
                  </span>
                </div>
                <div
                  className="shipyard-queue__progress"
                  role="progressbar"
                  aria-valuenow={percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="shipyard-queue__progress-fill"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="shipyard-queue__meta">
                  <span>{isCurrent ? 'In lavorazione' : `# ${idx + 1}`}</span>
                  <span className="text-muted">Tot: {task.totalTicks} tick</span>
                </div>
              </div>
            );
          })}
        </div>
      </>
    )}
  </div>
);
