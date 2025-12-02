import * as THREE from 'three';

export type AnchorEntry = {
  mesh?: THREE.InstancedMesh;
  object?: THREE.Object3D;
  index?: number;
  systemId: string;
  planetId: string | null;
  height: number;
};

export const createAnchorResolver = (
  systemPositions: Map<string, THREE.Vector3>,
  planetLookup: Map<string, THREE.Object3D>,
) => {
  const vectorPool: THREE.Vector3[] = [];
  const matrixPool: THREE.Matrix4[] = [];

  const getVector = () => vectorPool.pop() ?? new THREE.Vector3();
  const releaseVector = (vec: THREE.Vector3) => {
    vec.set(0, 0, 0);
    vectorPool.push(vec);
  };

  const getMatrix = () => matrixPool.pop() ?? new THREE.Matrix4();
  const releaseMatrix = (m: THREE.Matrix4) => {
    m.identity();
    matrixPool.push(m);
  };

  const resolveAnchorPositionLocal = (
    entry: { systemId: string; planetId: string | null; height: number },
    group: THREE.Group,
  ): THREE.Vector3 | null => {
    const systemPos = systemPositions.get(entry.systemId);
    if (!systemPos) {
      return null;
    }
    if (entry.planetId) {
      const planetObj = planetLookup.get(entry.planetId);
      if (planetObj) {
        const world = getVector();
        planetObj.getWorldPosition(world);
        group.worldToLocal(world);
        world.z += entry.height;
        return world;
      }
    }
    const pos = getVector().copy(systemPos);
    pos.z += entry.height;
    return pos;
  };

  const updateAnchors = (group: THREE.Group, entries: AnchorEntry[]) => {
    entries.forEach((entry) => {
      const pos = resolveAnchorPositionLocal(entry, group);
      if (!pos) {
        return;
      }
      if (entry.mesh && typeof entry.index === 'number') {
        const matrix = getMatrix().setPosition(pos.x, pos.y, pos.z);
        entry.mesh.setMatrixAt(entry.index, matrix);
        entry.mesh.instanceMatrix.needsUpdate = true;
        releaseMatrix(matrix);
      } else if (entry.object) {
        entry.object.position.set(pos.x, pos.y, pos.z);
      }
      releaseVector(pos);
    });
  };

  return {
    getVector,
    releaseVector,
    getMatrix,
    releaseMatrix,
    updateAnchors,
  };
};
