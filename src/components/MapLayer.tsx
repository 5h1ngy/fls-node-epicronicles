import { GalaxyMap } from '@components/GalaxyMap';

import '../styles/components/MapLayer.scss';

interface MapLayerProps {
  focusSystemId: string | null;
  focusPlanetId: string | null;
  focusTrigger?: number;
  mapMessage: string | null;
  onSelectSystem: (
    systemId: string,
    anchor: { x: number; y: number },
  ) => void;
  onClearFocus: () => void;
}

export const MapLayer = ({
  focusSystemId,
  focusPlanetId,
  focusTrigger = 0,
  mapMessage,
  onSelectSystem,
  onClearFocus,
}: MapLayerProps) => (
  <div className="game-map-layer">
    <GalaxyMap
      focusSystemId={focusSystemId}
      focusPlanetId={focusPlanetId}
      focusTrigger={focusTrigger}
      onSystemSelect={onSelectSystem}
      onClearFocus={onClearFocus}
    />
    {mapMessage ? <div className="map-alert">{mapMessage}</div> : null}
  </div>
);
