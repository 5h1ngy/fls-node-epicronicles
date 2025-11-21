# Flotte, cantieri e combattimento

- **Stato e logica**: moduli `src/engines/fleet/fleets.ts` (movimento, merge, split, ordini), `ships.ts` (statistiche e upkeep), `shipyard.ts` (costruzione) e `combatReports.tsx` per log UI.
- **UI gestione**: pannello dettagli nel dock `src/panels/fleet/FleetDetailPanel.tsx` (rotta, merge, split, composizione); lista guerre/rapporti in `src/panels/BattlesPanel.tsx` e `WarOverview.tsx`.
- **Ordini**: thunks `src/store/thunks/fleetThunks.ts` e `shipyardThunks.ts`; azioni di guerra in `warSelectors.ts` e `store/utils/warUtils.ts`.
- **Cantiere**: modale `ShipyardPanel.tsx` con componenti `shipyard/BuildQueue.tsx` e `shipyard/ShipDesignCard.tsx`.
- **Indicazioni in mappa**: linee target in `GalaxyMap.tsx` (marker per rotta e stato guerra con materiali `shared/three/materials.ts`).
