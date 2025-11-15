import { memo } from "react";
import { useAppSelector } from "@store/gameStore";
import { selectPlanets } from "@store/selectors";
import "../styles/components/PlanetPanels.scss";

interface ColonyPanelProps {
  onSelectPlanet: (planetId: string, systemId: string) => void;
  onFocusSystem: (systemId: string) => void;
}

const ColonyPanelComponent = ({ onSelectPlanet }: ColonyPanelProps) => {
  const planets = useAppSelector(selectPlanets);

  return (
    <section className="colony-panel">
      <div className="panel-section">
        <div className="panel-section__header">
          <h3>Colonie attive</h3>
        </div>
        <p className="text-muted">
          La gestione colonizzazione è ora nel dock (icona bandiera).
        </p>
        {planets.length === 0 ? (
          <p className="text-muted">Nessuna colonia attiva.</p>
        ) : (
          <ul className="colony-list">
            {planets.map((planet) => (
              <li key={planet.id}>
                <button
                  type="button"
                  className="colony-chip"
                  onClick={() => onSelectPlanet(planet.id, planet.systemId)}
                >
                  <span>{planet.name}</span>
                  <small>{planet.id}</small>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export const ColonyPanel = memo(ColonyPanelComponent);
