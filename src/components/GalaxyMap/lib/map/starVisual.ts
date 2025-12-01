import {
  Group,
  Mesh,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  AdditiveBlending,
} from 'three';
import type { StarClass, StarSystem } from '@domain/types';
import {
  createStarCoreMaterial,
  fallbackStarVisuals,
  type StarVisual,
} from './starCoreMaterial';
import {
  starGlowTexture,
  starStreakTexture,
  createStarBurstTexture,
} from './starTextures';

const createStarVisual = (
  starClass: StarSystem['starClass'],
  visibility: StarSystem['visibility'],
  pulseSeed: number,
  visuals: Record<StarClass, StarVisual>,
) => {
  const preset =
    visuals[starClass] ?? fallbackStarVisuals[starClass] ?? fallbackStarVisuals.G;
  const group = new Group();
  group.name = 'starVisual';
  group.userData = {
    ...group.userData,
    pulseSeed,
    baseGlow: preset.glowScale,
    timeSpeed: preset.plasmaSpeed,
  };

  const coreMaterial = createStarCoreMaterial({ preset, visibility, seed: pulseSeed });

  const core = new Mesh(
    new SphereGeometry(preset.coreRadius, 32, 32),
    coreMaterial,
  );
  core.userData.systemId = null;
  core.name = 'starCore';
  group.add(core);

  if (visibility !== 'unknown') {
    const glowTexture = starGlowTexture();
    if (glowTexture) {
      const glow = new Sprite(
        new SpriteMaterial({
          map: glowTexture,
          color: preset.glowColor,
          transparent: true,
          depthWrite: false,
          blending: AdditiveBlending,
          opacity: 0.7,
          name: 'starGlowMaterial',
        }),
      );
      glow.name = 'starGlow';
      glow.userData.systemId = null;
      glow.scale.set(preset.glowScale, preset.glowScale, 1);
      group.add(glow);

      const outerGlow = new Sprite(
        new SpriteMaterial({
          map: glowTexture,
          color: preset.glowColor,
          transparent: true,
          depthWrite: false,
          blending: AdditiveBlending,
          opacity: 0.28,
          name: 'starGlowOuterMaterial',
        }),
      );
      outerGlow.name = 'starGlowOuter';
      outerGlow.userData.systemId = null;
      const outerScale = preset.glowScale * 1.6;
      outerGlow.scale.set(outerScale, outerScale, 1);
      group.add(outerGlow);

      const streakTex = starStreakTexture();
      if (streakTex) {
        const streak = new Sprite(
          new SpriteMaterial({
            map: streakTex,
            color: preset.glowColor,
            transparent: true,
            depthWrite: false,
            blending: AdditiveBlending,
            opacity: preset.streakOpacity,
          }),
        );
        streak.name = 'starStreak';
        streak.userData.systemId = null;
        streak.scale.set(preset.glowScale * 1.8, preset.glowScale * 0.65, 1);
        group.add(streak);

        const streakCross = new Sprite(
          new SpriteMaterial({
            map: streakTex,
            color: preset.glowColor,
            transparent: true,
            depthWrite: false,
            blending: AdditiveBlending,
            opacity: preset.streakOpacity * 0.75,
          }),
        );
        streakCross.name = 'starStreakCross';
        streakCross.userData.systemId = null;
        streakCross.scale.set(preset.glowScale * 1.6, preset.glowScale * 0.55, 1);
        streakCross.material.rotation = Math.PI / 2;
        group.add(streakCross);
      }

      const sparkle = new Sprite(
        new SpriteMaterial({
          map: glowTexture,
          color: '#ffffff',
          transparent: true,
          depthWrite: false,
          blending: AdditiveBlending,
          opacity: 0.4,
        }),
      );
      sparkle.name = 'starSparkle';
      sparkle.userData.systemId = null;
      sparkle.scale.set(preset.glowScale * 0.8, preset.glowScale * 0.8, 1);
      group.add(sparkle);

      const corona = new Sprite(
        new SpriteMaterial({
          map: glowTexture,
          color: preset.glowColor,
          transparent: true,
          depthWrite: false,
          blending: AdditiveBlending,
          opacity: 0.18,
        }),
      );
      corona.name = 'starCorona';
      corona.userData.systemId = null;
      corona.scale.set(preset.glowScale * 1.2, preset.glowScale * 1.2, 1);
      group.add(corona);

      const burstTex = createStarBurstTexture();
      if (burstTex) {
        const burst = new Sprite(
          new SpriteMaterial({
            map: burstTex,
            color: preset.glowColor,
            transparent: true,
            depthWrite: false,
            blending: AdditiveBlending,
            opacity: 0.12,
          }),
        );
        burst.name = 'starBurst';
        burst.userData.systemId = null;
        burst.scale.set(preset.glowScale * 2, preset.glowScale * 2, 1);
        group.add(burst);
      }
    }
  }

  return group;
};

export { createStarVisual };
