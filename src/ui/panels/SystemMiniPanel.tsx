import type { StarClass, StarSystem } from '@domain/types';
const starMeta: Record<
  StarClass,
  { label: string; temperature: string }
> = {
  O: { label: 'Gigante blu (Classe O)', temperature: '30.000-50.000 K' },
  B: { label: 'Blu-bianca (Classe B)', temperature: '10.000-30.000 K' },
  A: { label: 'Bianca (Classe A)', temperature: '7.500-10.000 K' },
  F: { label: 'Bianco-gialla (Classe F)', temperature: '6.000-7.500 K' },
  G: { label: 'Gialla (Classe G)', temperature: '5.200-6.000 K' },
  K: { label: 'Arancio (Classe K)', temperature: '3.700-5.200 K' },
  M: { label: 'Rossa (Classe M)', temperature: '2.400-3.700 K' },
};

type SystemMiniPanelProps = {
  system: StarSystem;
  ownerLabel: (ownerId?: string | null) => string;
  shipyardLabel: (system?: StarSystem | null) => string;
  onClose: () => void;
};

export const SystemMiniPanel = ({
  system,
  ownerLabel,
  shipyardLabel,
  onClose,
}: SystemMiniPanelProps) => {
  const meta =
    starMeta[system.starClass] ?? {
      label: `Classe ${system.starClass}`,
      temperature: '-',
    };

  return (
    <div className="system-mini-panel">
      <header className="system-mini-panel__header">
        <div>
          <p className="system-mini-panel__eyebrow">Stella</p>
          <h4 className="system-mini-panel__title">{system.name}</h4>
        </div>
        <button className="system-mini-panel__close" onClick={onClose}>
          X
        </button>
      </header>
      <div className="system-mini-panel__rows">
        <div className="system-mini-panel__row">
          <span className="text-muted">Tipologia</span>
          <span>{meta.label}</span>
        </div>
        <div className="system-mini-panel__row">
          <span className="text-muted">Temperatura</span>
          <span>{meta.temperature}</span>
        </div>
        <div className="system-mini-panel__row">
          <span className="text-muted">Stato</span>
          <span>
            {system.visibility === 'surveyed'
              ? 'Sondato'
              : system.visibility === 'revealed'
                ? 'Rivelato'
                : 'Sconosciuto'}
          </span>
        </div>
        <div className="system-mini-panel__row">
          <span className="text-muted">Proprietario</span>
          <span>{ownerLabel(system.ownerId)}</span>
        </div>
        <div className="system-mini-panel__row">
          <span className="text-muted">Minaccia</span>
          <span>{system.hostilePower ?? 0}</span>
        </div>
        <div className="system-mini-panel__row">
          <span className="text-muted">Cantiere</span>
          <span>{shipyardLabel(system)}</span>
        </div>
        <div className="system-mini-panel__row">
          <span className="text-muted">Pianeti</span>
          <span>{system.orbitingPlanets?.length ?? 0}</span>
        </div>
      </div>
    </div>
  );
};
