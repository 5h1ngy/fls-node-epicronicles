import { getAssetUrl } from '@shared/utils/paths';

export const MAIN_MENU_BACKGROUNDS = [
  getAssetUrl('/pages/main-menu/backgrounds/main-menu-background-1.png'),
  getAssetUrl('/pages/main-menu/backgrounds/main-menu-background-2.png'),
  getAssetUrl('/pages/main-menu/backgrounds/main-menu-background-3.png'),
  getAssetUrl('/pages/main-menu/backgrounds/main-menu-background-4.png'),
  getAssetUrl('/pages/main-menu/backgrounds/main-menu-background-5.png'),
  getAssetUrl('/pages/main-menu/backgrounds/main-menu-background-6.png'),
  getAssetUrl('/pages/main-menu/backgrounds/main-menu-background-7.png'),
  getAssetUrl('/pages/main-menu/backgrounds/main-menu-background-8.png'),
  getAssetUrl('/pages/main-menu/backgrounds/main-menu-background-9.png'),
  getAssetUrl('/pages/main-menu/backgrounds/main-menu-background-10.png'),
];

export const pickBackground = (index: number) =>
  MAIN_MENU_BACKGROUNDS[index % MAIN_MENU_BACKGROUNDS.length] ??
  MAIN_MENU_BACKGROUNDS[0];

export const randomBackgroundIndex = () =>
  Math.floor(Math.random() * MAIN_MENU_BACKGROUNDS.length);
