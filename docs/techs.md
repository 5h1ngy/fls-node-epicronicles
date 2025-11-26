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

## 6. Catalogo attuale (set minimo in config)

### Ricerca (solo il necessario)
- **Energia fotonica** (`photonics`) - Era 1, cluster `energy-1`, `foundation`, origin standard. Bonus energia.
- **Sensori avanzati** (`advanced-sensors`) - Era 1, cluster `sensors-1`, `feature`, origin standard. Gateway per Era 2.
- **Bio-cupole** (`bio-domes`) - Era 1, cluster `bio-1`, `foundation`, origin standard. Bonus cibo.
- **Leghe rinforzate** (`reinforced-alloys`) - Era 1, cluster `materials-1`, `foundation`, origin standard. Bonus minerali.
- **Burosfera** (`bureaucracy`) - Era 2, cluster `admin-1`, `feature`, origin standard.
- **Cantieri modulari** (`modular-yards`) - Era 2, cluster `yards-1`, `feature`, origin standard, prereq `reinforced-alloys`.

### Tradizioni (set base)
- **Scansioni fulminee** (`survey-speed`) - Era 1, cluster `explore-1`, origin standard.
- **Logistica avanzata** (`logistics`) - Era 1, cluster `military-1`, origin standard.
- **Quadri amministrativi** (`bureaucrats`) - Era 1, cluster `economy-1`, origin standard.
- **Pianificazione planetaria** (`planetary-planning`) - Era 1, cluster `economy-1`, origin standard, prereq `bureaucrats`.

Nota: tech rare, perk di fazione/reliquia e anomalie speciali sono state rimosse per ora per mantenere solo le feature indispensabili al loop base di gioco.
