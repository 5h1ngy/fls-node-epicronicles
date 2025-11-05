import { useMemo, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { resourceLabels } from '../../domain/resourceMetadata';
import type { ShipClassId, StarSystem } from '../../domain/types';
import { applyShipTemplate, applyCustomization } from '../../domain/ships';

const buildMessages = {
  NO_SESSION: 'Nessuna sessione.',
  INVALID_DESIGN: 'Progetto nave non valido.',
  QUEUE_FULL: 'Coda cantieri piena.',
  INSUFFICIENT_RESOURCES: 'Risorse insufficienti.',
} as const;

interface ShipyardPanelProps {
  system?: StarSystem;
}

export const ShipyardPanel = ({ system }: ShipyardPanelProps) => {
  const session = useGameStore((state) => state.session);
  const designs = useGameStore((state) => state.config.military.shipDesigns);
  const queueLimit = useGameStore(
    (state) => state.config.military.shipyard.queueSize,
  );
  const queueShipBuild = useGameStore((state) => state.queueShipBuild);
  const shipTemplates = useGameStore((state) => state.config.military.templates);
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

  const resources = session?.economy.resources;
  const queue = session?.shipyardQueue ?? [];

  const canAfford = (designCost: Record<string, number | undefined>) => {
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

  const queueUsage = `${queue.length}/${queueLimit}`;

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
      setMessage(`Variante ${customization.name || 'custom'} avviata.`);
    } else {
      setMessage(buildMessages[result.reason]);
    }
  };

  if (!session) {
    return null;
  }

  const queueWithProgress = useMemo(
    () =>
      queue.map((task) => ({
        ...task,
        progress:
          1 - task.ticksRemaining / Math.max(1, task.totalTicks),
      })),
    [queue],
  );

  return (
    <section className="shipyard-panel">
      <header>
        <h3>Cantieri</h3>
        <span className="text-muted">Coda: {queueUsage}</span>
      </header>
      {system ? (
        <div className="shipyard-panel__summary">
          <strong>{system.name}</strong>
          <span>Classe: {system.starClass}</span>
          <span>Pianeti orbitanti: {system.orbitingPlanets.length}</span>
        </div>
      ) : null}
      {message ? <p className="panel-message">{message}</p> : null}
      <div className="shipyard-panel__designs">
        {designs.map((design) => {
          const templates = shipTemplates.filter(
            (template) => template.base === design.id,
          );
          const templateId = selectedTemplate[design.id] ?? '';
          const effectiveDesign =
            templateId && templates.length > 0
        ? applyShipTemplate(
            design,
            templates.find((tpl) => tpl.id === templateId) ?? templates[0],
          )
        : design;
          const customState = customConfig[design.id] ?? {
            offense: 0,
            defense: 0,
            hull: 0,
            name: '',
          };
          const points =
            customState.offense + customState.defense + customState.hull;
          const costMultiplier = 1 + points * 0.08;
          const customizedDesign = applyCustomization(effectiveDesign, {
            attackBonus: customState.offense * 2,
            defenseBonus: customState.defense * 1.5,
            hullBonus: customState.hull * 3,
            costMultiplier,
            name: customState.name || undefined,
          });
          const affordable = canAfford(design.buildCost);
          const disabled = queue.length >= queueLimit || !affordable;
          const customAffordable = canAfford(customizedDesign.buildCost);
          const customDisabled =
            queue.length >= queueLimit || !customAffordable || points <= 0;
          return (
            <div key={design.id} className="shipyard-panel__card">
              <strong>{effectiveDesign.name}</strong>
              <span className="text-muted">
                Tempo: {design.buildTime} tick
              </span>
              {templates.length > 0 ? (
                <label className="fleet-panel__order">
                  <span className="text-muted">Template</span>
                  <select
                    value={templateId}
                    onChange={(event) =>
                      setSelectedTemplate((prev) => ({
                        ...prev,
                        [design.id]: event.target.value || '',
                      }))
                    }
                  >
                    <option value="">Base</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <p>
                Costi:{' '}
                {Object.entries(effectiveDesign.buildCost)
                  .filter(([, amount]) => amount && amount > 0)
                  .map(
                    ([type, amount]) =>
                      `${resourceLabels[type as keyof typeof resourceLabels]} ${amount}`,
                  )
                  .join(' | ')}
              </p>
              <div className="fleet-panel__order">
                <span className="text-muted">
                  Att:{effectiveDesign.attack} Dif:{effectiveDesign.defense} Hull:
                  {effectiveDesign.hullPoints}
                </span>
              </div>
              <button
                className="panel__action panel__action--compact"
                disabled={disabled}
                onClick={() => handleBuild(design.id, design.name)}
              >
                Costruisci
              </button>
              <div className="fleet-panel__order">
                <span className="text-muted">Designer rapido (distribuisci punti)</span>
                <label className="panel__field">
                  Offesa (+2 atk per punto)
                  <input
                    type="range"
                    min={0}
                    max={4}
                    value={customState.offense}
                    onChange={(e) =>
                      setCustomConfig((prev) => ({
                        ...prev,
                        [design.id]: {
                          ...customState,
                          offense: Number(e.target.value),
                        },
                      }))
                    }
                  />
                </label>
                <label className="panel__field">
                  Difesa (+1.5 def per punto)
                  <input
                    type="range"
                    min={0}
                    max={4}
                    value={customState.defense}
                    onChange={(e) =>
                      setCustomConfig((prev) => ({
                        ...prev,
                        [design.id]: {
                          ...customState,
                          defense: Number(e.target.value),
                        },
                      }))
                    }
                  />
                </label>
                <label className="panel__field">
                  Hull (+3 hp per punto)
                  <input
                    type="range"
                    min={0}
                    max={4}
                    value={customState.hull}
                    onChange={(e) =>
                      setCustomConfig((prev) => ({
                        ...prev,
                        [design.id]: {
                          ...customState,
                          hull: Number(e.target.value),
                        },
                      }))
                    }
                  />
                </label>
                <label className="panel__field">
                  Nome variante
                  <input
                    type="text"
                    value={customState.name}
                    onChange={(e) =>
                      setCustomConfig((prev) => ({
                        ...prev,
                        [design.id]: {
                          ...customState,
                          name: e.target.value,
                        },
                      }))
                    }
                  />
                </label>
                <p className="text-muted">
                  Punti: {points} · Moltiplicatore costo: {costMultiplier.toFixed(2)}
                </p>
                <p className="text-muted">
                  Statistiche: Atk {customizedDesign.attack} · Dif {customizedDesign.defense} · Hull{' '}
                  {customizedDesign.hullPoints}
                </p>
                <p>
                  Costi:{' '}
                  {Object.entries(customizedDesign.buildCost)
                    .filter(([, amount]) => amount && amount > 0)
                    .map(
                      ([type, amount]) =>
                        `${resourceLabels[type as keyof typeof resourceLabels]} ${amount}`,
                    )
                    .join(' | ')}
                </p>
                <button
                  className="panel__action panel__action--compact"
                  disabled={customDisabled}
                  onClick={() =>
                    handleBuildCustom(
                      design.id,
                      design.name,
                      customState,
                      templateId,
                    )
                  }
                >
                  Costruisci variante
                </button>
                {!customAffordable ? (
                  <p className="text-muted">Risorse insufficienti per la variante.</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      <div className="shipyard-panel__queue">
        <h4>Coda costruzione</h4>
        {queueWithProgress.length === 0 ? (
          <p className="text-muted">Nessuna nave in costruzione.</p>
        ) : (
          <ul>
            {queueWithProgress.map((task) => (
              <li key={task.id}>
                <span>{task.designId}</span>
                <span className="text-muted">
                  {task.ticksRemaining} tick
                </span>
                <div className="progress-bar">
                  <div
                    className="progress-bar__fill"
                    style={{ width: `${Math.round(task.progress * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};
