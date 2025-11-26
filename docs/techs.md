## 1. Struttura generale dell'albero

### 1.1. Dividilo in "Ere Stellari"

Le ere danno ritmo e chiarezza:

- **Era 1 – Esodo / Pre-FTL**: uscire dal sistema, sopravvivere, prime colonie.
- **Era 2 – Espansione Locale**: espansione rapida, colonizzazione, prime flotte serie.
- **Era 3 – Potenze Stellari**: guerre serie, megastrutture medie, diplomazia avanzata.
- **Era 4 – Civiltà Galattiche**: viaggi super-veloci, armi esotiche, manipolazione di stelle, IA avanzata.
- **Era 5 – Trascendenza** (opzionale): vittoria "ascensione", tecnologie quasi "magiche".

Uso pratico:
- Ogni era sblocca un anello/cerchio di tecnologie.
- Per passare all'era successiva servono X tecnologie di soglia (*gateway techs*).
- Condizioni alternative: N colonie + N ricerca totale, o incontro fenomeni/eventi.

### 1.2. Layout logico: reti più che rami rigidi
- Cluster tematici (3-6 tech per cluster) collegati da dipendenze incrociate, per evitare l'albero "tubo".
- Permette specializzazioni, percorsi alternativi e sinergie tra rami.

## 2. Macro-rami tematici (assi principali)
- Exploit — Economia & Industria
- Explore — Navigazione & Sensori
- Expand — Colonizzazione & Società
- Exterminate — Militare & Dottrine
- Rami trasversali: Energia, IA, Biotech, ecc.

Esempi di rami:
- Propulsione & Esplorazione (subluce, FTL, sensori, ricognizione remota)
- Energia & Materiali (generazione, materiali, scudi/armature, efficienza)
- Industria, Economia & Logistica (produzione, supply interstellare, megastrutture economiche, automazione)
- Militare (armi, difese, scafi, dottrine)
- Società/Governo/Diplomazia (cohesion, casus belli, federazioni)
- Informatica/IA/Cyber (computazione, automazione, hacking, IA autonoma)
- Biotech & Xenologia (terraforming, adattamenti genetici, diplomazia specie)

## 3. Dipendenze e scelte interessanti
- **Mutua esclusività** (IA forte vs regolata, Biotech vs Cyber, dottrine flotta sciame vs élite).
- **Dipendenze incrociate** tra rami (es. navi capitali richiedono materiali avanzati + propulsione pesante + logistica).
- **Fondamenta vs Spezie**: per ogni 2-3 tech numeriche, 1 tech che cambia gameplay.
- **Tech rare/reliquie**: compaiono solo con eventi, anomalie, specie speciali.

## 4. Esempio di progressione
- **Era 1**: Propulsione chimica migliorata, Miniere orbitali, Laboratori base, Colonie modulari.
- **Era 2**: Motori FTL 1a gen, Fregate di frontiera, Amministrazione coloniale, Computazione quantistica.
  - Scelta dottrina: difesa frontiere vs pressione offensiva.
- **Era 3**: Megacantiere orbitale, Corazzate d'assalto, IA strategica, Diplomazia coercitiva.
  - Specializzazione: flotta sciame vs nucleo d'élite (mutuamente esclusivi).
- **Era 4**: Motori FTL 3a gen, Megastrutture militari, Armi esotiche, Spionaggio quantico.
- **Era 5**: Ascensione IA/Bio, Ingegneria stellare, Unità galattica (vittoria diplomatica).

## 5. Mini-checklist
1. Ogni ramo supporta uno stile di gioco chiaro?
2. Ci sono scelte vere (non solo +numero)?
3. Alcune tech cambiano meccaniche, non solo bonus?
4. Tech/eventi rari rendono le run diverse?
5. Ogni era ha 1-3 tech soglia che segnano il salto di potenza?

## 6. Catalogo attuale (bozza minima in config)

### Ricerca
- **Energia fotonica** (`photonics`) — Era 1, cluster `energy-1`, `foundation`, origin standard. Bonus energia.
- **Bio-cupole** (`bio-domes`) — Era 1, cluster `bio-1`, `foundation`, origin standard. Bonus cibo.
- **Leghe rinforzate** (`reinforced-alloys`) — Era 1, cluster `materials-1`, `foundation`, origin standard. Bonus minerali.
 - **Sensori avanzati** (`advanced-sensors`) — Era 1, cluster `sensors-1`, `feature`, origin standard, gateway per Era 2.
