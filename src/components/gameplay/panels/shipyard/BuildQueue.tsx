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
      <ul>
        {queue.map((task) => (
          <li key={task.id}>
            <span>{task.designId}</span>
            <span className="text-muted">{task.ticksRemaining} tick</span>
            <div className="progress-bar">
              <div
                className="progress-bar__fill"
                style={{ width: `${Math.round(task.progress * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    )}
  </div>
);
