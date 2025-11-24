## Tech & Traditions - Feature Pack

### Obiettivi
- Dare progressione a “ere” con gateway tech e cluster tematici.
- Introdurre scelte esclusive (IA libera vs regolamentata, Biotech vs Cyber, Dottrina flotta).
- Bilanciare “fondamenta” (bonus numerici) con “feature” (nuove meccaniche) e “rare” (reliquie/anomalie).
- Allineare tradizioni a stili di gioco (Economia, Espansione, Militare, Esplorazione, IA/Bio).

### Struttura dati proposta
- **ResearchTech**: `era`, `clusterId`, `kind: foundation|feature|rare`, `origin: standard|relic|anomaly|faction`, `mutuallyExclusiveGroup`, `prerequisites`.
- **TraditionPerk**: `era`, `clusterId`, `mutuallyExclusiveGroup`, `prerequisites`.
- **ResearchConfig.eras**: elenco di ere con gateway tech.

### Ere (bozza)
- Era 1 – Esodo: sopravvivenza, uscita dal sistema, prime colonie.
- Era 2 – Espansione locale: espansione stellare, amministrazione, cantieri avanzati.
- Era 3 – Potenze stellari: flotte pesanti, IA strategica, megacantieri.
- Era 4 – Civiltà galattiche: FTL avanzato, armi esotiche, megastrutture.
- Era 5 – Trascendenza: ascensione IA/bio, ingegneria stellare, vittoria diplomatica.

### Cluster tematici (esempi)
- Propulsione & Sensori (warp 1/2/3, sensori avanzati, logistica FTL).
- Energia & Materiali (fusione → antimateria, nanocompositi, scudi/armature).
- Industria & Logistica (miniere orbitali, hub di rifornimento, megacantieri).
- Militare & Dottrine (scafi, armi, dottrine flotta: sciame vs élite).
- Società & Diplomazia (governo, coesione, casus belli, federazione).
- IA & Cyber (calcolo quantistico, automazione, hacking, IA autonoma).
- Biotech & Xenologia (terraforming, adattamenti genetici, armi bio, diplomazia specie).
- Rare: reliquie, anomalie, ispirazioni aliene.

### Scelte esclusive (esempi)
- IA forte vs IA regolamentata (potenza vs rischio/eventi).
- Biotech vs Cybernetica (pop adattabili vs efficienza meccanica).
- Dottrina: Sciame vs Nucleo d’élite (molte navi piccole vs poche navi enormi).

### Regole di pescaggio (UI/UX)
- Ogni ramo mostra 2–3 tech offerte filtrate per era attuale e prerequisiti.
- Mix: 2 foundation → 1 feature; rare solo se evento/reliquia.
- Gateway tech contano per sbloccare l’era successiva.

### Tradizioni
- Alberi tematici: Economia, Espansione, Militare, Esplorazione, IA/Bio.
- Gating per era/prerequisiti; perk esclusivi per stile (dottrine, ideologie).
- Punti tradizione da Influenza e perk/tech correlati.

### UI/UX (linee guida)
- Header con Era corrente e progresso gateway.
- Card cluster per tech/perk, badge foundation/feature/rare, origine.
- Blocchi scelte esclusive con toggle e lock visivo.
- Filtri: mostra/nascondi completate, rare disponibili, era.
