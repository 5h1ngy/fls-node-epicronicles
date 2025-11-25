import { useState, type Dispatch, type SetStateAction } from 'react';
import type { ShipDesign } from '@domain/types';
import { applyShipTemplate, applyCustomization } from '@domain/fleet/ships';
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
  const [showEditor, setShowEditor] = useState(false);
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
  const displayDesign = showEditor ? customizedDesign : effectiveDesign;
  const affordable = canAfford(design.buildCost);
  const disabled = queueLength >= queueLimit || !affordable;
  const customAffordable = canAfford(customizedDesign.buildCost);
  const customDisabled =
    queueLength >= queueLimit || !customAffordable;
  const variantName =
    selectedTemplateId &&
    templates.find((tpl) => tpl.id === selectedTemplateId)?.name;

  return (
    <div className="shipyard-panel__card">
      <div className="shipyard-card__header">
        <div className="shipyard-card__header-left">
          <strong className="shipyard-card__title">{design.name}</strong>
          {variantName ? (
            <p className="shipyard-card__subtitle">{variantName}</p>
          ) : null}
          {design.description ? (
            <p className="shipyard-card__description">{design.description}</p>
          ) : null}
        </div>
        <div className="shipyard-card__badges">
          <span className="pill pill--glass" title="Tempo di costruzione">
            ⏱ {design.buildTime} tick
          </span>
        </div>
      </div>

      <div className="shipyard-card__section">
        <p className="text-muted">Costi</p>
        <div className="shipyard-card__meta">
          {Object.entries(displayDesign.buildCost ?? {}).map(([key, value]) =>
            value ? (
              <span key={key} className="pill pill--cost">
                {key}: {value}
              </span>
            ) : null,
          )}
          {!displayDesign.buildCost || Object.values(displayDesign.buildCost).every((v) => !v)
            ? <span className="pill pill--cost">N/A</span>
            : null}
        </div>
      </div>
      <div className="shipyard-card__section">
        <p className="text-muted">Statistiche</p>
        <div className="shipyard-card__meta">
          <span className="pill pill--stat pill--stat-attack">Atk {displayDesign.attack}</span>
          <span className="pill pill--stat pill--stat-defense">Def {displayDesign.defense}</span>
          <span className="pill pill--stat pill--stat-hull">Hull {displayDesign.hullPoints}</span>
        </div>
      </div>
      {showEditor && (
        <div className="shipyard-card__editor">
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
        </div>
      )}
      <div className="shipyard-card__actions">
        <button
          className="panel__action panel__action--compact"
          disabled={showEditor ? customDisabled : disabled}
          onClick={() =>
            showEditor
              ? onBuildCustom(design.id, design.name, customState, selectedTemplateId)
              : onBuild(design.id, design.name)
          }
        >
          Costruisci
        </button>
        <button
          className="panel__action panel__action--ghost"
          onClick={() => setShowEditor((prev) => !prev)}
        >
          Modifica
        </button>
      </div>
    </div>
  );
};
