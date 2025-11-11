interface SideDockProps {
  onOpenMissions: () => void;
  onOpenEvents: () => void;
  onOpenDiplomacy: () => void;
  onOpenEconomy: () => void;
}

export const SideDock = ({
  onOpenMissions,
  onOpenEvents,
  onOpenDiplomacy,
  onOpenEconomy,
}: SideDockProps) => (
  <aside className="side-dock">
    <div className="side-dock__items">
      <button
        type="button"
        className="side-dock__btn"
        onClick={onOpenMissions}
        aria-label="Missioni in corso"
        data-tooltip="Missioni in corso"
      >
        🛰️
      </button>
      <button
        type="button"
        className="side-dock__btn"
        onClick={onOpenEvents}
        aria-label="Eventi e anomalie"
        data-tooltip="Eventi e anomalie"
      >
        ✧
      </button>
      <button
        type="button"
        className="side-dock__btn"
        onClick={onOpenDiplomacy}
        aria-label="Diplomazia"
        data-tooltip="Diplomazia"
      >
        🤝
      </button>
      <button
        type="button"
        className="side-dock__btn"
        onClick={onOpenEconomy}
        aria-label="Bilancio economico"
        data-tooltip="Bilancio economico"
      >
        💹
      </button>
    </div>
  </aside>
);
