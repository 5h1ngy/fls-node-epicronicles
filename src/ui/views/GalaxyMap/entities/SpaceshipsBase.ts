import * as THREE from 'three';

export interface TravelPathParams {
  group: THREE.Group;
  fromSystemId: string;
  toSystemId: string;
  lineMaterial: THREE.Material;
  targetGeometry: THREE.BufferGeometry;
  targetMaterial: THREE.Material;
  targetHeight: number;
}

export abstract class SceneEntityBase {
  protected positions: Map<string, THREE.Vector3>;
  protected getVector: () => THREE.Vector3;
  protected releaseVector: (v: THREE.Vector3) => void;

  constructor(
    positions: Map<string, THREE.Vector3> = new Map(),
    getVector: () => THREE.Vector3 = () => new THREE.Vector3(),
    releaseVector: (v: THREE.Vector3) => void = () => undefined,
  ) {
    this.positions = positions;
    this.getVector = getVector;
    this.releaseVector = releaseVector;
  }

  // Optionally override to prepare reusable state.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setup(_params?: unknown): void {}

  // Per-frame hook; default no-op.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(_params?: unknown): void {}

  protected createTravelPath({
    group,
    fromSystemId,
    toSystemId,
    lineMaterial,
    targetGeometry,
    targetMaterial,
    targetHeight,
  }: TravelPathParams) {
    const from = this.positions.get(fromSystemId);
    const to = this.positions.get(toSystemId);
    if (!from || !to) {
      return;
    }
    const a = this.getVector().set(from.x, from.y + 0.2, from.z);
    const b = this.getVector().set(to.x, to.y + 0.2, to.z);
    const points = [a, b];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, lineMaterial);
    group.add(line);

    const targetMarker = new THREE.Mesh(targetGeometry, targetMaterial);
    targetMarker.position.set(to.x, to.y + targetHeight, to.z);
    group.add(targetMarker);

    this.releaseVector(a);
    this.releaseVector(b);
  }
}

export { SceneEntityBase as SpaceshipsBase };
