import { GalaxyMap } from '@components/GalaxyMap';

import './MapLayer.scss';

interface MapLayerProps {
  focusSystemId: string | null;
  focusPlanetId: string | null;
  focusTrigger?: number;
  mapMessage: string | null;
  onSelectSystem: (
    systemId: string,
    anchor: { x: number; y: number },
  ) => void;
  onSelectPlanet: (
    planetId: string,
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
  focusPlanetId,
  focusTrigger = 0,
  mapMessage,
  onSelectSystem,
  onSelectPlanet,
  onSelectShipyard,
  onClearFocus,
}: MapLayerProps) => (
  <div className="game-map-layer">
    <GalaxyMap
      focusSystemId={focusSystemId}
      focusPlanetId={focusPlanetId}
      focusTrigger={focusTrigger}
      onSystemSelect={onSelectSystem}
      onPlanetSelect={onSelectPlanet}
      onShipyardSelect={onSelectShipyard}
      onClearFocus={onClearFocus}
    />
    {mapMessage ? <div className="map-alert">{mapMessage}</div> : null}
  </div>
);
