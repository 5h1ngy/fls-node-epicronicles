import * as THREE from 'three';

type HitResult =
  | {
      systemId: string;
      planetId?: string;
      kind?: string;
      visibility?: string;
      worldPos: THREE.Vector3;
    }
  | null;

export const resolveHitObject = (
  intersects: THREE.Intersection[],
): HitResult => {
  const hit = intersects.find((intersect) => {
    let obj: THREE.Object3D | null = intersect.object;
    while (obj && !obj.userData.systemId && !obj.userData.planetId && !obj.userData.kind) {
      obj = obj.parent;
    }
    return Boolean(obj?.userData.systemId);
  });
  if (!hit) {
    return null;
  }
  let targetNode: THREE.Object3D | null = hit.object;
  while (
    targetNode &&
    !targetNode.userData.systemId &&
    !targetNode.userData.planetId &&
    !targetNode.userData.kind
  ) {
    targetNode = targetNode.parent;
  }
  if (!targetNode) {
    return null;
  }
  const systemId = targetNode.userData.systemId as string;
  const planetId = targetNode.userData.planetId as string | undefined;
  const kind = targetNode.userData.kind as string | undefined;
  const visibility = targetNode.userData.visibility as string | undefined;
  const worldPos = new THREE.Vector3();
  targetNode.getWorldPosition(worldPos);
  return { systemId, planetId, kind, visibility, worldPos };
};

export const computeAnchor = (
  worldPos: THREE.Vector3,
  camera: THREE.Camera,
  viewport: { width: number; height: number },
) => {
  const projected = worldPos.clone().project(camera);
  const anchorX = ((projected.x + 1) / 2) * viewport.width;
  const anchorY = ((-projected.y + 1) / 2) * viewport.height;
  return { x: anchorX, y: anchorY };
};
