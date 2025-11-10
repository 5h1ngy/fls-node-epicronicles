import { useMemo, useState } from 'react';
import { useAppSelector, useGameStore } from '@store/gameStore';
import type { ShipClassId, StarSystem } from '@domain/types';
import { ShipDesignCard } from './shipyard/ShipDesignCard';
import { BuildQueue } from './shipyard/BuildQueue';
import { selectResources, selectShipyardQueue } from '@store/selectors';

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

  const resources = useAppSelector(selectResources);
  const queue = useAppSelector(selectShipyardQueue);

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
      const label = customization.name || designName || 'custom';
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
          const customState = customConfig[design.id] ?? {
            offense: 0,
            defense: 0,
            hull: 0,
            name: '',
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
              onSelectTemplate={(id) =>
                setSelectedTemplate((prev) => ({ ...prev, [design.id]: id }))
              }
              customState={customState}
              setCustomState={setCustomConfig}
              onBuild={handleBuild}
              onBuildCustom={handleBuildCustom}
            />
          );
        })}
      </div>
      <BuildQueue queue={queueWithProgress} />
    </section>
  );
};
