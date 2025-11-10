import { useState } from 'react';
import { useGameStore } from '@store/gameStore';

interface HudBottomBarProps {
  onToggleDebug: () => void;
  debugOpen: boolean;
  onShowWars?: () => void;
  warUnread?: number;
}

export const HudBottomBar = ({
  onToggleDebug,
  debugOpen,
  onShowWars,
  warUnread = 0,
}: HudBottomBarProps) => {
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const session = useGameStore((state) => state.session);
  const returnToMenu = useGameStore((state) => state.returnToMenu);
  const saveSession = useGameStore((state) => state.saveSession);
  const loadSession = useGameStore((state) => state.loadSession);
  const hasSavedSession = useGameStore((state) => state.hasSavedSession);

  if (!session) {
    return null;
  }

  const { clock, galaxy, scienceShips, notifications, empires } = session;
  const revealedCount = galaxy.systems.filter(
    (system) => system.visibility !== 'unknown',
  ).length;
  const surveyedCount = galaxy.systems.filter(
    (system) => system.visibility === 'surveyed',
  ).length;
  const visibleNotifications = notifications.slice(-2).reverse();
  const activeWars = empires.filter(
    (empire) => empire.kind === 'ai' && empire.warStatus === 'war',
  );
  const latestWarEvent =
    session.warEvents.length > 0
      ? session.warEvents[session.warEvents.length - 1]
      : null;
  const ownedSystems = galaxy.systems.filter(
    (system) => system.ownerId === 'player',
  ).length;
  const warLabels = activeWars
    .map((empire) => {
      const duration =
        empire.warSince !== undefined && empire.warSince !== null
          ? ` ${Math.max(0, clock.tick - empire.warSince)}t`
          : '';
      return `${empire.name}${duration}`;
    })
    .slice(0, 3);
  const hasWarEvent =
    notifications.find((notif) => notif.kind === 'warDeclared' || notif.kind === 'peaceAccepted') !==
    undefined;

  return (
    <div className="hud-bottom-bar">
      <div>
        <dt>Tick</dt>
        <dd>{clock.tick}</dd>
      </div>
      <div>
        <dt>Status</dt>
        <dd>{clock.isRunning ? 'Running' : 'Paused'}</dd>
      </div>
      <div>
        <dt>Sistemi</dt>
        <dd>{galaxy.systems.length}</dd>
      </div>
      <div>
        <dt>Rivelati</dt>
        <dd>
          {revealedCount}/{galaxy.systems.length}
        </dd>
      </div>
      <div>
        <dt>Sondati</dt>
        <dd>
          {surveyedCount}/{galaxy.systems.length}
        </dd>
      </div>
      <div>
        <dt>Controllati</dt>
        <dd>{ownedSystems}</dd>
      </div>
      <div>
        <dt>Navi scientifiche</dt>
        <dd>{scienceShips.length}</dd>
      </div>
      <div>
        <dt>Guerre</dt>
        <dd>{activeWars.length}</dd>
      </div>
      {warLabels.length > 0 ? (
        <div className="hud-bottom-bar__wars">
          <strong>Conflitti:</strong>
          {warLabels.map((label) => (
            <span key={label} className="hud-war-chip">
              {label}
            </span>
          ))}
          {activeWars.length > warLabels.length ? (
            <span className="text-muted">+{activeWars.length - warLabels.length}</span>
          ) : null}
          {hasWarEvent ? <span className="hud-war-chip hud-war-chip--alert">!</span> : null}
          {onShowWars ? (
            <button
              className="panel__action panel__action--inline panel__action--compact"
              onClick={onShowWars}
            >
              Journal
            </button>
          ) : null}
          {warUnread > 0 ? (
            <span className="hud-war-chip hud-war-chip--alert" title="Eventi guerra non letti">
              {warUnread}
            </span>
          ) : null}
        </div>
      ) : null}
      {latestWarEvent ? (
        <div className="hud-bottom-bar__wars">
          <strong>Ultimo evento:</strong>
          <span className="hud-war-chip">
            {latestWarEvent.message} (t{latestWarEvent.tick})
          </span>
        </div>
      ) : null}
      {visibleNotifications.length > 0 ? (
        <div className="hud-bottom-bar__notifications">
          {visibleNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`hud-notification hud-notification--${notification.kind}`}
            >
              <strong>Tick {notification.tick}</strong>
              <span>{notification.message}</span>
            </div>
          ))}
        </div>
      ) : null}
      <div className="hud-bottom-bar__actions">
        <button
          className="panel__action panel__action--inline panel__action--compact"
          onClick={() => {
            const result = saveSession();
            setSaveMessage(
              result.success
                ? 'Partita salvata.'
                : 'Salvataggio non riuscito.',
            );
          }}
        >
          Save
        </button>
        <button
          className="panel__action panel__action--inline panel__action--compact"
          onClick={() => {
            const result = loadSession();
            setSaveMessage(
              result.success
                ? 'Partita caricata.'
                : 'Caricamento non riuscito.',
            );
          }}
          disabled={!hasSavedSession()}
        >
          Load
        </button>
        <button
          className="panel__action panel__action--inline panel__action--compact"
          onClick={onToggleDebug}
        >
          {debugOpen ? 'Hide debug' : 'Debug'}
        </button>
        <button
          className="panel__action panel__action--inline panel__action--compact"
          onClick={returnToMenu}
        >
          Quit to menu
        </button>
        {saveMessage ? (
          <span className="text-muted">{saveMessage}</span>
        ) : null}
      </div>
    </div>
  );
};
