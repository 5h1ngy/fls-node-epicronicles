## 1. Visione generale

**Genere:** 4X spaziale / grand strategy in tempo reale con pausa.
**Modalità:** solo single player contro IA.
**Obiettivo del giocatore:** guidare un impero spaziale dalla scoperta del viaggio FTL (più rapido della luce) al dominio/leadership della galassia (militare, diplomatica, tecnologica, economica).

**Pilastri di design:**

1. **Esplorazione** della galassia e scoperta di anomalie/eventi.
2. **Gestione profonda dell’impero** (pianeti, risorse, popolazione).
3. **Diplomazia e guerra** con imperi controllati dall’IA.
4. **Progressione a lungo termine** (tecnologie, tradizioni, ascensioni).
5. **Narrazione emergente** tramite eventi dinamici e crisi di fine partita.

---

## 2. Attori e contesto d’uso

### Attori principali

* **Giocatore**

  * Interagisce tramite interfaccia grafica (mouse/tastiera).
  * Prende decisioni strategiche, imposta politiche, gestisce flotte e colonie.

* **Motore di gioco**

  * Simula la galassia (economia, IA, eventi, combattimenti).
  * Gestisce il tempo di gioco (velocità, pausa).

* **IA degli imperi**

  * Controlla imperi rivali/alleati.
  * Sfrutta le stesse regole di base del giocatore (o con bonus/dazi).

### Modalità principali

* **Nuova partita**
* **Carica partita**
* **Tutorial / Nuova partita guidata**
* **Scenari preconfigurati** (opzionale: guerre fredde pre-impostate, crisi anticipate, ecc.)
* **Impostazioni partita**

  * Dimensione galassia, numero di imperi, numero di civiltà primitive, presenza di crisi di fine partita, difficoltà IA, ecc.

---

## 3. Loop di gioco

### 3.1 Loop principale (4X)

1. **Esplora**: inviare navi scientifiche per scoprire sistemi stellari, risorse, anomalie.
2. **Espandi**: colonizzare pianeti abitabili, rivendicare sistemi.
3. **Sfrutta**: sviluppare infrastrutture, estrarre risorse, ottimizzare pianeti.
4. **Elimina / Gestisci**: competere con altri imperi tramite guerra, vassallaggio, diplomazia o egemonia economica/culturale.

Questo loop si ripete lungo tre fasi di gioco:

* **Early game**: esplorazione e colonizzazione iniziale.
* **Mid game**: diplomazia complessa, guerre regionali, specializzazione economica.
* **Late game**: grandi alleanze, crisi galattiche, condizioni di vittoria.

### 3.2 Loop secondari

* **Gestione pianeta**: costruisci distretti/edifici → bilancia risorse → mantieni stabilità/felicità.
* **Diplomazia**: monitora relazioni → negozia trattati → gestisci opinione e minacce.
* **Guerra**: progetta navi → compone flotte → sposta e combatte → occupa sistemi/pianeti.

---

## 4. Moduli funzionali principali

### 4.1 Generazione e gestione della galassia

**Funzioni:**

* Generazione procedurale della mappa:

  * Parametri: dimensione (piccola/media/grande), numero di stelle, densità di nebulose, presenza di fenomeni speciali (buchi neri, pulsar, ecc.).
  * Configurazione forma galassia (ellittica, a spirale, anello, ecc.).
* Allocazione iniziale:

  * Posizionamento imperi iniziali (giocatore + IA).
  * Inserimento di civiltà primitive, rovine, imperi caduti (facoltativo).
* Gestione stati del sistema stellare:

  * Stelle, pianeti, lune, risorse orbitanti.
  * Proprietà: tipo di stella, tipo di pianeta, abitabilità, risorse, anomalie.

**Requisiti funzionali chiave:**

* RF-GAL-01: il sistema deve permettere al giocatore di selezionare parametri della galassia prima di creare la partita.
* RF-GAL-02: il motore deve generare una galassia coerente e giocabile sulla base di questi parametri.
* RF-GAL-03: ogni sistema deve essere esplorabile e avere stato (non esplorato / esplorato / controllato).

---

### 4.2 Gestione dell’impero

#### 4.2.1 Risorse

Tipi tipici (esempio, personalizzabili):

* **Risorse di base:** energia, minerali, cibo.
* **Ricerca:** fisica, società, ingegneria (o equivalente).
* **Risorse strategiche:** risorse rare che sbloccano bonus speciali.
* **Capitale politico / influenza:** per decisioni di alto livello (politiche, rivendicazioni).
* **Capacità amministrativa / coesione imperiale** (facoltativo): limita espansione incontrollata.

Funzioni:

* Produzione, consumo, stoccaggio, commercio interno/esterno.
* Modificatori globali (politiche, tradizioni, eventi).

#### 4.2.2 Popolazione e pianeti

