interface SideDockProps {
  onOpenMissions: () => void;
  onOpenDiplomacy: () => void;
}

export const SideDock = ({ onOpenMissions, onOpenDiplomacy }: SideDockProps) => (
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
        onClick={onOpenDiplomacy}
        aria-label="Diplomazia"
        data-tooltip="Diplomazia"
      >
        🤝
      </button>
    </div>
  </aside>
);
