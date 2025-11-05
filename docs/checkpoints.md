# Roadmap "Checkpoints"

Stato sintetico per fasi, con feature flaggate tramite checkbox `[x]` (complete) o `[ ]` (mancanti/parziali).

## Fase 0 – Fondamenta tecniche
- [x] Architettura React + Three.js + Redux Toolkit, moduli di dominio puri
- [x] Loop simulazione con clock, pausa/play e speed
- [x] Debug console/pannelli, modalità auto-start da config
- [x] Menu principale con nuova sessione e seed
- [x] Sistema di salvataggio/caricamento partite
- [x] Modalità “galassia di test” e profili di generazione multipli

## Fase 1 – Galassia + Esplorazione (vertical slice)
- [x] Generazione galassia procedurale (sistemi, rotte, classe stella, mondo abitabile opzionale)
- [x] Mappa galattica 3D con pan/zoom, selezione sistemi e fog-of-war
- [x] Navi scientifiche iniziali con ordini muovi/sonda e auto-explore
- [x] Stati visibilità: unknown/revealed/surveyed con gating UI
- [x] Pannello sistema e overview galassia
- [x] Configurazione parametri galassia da UI nuova partita

## Fase 2 – Economia base, Pianeti e Colonizzazione
- [x] Risorse globali (energia, minerali, cibo, ricerca), bilancio per tick e stock
- [x] Pianeti colonizzabili con attributi base e mondo iniziale configurato
- [x] Nave colonia iniziale/costruibile e ordine “colonizza” con coda missione
- [x] Schermata dettaglio pianeta con produzione netta e distretti
- [x] Distretti base con coda costruzione, priorità/annulla e progress bar
- [x] Calcolo produzione/consumo per pianeta e morale (stabilità/felicità)
- [x] Popolazione semplificata con automazione ruoli e promo/democrazioni manuali
- [x] Risorsa influenza e abitabilità specie-specifica
- [x] Notifiche dedicate per sospensione distretti/risorse insufficienti
- [x] Gating colonizzazione su sistemi non sondati con messaggi più espliciti

## Fase 3 – Flotte militari e Combattimento
- [x] Classi nave base (corvette, frigate, colony) e design da config
- [x] Cantieri con coda limitata, build cost/tempo e template semplici
- [x] Creazione/merge/split flotte, ordini di movimento con travel ticks
- [x] Combattimento contro minacce di sistema, report e notifiche
- [x] Indicatori combattimento su mappa/HUD, log battaglie recente
- [x] Designer navi avanzato (varianti custom con potenziamenti rapidi)
- [ ] IA militare completa (ingaggio/ritiro, targeting strategico)
- [ ] UI riepilogo battaglie e statistiche approfondite

## Fase 4 – Multi-impero, IA base e Diplomazia minima
- [x] Imperi AI multipli con opinione e drift automatico
- [x] Dichiarazione guerra/pace da UI e drift che innesca guerra/pace AI
- [x] War zones che generano potenza ostile e war log con badge unread
- [x] Flotte AI generate in base a minacce e movimenti offensivi semplici
- [ ] Confini/controllo sistemi visibile su mappa
- [ ] IA economica/espansione: esplorazione, colonizzazione, cantieri AI
- [ ] Trattati base (non aggressione, accesso confini, accordi) e motivazioni opinione
- [ ] Pathfinding/attraversamento confini condizionato da stato guerra/pace

## Fase 5 – Tecnologia, Tradizioni e Progressione
- [ ] Sistema ricerca a rami, punti ricerca per ramo e schermata tech
- [ ] Effetti di ricerca (sblocchi edifici/moduli/bonus)
- [ ] Tradizioni/perk con progressione dedicata

## Fase 6 – Eventi, Anomalie avanzate e Crisi
- [ ] Sistema eventi generico con condizioni, opzioni, effetti e log
- [ ] Anomalie avanzate e catene multi-step
- [ ] Crisi di fine partita con IA dedicata e overlay mappa

## Fase 7 – UI/UX, Tutorial, Bilanciamento e Polish
- [ ] Tooltip completi, filtri mappa raffinati, notifiche configurabili
- [ ] Tutorial/onboarding guidato o suggerimenti contestuali
- [ ] Profilazione/ottimizzazione late game e robustezza salvataggi
- [ ] Modding/override dati via JSON esterni
- [ ] Bilanciamento finale costi/tempi/output e curve difficoltà IA
