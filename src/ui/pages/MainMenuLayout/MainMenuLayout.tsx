import type { ReactNode } from 'react';

import './MainMenuLayout.scss';

interface MainMenuLayoutProps {
  background: string;
  showBrand?: boolean;
  toast?: string | null;
  children: ReactNode;
}

export const MainMenuLayout = ({
  background,
  showBrand = true,
  toast = null,
  children,
}: MainMenuLayoutProps) => (
  <div
    className="main-menu"
    style={{ backgroundImage: `url(${background})` }}
  >
    <div className="main-menu__overlay" />

    {showBrand ? (
      <header className="main-menu__brand">
        <img
          src="/pages/main-menu/logo-full.png"
          alt="FLS Node Epicronicles logo"
          className="main-menu__logo"
        />
      </header>
    ) : null}

    <div className="main-menu__content">{children}</div>

    {toast ? <div className="main-menu__toast">{toast}</div> : null}
  </div>
);
