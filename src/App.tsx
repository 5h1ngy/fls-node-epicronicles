import { useEffect } from 'react';
import './styles/main.scss';
import { GameScreen } from '@components/GameScreen';
import { MainMenu } from '@pages/MainMenu';
import { useGameStore } from '@store/gameStore';

export const App = () => {
  const view = useGameStore((state) => state.view);
  const autoStart = useGameStore((state) => state.config.debug.autoStart);
  const hasSession = useGameStore((state) => Boolean(state.session));
  const startNewSession = useGameStore((state) => state.startNewSession);

  useEffect(() => {
    if (autoStart && !hasSession) {
      startNewSession();
    }
  }, [autoStart, hasSession, startNewSession]);

  const isMenu = view === 'mainMenu';

  return (
    <div className={`app-shell ${isMenu ? 'app-shell--menu' : ''}`}>
      {isMenu ? <MainMenu /> : <GameScreen />}
    </div>
  );
};
