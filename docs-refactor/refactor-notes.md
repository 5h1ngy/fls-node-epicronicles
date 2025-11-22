# Refactor galassia e rendering

Obiettivi
- Distribuzione sistemi robusta per forme circle/spiral (evitare collasso, equidistanza, scaling per preset grandi).
- Rendering galattico credibile: fog/bracci multicolore procedurale, buco nero shader-based, starfield instanziato.
- Controlli camera affidabili con limiti dinamici basati sul raggio galattico.

Librerie proposte
- poisson-disk-sampling: distribuzione uniforme dei sistemi (mapping a bracci per spirale). **Integrata nei parametri di generazione.**
- fast-simplex-noise: noise per fog/nebula e accretion shader procedurali. *(da integrare)*
- three/examples/jsm/controls/OrbitControls: pan/zoom con limiti dinamici. *(da integrare)*
- (Opzionale) three-nebula: particellare decorativo per polvere/fiocchi luminosi. *(valutare)*

Step tecnici
1) Generazione galassia: Poisson per punti base, mapping raggio/angolo (circle) o bracci (spiral); fallback golden-angle per preset piccoli. Salva max radius per camera/fog. **In corso (Poisson inserito in galaxy.ts).**
2) Rendering: fog shader su simplex (2 layer colori caldo/freddo), starfield instanziato, black hole shader allineato al piano, aggiunta OrbitControls. *(da fare)*
3) Preset: supporto preset “mega” e auto-calcolo min/max zoom, fog size e starfield bounds dal raggio. *(in corso parziale, min/max zoom dinamici già presenti)*
4) Documentazione: note su nuovi parametri e librerie. **In corso.**
