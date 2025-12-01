import * as THREE from 'three';

export const disposeNebula = (nebula: THREE.Group | null) => {
  if (!nebula) {
    return;
  }
  const maskTex = nebula.userData.maskTexture as THREE.Texture | undefined;
  const ownsMask = nebula.userData.maskOwned as boolean | undefined;
  if (maskTex && ownsMask) {
    maskTex.dispose();
  }
  nebula.children.forEach((child) => {
    if (child instanceof THREE.Points || child instanceof THREE.Mesh) {
      child.geometry.dispose();
      const mat = child.material;
      if (Array.isArray(mat)) {
        mat.forEach((entry) => entry.dispose());
      } else if (mat) {
        mat.dispose();
      }
    }
  });
  nebula.clear();
};
