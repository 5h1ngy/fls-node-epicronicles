import * as THREE from 'three';

interface TravelPathParams {
  group: THREE.Group;
  positions: Map<string, THREE.Vector3>;
  fromSystemId: string;
  toSystemId: string;
  lineMaterial: THREE.Material;
  targetGeometry: THREE.BufferGeometry;
  targetMaterial: THREE.Material;
  targetHeight: number;
  getVector: () => THREE.Vector3;
  releaseVector: (v: THREE.Vector3) => void;
}

export const createTravelPath = ({
  group,
  positions,
  fromSystemId,
  toSystemId,
  lineMaterial,
  targetGeometry,
  targetMaterial,
  targetHeight,
  getVector,
  releaseVector,
}: TravelPathParams) => {
  const from = positions.get(fromSystemId);
  const to = positions.get(toSystemId);
  if (!from || !to) {
    return;
  }
  const a = getVector().set(from.x, from.y, from.z + 0.2);
  const b = getVector().set(to.x, to.y, to.z + 0.2);
  const points = [a, b];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.Line(geometry, lineMaterial);
  group.add(line);

  const targetMarker = new THREE.Mesh(targetGeometry, targetMaterial);
  targetMarker.position.set(to.x, to.y, to.z + targetHeight);
  group.add(targetMarker);

  releaseVector(a);
  releaseVector(b);
};
