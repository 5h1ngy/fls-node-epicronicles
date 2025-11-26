## Roadmap Ricerca & Tradizioni

### Fase 1 – Modellazione e dati
- [x] Estendere tipi `ResearchTech`/`TraditionPerk` con `era`, `clusterId`, `kind`, `origin`, `mutuallyExclusiveGroup`.
- [x] Aggiungere `research.eras` in config con gateway iniziali.
- [x] Annotare tutte le tech/tradizioni esistenti con era/cluster/kind ed eventuale origine/rarità.
- [x] Definire e applicare i gruppi esclusivi (IA libera/regolata, Biotech/Cyber, Dottrine flotta).

### Fase 2 – Logica di gioco
- [ ] Stato ricerca: `currentEra`, `unlockedEras`, conteggio gateway.
- [x] Selezione offerte tech per ramo con filtri era/cluster/kind e mix foundation/feature.
- [ ] Gestione scelte esclusive: blocco rami alternativi e memorizzazione scelta.
- [ ] Tradizioni: gating per era e perk esclusivi; punti tradizione da influenze/bonus.

### Fase 3 – UI/UX
- [x] Pannello Ricerca/Tradizioni ristrutturato: header era, badge era/tipo, grouping per cluster, colonne Ricerca/Tradizioni.
- [ ] Aggiungere blocchi di scelte esclusive e filtri (completate, rare, era) + barre di avanzamento per ramo.
- [x] Filtri (completate, rare, era) e highlight completate.
- [x] Stato attivo/progresso per ramo con barre e countdown.
- [x] Visualizzazione percorsi esclusivi scelti (pill/caption) e lock su card.
- [x] Mostrare l’origine non standard sulle card (anomaly/relic/faction).
- [x] Badge origine differenziati e label percorsi esclusivi nelle card per chiarezza.

### Fase 4 – Contenuti e varietà
- [ ] Ampliare pool tech per ogni era/cluster.
- [ ] Introdurre tech rare da reliquie/anomalie/eventi.
- [ ] Tradizioni avanzate per stili di gioco (economia, espansione, militare, esplorazione, IA/bio).

### Fase 5 – Bilanciamento e QA
- [ ] Test di ritmo (gateway tech per era).
- [ ] Equilibrio foundation vs feature; rischio eventi per scelte estreme (IA forte, armi bio, ecc.).
- [ ] Feedback visivo e notifiche (completamento, scelte esclusive, era sbloccata).

### Stato attuale
- Offerte Ricerca filtrate/bilanciate per era e tipo (Fondamenta/Feature/Rare).
- UI Ricerca/Tradizioni con colonne, badge era/tipo e cluster.
- Tutte le tech/perk correnti sono etichettate con era, cluster, kind/origin.
- Config include coppie esclusive base (AI governance, Bio vs Cyber, Dottrine flotta) con lock in UI.
- Prime tech rare collegate a eventi/anomalie/fazione (relic-sensors, ancient-drives, psi-echoes, chrono-scanners, void-harmonics, quantum-beacons, dark-core-reactor, stellar-ward, gravitic-lens, drone-foundry) via insight/backlog.
- Gateway Era 2 tutti in Era 1 (sensori avanzati, leghe rinforzate) per evitare stalli.
- Rare Era 4 ampliate con nuove anomalie (phase-shield-lattice, ancient-databanks).

### Prossimi micro-step
- Ampliare pool rare e collegarle ad altri eventi/anomalie (e.g. reliquie multiple, catene evento). → Nuove rare/anomalie Era 4 aggiunte (phase-catalyst, void-sentinels).
- [x] Bilanciare gateway: mantenere visibili alcune gateway dell’era successiva nel pescaggio (slot dedicati) e hint UI quando lista vuota; garantire almeno una gateway tra le offerte se disponibile.
