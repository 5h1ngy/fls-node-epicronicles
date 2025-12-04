import { useMemo, useState } from "react";
import { useAppSelector, useGameStore } from "@store/gameStore";
import type { ShipClassId, StarSystem } from "@domain/types";
import type { BuildShipyardReason } from "@store/slice/gameSlice";
import { ShipDesignCard } from "./components/ShipDesignCard";
import { BuildQueue } from "./components/BuildQueue";
import { selectResources, selectShipyardQueue, selectResearch } from "@store/selectors";
import "./ShipyardWindow.scss";

const buildMessages = {
  NO_SESSION: "Nessuna sessione.",
  INVALID_DESIGN: "Progetto nave non valido.",
  QUEUE_FULL: "Coda cantieri piena.",
  INSUFFICIENT_RESOURCES: "Risorse insufficienti.",
} as const;

interface ShipyardWindowProps {
  system?: StarSystem;
}

export const ShipyardWindow = ({ system }: ShipyardWindowProps) => {
  const designs = useGameStore((state) => state.config.military.shipDesigns);
  const queueLimit = useGameStore((state) => state.config.military.shipyard.queueSize);
  const shipyardCost = useGameStore((state) => state.config.military.shipyard.buildCost);
  const queueShipBuild = useGameStore((state) => state.queueShipBuild);
  const shipTemplates = useGameStore((state) => state.config.military.templates);
  const buildShipyard = useGameStore((state) => state.buildShipyard);
  const session = useGameStore((state) => state.session);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Record<string, string>>({});
  const [customConfig, setCustomConfig] = useState<
    Record<
      string,
      {
        offense: number;
        defense: number;
        hull: number;
        name: string;
      }
    >
  >({});

  const resources = useAppSelector(selectResources);
  const queue = useAppSelector(selectShipyardQueue);
  const research = useAppSelector(selectResearch);

  const canAfford = useMemo(() => {
    return (designCost: Record<string, number | undefined>) => {
      if (!resources) {
        return false;
      }
      return Object.entries(designCost).every(([type, amount]) => {
        if (!amount) {
          return true;
        }
        const ledger = resources[type as keyof typeof resources];
        return (ledger?.amount ?? 0) >= amount;
      });
    };
  }, [resources]);

  const handleBuild = (designId: ShipClassId, designName: string) => {
    const templateId = selectedTemplate[designId];
    const result = queueShipBuild(designId, templateId);
    if (result.success) {
      setMessage(`Costruzione ${designName} avviata.`);
    } else {
      setMessage(buildMessages[result.reason]);
    }
  };

  const handleBuildCustom = (
    designId: ShipClassId,
    designName: string,
    customization: {
      offense: number;
      defense: number;
      hull: number;
      name: string;
    },
    templateId?: string,
  ) => {
    const attackBonus = customization.offense * 2;
    const defenseBonus = customization.defense * 1.5;
    const hullBonus = customization.hull * 3;
    const points = customization.offense + customization.defense + customization.hull;
    const costMultiplier = 1 + points * 0.08;
    const result = queueShipBuild(designId, templateId, {
      attackBonus,
      defenseBonus,
      hullBonus,
      costMultiplier,
      name: customization.name ? customization.name : undefined,
    });
    if (result.success) {
      const label = customization.name || designName || "custom";
      setMessage(`Variante ${label} avviata.`);
    } else {
      setMessage(buildMessages[result.reason]);
    }
  };

  const queueWithProgress = useMemo(
    () =>
      queue.map((task) => ({
        ...task,
        progress: 1 - task.ticksRemaining / Math.max(1, task.totalTicks),
      })),
    [queue],
  );

  const completedTechs = useMemo(
    () =>
      new Set(research ? Object.values(research.branches).flatMap((b) => b.completed) : []),
    [research],
  );

  type BuildCheck = { ok: true } | { ok: false; reason: BuildShipyardReason };
  const canBuildShipyard: BuildCheck = useMemo(() => {
    if (!session || !system) {
      return { ok: false, reason: "NO_SESSION" };
    }
    if (system.visibility !== "surveyed") {
      return { ok: false, reason: "SYSTEM_NOT_SURVEYED" };
    }
    if (system.hasShipyard) {
      return { ok: false, reason: "ALREADY_BUILT" };
    }
    if (!completedTechs.has("orbital-shipyard")) {
      return { ok: false, reason: "TECH_MISSING" };
    }
    const constructorPresent = session.fleets.some(
      (fleet) =>
        fleet.systemId === system.id &&
        fleet.ships.some((ship) => designs.find((d) => d.id === ship.designId)?.role === "construction"),
    );
    if (!constructorPresent) {
      return { ok: false, reason: "NO_CONSTRUCTOR" };
    }
    if (system.shipyardBuild) {
      return { ok: false, reason: "IN_PROGRESS" };
    }
    if (!canAfford(shipyardCost)) {
      return { ok: false, reason: "INSUFFICIENT_RESOURCES" };
    }
    return { ok: true };
  }, [session, system, completedTechs, designs, shipyardCost, canAfford]);

  const handleBuildShipyard = () => {
    if (!system) return;
    const result = buildShipyard(system.id, system.shipyardAnchorPlanetId ?? null);
    if (result.success) {
      setMessage("Costruzione cantiere avviata (10 tick).");
    } else if (result.reason) {
      const labels: Record<string, string> = {
        NO_SESSION: "Nessuna sessione attiva.",
        SYSTEM_NOT_FOUND: "Sistema non valido.",
        SYSTEM_NOT_SURVEYED: "Il sistema deve essere ispezionato.",
        TECH_MISSING: "Richiede la tecnologia Cantiere orbitale.",
        ALREADY_BUILT: "Cantiere gia presente.",
        NO_CONSTRUCTOR: "Serve una nave costruttrice nel sistema.",
        INSUFFICIENT_RESOURCES: "Risorse insufficienti.",
        IN_PROGRESS: "Costruzione gia in corso.",
      } as const;
      setMessage(labels[result.reason] ?? "Azione non disponibile.");
    }
  };

  const allowedDesign = (designId: string) => {
    if (designId === "constructor") return true;
    const hasYard = completedTechs.has("orbital-shipyard");
    if (designId === "colony") return hasYard && completedTechs.has("colony-foundations");
    if (designId === "science") return hasYard && completedTechs.has("science-outfitting");
    if (designId === "corvette" || designId === "frigate") return hasYard;
    return true;
  };

  return (
    <section className="shipyard-panel shipyard-panel--columns">
      <header className="shipyard-panel__header">
        <div>
          <h3>{system ? `Sistema ${system.name}` : "Cantiere orbitale"}</h3>
        </div>
        <div className="shipyard-panel__header-meta"></div>
      </header>
      {message ? <p className="panel-message">{message}</p> : null}
      {system && (!system.hasShipyard || system.shipyardBuild) ? (
        <div className="shipyard-panel__empty">
          {system.shipyardBuild ? (
            <>
              <p className="text-muted">Costruzione cantiere in corso.</p>
              <p className="text-muted">
                Progresso: {Math.round(
                  (1 - system.shipyardBuild.ticksRemaining / Math.max(1, system.shipyardBuild.totalTicks)) *
                    100,
                )}
                %
              </p>
            </>
          ) : (
            <>
              <p className="text-muted">
                Nessun cantiere orbitale in questo sistema. Usa una nave costruttrice per costruirlo.
              </p>
              <p className="text-muted">
                Costo: energia {shipyardCost.energy ?? 0} / minerali {shipyardCost.minerals ?? 0}
              </p>
              <button className="panel__action" onClick={handleBuildShipyard} disabled={!canBuildShipyard.ok}>
                Costruisci cantiere
              </button>
              {canBuildShipyard.ok ? null : (
                <small className="text-muted">
                  {canBuildShipyard.reason === "TECH_MISSING"
                    ? "Richiede tecnologia Cantiere orbitale."
                    : canBuildShipyard.reason === "NO_CONSTRUCTOR"
                      ? "Serve una nave costruttrice nel sistema."
                      : canBuildShipyard.reason === "SYSTEM_NOT_SURVEYED"
                        ? "Il sistema deve essere ispezionato."
                        : canBuildShipyard.reason === "INSUFFICIENT_RESOURCES"
                          ? "Risorse insufficienti."
                          : canBuildShipyard.reason === "IN_PROGRESS"
                            ? "Costruzione gia in corso."
                            : null}
                </small>
              )}
            </>
          )}
        </div>
      ) : null}
      {system?.hasShipyard ? (
        <div className="shipyard-panel__columns">
          <div className="shipyard-panel__col shipyard-panel__col--designs">
            <div className="shipyard-panel__grid">
              {designs.filter((d) => allowedDesign(d.id)).map((design) => {
                const templates = shipTemplates.filter((template) => template.base === design.id);
                const templateId = selectedTemplate[design.id] ?? "";
                const customState = customConfig[design.id] ?? {
                  offense: 0,
                  defense: 0,
                  hull: 0,
                  name: "",
                };
                return (
                  <ShipDesignCard
                    key={design.id}
                    design={design}
                    templates={templates}
                    queueLength={queue.length}
                    queueLimit={queueLimit}
                    canAfford={canAfford}
                    selectedTemplateId={templateId}
                    onSelectTemplate={(id) => setSelectedTemplate((prev) => ({ ...prev, [design.id]: id }))}
                    customState={customState}
                    setCustomState={setCustomConfig}
                    onBuild={handleBuild}
                    onBuildCustom={handleBuildCustom}
                  />
                );
              })}
            </div>
          </div>
          <aside className="shipyard-panel__col shipyard-panel__col--queue-right shipyard-queue__section">
            <BuildQueue queue={queueWithProgress} />
          </aside>
        </div>
      ) : null}
    </section>
  );
};
