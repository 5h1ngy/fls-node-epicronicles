# Progressione, tempo e AI

- **Tick e velocità**: clock in `src/engines/time/clock.ts`, controlli velocità/pause in `HudTopBar.tsx` con pulsanti 0.5x/1x/2x/4x e stato simulazione.
- **Simulazione step**: orchestrata in `src/engines/session/simulation.ts` (economia, ricerca, eventi, guerra) richiamata dal loop `useGameLoop.ts` e dal worker.
- **Modificatori**: bonus/malus impero in `src/engines/progression/modifiers.ts`, applicati a economie e combattimento.
- **AI imperi**: logica decisionale in `src/engines/ai/ai.ts` (colonizzazione, guerre, ricerca, diplomazia), integrata con motori specifici.
- **Ricerca/tradizioni**: vedi `features-ricerca-tradizioni.md` per alberi e progressi.
