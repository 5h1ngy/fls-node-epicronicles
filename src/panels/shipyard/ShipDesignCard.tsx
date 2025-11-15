import type { Dispatch, SetStateAction } from 'react';
import type { ShipDesign } from '@domain/types';
import { applyShipTemplate, applyCustomization } from '@domain/fleet/ships';
import { formatCost } from '../shared/formatters';
import type { MilitaryConfig } from '@config/gameConfig';

import '../../styles/components/FleetShared.scss';
import '../../styles/components/ShipyardPanel.scss';

type CustomState = {
  offense: number;
  defense: number;
  hull: number;
  name: string;
};

interface ShipDesignCardProps {
  design: ShipDesign;
  templates: MilitaryConfig['templates'];
  queueLength: number;
  queueLimit: number;
  canAfford: (cost: Record<string, number | undefined>) => boolean;
  selectedTemplateId: string;
  onSelectTemplate: (templateId: string) => void;
  customState: CustomState;
  setCustomState: Dispatch<SetStateAction<Record<string, CustomState>>>;
  onBuild: (designId: ShipDesign['id'], designName: string) => void;
  onBuildCustom: (
    designId: ShipDesign['id'],
    designName: string,
    customization: CustomState,
    templateId?: string,
  ) => void;
}

export const ShipDesignCard = ({
  design,
  templates,
  queueLength,
  queueLimit,
  canAfford,
  selectedTemplateId,
  onSelectTemplate,
  customState,
  setCustomState,
  onBuild,
  onBuildCustom,
}: ShipDesignCardProps) => {
  const effectiveDesign =
    selectedTemplateId && templates.length > 0
      ? applyShipTemplate(
          design,
          templates.find((tpl) => tpl.id === selectedTemplateId) ?? templates[0],
        )
      : design;

  const points = customState.offense + customState.defense + customState.hull;
  const costMultiplier = 1 + points * 0.08;
  const customizedDesign = applyCustomization(effectiveDesign, {
    attackBonus: customState.offense * 2,
    defenseBonus: customState.defense * 1.5,
    hullBonus: customState.hull * 3,
    costMultiplier,
    name: customState.name || undefined,
  });
  const affordable = canAfford(design.buildCost);
  const disabled = queueLength >= queueLimit || !affordable;
  const customAffordable = canAfford(customizedDesign.buildCost);
  const customDisabled =
    queueLength >= queueLimit || !customAffordable || points <= 0;

  return (
    <div className="shipyard-panel__card">
      <strong>{effectiveDesign.name}</strong>
      <span className="text-muted">Tempo: {design.buildTime} tick</span>
      {templates.length > 0 ? (
        <label className="fleet-panel__order">
          <span className="text-muted">Template</span>
          <select
            value={selectedTemplateId}
            onChange={(event) => onSelectTemplate(event.target.value)}
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
      <p>Costi: {formatCost(effectiveDesign.buildCost) || 'N/A'}</p>
      <div className="fleet-panel__order">
        <span className="text-muted">
          Att:{effectiveDesign.attack} Dif:{effectiveDesign.defense} Hull:
          {effectiveDesign.hullPoints}
        </span>
      </div>
      <button
        className="panel__action panel__action--compact"
        disabled={disabled}
        onClick={() => onBuild(design.id, design.name)}
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
              setCustomState((prev) => ({
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
              setCustomState((prev) => ({
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
              setCustomState((prev) => ({
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
              setCustomState((prev) => ({
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
        <p>Costi: {formatCost(customizedDesign.buildCost) || 'N/A'}</p>
        <button
          className="panel__action panel__action--compact"
          disabled={customDisabled}
          onClick={() =>
            onBuildCustom(design.id, design.name, customState, selectedTemplateId)
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
};
