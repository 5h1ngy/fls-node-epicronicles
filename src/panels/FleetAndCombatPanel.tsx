import type { RefObject } from 'react';
import { memo } from 'react';
import { useAppSelector, useGameStore } from '@store/gameStore';
import { WarOverview } from './fleet/WarOverview';
import { FleetList } from './fleet/FleetList';
import { CombatReports } from './fleet/CombatReports';
import { WarEventsMemo } from './war/WarEventsMemo';
import {
  selectCombatReports,
  selectEmpires,
  selectFleets,
  selectScienceShips,
  selectSessionTick,
  selectSystems,
  selectWarEvents,
} from '@store/selectors';

interface FleetAndCombatPanelProps {
  warEventsRef?: RefObject<HTMLUListElement | null>;
  unreadWarIds?: Set<string>;
  onMarkWarRead?: () => void;
}

const FleetAndCombatPanelComponent = ({
  warEventsRef,
  unreadWarIds,
  onMarkWarRead,
}: FleetAndCombatPanelProps) => {
  const fleets = useAppSelector(selectFleets);
  const systems = useAppSelector(selectSystems);
  const orderFleetMove = useGameStore((state) => state.orderFleetMove);
  const designs = useGameStore((state) => state.config.military.shipDesigns);
  const reports = useAppSelector(selectCombatReports).slice().reverse().slice(0, 30);
  const scienceShips = useAppSelector(selectScienceShips);
  const empires = useAppSelector(selectEmpires);
  const mergeFleetsAction = useGameStore((state) => state.mergeFleets);
  const splitFleetAction = useGameStore((state) => state.splitFleet);
  const warEvents = useAppSelector(selectWarEvents).slice().reverse().slice(0, 20);
  const sessionTick = useAppSelector(selectSessionTick);

  return (
    <section className="fleet-combat-panel">
      <WarOverview empires={empires} sessionTick={sessionTick} />
      <WarEventsMemo
        events={warEvents}
        empires={empires}
        unreadWarIds={unreadWarIds}
        onMarkWarRead={onMarkWarRead}
        warEventsRef={warEventsRef}
      />
      <FleetList
        fleets={fleets}
        systems={systems}
        scienceShips={scienceShips}
        designs={designs}
        onOrder={(fleetId, systemId) => orderFleetMove(fleetId, systemId)}
        onMerge={mergeFleetsAction}
        onSplit={splitFleetAction}
      />
      <CombatReports reports={reports} systems={systems} />
    </section>
  );
};

export const FleetAndCombatPanel = memo(FleetAndCombatPanelComponent);
