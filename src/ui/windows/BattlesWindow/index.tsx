import type { RefObject } from 'react';
import { memo } from 'react';
import { useAppSelector } from '@store/gameStore';
import { WarOverview } from './components/WarOverview';
import { CombatReports } from './components/CombatReports';
import { WarEventsMemo } from './components/WarEventsMemo';
import {
  selectCombatReports,
  selectEmpires,
  selectSessionTick,
  selectSystems,
  selectWarEvents,
} from '@store/selectors';

import './BattlesWindow.scss';

interface BattlesWindowProps {
  warEventsRef?: RefObject<HTMLUListElement | null>;
  unreadWarIds?: Set<string>;
  onMarkWarRead?: () => void;
}

const BattlesWindowComponent = ({
  warEventsRef,
  unreadWarIds,
  onMarkWarRead,
}: BattlesWindowProps) => {
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

export const BattlesWindow = memo(BattlesWindowComponent);

