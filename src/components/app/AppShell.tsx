import { useEffect } from 'react';
import '../../index.css';
import { GameScreen } from '../gameplay/GameScreen';
import { MainMenu } from '../menu/MainMenu';
import { useGameStore } from '../../store/gameStore';

export const AppShell = () => {
  const view = useGameStore((state) => state.view);
  const autoStart = useGameStore((state) => state.config.debug.autoStart);
  const hasSession = useGameStore((state) => Boolean(state.session));
  const startNewSession = useGameStore((state) => state.startNewSession);

  useEffect(() => {
    if (autoStart && !hasSession) {
      startNewSession();
    }
  }, [autoStart, hasSession, startNewSession]);

  return (
    <div className="app-shell">
      {view === 'mainMenu' ? <MainMenu /> : <GameScreen />}
    </div>
  );
};
