# Diplomazia e relazioni

- **Engine**: `src/engines/diplomacy/diplomacy.ts` gestisce stati pace/guerra, opinione e personalità IA; helper in `store/utils/warUtils.ts`.
- **UI**: pannello `src/panels/DiplomacyPanel.tsx` (relazioni, sentiment, azioni), stato guerre in `BattlesPanel.tsx` e badge HUD `HudBottomBar.tsx` (warUnread).
- **IA avversari**: comportamenti in `src/engines/ai/ai.ts` includono decisioni diplomatiche e guerre.
- **Thunks**: `src/store/thunks/diplomacyThunks.ts` per dichiarazioni e trattati; selettori `warSelectors.ts` per opinioni e guerre attive.
