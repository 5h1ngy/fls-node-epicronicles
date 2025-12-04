import { useEffect } from 'react';
import './styles/main.scss';
import { GameScreen } from '@components/GameScreen';
import { MainMenu } from '@pages/MainMenu';
import { useGameStore } from '@store/gameStore';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';

export const App = () => {
  const view = useGameStore((state) => state.view);
  const autoStart = useGameStore((state) => state.config.debug.autoStart);
  const hasSession = useGameStore((state) => Boolean(state.session));
  const startNewSession = useGameStore((state) => state.startNewSession);
  const navigate = useNavigate();

  useEffect(() => {
    if (autoStart && !hasSession) {
      startNewSession();
    }
  }, [autoStart, hasSession, startNewSession]);

  useEffect(() => {
    if (view === 'simulation') {
      navigate('/game', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }, [view, navigate]);

  const isMenu = view === 'mainMenu';

  return (
    <div className={`app-shell ${isMenu ? 'app-shell--menu' : ''}`}>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route
          path="/game"
          element={view === 'simulation' ? <GameScreen /> : <Navigate to="/" replace />}
        />
        <Route
          path="*"
          element={<Navigate to={isMenu ? '/' : '/game'} replace />}
        />
      </Routes>
    </div>
  );
};
