# Checkpoints performance & ottimizzazioni

Stato sintetico delle attività per migliorare drasticamente le performance. Aggiorna le checkbox man mano che completi i task.

## Rendering / Three.js
- [x] Instancing per marker sistemi/flotte (sostituire mesh singole con `InstancedMesh`) per science ships e flotte.
- [x] LOD/visibilità: disattivare label/orbite su zoom alto, raycast limitato al gruppo sistemi.
- [x] Batch update nodi mappa (evitare rebuild intero gruppo a ogni tick) con firma sistemi per skip rebuild invariato.
- [x] Pooling di geometrie/materiali e vector per ridurre allocazioni in loop (cache geometrie pianeti/anelli, vector pool per linee).

## React/UI
- [x] `React.memo`/memo selectors su liste grandi (colonie, flotte, log) e virtualizzazione log (memo ColonyPanel, FleetAndCombatPanel; war log limitato a 20 eventi).
- [x] Lazy load dei pannelli poco usati (shipyard, research, eventi) con dynamic import.

## Store/Simulazione
- [x] Batching tick e debounce notifiche/war log in late game (cap a 5 tick per ciclo).
- [x] Precompute lookup (hostileSystems, fleetsBySystem) per ridurre ricerche ripetute (map indice sistemi per advanceFleets).
- [x] Debounce spawn eventi in guerra intensa / late game.
- [x] Clamp risorse/net per evitare overflow o valori estremi.

## Build/Bundle
- [x] Rollup manualChunks per split `three` e `react`, chunkSizeWarningLimit alzato.
- [x] Tree-shake mirato su import Three (evitare wildcard).
- [x] Altri split per pannelli UI (code splitting a route/chunk) tramite lazy load pannelli.

## Mappa interattiva
- [x] LOD label/orbite basato su zoom e campo visivo.
- [x] Raycast solo su sistemi (disabilitare orbits per hit test).

## Clock/loop
- [x] Tick rate adattivo (pausa in background, riduzione tps in idle: pausa quando tab non visibile).
- [ ] Valutare worker per `advanceSimulation` (se serve isolare main thread).

## Profilazione
- [ ] Profilare con Chrome DevTools (Timeline/Allocations) su scenari 30+ sistemi e molte flotte; annotare hot path.
