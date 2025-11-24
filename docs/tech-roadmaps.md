## Roadmap Ricerca & Tradizioni

### Fase 1 – Modellazione e dati
- [x] Estendere tipi `ResearchTech`/`TraditionPerk` con `era`, `clusterId`, `kind`, `origin`, `mutuallyExclusiveGroup`.
- [x] Aggiungere `research.eras` in config con gateway iniziali.
- [ ] Annotare tutte le tech/tradizioni esistenti con era/cluster/kind.
- [ ] Definire i gruppi esclusivi (IA, Biotech/Cyber, Dottrine flotta).

### Fase 2 – Logica di gioco
- [ ] Stato ricerca: `currentEra`, `unlockedEras`, conteggio gateway.
- [ ] Selezione offerte tech per ramo con filtri era/cluster/kind e mix foundation/feature.
- [ ] Gestione scelte esclusive: blocco rami alternativi e memorizzazione scelta.
- [ ] Tradizioni: gating per era e perk esclusivi; punti tradizione da influenze/bonus.

### Fase 3 – UI/UX
- [ ] Pannello Ricerca/Tradizioni ristrutturato: header era + progresso, card cluster, badge foundation/feature/rare, origine, blocchi esclusivi.
- [ ] Filtri (completate, rare, era) e highlight completate.
- [ ] Stato attivo/progresso per ramo con barre e countdown.

### Fase 4 – Contenuti e varietà
- [ ] Ampliare pool tech per ogni era/cluster.
- [ ] Introdurre tech rare da reliquie/anomalie/eventi.
- [ ] Tradizioni avanzate per stili di gioco (economia, espansione, militare, esplorazione, IA/bio).

### Fase 5 – Bilanciamento e QA
- [ ] Test di ritmo (gateway tech per era).
- [ ] Equilibrio foundation vs feature; rischio eventi per scelte estreme (IA forte, armi bio, ecc.).
- [ ] Feedback visivo e notifiche (completamento, scelte esclusive, era sbloccata).
