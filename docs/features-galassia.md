# Galassia, mappa 3D ed esplorazione

## Generazione e dati galassia
- `createTestGalaxy`: genera sistemi da seed, numero e raggio; assegna classi stellari, orbite planetarie, eventuale mondo abitabile, hostilePower.
- Home system assegnato al player, secondo all’AI-1; confini assegnati quando i sistemi vengono colonizzati.
- System visibility: `unknown/revealed/surveyed`.

## Mappa Three.js (`GalaxyMap.tsx`)
- Scene con camera prospettica e controlli pan/zoom; label scala dinamica, orbits toggle in base allo zoom.
- Node sistema: sfera stella, label, ring proprietario (player/AI), ring ostile, ring combat recenti, icona battaglia attiva.
- Pianeti: orbite animate con posizione aggiornata a ogni frame; colori per pianeta; lookup per focus planeta.
- Science ships: marker con status (idle/traveling/surveying), linee verso target.
- Fleet marker: sphere e linee target; colorazione guerra/pace.
- Interazione: raycast click su sistema (solo se non unknown), focus/zoom su sistema o pianeta, clear focus su click vuoto; scroll-to log guerre da HUD.

## Esplorazione e FoW
- Navi scientifiche: stato `idle/traveling/surveying`, autoExplore on by default; assegnazione automatica di target unknown.
- Tick viaggio/sondaggio da config `exploration` (travelTicks, surveyTicks).
- Upgrade visibilità: revealed al primo arrivo, surveyed al completamento sondaggio.
- Gating colonizzazione: sistemi non sondati bloccano l’ordine.

## Pannelli correlati
- MapPanels include: GalaxyOverview, SciencePanel (ordini, auto-explore toggle), SystemPanel (dettagli sistema, pianeti, badge colonizzato/habitable), focus pannello sistema su click.
- HUD mostra conteggio sistemi sondati/rivelati.
