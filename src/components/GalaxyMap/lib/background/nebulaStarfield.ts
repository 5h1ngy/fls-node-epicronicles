import * as THREE from 'three';
import { createPositionSampler, type NebulaShape } from './nebulaSampling';
import { getNebulaTexture } from './nebulaTextures';

export const buildNebulaStarfield = ({
  radius,
  shape,
  seed,
  baseColors,
}: {
  radius: number;
  shape: NebulaShape;
  seed: string;
  baseColors: THREE.Color[];
}) => {
  const starTexture = getNebulaTexture();
  if (!starTexture) {
    return null;
  }
  const group = new THREE.Group();
  group.name = 'starfield';
  const samplePosition = createPositionSampler(`${seed}-stars`, radius, shape);

  const makePoints = ({
    count,
    size,
    opacity,
    colorBias,
  }: {
    count: number;
    size: number;
    opacity: number;
    colorBias: number;
  }) => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const { x, y, z, falloff, random } = samplePosition();
      const stride = i * 3;
      positions[stride] = x * 1.05 + (random() - 0.5) * radius * 0.05;
      positions[stride + 1] = y * 1.05 + (random() - 0.5) * radius * 0.05;
      positions[stride + 2] = z * 0.35;
      const tint = baseColors[1]
        .clone()
        .lerp(baseColors[2], falloff * colorBias);
      colors[stride] = tint.r;
      colors[stride + 1] = tint.g;
      colors[stride + 2] = tint.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size,
      map: starTexture,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      opacity,
      sizeAttenuation: true,
    });
    const points = new THREE.Points(geo, mat);
    points.renderOrder = -15;
    return points;
  };

  const starCount = Math.min(4500, Math.max(900, Math.floor(radius * 1.8)));
  const dustCount = Math.min(2200, Math.max(600, Math.floor(radius)));

  const brightStars = makePoints({
    count: starCount,
    size: Math.max(1.6, radius * 0.007),
    opacity: 1,
    colorBias: 0.8,
  });
  const dust = makePoints({
    count: dustCount,
    size: Math.max(2.6, radius * 0.012),
    opacity: 0.35,
    colorBias: 0.45,
  });

  group.add(dust);
  group.add(brightStars);
  return group;
};
