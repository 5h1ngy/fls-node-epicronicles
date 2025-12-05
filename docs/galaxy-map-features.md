## 1. Scopo e contesto

La **Mappa Galattica** è il modulo che:

* visualizza in modo sintetico e interattivo lo stato della galassia (sistemi, pianeti, colonie, flotte, navi scientifiche, rotte),
* permette al giocatore di **navigare**, **selezionare** e **focalizzare** elementi del game state,
* fornisce ancoraggi per UI 2D (overlay informativi e pannelli di dettaglio).

Attori principali:

* **Giocatore**: esplora e comanda tramite la mappa.
* **Motore di gioco**: fornisce i dati di stato e riceve input (selezioni, focus, comandi).

---

## 2. Requisiti funzionali

### 2.1 Acquisizione dati e aggiornamento stato

**RF-MAP-01 – Lettura stato galassia**
La mappa deve leggere dal game state almeno i seguenti dati:

* sistemi stellari (posizione, proprietà di base, stato di scoperta),
* colonie e pianeti rilevanti,
* flotte e navi scientifiche (posizione, stato, destinazione),
* configurazione globale della mappa (forma, seed galattico, parametri orbite e preset visuali).

---

**RF-MAP-02 – Aggiornamento coerente con il game state**
La mappa deve aggiornare la rappresentazione visiva quando avvengono cambiamenti rilevanti nel game state (es. nuove flotte, colonizzazione, cambi stato sistemi) evitando rebuild inutili.

---

**RF-MAP-03 – Limiti di navigazione**
Il sistema deve calcolare automaticamente:

* il raggio massimo della galassia,
* i limiti di zoom e movimento camera,

in modo che tutti i sistemi siano sempre raggiungibili e la camera non esca dal volume di gioco.

---

### 2.2 Navigazione, camera e focus

**RF-MAP-10 – Controllo della camera**
La mappa deve permettere al giocatore di:

* muovere la visuale sulla galassia (pan),
* modificare lo zoom entro limiti min/max,
* passare tra almeno due angoli di vista predefiniti (es. top-down e inclinato).

I cambi di zoom e tilt devono essere interpolati in modo fluido, salvo richiesta di focus immediato.

---

**RF-MAP-11 – Focus su sistema/pianeta**
Il sistema deve poter ricevere richieste di focus:

* su uno specifico sistema,
* su uno specifico pianeta (con fallback al sistema se il pianeta non è disponibile),

spostando la camera e impostando uno zoom suggerito, clampato ai limiti della scena. I sistemi non ancora rivelati non devono essere focusabili.

---

**RF-MAP-12 – Focus da eventi esterni**
La mappa deve poter essere richiamata da altri moduli (es. eventi, log, notifiche) per:

* centrare la vista su un sistema o una flotta,
* evidenziarlo visivamente (es. highlight o ring temporaneo).

*(questo è implicito nel concetto di “focus programmabile” e ancore per UI)*

---

### 2.3 Interazione con l’utente

**RF-MAP-20 – Selezione elementi**
La mappa deve consentire al giocatore, tramite click sinistro, di selezionare:

* un sistema stellare,
* un pianeta visibile,
* una shipyard o altra struttura legata al sistema.

La selezione deve restituire almeno un’identità univoca dell’oggetto (systemId, planetId, tipo).

---

**RF-MAP-21 – Interazione limitata dalla visibilità**
Elementi appartenenti a sistemi non ancora rivelati devono:

* non essere selezionabili,
* non rispondere al raycast.

---

**RF-MAP-22 – Integrazione con UI 2D**
Per ogni elemento selezionabile (sistema, pianeta, shipyard, flotta, nave scientifica) la mappa deve fornire:

* una posizione di ancoraggio 2D per overlay UI,
* l’aggiornamento dinamico di tale anchor quando la camera si muove.

---

**RF-MAP-23 – Controllo zoom via input**
Lo scroll del mouse (o input equivalente) deve modificare lo zoom della camera entro i limiti definiti, con risposta immediata e fluida.

---

### 2.4 Background e atmosfera visiva

**RF-MAP-30 – Background galattico**
La mappa deve visualizzare un background atmosferico che:

* rispecchi la forma/seed della galassia (es. maschera galattica),
* includa elementi come nebulose, starfield e fog.

---

**RF-MAP-31 – Oggetto centrale opzionale**
La mappa deve permettere la presenza opzionale di un oggetto centrale (es. buco nero) che può essere:

* aggiunto o rimosso in modo dinamico,
* riposizionato correttamente dopo un rebuild della scena.

---

### 2.5 Rappresentazione sistemi, pianeti e orbite

**RF-MAP-40 – Visualizzazione dei sistemi stellari**
Ogni sistema deve essere rappresentato da:

* un nodo centrale (stella) con proprietà visive in base alla classe,
* un’etichetta testuale (nome del sistema),
* indicatori grafici di proprietà (giocatore, IA, neutrale),
* eventuali indicatori di:

  * ostilità,
  * combattimenti recenti,
  * battaglie in corso,
  * presenza di shipyard.