- **Burosfera** (`bureaucracy`) — Era 2, cluster `admin-1`, `feature`, origin standard.
- **Cantieri modulari** (`modular-yards`) — Era 2, cluster `yards-1`, `feature`, origin standard, prereq `reinforced-alloys`.
- **Sensori reliquia** (`relic-sensors`) — Era 1, cluster `relic-1`, `rare`, origin anomaly. Bonus ricerca, ottenibile da evento/anomalia.
- **Propulsori antichi** (`ancient-drives`) — Era 2, cluster `relic-2`, `rare`, origin relic. Bonus energia, ottenibile da evento.
- **Echi psionici** (`psi-echoes`) — Era 2, cluster `relic-3`, `rare`, origin relic/anomaly. Bonus ricerca e influenza, ottenibile da anomalia.
- **Scanner cronici** (`chrono-scanners`) — Era 2, cluster `relic-4`, `rare`, origin anomaly. Bonus ricerca, ottenibile da anomalia.
- **Armoniche del vuoto** (`void-harmonics`) — Era 3, cluster `relic-5`, `rare`, origin anomaly. Bonus energia e ricerca, ottenibile da anomalia.
- **Beacon quantici** (`quantum-beacons`) — Era 3, cluster `relic-6`, `rare`, origin anomaly. Bonus energia e ricerca, ottenibile da anomalia.
- **Reattore nucleo oscuro** (`dark-core-reactor`) — Era 3, cluster `relic-7`, `rare`, origin relic. Bonus energia e minerali, ottenibile da anomalia.
- **Baluardo stellare** (`stellar-ward`) — Era 3, cluster `faction-1`, `rare`, origin faction. Bonus ricerca e influenza, ottenibile da evento fazione.
- **Lente gravitica** (`gravitic-lens`) — Era 3, cluster `relic-8`, `rare`, origin anomaly. Bonus ricerca, ottenibile da anomalia.
- **Fonderia droni reliquia** (`drone-foundry`) — Era 3, cluster `relic-9`, `rare`, origin relic. Bonus minerali e costo navi leggere, ottenibile da anomalia.
- **Catalizzatore di fase** (`phase-catalyst`) — Era 4, cluster `relic-10`, `rare`, origin anomaly. Bonus ricerca ed energia, ottenibile da anomalia.
- **Sentinelle del vuoto** (`void-sentinels`) — Era 4, cluster `relic-11`, `rare`, origin relic. Bonus costo navi capitali/difesa flotte, ottenibile da anomalia.
- **Reticolo scudi di fase** (`phase-shield-lattice`) — Era 4, cluster `relic-12`, `rare`, origin relic. Bonus ricerca e difesa flotte, ottenibile da anomalia.
- **Databank antichi** (`ancient-databanks`) — Era 4, cluster `relic-13`, `rare`, origin anomaly. Bonus influenza e ricerca, ottenibile da anomalia.
- **IA aperta** (`ai-open`) — Era 2, cluster `ai-1`, `feature`, origin standard, gruppo esclusivo `ai-governance`.
- **IA regolata** (`ai-regulated`) — Era 2, cluster `ai-1`, `feature`, origin standard, gruppo esclusivo `ai-governance`.
- **Adattamento biologico** (`bio-adaptation`) — Era 2, cluster `bio-cyber-1`, `feature`, origin standard, gruppo esclusivo `bio-cyber`.
- **Potenziamenti cibernetici** (`cyber-augmentation`) — Era 2, cluster `bio-cyber-1`, `feature`, origin standard, gruppo esclusivo `bio-cyber`.
- **Dottrina sciame** (`doctrine-swarm`) — Era 2, cluster `doctrine-1`, `feature`, origin standard, gruppo esclusivo `fleet-doctrine`.
- **Dottrina nucleo d’élite** (`doctrine-core`) — Era 2, cluster `doctrine-1`, `feature`, origin standard, gruppo esclusivo `fleet-doctrine`.

### Tradizioni
- **Scansioni fulminee** (`survey-speed`) — Era 1, cluster `explore-1`, origin standard.
- **Logistica avanzata** (`logistics`) — Era 1, cluster `military-1`, origin standard.
- **Quadri amministrativi** (`bureaucrats`) — Era 1, cluster `economy-1`, origin standard.
- **Pianificazione planetaria** (`planetary-planning`) — Era 1, cluster `economy-1`, origin standard, prereq `bureaucrats`.
