## Roadmap Ricerca & Tradizioni

### Fase 1 - Modellazione e dati
- [x] Estendere tipi `ResearchTech`/`TraditionPerk` con `era`, `clusterId`, `kind`, `origin`, `mutuallyExclusiveGroup`.
- [x] Aggiungere `research.eras` in config con gateway iniziali.
- [x] Annotare tech/tradizioni con era/cluster/kind e origine/rarita.
- [x] Definire gruppi esclusivi (IA libera/regolata, Biotech/Cyber, Dottrine flotta).

### Fase 2 - Logica di gioco
- [x] Stato ricerca: `currentEra`, `unlockedEras`, conteggio gateway.
- [x] Selezione offerte tech per ramo con filtri era/cluster/kind e mix foundation/feature.
- [x] Gestione scelte esclusive: blocco rami alternativi e memorizzazione scelta.
- [x] Tradizioni: gating per era e perk esclusivi; punti tradizione da influssi/bonus.

### Fase 3 - UI/UX
- [x] Pannello Ricerca/Tradizioni: header era, badge era/tipo, grouping per cluster, colonne Ricerca/Tradizioni.
- [ ] Aggiungere blocchi di scelte esclusive e filtri (completate, rare, era) + barre di avanzamento per ramo.
- [x] Filtri (completate, rare, era) e highlight completate.
- [x] Stato attivo/progresso per ramo con barre e countdown.
- [x] Visualizzazione percorsi esclusivi scelti (pill/caption) e lock su card.
- [x] Mostrare origine non standard sulle card (anomaly/relic/faction).

### Fase 4 - Contenuti e varieta (posticipata)
- [ ] (Posticipato) Ampliare pool tech per ogni era/cluster.
- [ ] (Posticipato) Reintrodurre tech rare da reliquie/anomalie/eventi.
- [ ] (Posticipato) Tradizioni avanzate per stili di gioco (economia, espansione, militare, esplorazione, IA/bio).

### Fase 5 - Bilanciamento e QA
- [ ] Test di ritmo (gateway tech per era).
- [ ] Equilibrio foundation vs feature; rischio eventi per scelte estreme (IA forte, armi bio, ecc.).
- [ ] Feedback visivo e notifiche (completamento, scelte esclusive, era sbloccata).

### Stato attuale
- Pool tech ridotto al set minimo (6 tech base in Era 1-2) e 4 perk base; rimosse rare/evento/fazione.
- Eventi/anomalie ridotti a quelli essenziali e senza insight verso tech rare.
- UI Ricerca/Tradizioni ristrutturata con badge era/tipo e cluster; offerte garantiscono gateway disponibili.
- Config ancora etichettata per origine/kind, ma i percorsi esclusivi non sono ancora bloccati logicamente.

### Prossimi micro-step
- QA ritmo base: verificare progressione con set minimo di tech e offerte non vuote, controllo gateway garantiti.
- Solo in seguito: reintrodurre pool rare + anomalie/eventi dedicati e bilanciarli.
