# Infrastruttura, persistenza e debug

- **Worker simulazione**: `src/shared/workers/simulationWorker.ts` per scaricare il main thread; orchestrato da `useGameLoop.ts`.
- **Persistenza**: thunks `persistenceThunks.ts` (save/load), storage configurato in `gameStore.ts`.
- **Config e tipi**: `src/config/gameConfig.ts` per parametri gameplay; tipi dominio in `src/engines/types.ts`.
- **Debug**: console dedicata `src/components/DebugConsole.tsx` con viewer JSON, watch list, aggiornamenti real-time.
- **Materiali/scene**: rendering 3D supportato da `shared/three/scene.ts`, `materials.ts`, `mapUtils.ts`.
- **Styling e layout**: `src/index.css` centralizza stili, pulsanti HUD, dock e modali.