La visibilità delle etichette deve dipendere dal livello di zoom.

---

**RF-MAP-41 – Visualizzazione delle stelle**
Le stelle devono differenziarsi almeno per:

* classe/spettro (es. O–M),
* stato di conoscenza (normale vs “unknown” con resa attenuata).

Eventuali animazioni (glow, rotazione, effetti) devono essere mantenute coerenti anche dopo rebuild della mappa.

---

**RF-MAP-42 – Visualizzazione orbite e pianeti**
Per ogni sistema, la mappa deve:

* mostrare le orbite dei pianeti (quando il livello di zoom è sufficiente),
* animare la posizione dei pianeti sulle orbite,
* evidenziare con un marker (es. ring) i pianeti colonizzati o usati come ancore.

Le etichette dei pianeti devono scalare con lo zoom ed essere visibili solo a distanze adeguate.

---

**RF-MAP-43 – Lookup per pianeti**
La mappa deve mantenere un lookup dei pianeti di ciascun sistema per:

* ancorare overlay UI,
* costruire e aggiornare le linee di viaggio verso di essi (es. colonizzazione, missioni).

---

### 2.6 Rappresentazione di flotte e navi scientifiche

**RF-MAP-50 – Visualizzazione navi scientifiche**
Le navi scientifiche devono essere rappresentate tramite marker che:

* differenziano almeno gli stati *idle*, *in viaggio*, *in surveying*,
* includono un’indicazione chiara di destinazione (es. marker target elevato),
* sono posizionati a un’altezza coerente per distinguerli da altri elementi.

---

**RF-MAP-51 – Visualizzazione flotte**
Le flotte devono essere rappresentate tramite marker che:

* differenziano almeno stati *idle* e *in guerra*,
* mostrano le rotte pianificate tra i sistemi,
* possono usare un modello specifico per tipologie speciali (es. flotte di costruzione),
* cambiano aspetto a seconda dello stato di guerra/pace.

---

**RF-MAP-52 – Percorsi di viaggio**
La mappa deve rappresentare le rotte di viaggio (travel paths) come:

* linee 3D tra sistemi (o verso target intermedi),
* con un marker di destinazione (target) chiaramente visibile,
* applicabili sia a flotte sia a navi scientifiche.

---

### 2.7 Aggiornamento per frame e rebuild

**RF-MAP-60 – Aggiornamento continuo della scena**
A ogni ciclo di aggiornamento, la mappa deve:

* aggiornare camera e tilt in base agli input e agli interpolanti,
* aggiornare l’opacità/visibilità di elementi (es. nebula, label, indicatori) in funzione dello zoom,
* animare orbite e stelle (se previsto),
* riallineare la posizione delle ancore (flotte, navi scientifiche) con il game state corrente.

---

**RF-MAP-61 – Preservazione di stato visivo tra rebuild**
In caso di ricostruzione completa della mappa, il sistema deve:

* preservare informazioni essenziali per la continuità visiva (angoli orbitali, rotazione delle stelle),
* ricreare i nodi (sistemi, ancore, background) in posizioni coerenti con lo stato precedente,
* ripristinare eventuali oggetti centrali (es. buco nero).

---

## 3. Requisiti non funzionali specifici del modulo

**RNF-MAP-01 – Performance e fluidità**
La mappa deve garantire una navigazione fluida (frame rate stabile) anche con:

* un numero elevato di sistemi,
* più flotte e navi scientifiche,
* numerosi elementi visuali (background, orbite, label).

---

**RNF-MAP-02 – Gestione risorse e memoria**
Il modulo deve:

* rilasciare correttamente le risorse grafiche (geometrie, materiali, texture) alla chiusura o al rebuild della scena,
* evitare allocazioni inutili a ogni frame per ridurre il carico del garbage collector.

---

**RNF-MAP-03 – Sicurezza delle interazioni**
Il sistema deve:

* disabilitare il contesto di default del browser su click destro (se in web),
* evitare che oggetti puramente decorativi interferiscano con la selezione (niente raycast su elementi di background).

---

## 4. Esempi di casi d’uso (mappa)

### UC-MAP-01: Navigare la galassia

1. Il giocatore apre la mappa galattica.
2. Muove la visuale e regola lo zoom per esplorare i sistemi.
3. La mappa aggiorna camera, nebula, label e indicatori in base alla posizione/zoom.

---

### UC-MAP-02: Selezionare un sistema e aprire l’overlay

1. Il giocatore clicca su un sistema visibile.
2. La mappa identifica il sistema e lo imposta come selezionato.
3. Viene creato/aggiornato un anchor 2D.
4. L’interfaccia 2D mostra un pannello di riepilogo del sistema sul relativo anchor.

---

### UC-MAP-03: Seguire una flotta in movimento

1. Il motore di gioco imposta una rotta per una flotta.
2. La mappa visualizza la flotta e la linea di viaggio tra sistemi.
3. A ogni aggiornamento, la posizione della flotta viene aggiornata lungo la rotta.
4. Il giocatore può fochettare la camera sulla flotta per seguirne il movimento.