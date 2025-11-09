# Persistenza, config e infrastruttura

## Persistenza
- Thunk `saveSessionToStorage`/`loadSessionFromStorage`: serializza sessione in storage locale (se disponibile), controlli errore e motivi (storage unavailable, parse error).
- `hasSavedSession` per verificare presenza salvataggio; menu auto-start opzionale da config debug.

## Clock e tempo
- `advanceClock` calcola tick in base a elapsedMs e `ticksPerSecond`; supporta pausa, speed multiplier, now injection.
- Thunk `setSimulationRunning`, `setSpeedMultiplier`, `advanceClockBy` per pilotare il loop; `useGameLoop` richiama advanceClockBy con timestamp.

## Config e alias
- `gameConfig.ts` come singola fonte per parametri di bilanciamento e feature gating; preset galassia, debug, economy, colonization, diplomacy, military, map, research, traditions, events.
- Path alias per import: `@domain`, `@store`, `@components`, `@config`, `@three`, ecc.

## Struttura codice
- Domain puro per economia, flotte, colonizzazione, diplomazia, ricerca, tradizioni, eventi, galassia.
- Store/thunks per orchestrare mutazioni e side-effect controllati.
- Components React organizzati per app (AppShell, HUD) e gameplay (panels, map), UI (DraggablePanel), debug.

## Build e lint
- Build client con Vite + TypeScript; lint via ESLint; attenzione ai chunk size (warning segnalati in build).
