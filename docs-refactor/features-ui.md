# UI, HUD e finestre

- **Shell**: `src/components/GameScreen.tsx` compone HUD, dock sinistro (azioni strategiche), dock entità destro (colonie, flotte, navi scientifiche) e finestre drag & drop `DraggablePanel`.
- **Mappa**: `src/components/GalaxyMap.tsx`/`MapLayer.tsx` rendering 3D con Three.js (`shared/three/*`), centraggio su sistemi/pianeti dal dock.
- **HUD**: top bar risorse e controlli velocità (`HudTopBar.tsx`), bottom bar con stats e azioni (`HudBottomBar.tsx`), icone lato sinistro `SideDock.tsx`.
- **Finestre dedicate**: missioni, eventi, diplomazia, economia, ricerca/tradizioni, panorama galassia, colonizzazione, log, debug console (`components/DebugConsole.tsx`).
- **Dock entità**: `SideEntityDock.tsx` lista entità con pulsante centra/dettagli, pannelli dettagli `FleetDetailPanel.tsx` e `ScienceShipDetailPanel.tsx` in basso a sinistra.
- **Stile**: definizioni in `src/index.css` (chip HUD, modali, dock, JSON debug, ecc.).
