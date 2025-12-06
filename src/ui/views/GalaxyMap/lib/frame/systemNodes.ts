import * as THREE from 'three';
import { updateStarVisuals } from './starVisuals';

export interface SystemNodesParams {
  systemGroup: THREE.Group;
  zoomFactor: number;
  camera: THREE.PerspectiveCamera;
}

export const updateSystemNodes = ({
  systemGroup,
  zoomFactor,
  camera,
}: SystemNodesParams) => {
  const showLabels = camera.position.y < 240 && zoomFactor < 0.9;
  const baseLabelScale = showLabels
    ? THREE.MathUtils.clamp(120 / Math.max(1, camera.position.y), 0.45, 1.4)
    : 1;
  const starLabelScale = baseLabelScale;
  const ringOpacity = 0.2 + zoomFactor * 0.5;

  systemGroup.children.forEach((node) => {
    const label = node.getObjectByName('label') as THREE.Sprite;
    if (label) {
      label.visible = showLabels;
      if (showLabels) {
        label.scale.set(
          label.userData.baseWidth * starLabelScale,
          label.userData.baseHeight * starLabelScale,
          1,
        );
      }
    }

    node.children.forEach((child) => {
      if (
        child instanceof THREE.Mesh &&
        (child.userData?.kind === 'ownerBase' ||
          child.userData?.kind === 'colonizedSystem' ||
          child.userData?.kind === 'hostile' ||
          child.userData?.kind === 'combat')
      ) {
        const mat = child.material as THREE.Material & { opacity?: number; transparent?: boolean };
        if (mat.opacity !== undefined) {
          mat.transparent = true;
          mat.opacity = ringOpacity;
        }
      }
    });

    updateStarVisuals(node);
  });
};
