# Eventi, anomalie e crisi

## Definizioni e tipi
- EventDefinition per narrative/anomaly/crisis con id, titolo, descrizione, options[].
- EventOptionEffect supporta: `resource`, `influence`, `stability`, `hostileSpawn`, `insight`, `triggerEvent`.
- Sistema eventi nella sessione: `events.active`, `events.queue`, `events.log`.

## Spawn e queue
- Intervalli configurabili: narrative, anomaly, crisis.
- Condizioni: anomaly su sistemi sondati senza ostili; crisis su sistemi sondati; skip se guerre intense recente.
- Queue: se non c’è evento attivo, pesca da queue; follow-up aggiunti via effetto `triggerEvent` (instanzia l’evento per id e lo accoda).

## Risoluzione
- Affordability: verifica costi risorse (effetti resource negativi) prima di consentire scelta.
- Applicazione effetti: modifica stock risorse, influenza, stabilità planetaria, hostilePower su sistema target o fallback; può accodare un follow-up.
- Log e notifiche: `eventStarted` e `eventResolved`; log limitato (20) e notifiche limitate (6).

## Crisi iniziale
- Definizione base “Incursione esterna”: spawn ostili potenziati o ridotti pagando influenza; integra war zones e combattimenti standard.

## UI
- Pannello “Eventi & Anomalie”: mostra evento attivo con badge tipo, bottoni opzioni (disabilitati se non affordable), costo indicato, registro storico con tick.
- HUD: notifiche evento in arrivo/completato.
