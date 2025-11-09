# UI, HUD e interazione

## HUD
- Top bar: risorse con net/tick, seed sessione, elapsed time, controlli play/pause/speed, toggle debug.
- Bottom bar: notifiche recenti (colonizzazione, distretti, combattimenti, guerre, eventi), chip guerre con badge unread e pulsante scroll-to log.

## Pannelli draggable/resizable
- Colonie: lista colonie, produzione, distretti, coda costruzioni, selezione sistema/pianeta.
- Galaxy Overview: mini elenco sistemi sondati/rivelati e statistiche di sintesi.
- Economia: ledger risorse con income/upkeep/net.
- District queue: coda distretti globale con progress, priorità/annulla.
- Scienza: navi scientifiche, stato, auto-explore toggle, ordini di movimento.
- Sistema (on focus): pianeti, badge colonizzato/habitable, link a PlanetDetail.
- PlanetDetail: produzione dettagliata, popolazione e ruoli, morale, distretti, coda locale, azioni promote/demote, queue distretto.
- Fleet & Combat: flotte, ordini movimento, merge/split, log battaglie.
- Diplomazia: imperi con opinione, stato guerra/pace, azioni dichiarazione/pace/accesso.
- Shipyard: design/template/custom build, coda con progress, sintesi sistema.
- Ricerca & Tradizioni: stato rami, tech attive, avvio tech, punti tradizione e sblocco perk.
- Eventi & Anomalie: evento attivo, opzioni con costi/effetti, registro storico.
- Debug console: accesso da HUD.

## Mappa interattiva
- GalaxyMap: click per focus sistema (se sondato), orbit animation, marker flotte/science, ring ostili/combattimento, icona battaglia attiva, pan/zoom controllati; focus pianeta e zoom con target.
- DraggablePanel overlay mantiene interattività mappa (pointer-events disabilitati sul container, abilitati sui pannelli).

## Styling e UX
- CSS `index.css` con temi scuri, badge, progress bar, card, panel-message, log lists.
- Controlli di affordability (disabled button) su eventi, shipyard, distretti.
- Messaggi contestuali (map alert se sistema non sondato, panel-message per esiti azioni).
