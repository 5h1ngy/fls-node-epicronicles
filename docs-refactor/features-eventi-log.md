# Eventi, anomalie e log

- **Generazione eventi**: `src/engines/events/events.ts` crea notifiche, anomalie e scelte; thunks `eventThunks.ts` per dispatch.
- **UI**: pannello `src/panels/EventPanel.tsx` per eventi/anomalie, `src/panels/LogPanel.tsx` per storico consolidato, modale dock “Log” integrata in `GameScreen.tsx`.
- **War events**: memo in `src/panels/war/WarsEventsMemo.tsx` e badge non letti gestiti da hook `useWarEvents.ts`.
- **Notifiche in HUD**: blocchi nella bottom bar rimossi, ora il log completo è nel dock (pulsante dedicato).
