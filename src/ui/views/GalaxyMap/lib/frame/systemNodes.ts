import * as THREE from 'three';
import type { MutableRefObject } from 'react';
import { updateStarVisuals } from './starVisuals';

export interface SystemNodesParams {
  systemGroup: THREE.Group;
  delta: number;
  elapsed: number;
  zoomFactor: number;
  planetAngleRef: MutableRefObject<Map<string, number>>;
  camera: THREE.PerspectiveCamera;
  deltaFactor: number;
}

export const updateSystemNodes = ({
  systemGroup,
  delta,
  elapsed,
  zoomFactor,
  planetAngleRef,
  camera,
  deltaFactor,
}: SystemNodesParams) => {
  const showOrbits = camera.position.z < 105;
  const showLabels = camera.position.z < 240 && zoomFactor < 0.9;
  const baseLabelScale = showLabels
    ? THREE.MathUtils.clamp(120 / camera.position.z, 0.45, 1.4)
    : 1;
  const starLabelScale = baseLabelScale;
  const planetLabelScale = showLabels
    ? THREE.MathUtils.clamp(baseLabelScale * 0.75, 0.35, 1.0)
    : 1;
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

    const baseRing = node.children.find(
      (child) => child.userData?.kind === 'ownerBase',
    );
    const orbitRing = node.children.find(
      (child) => child.userData?.kind === 'ownerOrbit',
    );
    if (baseRing) {
      baseRing.visible = !showOrbits;
    }
    if (orbitRing) {
      orbitRing.visible = showOrbits && orbitRing.userData?.orbitVisible;
    }

    const orbitGroup = node.getObjectByName('orbits') as THREE.Group;
    if (orbitGroup) {
      orbitGroup.visible = showOrbits;
      if (showOrbits) {
        orbitGroup.children.forEach((child) => {
          const orbitData = child.userData;
          if (
            (orbitData?.kind === 'planet' || orbitData?.kind === 'colonized') &&
            typeof orbitData.orbitRadius === 'number'
          ) {
            const orbitSpeed = orbitData.orbitSpeed ?? 0;
            const nextAngle =
              (orbitData.orbitAngle ?? 0) + orbitSpeed * deltaFactor;
            orbitData.orbitAngle = nextAngle;
            const targetX = Math.cos(nextAngle) * orbitData.orbitRadius;
            const targetY = Math.sin(nextAngle) * orbitData.orbitRadius;
            child.position.set(targetX, targetY, 0);

            if (orbitData.kind === 'planet') {
              planetAngleRef.current.set(
                orbitData.planetId as string,
                nextAngle,
              );
            }

            const planetLabel = (child as THREE.Object3D).getObjectByName(
              'planetLabel',
            ) as THREE.Sprite | null;
            if (planetLabel) {
              planetLabel.visible = showLabels;
              if (showLabels) {
                planetLabel.scale.set(
                  planetLabel.userData.baseWidth * planetLabelScale,
                  planetLabel.userData.baseHeight * planetLabelScale,
                  1,
                );
              }
            }
          }
        });
      }
    }

    node.children.forEach((child) => {
      if (
        child instanceof THREE.Mesh &&
        (child.userData?.kind === 'owner' ||
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

    updateStarVisuals(node, elapsed, zoomFactor, delta);
  });
};
