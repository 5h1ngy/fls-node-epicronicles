import { useEffect } from 'react';
import './styles/main.scss';
import { GameScreen } from '@components/GameScreen';
import { MainMenu } from '@pages/MainMenu';
import { useGameStore } from '@store/gameStore';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';

const basePath = (import.meta.env.VITE_BASE_PATH || '/').replace(/\/+$/, '') || '';
const HOME_PATH = `${basePath}/`;
const GAME_PATH = `${basePath}/game`;

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
      navigate(GAME_PATH, { replace: true });
    } else {
      navigate(HOME_PATH, { replace: true });
    }
  }, [view, navigate]);

  const isMenu = view === 'mainMenu';

  return (
    <div className={`app-shell ${isMenu ? 'app-shell--menu' : ''}`}>
      <Routes>
        <Route path={HOME_PATH} element={<MainMenu />} />
        <Route
          path={GAME_PATH}
          element={view === 'simulation' ? <GameScreen /> : <Navigate to={HOME_PATH} replace />}
        />
        <Route
          path="*"
          element={<Navigate to={isMenu ? HOME_PATH : GAME_PATH} replace />}
        />
      </Routes>
    </div>
  );
};
