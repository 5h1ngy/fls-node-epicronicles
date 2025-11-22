# Roadmap refactor galassia

## Fase 1 – Fondamenta generazione
- Integra `poisson-disk-sampling` per distribuire sistemi (circle/spiral mapping). **In corso (poisson aggiunto).**
- Aggiorna `galaxy.ts` a usare Poisson + golden-angle fallback e salva `maxSystemRadius`. **In corso (Poisson attivo).**
- Verifica preset esistenti e “mega” (1200 sistemi). *(da verificare dopo render update)*

## Fase 2 – Rendering & camera
- Sostituisci fog con shader simplex multicolore (no canvas) scalato su `maxSystemRadius`. **In corso (shader con texture da fast-simplex-noise).**
- Istanzia starfield via InstancedMesh; mantieni black hole shader allineato al piano. **Completato (InstancedMesh starfield + nebula particles)**
- Adotta `OrbitControls` con min/max zoom dinamici e pan limitato al raggio. **In corso (OrbitControls + clamp zoom dinamici)**

## Fase 3 – Finishing
- (Opzionale) Aggiungi layer particellare con `three-nebula` per polvere/brillii.
- Rifinisci preset visivi (colori fog, intensità glow) e performance check.
- Aggiorna documentazione `docs-refactor/refactor-notes.md` con parametri e usage.
