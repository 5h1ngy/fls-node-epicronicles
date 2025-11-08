import type { RefObject } from 'react';
import { useGameStore } from '@store/gameStore';
import { WarOverview, WarEvents } from './fleet/WarOverview';
import { FleetList } from './fleet/FleetList';
import { CombatReports } from './fleet/CombatReports';

interface FleetAndCombatPanelProps {
  warEventsRef?: RefObject<HTMLDivElement>;
  unreadWarIds?: Set<string>;
  onMarkWarRead?: () => void;
}

export const FleetAndCombatPanel = ({
  warEventsRef,
  unreadWarIds,
  onMarkWarRead,
}: FleetAndCombatPanelProps) => {
  const session = useGameStore((state) => state.session);
  const fleets = session?.fleets ?? [];
  const systems = session?.galaxy.systems ?? [];
  const orderFleetMove = useGameStore((state) => state.orderFleetMove);
  const designs = useGameStore((state) => state.config.military.shipDesigns);
  const reports = (session?.combatReports ?? []).slice().reverse();
  const scienceShips = session?.scienceShips ?? [];
  const empires = session?.empires ?? [];
  const mergeFleetsAction = useGameStore((state) => state.mergeFleets);
  const splitFleetAction = useGameStore((state) => state.splitFleet);
  const warEvents = (session?.warEvents ?? []).slice().reverse();

  return (
    <section className="fleet-combat-panel">
      <WarOverview empires={empires} sessionTick={session?.clock.tick ?? 0} />
      <WarEvents
        warEvents={warEvents}
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
