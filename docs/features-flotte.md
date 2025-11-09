# Flotte, cantieri, combattimento e IA militare

## Shipyard e design navi
- Design base: corvette, frigate, colony (cost/buildTime/attack/defense/hull/speed).
- Template varianti con bonus/malus e costMultiplier; custom build con bonus offense/defense/hull e cost multiplier configurabile.
- Queue cantieri con limite configurabile; verifica risorse via `canAffordCost`, detrae stock e crea `ShipyardTask`; messaggi UI per success/failure.

## Flotte e movimento
- Fleet structure: lista ships con designId + eventuali bonus, systemId, targetSystemId, ticksToArrival.
- Ordini: orderFleetMove, mergeFleets, splitFleet; calcolo travel ticks da distanza e baseTravelTicks (config militare).
- Fleet merge/split con validazioni (same system, disponibilità navi).

## Combattimento
- Trigger: presenza hostilePower > 0 nel sistema dove sosta la flotta.
- Danni: outgoing = somma attack; incoming = max(0, hostilePower - defense*0.5). Applicazione danni su navi, calcolo perdite, aggiornamento hostilePower.
- Esiti: playerVictory/playerDefeat/stalemate/mutualDestruction; hostilesCleared se hostilePower azzerato; report con potenze, danni, perdite, tick.
- Log e notifiche: combatReports (slice limit), notifiche HUD, ring combat recenti e icona battaglia su mappa.

## IA militare e war zones
- ensureAiFleet/reinforceAiFleets: spawn/rafforza flotte IA in base a minaccia e configurazione diplomazia (aiFleetStrength).
- advanceAiWarMoves: targeting sistemi ostili/border; evita cicli; scala numero navi per minaccia.
- War zones: applyWarPressure/intensifyWarZones aumentano hostilePower in sistemi durante guerre e su intervalli; usate anche per crisi/eventi ostili.

## Pannelli e UI
- FleetAndCombatPanel: elenco flotte, ordini movimento, merge/split, dettagli navi, log battaglie recenti.
- ShipyardPanel: design/template/custom build, coda cantieri con progress, messaggi di esito, summary sistema se aperto da mappa.
- GalaxyMap: marker flotte e linee target; indicatori di battaglia e ostilità per situational awareness.
