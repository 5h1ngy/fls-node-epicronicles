interface SideDockProps {
  onOpenMissions: () => void;
}

export const SideDock = ({ onOpenMissions }: SideDockProps) => (
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
    </div>
  </aside>
);
