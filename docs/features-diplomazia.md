# Diplomazia e multi-impero

## Imperi e stato relazionale
- Imperi: player + due AI generate da seed, con colore, personality, opinion, warStatus.
- Opinion drift configurato (range min/max, war/peace threshold, check interval).
- War events loggati con badge “unread”; warSince per durata.

## Azioni diplomatiche (thunk)
- `declareWarOnEmpire`, `proposePeaceWithEmpire`, `requestBorderAccess` con validazioni (empire esistente, stato corrente).
- Risultati con reason specifico; update warStatus e notifiche/log guerra.

## War zones e confini
- `assignBordersToPlayer`: assegna sistemi colonizzati al player.
- War zones: generazione potenza ostile in base a guerre attive, intensificazione periodica; impatto su movimenti e combattimenti IA.
- Accesso confini: IA usa warStatus/borderAccess per decidere targeting e movimenti.

## UI diplomazia
- DiplomacyPanel: elenco imperi con opinione, stato (guerra/pace), pulsanti azioni (guerra/pace/accesso), messaggi di esito.
- HUD bottom: badge guerre attive, war log con scroll-to da bottone notifiche.