* **Pop (popolazione)** con attributi:

  * Specie, tratti (intelligente, forte, pacifista, ecc.), etica.
  * Professione/ruolo (minatore, ricercatore, burocrate…).
* **Pianeti**:

  * Distretti (miniere, generatori, abitativi, industriali…).
  * Edifici (laboratori, templi, centri amministrativi, ecc.).
  * Attributi di pianeta: dimensione, tipo, modificatori (ricco di minerali, radioattivo, sacro...).
  * Stabilità, criminalità, felicità media, produzione totale.

**Requisiti funzionali:**

* RF-IMP-01: il giocatore deve poter visualizzare lo stato completo dell’impero (risorse, pianeti, pop, flotte) in una schermata di riepilogo.
* RF-IMP-02: il giocatore deve poter gestire ciascun pianeta (costruzione, distretti, edifici, specializzazione).
* RF-IMP-03: la simulazione aggiorna la produzione/consumo risorse ad ogni “tick” di gioco.

---

### 4.3 Tecnologia, tradizioni e progressione

Funzioni:

* **Albero/deck tecnologico**:

  * Ricerca suddivisa in categorie (fisica/società/ingegneria o altro schema).
  * Scelte periodiche: il giocatore seleziona cosa ricercare tra opzioni proposte (o albero fisso).
* **Tradizioni / Perk**:

  * Linee di sviluppo non strettamente tecnologiche (militare, economica, esplorativa, spirituale, ecc.).
  * Bonus permanenti o sblocchi di meccaniche.
* **Ascensioni / Evoluzioni maggiori**:

  * Sblocchi che cambiano radicalmente lo stile di gioco (es. focus su robotica, genetica, psionica).

Requisiti:

* RF-TEC-01: il sistema deve presentare al giocatore le tecnologie disponibili e i prerequisiti.
* RF-TEC-02: completata una ricerca, il gioco deve applicare immediatamente i bonus/sblocchi.
* RF-TEC-03: il giocatore deve poter pianificare la progressione via schermata dedicata.

---

### 4.4 Diplomazia e relazioni internazionali

Anche se il gioco è single player, il cuore è l’interazione con IA:

Funzioni:

* **Sistema di relazioni**:

  * Opinione (numerica), fiducia, paura/minaccia.
  * Fattori: etica compatibile/incompatibile, conflitti passati, trattati, distanza, forza relativa.
* **Trattati**:

  * Patti di non aggressione, alleanze difensive, federazioni, accordi commerciali, accesso ai confini, ricerca congiunta.
* **Comunicazioni diplomatiche**:

  * Proposte del giocatore alla IA e viceversa.
  * Richieste di aiuto, ultimatum.
* **Guerra e pace**:

  * Dichiarazione di guerra con casus belli/obiettivi.
  * Negoziazione di condizioni di pace (cessione sistemi, risorse, vassallaggio).

Requisiti:

* RF-DIP-01: il giocatore deve poter vedere le relazioni con ogni impero (valore numerico + modifiers).
* RF-DIP-02: il giocatore deve poter proporre trattati attraverso una UI strutturata (offerte/richieste).
* RF-DIP-03: il sistema di IA deve valutare le proposte in base a una logica trasparente (o almeno coerente).

---

### 4.5 Flotte, navi e combattimento

Funzioni:

* **Designer navi**:

  * Classi (corvette, fregate, incrociatori, corazzate, titan, ecc.).
  * Moduli: armi (laser, missili, cinetiche), difese (scudi, corazze), utility (sensori, reattori, motori).
* **Produzione e mantenimento**:

  * Coda di costruzione in spaceport/cantiere.
  * Costo in risorse, consumo di manutenzione.
* **Gestione flotte**:

  * Raggruppare navi in flotte.
  * Assegnare ammiragli con tratti.
  * Impostare punti di raccolta, pattern di pattugliamento.
* **Combattimento**:

  * Risolto in tempo reale con pausa (visualizzato sulla mappa o in schermata dedicata).
  * Il giocatore impartisce ordini di movimento/ingaggio.
  * Risultato: perdite di navi, cambiamento controllo sistema.

Requisiti:

* RF-CMB-01: il giocatore deve poter progettare le navi tramite interfaccia dedicata, con feedback su costo e potenza.
* RF-CMB-02: il giocatore deve poter ordinare a una flotta di muoversi tra sistemi e attaccare bersagli.
* RF-CMB-03: il sistema deve calcolare il risultato del combattimento tenendo conto di armamenti, difese, tattiche e modificatori (leader, tecnologia, territorio, ecc.).

---

### 4.6 Eventi, narrazione dinamica e crisi

Funzioni:

* **Anomalie**:

  * Scoperte da navi scientifiche durante l’esplorazione.
  * Richiedono tempo per essere analizzate.
  * Possono generare:

    * Eventi positivi (risorse, tecnologie).
    * Eventi negativi (mostri spaziali, malus).
* **Catene di eventi**:

  * Storyline multi-step con scelte del giocatore.
  * Conseguenze a lungo termine sull’impero o sulla galassia.
