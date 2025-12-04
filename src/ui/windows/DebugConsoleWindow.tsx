import { useState } from 'react';
import type { ReactElement } from 'react';
import { useGameStore } from '@store/gameStore';

import './DebugConsoleWindow.scss';

export const DebugConsoleWindow = () => {
  const session = useGameStore((state) => state.session);
  const rawData = session ?? null;
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    root: true,
  });
  const [watches, setWatches] = useState<string[]>([]);

  const toggle = (path: string) =>
    setExpanded((prev) => ({ ...prev, [path]: !prev[path] }));

  const addWatch = (path: string) =>
    setWatches((prev) => (prev.includes(path) ? prev : [...prev, path]));

  const removeWatch = (path: string) =>
    setWatches((prev) => prev.filter((item) => item !== path));

  const getValueByPath = (data: unknown, path: string) => {
    if (!path || path === 'root') return data;
    return path
      .replace(/^root\./, '')
      .split('.')
      .reduce<unknown>((acc, key) => {
        if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
          return (acc as Record<string, unknown>)[key];
        }
        return undefined;
      }, data);
  };

  if (!rawData) {
    return <p className="text-muted">Nessuna sessione attiva.</p>;
  }

  const renderNode = (
    value: unknown,
    path: string,
    label: string,
    seen: WeakSet<object>,
  ): ReactElement => {
    const isObject = typeof value === 'object' && value !== null;
    const isArray = Array.isArray(value);
    const canExpand = isObject;
    const isExpanded = expanded[path] ?? false;
    const displayLabel = isArray ? `${label} [${(value as unknown[]).length}]` : label;

    if (isObject) {
      if (seen.has(value as object)) {
        return (
          <div className="debug-node" key={path}>
            <div className="debug-node__row">
              <button className="debug-node__toggle" aria-label="circular" disabled>
                ↺
              </button>
              <span className="debug-node__label">{displayLabel}</span>
              <button className="debug-node__watch" onClick={() => addWatch(path)}>
                Watch
              </button>
              <span className="text-muted">[circular]</span>
            </div>
          </div>
        );
      }
      seen.add(value as object);
    }

    return (
      <div className="debug-node" key={path}>
        <div className="debug-node__row">
          {canExpand ? (
            <button
              className="debug-node__toggle"
              onClick={() => toggle(path)}
              aria-label="toggle"
            >
              {isExpanded ? '−' : '+'}
            </button>
          ) : (
            <span className="debug-node__spacer" />
          )}
          <span className="debug-node__label">{displayLabel}</span>
          <button className="debug-node__watch" onClick={() => addWatch(path)}>
            Watch
          </button>
          {!canExpand ? (
            <span className="debug-node__value">
              {typeof value === 'string' ? `"${value}"` : String(value)}
            </span>
          ) : null}
        </div>
        {canExpand && isExpanded ? (
          <div className="debug-node__children">
            {Object.entries(value as Record<string, unknown>).map(([key, child]) =>
              renderNode(child, `${path}.${key}`, key, seen),
            )}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="debug-viewer">
      <div className="debug-card">
        <div className="debug-card__header">
          <h4>Session JSON</h4>
          <span className="text-muted">Espandi i nodi e aggiungi watch</span>
        </div>
        <div className="debug-json">
          {renderNode(rawData, 'root', 'root', new WeakSet())}
        </div>
      </div>
      <div className="debug-card debug-watch">
        <div className="debug-card__header">
          <h4>Watch</h4>
          <span className="text-muted">Variabili monitorate</span>
        </div>
        <div className="debug-watch__list">
          {watches.length === 0 ? (
            <p className="text-muted">Nessuna variabile watchata.</p>
          ) : (
            <ul>
              {watches.map((path) => (
                <li key={path}>
                  <div className="debug-watch__row">
                    <span className="debug-watch__path">{path}</span>
                    <button
                      className="debug-node__watch"
                      onClick={() => removeWatch(path)}
                      aria-label={`Rimuovi watch ${path}`}
                    >
                      X
                    </button>
                  </div>
                  <pre className="debug-watch__value">
                    {JSON.stringify(getValueByPath(rawData, path), null, 2)}
                  </pre>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
