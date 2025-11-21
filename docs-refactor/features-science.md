# Navi scientifiche ed esplorazione

- **Logica**: definizioni in `src/engines/galaxy/exploration.ts` (stati sondando/viaggio), supporto materiali in `shared/three/materials.ts` e linee target in `GalaxyMap.tsx`.
- **UI**: pannello dock `src/panels/fleet/ScienceShipDetailPanel.tsx` con stato, sistema corrente e destinazione; elenco nel dock destro `SideEntityDock.tsx`.
- **Ordini**: thunks `src/store/thunks/scienceThunks.ts` e selettori `sessionSelectors.ts` per rotta e stato.
- **Interazione mappa**: click su sistemi in `GameScreen.tsx`/`MapLayer.tsx` per focus e feedback.
