# Architettura, stato globale e simulazione

- **Entry/UI**: `src/main.tsx`, `src/App.tsx`, shell `GameScreen.tsx` orchestrano HUD, dock e mappe.
- **Stato globale**: store Zustand in `src/store/gameStore.ts` con slice `src/store/slice/gameSlice.ts`; selettori in `src/store/selectors/*` e thunk in `src/store/thunks/*` per azioni di economia, flotte, diplomazia, eventi, ricerca.
- **Simulazione**: pipeline in `src/engines/session/simulation.ts` con passi economia, flotte, ricerca, diplomazia, eventi; clock in `src/engines/time/clock.ts` e worker dedicato `src/shared/workers/simulationWorker.ts`.
- **Config**: parametri in `src/config/gameConfig.ts` (economia, shipyard, map); risorse di scena in `src/shared/three/*` per rendering 3D.
- **Persistenza**: thunks in `src/store/thunks/persistenceThunks.ts` per salvataggi/caricamenti.
- **AI**: comportamenti degli imperi in `src/engines/ai/ai.ts` (decisioni su guerra, espansione, ricerca) e helper vari nelle engine.
