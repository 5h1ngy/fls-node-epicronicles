# Galassia, mappa 3D ed esplorazione

- **Generazione e stato**: sistemi stellari in `src/engines/galaxy/galaxy.ts`, dati di posizionamento `mapPosition` usati da `GalaxyMap.tsx`.
- **Mappa 3D**: `src/components/GalaxyMap.tsx` con Three.js (`shared/three/scene.ts`, `materials.ts`, `mapUtils.ts`). Supporto per focus sistema/pianeta, zoom, panning, marker rotta flotte/navi scientifiche e hostili.
- **Selezione sistemi**: click gestiti in `GalaxyMap.tsx` -> `MapLayer.tsx` -> `GameScreen.tsx` con check visibilità (`selectSystems`, colonized set) e messaggi mappa.
- **Esplorazione**: logica in `src/engines/galaxy/exploration.ts` (stato surveyed/unknown, target navi scientifiche), thunks `scienceThunks.ts`.
- **Panoramica**: modale `src/panels/GalaxyOverview.tsx` mostra lista sistemi, colonie e hostili.
