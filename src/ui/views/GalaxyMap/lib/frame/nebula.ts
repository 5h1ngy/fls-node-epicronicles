import * as THREE from 'three';

export const updateNebulaOpacity = (
  nebula: THREE.Group | null,
  zoomFactor: number,
) => {
  if (!nebula) {
    return;
  }
  nebula.children.forEach((child) => {
    if (child instanceof THREE.Points) {
      const mat = child.material as THREE.ShaderMaterial | THREE.PointsMaterial;
      const base = child.userData.baseOpacity ?? 0.2;
      if ('uniforms' in mat && mat.uniforms.uGlobalOpacity) {
        const uniform = mat.uniforms.uGlobalOpacity;
        if (uniform) {
          uniform.value = base * (0.85 + zoomFactor * 1.1);
        }
      } else if ('opacity' in mat) {
        mat.opacity = base * (0.85 + zoomFactor * 1.1);
      }
    } else if (child instanceof THREE.Mesh) {
      const mat = child.material as THREE.ShaderMaterial;
      if (mat.uniforms?.uOpacity) {
        const base =
          (child.userData.baseOpacity as number | undefined) ??
          (mat.uniforms.uOpacity.value as number) ??
          0.4;
        mat.uniforms.uOpacity.value = base * (0.55 + zoomFactor * 0.7);
      }
    }
  });
};
