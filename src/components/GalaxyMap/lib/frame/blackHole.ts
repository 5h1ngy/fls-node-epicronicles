import * as THREE from 'three';
import type { MutableRefObject } from 'react';

export const updateBlackHoleFrame = (
  blackHoleRef: MutableRefObject<THREE.Group | null>,
  delta: number,
  elapsed: number,
) => {
  const blackHole = blackHoleRef.current;
  const outer = blackHole?.getObjectByName('accretionOuter') as THREE.Mesh | null;
  const glow = blackHole?.getObjectByName('glow') as THREE.Mesh | null;
  const innerDisk = blackHole?.getObjectByName('accretionInner') as THREE.Mesh | null;
  const shaderMats =
    (blackHole?.userData.shaderMaterials as THREE.ShaderMaterial[]) ?? [];

  shaderMats.forEach((mat) => {
    if (mat.uniforms.uTime) {
      mat.uniforms.uTime.value = elapsed;
    }
  });
  if (blackHole) {
    blackHole.rotation.z += delta * 0.12;
  }
  if (outer) {
    outer.rotation.z += delta * 0.35;
  }
  if (innerDisk) {
    innerDisk.rotation.z -= delta * 0.28;
  }
  if (glow) {
    glow.rotation.z -= delta * 0.25;
  }
};
