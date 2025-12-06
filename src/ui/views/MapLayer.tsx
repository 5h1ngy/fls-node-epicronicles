import { GalaxyMap } from '@components/GalaxyMap';

import './MapLayer.scss';

interface MapLayerProps {
  focusSystemId: string | null;
  focusTrigger?: number;
  mapMessage: string | null;
  onSelectSystem: (
    systemId: string,
    anchor: { x: number; y: number },
  ) => void;
  onSelectShipyard: (
    systemId: string,
    anchor: { x: number; y: number },
  ) => void;
  onClearFocus: () => void;
}

export const MapLayer = ({
  focusSystemId,
  focusTrigger = 0,
  mapMessage,
  onSelectSystem,
  onSelectShipyard,
  onClearFocus,
}: MapLayerProps) => (
  <div className="game-map-layer">
    <GalaxyMap
      focusSystemId={focusSystemId}
      focusTrigger={focusTrigger}
      onSystemSelect={onSelectSystem}
      onShipyardSelect={onSelectShipyard}
      onClearFocus={onClearFocus}
    />
    {mapMessage ? <div className="map-alert">{mapMessage}</div> : null}
  </div>
);
