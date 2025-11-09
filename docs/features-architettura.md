# Architettura, stato globale e simulazione

## Stato globale e slice
- Store Redux Toolkit (`gameSlice`) con vista (`mainMenu`/`simulation`), config e `session`.
- `GameSession` contiene clock, galassia, empires, economy, colonizationTasks, fleets, shipyardQueue, districtConstructionQueue, combatReports, notifications, warEvents, research, traditions, events.
- Hooks: `useGameStore` espone selettori + thunks tipizzati; `useAppSelector`/`useAppDispatch` per accesso sicuro.

## Loop di simulazione
- `advanceSimulation(session, ticks, config)`: esegue un ciclo per tick:
  1. Assicura flotte IA, rinforza e calcola fallback system.
  2. Avanza colonizzazione, assegna confini, auto-espansione AI.
  3. Avanza distretti, shipyard, movimenti flotte + combattimenti, log e notifiche.
  4. Diplomazia: drift, guerra/pace, war zones e intensificazione.
  5. Esplorazione: auto-explore, upgrade visibilità.
  6. Automazione popolazione, economia con modificatori (tech/perk), ricerca e tradizioni.
  7. Eventi/anomalie/crisi: spawn condizionato, queue, notifiche.
  8. Trimming log/notifiche (limite configurato).

## Thunks principali (azioni di gameplay)
- Sessione: startNewSession, returnToMenu, setSimulationRunning, setSpeedMultiplier, advanceClockBy, save/load.
- Economia/colonie: startColonization, queueDistrictConstruction, cancel/prioritize, promote/demote population.
- Flotte: orderFleetMove, mergeFleets, splitFleet.
- Shipyard: queueShipBuild (design, template, custom).
- Diplomazia: declareWar, proposePeace, requestBorderAccess.
- Ricerca/Tradizioni: beginResearch, unlockTraditionPerk.
- Eventi: resolveActiveEvent.

## Configurazione centrale (`src/config/gameConfig.ts`)
- Galaxy presets, ticksPerSecond, debug autoStart.
- Exploration: travel/survey ticks.
- Economy: starting resources, homeworld, distretti, populationJobs, morale, habitability.
- Colonization: costi e tempi missione.
- Diplomacy: opinion range, war/peace threshold, check interval, war zones, potenza flotte IA, log limit.
- Military: shipyard queue, fleet baseTravelTicks, design navi, template, colony ship.
- Map: orbitSpeed.
- Research: rami, tech (cost/effects/prereq), pointsPerResearchIncome.
- Traditions: alberi, perk (cost/effects/prereq), pointsPerInfluenceIncome.
- Events: definizioni narrative/anomaly/crisis, intervalli, effetti.

## Tipi dominio chiave
- Risorse: energy, minerals, food, research, influence con ledger.
- Popolazione: workers/specialists/researchers, morale/stabilità/happiness.
- Navi: ScienceShip, Fleet (ships con designId + bonus), ShipyardTask, ColonizationTask.
- Ricerca/Tradizioni: branch state (current/progress/completed), perk unlocked/points.
- Eventi: GameEvent con options ed effects, queue e log.