* **Crisi di fine partita**:

  * Minaccia esterna o interna che mette a rischio l’intera galassia.
  * Richiede cooperazione/contrasto con altri imperi IA.

Requisiti:

* RF-EVT-01: il sistema deve poter generare eventi casuali o condizionati da stato di gioco.
* RF-EVT-02: il giocatore deve poter scegliere tra opzioni di risposta con effetti diversi.
* RF-EVT-03: devono esistere almeno 1–2 tipi di “crisi finali” che cambino drasticamente il contesto di gioco.

---

### 4.7 Interfaccia utente e controllo

Funzioni:

* **Mappa galattica**:

  * Visualizzazione di sistemi, confini, rotte FTL, icone sintetiche (flotte, basi, eventi).
  * Filtri (politico, economico, militare, diplomatico).
* **Pannelli**:

  * Imperi, pianeti, flotte, tecnologia, diplomazia, log eventi.
* **Notifiche e alert**:

  * Nuove ricerche disponibili, crisi, guerra, mancanza risorse, ecc.
* **Tempo di gioco**:

  * Controllo velocità (pausa, x1, x2, x3…).

Requisiti:

* RF-UI-01: il giocatore deve poter raggiungere qualsiasi informazione di stato in massimo 2–3 click.
* RF-UI-02: le notifiche devono essere filtrabili e silenziabili.
* RF-UI-03: deve essere sempre possibile mettere in pausa il gioco per impartire ordini.

---

## 5. Requisiti non funzionali

* **Prestazioni**:

  * Gestire N imperi IA e M sistemi stellari senza cali di framerate significativi nelle fasi avanzate.
* **Scalabilità della simulazione**:

  * Possibilità di ridurre il carico (es. semplificando calcoli di IA/dettagli) in late game.
* **Usabilità**:

  * Tutorial interattivo.
  * Tooltip dettagliati su tutti gli elementi complessi.
* **Modularità**:

  * Sistemi relativamente indipendenti (diplomazia, economia, IA) per permettere estensioni future.
* **Modding (opzionale)**:

  * File di configurazione / script per razze, eventi, tecnologie, ecc.

---

## 6. Esempi di casi d’uso

Solo alcuni, per dare struttura “analisi funzionale classica”.

### UC-01: Avviare una nuova partita

* **Attore:** Giocatore.
* **Scopo:** Iniziare una nuova campagna.
* **Flusso principale:**

  1. Il giocatore seleziona “Nuova partita” dal menu principale.
  2. Sceglie o crea l’impero (specie, etica, governo, bandiera).
  3. Configura la galassia (dimensione, n° imperi, difficoltà IA…).
  4. Conferma e avvia.
  5. Il sistema genera la galassia e mostra la prima schermata di gioco.

---

### UC-02: Colonizzare un pianeta

* **Attore:** Giocatore.
* **Scopo:** Espandere l’impero.
* **Flusso principale:**

  1. Il giocatore individua un pianeta abitabile in un sistema controllato.
  2. Seleziona una nave colonia o ordina di costruirla.
  3. Ordina alla nave colonia di colonizzare il pianeta.
  4. Dopo un certo tempo di viaggio/colonia, il pianeta diventa colonia attiva.
  5. Il sistema aggiorna risorse, confini e lista pianeti controllati.

---

### UC-03: Dichiarare guerra

* **Attore:** Giocatore.
* **Scopo:** Avviare un conflitto con un altro impero.
* **Flusso principale:**

  1. Il giocatore apre il pannello diplomazia dell’impero bersaglio.
  2. Seleziona “Dichiara guerra”.
  3. Sceglie obiettivi di guerra (sistemi, vassallaggio, liberazione, ecc.).
  4. Conferma.
  5. Il sistema imposta lo stato di guerra, aggiorna relazioni e notifiche, abilita obiettivi militari.

---

### UC-04: Progettare una nave

* **Attore:** Giocatore.
* **Scopo:** Creare un nuovo modello di nave.
* **Flusso principale:**

  1. Il giocatore apre il Designer navi.
  2. Sceglie una classe (es. incrociatore).
  3. Assegna moduli e componenti disponibili (armi, scudi, motori).
  4. Il sistema calcola costo, manutenzione e potenza stimata.
  5. Il giocatore salva il progetto, che diventa costruibile nei cantieri.

---

### UC-05: Rispondere a un evento

* **Attore:** Giocatore.
* **Scopo:** Gestire un evento generato dal gioco.
* **Flusso principale:**

  1. Il sistema genera un evento (es. anomalia risolta, ribellione, contatto con nuova specie).
  2. Mostra una finestra con descrizione e 2–3 opzioni.
  3. Il giocatore sceglie un’opzione.
  4. Il sistema applica gli effetti (modificatori, risorse, cambi di relazione, ecc.).
  5. L’evento viene archiviato nel log.