# Economia e risorse

- **Engine**: `src/engines/economy/economy.ts` calcola produzione/consumi per energia, minerali, cibo, ricerca, influenza; distretti da `economy/districts.ts` e popolazione da `economy/population.ts`.
- **Bilancio**: pannello `src/panels/EconomyPanel.tsx` mostra ledger e net; HUD top bar `src/components/HudTopBar.tsx` con risorse e delta colori.
- **Costi e upkeep**: costi distretti e navi da `gameConfig.ts` e `economyUtils.ts`; upkeep flotte in `engines/fleet/ships.ts`.
- **Notifiche economiche**: util `src/store/utils/notificationUtils.ts` e selettori `src/store/selectors/economySelectors.ts`.
- **Shipyard**: produzione navi in `src/engines/fleet/shipyard.ts`, UI `src/panels/shipyard/*` e modale `ShipyardPanel.tsx`.
