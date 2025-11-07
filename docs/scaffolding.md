# Scaffolding progetto

Questa è la struttura attuale del codice dopo il refactor dello store e delle cartelle principali.

## Store
- `src/store/index.ts`: crea lo store Redux (`store`, `RootState`, `AppDispatch`).
- `src/store/slice/gameSlice.ts`: slice `game` con stato base (`view`, `config`, `session`) e reducer (`startSessionSuccess`, `returnToMenu`, `setSessionState`).
- `src/store/thunks/gameThunks.ts`: tutti i thunk di gameplay (sessione/clock, colonizzazione, cantieri, distretti, flotte, navi scientifiche, popolazione, diplomazia, salvataggi). Espone anche i tipi di risultato (es. `StartColonizationResult`).
- `src/store/utils/sessionUtils.ts`: helper condivisi (notifiche, war events, refund risorse, update popolazione).
- `src/store/hooks.ts`: hook `useGameStore` (API invariata), `useAppDispatch`, `useAppSelector`.
- `src/store/gameStore.ts`: shim di compatibilità che re-esporta `store` e `useGameStore` (per non toccare gli import dei componenti).

## Alias (import puliti)
- Configurati in `tsconfig.app.json` e `vite.config.ts`:
  - `@store/*` → `src/store/*`
  - `@domain/*` → `src/domain/*`
  - `@components/*` → `src/components/*`
  - `@config/*` → `src/config/*`
  - `@assets/*` → `src/assets/*`
Usali per evitare percorsi relativi annidati.

## Dominio (logica pura)
- `src/domain/` organizzato per area:
  - `economy/` (economy, districts, population, resourceMetadata in `shared/`)
  - `fleet/` (ships, fleets, shipyard)
  - `galaxy/` (galaxy, exploration)
  - `session/` (session bootstrap, simulation, colonization)
  - `diplomacy/`, `ai/`, `time/` (clock), `types.ts` condiviso
- Config di bilanciamento in `src/config/gameConfig.ts`.

## UI
- Componenti React sotto `src/components/` organizzati per area (gameplay, debug, app shell, UI di supporto).
- Hook `useGameStore` usato dai componenti per accedere allo stato e dispatchare i thunk.
- Barrel utili:
  - `src/components/gameplay/index.ts`
  - `src/components/ui/index.ts`
- Three.js estratto in `src/three/` (`materials.ts`, `scene.ts`, `mapUtils.ts`); `GalaxyMap` usa questi helper.
- Componenti scomposti:
  - `MapLayer` (mappa) e `MapPanels` (pannelli flottanti)
  - `PlanetDetail` incapsula il pannello di dettaglio pianeta
  - `HudTopBar`, `HudBottomBar`, `ResourceBar`, pannelli feature (Colony, Fleet, Diplomazia, Shipyard, ecc.)

## Entry point
- `src/main.tsx` monta l’app e collega lo store Redux.

## Notazione
- Tutti i moduli TypeScript sono tipizzati strict.
- Thunk centralizzati in `gameThunks.ts` ma separabili ulteriormente (es. per dominio) se necessario; gli hook non cambiano.
