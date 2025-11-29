import * as THREE from 'three';

export const updateStarVisuals = (
  node: THREE.Object3D,
  elapsed: number,
  zoomFactor: number,
  delta: number,
) => {
  const starGlow = node.getObjectByName('starGlow') as THREE.Sprite | null;
  const starGlowOuter = node.getObjectByName('starGlowOuter') as THREE.Sprite | null;
  const starStreak = node.getObjectByName('starStreak') as THREE.Sprite | null;
  const starStreakCross = node.getObjectByName('starStreakCross') as THREE.Sprite | null;
  const starSparkle = node.getObjectByName('starSparkle') as THREE.Sprite | null;
  const starCore = node.getObjectByName('starCore') as THREE.Mesh | null;
  const starBurst = node.getObjectByName('starBurst') as THREE.Sprite | null;
  const starCorona = node.getObjectByName('starCorona') as THREE.Sprite | null;
  const starVisualGroup = node.getObjectByName('starVisual') as THREE.Group | null;
  const pulseSeed = (node.getObjectByName('starVisual')?.userData?.pulseSeed as number) ?? 0;
  const baseGlow =
    (node.getObjectByName('starVisual')?.userData?.baseGlow as number) ?? 1;
  const timeSpeed =
    (node.getObjectByName('starVisual')?.userData?.timeSpeed as number) ?? 1;
  const scaleAtten = 1 + zoomFactor * 0.45;
  const opacityAtten = 0.8 + zoomFactor * 0.5;
  const farView = zoomFactor > 0.55;

  if (starCore) {
    const mat = starCore.material as THREE.ShaderMaterial;
    if (mat.uniforms?.uTime) {
      mat.uniforms.uTime.value = (elapsed + pulseSeed * 0.5) * timeSpeed;
    }
  }
  if (starVisualGroup) {
    const spin = 0.15 * timeSpeed;
    starVisualGroup.rotation.z += delta * spin;
  }
  if (starGlow) {
    const t = elapsed + pulseSeed * 0.1;
    const pulse = 1 + Math.sin(t * 1.3) * 0.06;
    const farScale = farView ? 1.02 + Math.max(0, zoomFactor - 0.6) * 0.6 : 1;
    const farOpacity = farView ? 0.35 + Math.max(0, zoomFactor - 0.6) * 0.45 : 1;
    starGlow.scale.set(
      baseGlow * pulse * scaleAtten * farScale,
      baseGlow * pulse * scaleAtten * farScale,
      1,
    );
    starGlow.material.opacity =
      (0.7 + Math.sin(t * 1.1) * 0.12) * opacityAtten * farOpacity;
  }
  if (starGlowOuter) {
    const t = elapsed + pulseSeed * 0.06;
    const pulse = 1 + Math.sin(t * 0.7) * 0.04;
    const farScale = farView ? 1.05 + Math.max(0, zoomFactor - 0.6) * 0.7 : 1;
    const farOpacity = farView ? 0.4 + Math.max(0, zoomFactor - 0.6) * 0.4 : 1;
    const mat = starGlowOuter.material as THREE.Material & { opacity?: number };
    starGlowOuter.scale.set(
      baseGlow * 1.6 * pulse * scaleAtten * farScale,
      baseGlow * 1.6 * pulse * scaleAtten * farScale,
      1,
    );
    if (mat.opacity !== undefined) {
      mat.opacity = (0.22 + Math.sin(t * 0.9) * 0.05) * opacityAtten * farOpacity;
    }
  }
  if (starStreak) {
    starStreak.visible = farView;
    if (farView) {
      const t = elapsed + pulseSeed * 0.12;
      const pulse = 1 + Math.sin(t * 0.6) * 0.05;
      const farScale = 0.7 + Math.max(0, zoomFactor - 0.6) * 0.8;
      const mat = starStreak.material as THREE.Material & { opacity?: number };
      starStreak.scale.set(
        (baseGlow * 1.2) * pulse * farScale,
        (baseGlow * 0.45) * (1 + Math.sin(t * 0.8) * 0.04) * farScale,
        1,
      );
      if (mat.opacity !== undefined) {
        mat.opacity = 0.12 + Math.sin(t * 1.1) * 0.03;
      }
    }
  }
  if (starStreakCross) {
    starStreakCross.visible = farView;
    if (farView) {
      const t = elapsed + pulseSeed * 0.1;
      const pulse = 1 + Math.sin(t * 0.5) * 0.04;
      const farScale = 0.6 + Math.max(0, zoomFactor - 0.6) * 0.7;
      const mat = starStreakCross.material as THREE.Material & { opacity?: number; rotation?: number };
      const spriteMat = starStreakCross.material as THREE.SpriteMaterial;
      starStreakCross.scale.set(
        (baseGlow * 1.1) * pulse * farScale,
        (baseGlow * 0.38) * (1 + Math.sin(t * 0.7) * 0.05) * farScale,
        1,
      );
      if (mat.opacity !== undefined) {
        mat.opacity = 0.1 + Math.sin(t * 0.9) * 0.03;
      }
      spriteMat.rotation = Math.PI / 2 + Math.sin(t * 0.2) * 0.08;
    }
  }
  if (starSparkle) {
    starSparkle.visible = !farView;
    const t = elapsed + pulseSeed * 0.14;
    const pulse = 1 + Math.sin(t * 1.5) * 0.1;
    const mat = starSparkle.material as THREE.Material & { opacity?: number };
    starSparkle.scale.set(
      baseGlow * 0.8 * pulse * scaleAtten,
      baseGlow * 0.8 * pulse * scaleAtten,
      1,
    );
    if (mat.opacity !== undefined) {
      mat.opacity = (0.3 + Math.sin(t * 2.1) * 0.08) * opacityAtten;
    }
  }
  if (starCorona) {
    starCorona.visible = !farView;
    const t = elapsed + pulseSeed * 0.18;
    const pulse = 1 + Math.sin(t * 1.4) * 0.08;
    const mat = starCorona.material as THREE.SpriteMaterial;
    starCorona.scale.set(
      baseGlow * 1.2 * pulse * scaleAtten,
      baseGlow * 1.2 * pulse * scaleAtten,
      1,
    );
    mat.rotation = Math.sin(t * 0.6) * 0.1;
    mat.opacity = (0.16 + Math.sin(t * 1.1) * 0.05) * opacityAtten;
  }
  if (starBurst) {
    starBurst.visible = farView;
    const t = elapsed + pulseSeed * 0.08;
    const farBoost = Math.max(0, zoomFactor - 0.55) / 0.6;
    const pulse = 1 + Math.sin(t * 0.4) * 0.04;
    const mat = starBurst.material as THREE.Material & { opacity?: number };
    const scale = baseGlow * 1.8 * (0.5 + farBoost * 0.8) * pulse;
    starBurst.scale.set(scale, scale, 1);
    if (mat.opacity !== undefined) {
      mat.opacity = 0.08 + farBoost * 0.3;
    }
  }
};
