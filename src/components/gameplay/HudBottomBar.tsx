import { useGameStore } from '../../store/gameStore';

interface HudBottomBarProps {
  onToggleDebug: () => void;
  debugOpen: boolean;
}

export const HudBottomBar = ({ onToggleDebug, debugOpen }: HudBottomBarProps) => {
  const session = useGameStore((state) => state.session);
  const returnToMenu = useGameStore((state) => state.returnToMenu);

  if (!session) {
    return null;
  }

  const { clock, galaxy, scienceShips, notifications } = session;
  const revealedCount = galaxy.systems.filter(
    (system) => system.visibility !== 'unknown',
  ).length;
  const surveyedCount = galaxy.systems.filter(
    (system) => system.visibility === 'surveyed',
  ).length;
  const visibleNotifications = notifications.slice(-2).reverse();

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
        <dt>Navi scientifiche</dt>
        <dd>{scienceShips.length}</dd>
      </div>
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
      </div>
    </div>
  );
};
