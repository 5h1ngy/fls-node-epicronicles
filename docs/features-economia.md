# Economia, pianeti, popolazione e colonie

## Risorse e produzione
- Risorse globali: energia, minerali, cibo, ricerca, influenza (ledger amount/income/upkeep).
- Calcolo produzione per pianeta: baseProduction + distretti + popolazione – upkeep, con modificatore morale.
- Modificatori di progressione (tech/perk) applicati come multipliers per income e bonus flat influenza.
- Net per tick sommato a stock con clamp a zero.

## Pianeti e distretti
- Homeworld configurato (nome, size, habitability, distretti iniziali, produzione/upkeep).
- Distretti: generator/mining/farm/research con costi/buildTime/production/upkeep; optional requiresColonists.
- Coda costruzione distretti: add, cancel, prioritize; avanzamento per tick, applicazione distretto se requisiti rispettati; notifiche `districtComplete`.

## Popolazione e morale
- Ruoli: workers, specialists, researchers con produzione/upkeep dedicati.
- Automazione: priorities (food, energy, minerals, research) con threshold deficit/surplus; riassegnazione worker/specialist/researcher.
- Morale/happiness: penalità overcrowding, deficit risorse, habitability bassa; bonus specialisti; clamp min/max; influenza produzione tramite modifier stabilità.

## Colonizzazione
- Config colonization: costi risorse, preparation/travel/duration ticks.
- Nave colonia iniziale/configurabile; ordine colonizza valida sistema sondato, disponibilità nave e risorse.
- Missione con stati preparing/traveling/colonizing, progress per tick; aggiunge pianeta e assegna confini player a completamento; notifiche start/complete.

## Notifiche e HUD economia
- HUD risorse mostra amount e net/tick; notifiche per distretti completati, colonizzazione start/complete, sospensioni per risorse insufficienti.
- EconomyPanel: elenco ledger con income/upkeep/net; DistrictQueuePanel con progress e azioni; PlanetDetail/ColonyPanel mostrano produzione breakdown, coda distretti, popolazione e morale.
