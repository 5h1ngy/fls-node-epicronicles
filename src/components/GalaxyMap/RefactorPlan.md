# GalaxyMap Refactor Plan (v4)

Documento di lavoro per snellire `src/components/GalaxyMap` e mantenere ogni file tra 150-200 linee con scaffolding più modulare.

## Stato attuale
- Hooks e scene separati: dati (`useGalaxyMapData`), focus (`useMapFocus`), input/raycast (`useMapInteractions`), scena/render loop (`useGalaxyScene`), rebuild (`useSceneRebuild`), lifecycle black hole (`useBlackHole`), anchor manager (`scene/anchors`), frame update modulare (`scene/frame/*`).
- Struttura cartella dedicata (`GalaxyMap/components|hooks|scene` + `index.ts`); file chiave ora <200 linee: `components/GalaxyMap.tsx` (~174), `scene/rebuildScene.ts` (~177), `scene/frameUpdate.ts` (~70), `background/*` modularizzati.
- Prop drilling ridotto tramite `GalaxyMapContext` + `useGalaxyMapRefs`; gli hook leggono refs/scene dal context anziché ricevere parametri chilometrici. API esterna del componente invariata.

## Obiettivi
- Portare tutti i file sotto il target 150-200 linee, spezzando per responsabilità omogenee (camera/tilt, labels/orbits, star visuals, nebula, anchors, builders).
- Ridurre il numero di parametri passati tra hook/scene creando piccoli helper/context locali (es. `GalaxyMapContext` o `useGalaxyMapController` che incapsula refs condivisi).
- Migliorare la leggibilità del rebuild: separare costruzione nebula, sistemi, science/fleet overlays e materiali in moduli riusabili.
- Mantenere un path di export stabile (`@components/GalaxyMap`) e aggiornare la checklist manuale a fine iterazione.

## Piano a step
- [x] Step A: Suddividere `scene/frameUpdate.ts` in sottosezioni (camera/tilt, labels+orbits, star visuals, black hole/nebula, anchors) portando il file <200 linee; fatto con sottocartella `scene/frame`.
- [x] Step B: Spezzare `scene/rebuildScene.ts` in builder mirati (`buildNebula`, `buildSystems`, `buildScienceAnchors`, `buildFleetAnchors`), mantenendo API di ritorno compatibile e file <200 linee (nuova cartella `scene/rebuild` + orchestratore da 177 linee).
- [x] Step C: Estrarre da `scene/background.ts` le utility di mask/nebula/noise in file separati (`background/mask.ts`, `background/nebulaLayers.ts`, `background/disposeNebula.ts`) per rispettare il limite di linee.
- [x] Step D: Ridurre `components/GalaxyMap.tsx` sotto 200 linee creando un hook di orchestrazione (provider/context + `useGalaxyMapRefs`).
- [x] Step E: Introdotto `GalaxyMapContext` per condividere refs/scene/meta tra hook (interactions, rebuild, focus) evitando prop-drilling massiccio.
- [ ] Step F: Checklist manuale (interazioni/animazioni/cleanup). Lint/typecheck già ok; resta validazione runtime.

## Nota su cosa mettere in `GalaxyMapContext` (per limitare parametri)
- Già nel context: refs condivisi (container, camera/systemGroup, offset/zoom/tilt, temp vec/matrix, planetAngle/planetLookup, anchorResolver, science/fleet anchors, nebula/blackHole, signatureRef) e meta min/max zoom + tilt bounds.
- Possibili aggiunte al context (per evitare nuovi parametri):
  - `sceneContext` (già nel context) per hook che lo usano indirettamente.
  - Callbacks comuni: `onSelectRef`, `onClearRef` possono essere aggiunti al context se altri hook ne hanno bisogno senza passaggio parametri.
  - Config invarianti: `baseTilt`, `maxTiltDown`, `orbitBaseSpeed`, `minZoom`, `maxZoom` già presenti; evitare di mettere dati volatili (systems, fleets, scienceShips) per non ri-renderizzare indiscriminatamente gli hook.
- Da tenere fuori dal context (per non intasarlo): dataset dinamici e callbacks esterni (`onPlanetSelect`, `onShipyardSelect`) passati solo dove servono; dati di rebuild (systems, fleets, scienceShips, starVisuals, colonizedLookup, combats) rimangono argomenti di `useSceneRebuild`.

## Checklist testing manuale
- Avvio sessione: nuova/restore, mappa renderizzata con nebula + black hole + sistemi.
- Navigazione: pan (tasto destro), zoom (wheel), tilt (middle click); rispetto min/max zoom.
- Selezioni: click su sistema/pianeta/cantiere porta focus/zoom; click su sistema sconosciuto pulisce focus.
- Overlays: ancore/linee per flotte e navi scientifiche seguono gli spostamenti; nessun errore console.
- Animazioni: nebula/stelle/black hole animati, nessun freeze con preset standard/mega.
- Cleanup: uscita dalla schermata senza loop o risorse pendenti.
