import { memo } from 'react';
import { useAppSelector, useGameStore } from '@store/gameStore';
import { FleetList } from './components/FleetList';
import {
  selectFleets,
  selectScienceShips,
  selectSystems,
} from '@store/selectors';
import './FleetAndCombatWindow.scss';

const FleetAndCombatWindowComponent = () => {
  const fleets = useAppSelector(selectFleets);
  const systems = useAppSelector(selectSystems);
  const orderFleetMove = useGameStore((state) => state.orderFleetMove);
  const designs = useGameStore((state) => state.config.military.shipDesigns);
  const scienceShips = useAppSelector(selectScienceShips);
  const mergeFleetsAction = useGameStore((state) => state.mergeFleets);
  const splitFleetAction = useGameStore((state) => state.splitFleet);

  return (
    <section className="fleet-combat-panel">
      <FleetList
        fleets={fleets}
        systems={systems}
        scienceShips={scienceShips}
        designs={designs}
        onOrder={(fleetId, systemId) => orderFleetMove(fleetId, systemId)}
        onMerge={mergeFleetsAction}
        onSplit={splitFleetAction}
      />
    </section>
  );
};

export const FleetAndCombatWindow = memo(FleetAndCombatWindowComponent);
