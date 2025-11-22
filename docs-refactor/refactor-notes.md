# Refactor galassia e rendering

Obiettivi
- Distribuzione sistemi robusta per forme circle/spiral (evitare collasso, equidistanza, scaling per preset grandi).
- Rendering galattico credibile: fog/bracci multicolore procedurale, buco nero shader-based, starfield instanziato.
- Controlli camera affidabili con limiti dinamici basati sul raggio galattico.

Librerie proposte
- poisson-disk-sampling: distribuzione uniforme dei sistemi (mapping a bracci per spirale).
- fast-simplex-noise: noise per fog/nebula e accretion shader procedurali.
- three/examples/jsm/controls/OrbitControls: pan/zoom con limiti dinamici.
- (Opzionale) three-nebula: particellare decorativo per polvere/fiocchi luminosi.

Step tecnici
1) Generazione galassia: Poisson per punti base, mapping raggio/angolo (circle) o bracci (spiral); fallback golden-angle per preset piccoli. Salva max radius per camera/fog.
2) Rendering: fog shader su simplex (2 layer colori caldo/freddo), starfield instanziato, black hole shader allineato al piano, aggiunta OrbitControls.
3) Preset: supporto preset “mega” e auto-calcolo min/max zoom, fog size e starfield bounds dal raggio.
4) Documentazione: note su nuovi parametri e librerie.
