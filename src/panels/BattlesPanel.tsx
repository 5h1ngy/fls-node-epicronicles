import type { RefObject } from 'react';
import { memo } from 'react';
import { useAppSelector } from '@store/gameStore';
import { WarOverview } from './fleet/WarOverview';
import { CombatReports } from './fleet/CombatReports';
import { WarEventsMemo } from './war/WarEventsMemo';
import {
  selectCombatReports,
  selectEmpires,
  selectSessionTick,
  selectSystems,
  selectWarEvents,
} from '@store/selectors';

interface BattlesPanelProps {
  warEventsRef?: RefObject<HTMLUListElement | null>;
  unreadWarIds?: Set<string>;
  onMarkWarRead?: () => void;
}

const BattlesPanelComponent = ({
  warEventsRef,
  unreadWarIds,
  onMarkWarRead,
}: BattlesPanelProps) => {
  const empires = useAppSelector(selectEmpires);
  const systems = useAppSelector(selectSystems);
  const reports = useAppSelector(selectCombatReports).slice().reverse().slice(0, 30);
  const warEvents = useAppSelector(selectWarEvents).slice().reverse().slice(0, 20);
  const sessionTick = useAppSelector(selectSessionTick);

  return (
    <section className="battles-panel">
      <WarOverview empires={empires} sessionTick={sessionTick} />
      <WarEventsMemo
        events={warEvents}
        empires={empires}
        unreadWarIds={unreadWarIds}
        onMarkWarRead={onMarkWarRead}
        warEventsRef={warEventsRef}
      />
      <CombatReports reports={reports} systems={systems} />
    </section>
  );
};

export const BattlesPanel = memo(BattlesPanelComponent);

