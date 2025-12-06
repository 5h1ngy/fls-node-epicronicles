import * as THREE from 'three';

export type AnchorEntry = {
  mesh?: THREE.InstancedMesh;
  object?: THREE.Object3D;
  index?: number;
  systemId: string;
  height: number;
};

export const createAnchorResolver = (
  systemPositions: Map<string, THREE.Vector3>,
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
    entry: { systemId: string; height: number },
  ): THREE.Vector3 | null => {
    const systemPos = systemPositions.get(entry.systemId);
    if (!systemPos) {
      return null;
    }
    const pos = getVector().copy(systemPos);
    pos.y += entry.height;
    return pos;
  };

  const updateAnchors = (_group: THREE.Group, entries: AnchorEntry[]) => {
    entries.forEach((entry) => {
      const pos = resolveAnchorPositionLocal(entry);
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
