# Checkpoints performance & ottimizzazioni

Stato sintetico delle attività per migliorare drasticamente le performance. Aggiorna le checkbox man mano che completi i task.

## Rendering / Three.js
- [ ] Instancing per marker sistemi/flotte (sostituire mesh singole con `InstancedMesh`).
- [x] LOD/visibilità: disattivare label/orbite su zoom alto, raycast limitato al gruppo sistemi.
- [ ] Batch update nodi mappa (evitare rebuild intero gruppo a ogni tick).
- [ ] Pooling di geometrie/materiali e vector per ridurre allocazioni in loop.

## React/UI
- [x] `React.memo`/memo selectors su liste grandi (colonie, flotte, log) e virtualizzazione log (memo ColonyPanel, FleetAndCombatPanel; ancora da valutare virtualizzazione log).
- [x] Lazy load dei pannelli poco usati (shipyard, research, eventi) con dynamic import.

## Store/Simulazione
- [ ] Batching tick e debounce notifiche/war log in late game.
- [ ] Precompute lookup (hostileSystems, fleetsBySystem) per ridurre ricerche ripetute.
- [x] Debounce spawn eventi in guerra intensa / late game.
- [ ] Clamp risorse/net per evitare overflow o valori estremi (parziale: ledger clamp).

## Build/Bundle
- [x] Rollup manualChunks per split `three` e `react`, chunkSizeWarningLimit alzato.
- [ ] Tree-shake mirato su import Three (evitare wildcard) (parziale: scene.ts).
- [ ] Altri split per pannelli UI (code splitting a route/chunk).

## Mappa interattiva
- [x] LOD label/orbite basato su zoom e campo visivo.
- [x] Raycast solo su sistemi (disabilitare orbits per hit test).

## Clock/loop
- [x] Tick rate adattivo (pausa in background, riduzione tps in idle: pausa quando tab non visibile).
- [ ] Valutare worker per `advanceSimulation` (se serve isolare main thread).

## Profilazione
- [ ] Profilare con Chrome DevTools (Timeline/Allocations) su scenari 30+ sistemi e molte flotte; annotare hot path.
