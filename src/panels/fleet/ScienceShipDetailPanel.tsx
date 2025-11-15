import type { ScienceShip, StarSystem } from '@domain/types';

import '../../styles/components/FleetShared.scss';

interface ScienceShipDetailPanelProps {
  ship: ScienceShip;
  systems: StarSystem[];
  onClose: () => void;
}

const statusLabel: Record<ScienceShip['status'], string> = {
  idle: 'In stazione',
  traveling: 'In viaggio',
  surveying: 'Sondando',
};

export const ScienceShipDetailPanel = ({
  ship,
  systems,
  onClose,
}: ScienceShipDetailPanelProps) => {
  const resolveName = (systemId: string | null | undefined) =>
    systemId
      ? systems.find((system) => system.id === systemId)?.name ?? systemId
      : 'N/D';

  return (
    <div className="science-detail">
      <header className="science-detail__header">
        <div>
          <p className="fleet-detail__eyebrow">Dettagli nave scientifica</p>
          <h3 className="fleet-detail__title">{ship.name ?? ship.id}</h3>
          <div className="fleet-detail__meta">
            <span>Stato: {statusLabel[ship.status]}</span>
          </div>
        </div>
        <button className="dock-detail__close" onClick={onClose}>
          ×
        </button>
      </header>

      <section className="science-detail__section">
        <div className="science-detail__row">
          <div>
            <span className="text-muted">Sistema attuale</span>
            <p className="science-detail__value">
              {resolveName(ship.currentSystemId)}
            </p>
          </div>
          <div>
            <span className="text-muted">Destinazione</span>
            <p className="science-detail__value">
              {ship.targetSystemId ? resolveName(ship.targetSystemId) : 'Nessuna'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
