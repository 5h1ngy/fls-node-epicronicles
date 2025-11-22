# Black hole rendering plan

Obiettivo
- Inserire un buco nero al centro della galassia con resa “videogame” (disco di accrescimento + glow), evitando texture esterne.

Librerie suggerite
- Base: Three.js (già presente).
- Shader: fragment/vertex custom per event horizon + accretion disk (no asset).
- Bloom: `postprocessing` (EffectComposer + BloomPass) per enfatizzare glow (opzionale ma consigliato).
- Particellare (opzionale): `three-nebula` per alone/polvere se serve un layer extra senza scrivere engine.

Architettura proposta
1. Nodo Black Hole (Three.Group)
   - Event horizon: `SphereGeometry` + `ShaderMaterial` nero (no lighting).
   - Accretion disk: `PlaneGeometry` ruotato sul piano XY, `ShaderMaterial`:
     - mask radiale (inner/outer), beaming su angolo, swirl (noise o sin).
     - doppio layer caldo/freddo per profondità.
   - Glow lensing: ring sprite/plane additive con gradiente radiale, pulsazione leggera.
2. Animazione
   - Uniform `uTime` nel render loop; rotazioni opposte dei due layer disco; flicker/pulse sul glow.
3. Composer (se usiamo `postprocessing`)
   - EffectComposer con RenderPass + BloomPass (intensità bassa) solo sul gruppo BH (via mask/layers) o su tutta la scena se accettabile.

Integrazione codice
- Creare `BlackHoleNode` helper (nuovo file es. `@three/blackHole.ts`) che espone `createBlackHole()` restituendo `{ group, shaderMaterials }`.
- In `GalaxyMap`: aggiungere il nodo al centro, aggiornare `uTime` e rotazioni nel render loop.
- Pulizia: dispose materiali/geometrie nel cleanup.
- Rimuovere fog/starfield decorativi per evitare interferenze (già fatto).

Varianti/render
- Se serve noise: usare GLSL noise inline (o texture 64x64 generata in memoria) per swirl/pattern del disco.
- Se serve alone di polvere: instanced quad additivi con random jitter (o `three-nebula` emitter) intorno al centro, molto sparsi.

Step operativi
1) Aggiungere (opz.) dipendenza `postprocessing` e creare composer con Bloom.
2) Implementare helper `createBlackHole` con shader procedurali (disco doppio + glow).
3) Integrare in `GalaxyMap` (add node, update uniformi/rotazioni, cleanup).
4) Testare performance e calibrare parametri (intensità bloom, opacità disco, velocità rotazione).
