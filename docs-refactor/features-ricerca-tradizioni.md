# Ricerca, tradizioni e progressione

- **Ricerca**: motore in `src/engines/research/research.ts` con alberi, sblocco tecnologie e scienza per tick; pannello UI `src/panels/TechPanel.tsx`.
- **Tradizioni**: modulo `src/engines/traditions/traditions.ts` (percorsi culturali, bonus); mostrato in `TechPanel` come sezione dedicata.
- **Progressione impero**: modificatori in `src/engines/progression/modifiers.ts` applicati su economie/risorse; thunks `progressionThunks.ts`.
- **Tempo e tick**: clock `src/engines/time/clock.ts`, controllo velocità in `HudTopBar.tsx` e `HudBottomBar.tsx`.
