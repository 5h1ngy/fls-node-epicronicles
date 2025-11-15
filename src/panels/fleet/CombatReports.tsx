import { useMemo } from 'react';
import type { CombatReport } from '@domain/types';
import type { StarSystem } from '@domain/types';

import '../../styles/components/CombatReports.scss';
import '../../styles/components/FleetShared.scss';

const resultLabel = {
  playerVictory: 'Vittoria',
  playerDefeat: 'Sconfitta',
  mutualDestruction: 'Mutua distruzione',
  stalemate: 'Stallo',
} as const;

const computeSummary = (reports: CombatReport[]) => {
  const totals = {
    total: reports.length,
    victories: reports.filter((r) => r.result === 'playerVictory').length,
    defeats: reports.filter((r) => r.result === 'playerDefeat').length,
    mutual: reports.filter((r) => r.result === 'mutualDestruction').length,
    stalemate: reports.filter((r) => r.result === 'stalemate').length,
    shipsLost: reports.reduce(
      (sum, r) => sum + r.losses.reduce((acc, loss) => acc + loss.shipsLost, 0),
      0,
    ),
    avgDamageTaken:
      reports.length > 0
        ? Math.round(
            reports.reduce((sum, r) => sum + r.damageTaken, 0) /
              reports.length,
          )
        : 0,
  };
  return totals;
};

interface CombatReportsProps {
  reports: CombatReport[];
  systems: StarSystem[];
}

export const CombatReports = ({ reports, systems }: CombatReportsProps) => {
  const battleSummary = useMemo(
    () => computeSummary(reports),
    [reports],
  );
  const resolveName = (systemId: string) =>
    systems.find((system) => system.id === systemId)?.name ?? systemId;

  return (
    <div className="panel-section">
      <div className="panel-section__header">
        <h3>Rapporti di combattimento</h3>
      </div>
      <div className="fleet-panel__order">
        <span className="text-muted">
          Totali: {battleSummary.total} · Vittorie {battleSummary.victories} ·
          Sconfitte {battleSummary.defeats} · Stallo {battleSummary.stalemate} ·
          Mutua {battleSummary.mutual}
        </span>
        <span className="text-muted">
          Navi perse: {battleSummary.shipsLost} · Danno medio subito:{' '}
          {battleSummary.avgDamageTaken}
        </span>
      </div>
      <ul>
        {reports.map((report) => (
          <li key={report.id}>
            <div className="combat-log__header">
              <strong>{resultLabel[report.result]}</strong>
              <span className="text-muted">
                Tick {report.tick} — {resolveName(report.systemId)}
              </span>
            </div>
            <p>
              Potenza flotta: {report.playerPower} | Difesa: {report.playerDefense} | Danno
              subito: {report.damageTaken}
            </p>
            <p>Minaccia: {report.hostilePower}</p>
            {report.losses.map((loss) => (
              <p key={`${report.id}-${loss.fleetId}`} className="text-muted">
                Perdite flotta {loss.fleetId.slice(0, 6)}: {loss.shipsLost}
              </p>
            ))}
          </li>
        ))}
      </ul>
    </div>
  );
};
