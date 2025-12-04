import { MainMenuLayout } from '../MainMenuLayout';

import './MainMenuLanding.scss';

interface MainMenuLandingProps {
  background: string;
  canLoad: boolean;
  onStart: () => void;
  onLoad: () => void;
  toast?: string | null;
}

export const MainMenuLanding = ({
  background,
  canLoad,
  onStart,
  onLoad,
  toast = null,
}: MainMenuLandingProps) => (
  <MainMenuLayout background={background} toast={toast} showBrand>
    <div className="main-menu__dock">
      <div className="main-menu__dock-title">Mission Control</div>
      <button className="main-menu__action" onClick={onStart}>
        Inizia partita
      </button>
      <button
        className="main-menu__action"
        onClick={onLoad}
        disabled={!canLoad}
      >
        Carica
      </button>
    </div>
  </MainMenuLayout>
);
