import { memo } from 'react';
import type { WarEvent, Empire } from '@domain/types';
import { WarEvents } from './WarOverview';

interface WarEventsMemoProps {
  events: WarEvent[];
  empires: Empire[];
  warEventsRef?: React.RefObject<HTMLUListElement | null>;
  unreadWarIds?: Set<string>;
  onMarkWarRead?: () => void;
}

export const WarEventsMemo = memo(function WarEventsMemo({
  events,
  empires,
  warEventsRef,
  unreadWarIds,
  onMarkWarRead,
}: WarEventsMemoProps) {
  return (
    <WarEvents
      warEvents={events}
      empires={empires}
      unreadWarIds={unreadWarIds}
      onMarkWarRead={onMarkWarRead}
      warEventsRef={warEventsRef}
    />
  );
});
