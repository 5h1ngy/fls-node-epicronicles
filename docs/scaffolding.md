# Scaffolding progetto

Foto dell'alberatura e dei ruoli principali dopo il refactor.

## Alias (import puliti)
Configurati in `tsconfig.app.json` e `vite.config.ts`:
- `@store/*` -> `src/store/*`
- `@domain/*` -> `src/domain/*`
- `@components/*` -> `src/components/*`
- `@config/*` -> `src/config/*`
- `@assets/*` -> `src/assets/*`
- `@three/*` -> `src/three/*`

## Store
- `src/store/index.ts`: crea lo store Redux (`store`, `RootState`, `AppDispatch`).
- `src/store/slice/gameSlice.ts`: slice `game` con stato base (`view`, `config`, `session`) e reducer (`startSessionSuccess`, `returnToMenu`, `setSessionState`).
- `src/store/thunks/`: thunks suddivisi per dominio:
  - `sessionThunks.ts` (bootstrap sessione, clock/speed, advance tick),
  - `colonizationThunks.ts`,
  - `shipyardThunks.ts`,
  - `districtThunks.ts`,
  - `populationThunks.ts`,
  - `fleetThunks.ts`,
  - `scienceThunks.ts`,
  - `diplomacyThunks.ts`,
  - `persistenceThunks.ts`,
  - `helpers.ts` (utility comuni), `index.ts` (barrel).
- `src/store/utils/sessionUtils.ts`: helper condivisi (notifiche, war events, refund risorse, update popolazione).
- `src/store/hooks.ts`: hook `useGameStore`, `useAppDispatch`, `useAppSelector`.
- `src/store/gameStore.ts`: shim di compatibilita' che re-esporta `store` e `useGameStore` per non toccare gli import storici.

## Dominio (logica pura per feature)
- `src/domain/economy`: economia, distretti, popolazione; dati comuni in `shared/`.
- `src/domain/fleet`: navi, flotte, shipyard.
- `src/domain/galaxy`: generazione/gestione galassia, esplorazione.
- `src/domain/session`: bootstrap sessione, simulazione tick, colonizzazione.
- `src/domain/diplomacy`, `src/domain/ai`, `src/domain/time` (clock), `src/domain/types.ts`.
- Config di bilanciamento in `src/config/gameConfig.ts`.

## Three.js
- `src/three/materials.ts`: materiali condivisi per stelle, flotte, indicatori, scienza.
- `src/three/scene.ts`: setup scena/camera/renderer con dispose centralizzato.
- `src/three/mapUtils.ts`: sprite label, pianeti in orbita, nodi sistema con anelli/indicatori.

## UI (React)
- Componenti sotto `src/components/`, organizzati per area:
  - `gameplay/` (HUD, mappa, pannelli nave/pianeta/flotta/diplomazia, ecc.).
  - `app/` (AppShell, MainMenu).
  - `ui/` (elementi riutilizzabili).
- Barrel utili: `src/components/gameplay/index.ts`, `src/components/ui/index.ts`.
- Split mappa: `MapLayer` (mappa), `MapPanels` (pannelli flottanti), `PlanetDetail` (dettaglio pianeta).
- `GalaxyMap` usa gli helper Three.js comuni.

## Entry point
- `src/main.tsx` monta l'app e collega lo store Redux.

## Nota generale
- Tipi strict, thunk centralizzati ma separabili per dominio in futuro; hook stabili (`useGameStore`).
