# Ricerca, tradizioni e progressione

## Ricerca
- Tre rami: physics, society, engineering.
- Tech con cost, descrizione, effetti (income multipliers, bonus vari), prerequisiti opzionali.
- Stato ramo: `currentTechId`, `progress`, `completed[]`; backlog delle tech.
- Avanzamento: punti derivati da income ricerca, distribuiti per ramo; completamento genera notifica e libera lo slot.
- UI: pannello “Ricerca & Tradizioni” mostra tech attiva per ramo, progress %, lista disponibili/completate e pulsante avvio (con gating prerequisiti).

## Tradizioni
- Tre alberi: exploration, economy, military.
- Perk con cost in punti tradizione, prerequisiti, effetti (multipliers risorse, bonus infl, tempo distretti, ecc.).
- Stato: punti disponibili (da income influenza * coefficiente), unlocked[].
- Sblocco: verifica prerequisiti e punti, aggiorna stato e applica effetti permanenti.
- UI: stessa view del pannello, elenco perk disponibili/sbloccati, punti mostrati.

## Modificatori di progressione
- Effetti tech/perk tradotti in `incomeMultipliers` per risorse e `influenceFlat`; applicati in `advanceEconomy` su base/distretti/pop produzione.
- Impatto indiretto su tempi (es. distretti via bonus produzione) e capacità militari (via income minerali/energia).
