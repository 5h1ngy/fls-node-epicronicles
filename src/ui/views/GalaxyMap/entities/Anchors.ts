import * as THREE from 'three';

export type AnchorEntry = {
  mesh?: THREE.InstancedMesh;
  object?: THREE.Object3D;
  index?: number;
  systemId: string;
  height: number;
};

export class AnchorsResolver {
  private systemPositions: Map<string, THREE.Vector3>;
  private vectorPool: THREE.Vector3[] = [];
  private matrixPool: THREE.Matrix4[] = [];

  constructor(systemPositions: Map<string, THREE.Vector3>) {
    this.systemPositions = systemPositions;
  }

  setup(systemPositions: Map<string, THREE.Vector3>) {
    this.systemPositions = systemPositions;
  }

  getVector() {
    return this.vectorPool.pop() ?? new THREE.Vector3();
  }

  releaseVector(vec: THREE.Vector3) {
    vec.set(0, 0, 0);
    this.vectorPool.push(vec);
  }

  getMatrix() {
    return this.matrixPool.pop() ?? new THREE.Matrix4();
  }

  releaseMatrix(m: THREE.Matrix4) {
    m.identity();
    this.matrixPool.push(m);
  }

  rebuild() {
    // nothing to build for resolver
  }

  update() {
    // resolver has no per-frame logic
  }

  updateAnchors(_group: THREE.Group, entries: AnchorEntry[]) {
    entries.forEach((entry) => {
      const systemPos = this.systemPositions.get(entry.systemId);
      if (!systemPos) {
        return;
      }
      const pos = this.getVector().copy(systemPos);
      pos.y += entry.height;
      if (entry.mesh && typeof entry.index === 'number') {
        const matrix = this.getMatrix().setPosition(pos.x, pos.y, pos.z);
        entry.mesh.setMatrixAt(entry.index, matrix);
        entry.mesh.instanceMatrix.needsUpdate = true;
        this.releaseMatrix(matrix);
      } else if (entry.object) {
        entry.object.position.set(pos.x, pos.y, pos.z);
      }
      this.releaseVector(pos);
    });
  }
}
