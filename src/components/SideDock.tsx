import {
  SatelliteDish,
  Sparkles,
  Handshake,
  LineChart,
  FlaskConical,
  Orbit,
  Flag,
  Swords,
  ScrollText,
} from 'lucide-react';
import './SideDock.scss';

interface SideDockProps {
  onOpenMissions: () => void;
  onOpenEvents: () => void;
  onOpenDiplomacy: () => void;
  onOpenEconomy: () => void;
  onOpenResearch: () => void;
  onOpenGalaxy: () => void;
  onOpenColonization: () => void;
  onOpenBattles: () => void;
  onOpenLog: () => void;
  showColonization?: boolean;
}

export const SideDock = ({
  onOpenMissions,
  onOpenEvents,
  onOpenDiplomacy,
  onOpenEconomy,
  onOpenResearch,
  onOpenGalaxy,
  onOpenColonization,
  onOpenBattles,
  onOpenLog,
  showColonization = true,
}: SideDockProps) => (
  <aside className="side-dock">
    <div className="side-dock__items">
      <button
        type="button"
        className="side-dock__btn"
        onClick={onOpenLog}
        aria-label="Log eventi"
        data-tooltip="Log eventi"
      >
        <ScrollText size={18} />
      </button>
      <button
        type="button"
        className="side-dock__btn"
        onClick={onOpenMissions}
        aria-label="Missioni in corso"
        data-tooltip="Missioni in corso"
      >
        <SatelliteDish size={18} />
      </button>
      <button
        type="button"
        className="side-dock__btn"
        onClick={onOpenEvents}
        aria-label="Eventi e anomalie"
        data-tooltip="Eventi e anomalie"
      >
        <Sparkles size={18} />
      </button>
      <button
        type="button"
        className="side-dock__btn"
        onClick={onOpenDiplomacy}
        aria-label="Diplomazia"
        data-tooltip="Diplomazia"
      >
        <Handshake size={18} />
      </button>
      <button
        type="button"
        className="side-dock__btn"
        onClick={onOpenEconomy}
        aria-label="Bilancio economico"
        data-tooltip="Bilancio economico"
      >
        <LineChart size={18} />
      </button>
      <button
        type="button"
        className="side-dock__btn"
        onClick={onOpenResearch}
        aria-label="Ricerca & Tradizioni"
        data-tooltip="Ricerca & Tradizioni"
      >
        <FlaskConical size={18} />
      </button>
      {showColonization ? (
        <button
          type="button"
          className="side-dock__btn"
          onClick={onOpenColonization}
          aria-label="Colonizzazione"
          data-tooltip="Colonizzazione"
        >
          <Flag size={18} />
        </button>
      ) : null}
      <button
        type="button"
        className="side-dock__btn"
        onClick={onOpenBattles}
        aria-label="Flotte & Battaglie"
        data-tooltip="Flotte & Battaglie"
      >
        <Swords size={18} />
      </button>
      <button
        type="button"
        className="side-dock__btn"
        onClick={onOpenGalaxy}
        aria-label="Panoramica galassia"
        data-tooltip="Panoramica galassia"
      >
        <Orbit size={18} />
      </button>
    </div>
  </aside>
);
