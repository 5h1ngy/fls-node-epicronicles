# Colonie, pianeti e popolazione

- **Gestione pianeta**: UI `src/panels/PlanetDetail.tsx` mostra produzione, distretti, code e popolazione; coda locale integrata (ex `DistrictQueuePanel`).
- **Colonizzazione**: logica missioni in `src/engines/session/colonization.ts` e thunks `src/store/thunks/colonizationThunks.ts`; pannello strategico `src/panels/ColonizationPanel.tsx`.
- **Popolazione**: ruoli e promozioni in `src/engines/economy/population.ts`, con controlli UI in `PlanetDetail` (promuovi/demote) e automazione config da `gameConfig.ts`.
- **Produzione planetaria**: calcolo resa distretti e popolazione in `src/engines/economy/economy.ts` e `src/store/utils/economyUtils.ts`.
- **Selezione da dock**: `src/components/SideEntityDock.tsx` elenca colonie, centra la mappa e apre il dettaglio del pianeta via `GameScreen.tsx`.
