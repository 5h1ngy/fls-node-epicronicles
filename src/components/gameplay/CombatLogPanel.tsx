import { useGameStore } from '../../store/gameStore';

const resultLabel = {
  playerVictory: 'Vittoria',
  playerDefeat: 'Sconfitta',
  mutualDestruction: 'Mutua distruzione',
} as const;

export const CombatLogPanel = () => {
  const reports = useGameStore(
    (state) => state.session?.combatReports ?? [],
  ).slice()
    .reverse();
  const systems = useGameStore((state) => state.session?.galaxy.systems ?? []);

  const resolveName = (systemId: string) =>
    systems.find((system) => system.id === systemId)?.name ?? systemId;

  if (reports.length === 0) {
    return null;
  }

  return (
    <section className="combat-log">
      <h3>Rapporti di combattimento</h3>
      <ul>
        {reports.map((report) => (
          <li key={report.id}>
            <div className="combat-log__header">
              <strong>{resultLabel[report.result]}</strong>
              <span className="text-muted">
                Tick {report.tick} &mdash; {resolveName(report.systemId)}
              </span>
            </div>
            <p>
              Potenza flotta: {report.playerPower} | Minaccia: {report.hostilePower}
            </p>
            {report.losses.map((loss) => (
              <p key={`${report.id}-${loss.fleetId}`} className="text-muted">
                Perdite flotta {loss.fleetId.slice(0, 6)}: {loss.shipsLost}
              </p>
            ))}
          </li>
        ))}
      </ul>
    </section>
  );
};
