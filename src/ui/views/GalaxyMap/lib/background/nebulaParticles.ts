import * as THREE from 'three';
import { createPositionSampler, type NebulaShape } from './nebulaSampling';
import { getDevicePixelRatio } from './nebulaTextures';

export const buildNebulaParticles = ({
  radius,
  shape,
  seed,
  maskTexture,
  baseColors,
}: {
  radius: number;
  shape: NebulaShape;
  seed: string;
  maskTexture: THREE.Texture;
  baseColors: THREE.Color[];
}) => {
  const group = new THREE.Group();
  const samplePosition = createPositionSampler(`${seed}-particles`, radius, shape);
  const devicePixelRatio = getDevicePixelRatio();

  const buildLayer = (
    count: number,
    sizeBase: number,
    opacity: number,
    colorA: THREE.Color,
    colorB: THREE.Color,
  ) => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const alphas = new Float32Array(count);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      const { x, y, z, falloff, random } = samplePosition();
      const stride = i * 3;
      positions[stride] = x + (random() - 0.5) * radius * 0.08;
      positions[stride + 1] = y + (random() - 0.5) * radius * 0.08;
      positions[stride + 2] = z;
      const colorMix = Math.min(
        1,
        Math.max(0, falloff * 0.7 + random() * 0.4),
      );
      const color = colorA.clone().lerp(colorB, colorMix);
      colors[stride] = color.r;
      colors[stride + 1] = color.g;
      colors[stride + 2] = color.b;
      alphas[i] = Math.min(
        1,
        opacity * 1.6 * (0.6 + random() * 0.8) * (0.45 + falloff),
      );
      sizes[i] = sizeBase * (0.5 + random() * 0.9);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('aAlpha', new THREE.Float32BufferAttribute(alphas, 1));
    geometry.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1));
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uGlobalOpacity: { value: 1 },
        uPixelRatio: { value: devicePixelRatio },
        uMask: { value: maskTexture },
        uMaskScale: { value: 1 / Math.max(1, radius * 1.6) },
      },
      vertexShader: `
        precision mediump float;
        precision mediump int;
        attribute float aAlpha;
        attribute float aSize;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vAlpha;
        varying vec2 vMaskUv;
        uniform float uMaskScale;
        void main() {
          vColor = color;
          vAlpha = aAlpha;
          vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
          vMaskUv = worldPos.xy * uMaskScale + 0.5;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float dist = -mvPosition.z;
          float sizeAtten = aSize * uPixelRatio * clamp(300.0 / max(1.0, dist), 0.5, 4.0);
          gl_PointSize = sizeAtten;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        precision mediump float;
        precision mediump int;
        varying vec3 vColor;
        varying float vAlpha;
        varying vec2 vMaskUv;
        uniform float uGlobalOpacity;
        uniform sampler2D uMask;
        void main() {
          vec2 uv = gl_PointCoord - 0.5;
          float d = length(uv) * 2.0;
          float falloff = smoothstep(1.0, 0.2, d);
          vec2 mUv = clamp(vMaskUv, 0.0, 1.0);
          float mask = clamp(texture2D(uMask, mUv).r, 0.0, 1.0);
          float maskAlpha = mix(0.65, 1.0, mask);
          float alpha = vAlpha * falloff * uGlobalOpacity * maskAlpha;
          if (alpha <= 0.001) discard;
          gl_FragColor = vec4(vColor * falloff, alpha);
        }
      `,
    });
    const mesh = new THREE.Points(geometry, material);
    mesh.userData.baseOpacity = opacity;
    mesh.renderOrder = -10;
    group.add(mesh);
  };

  const primaryCount = Math.min(
    18000,
    Math.max(6000, Math.floor(radius * 32)),
  );
  const midCount = Math.min(14000, Math.max(4000, Math.floor(radius * 22)));
  const glowCount = Math.min(9000, Math.max(2200, Math.floor(radius * 12)));
  buildLayer(
    primaryCount,
    Math.max(1.6, radius * 0.008),
    0.48,
    baseColors[0],
    baseColors[1],
  );
  buildLayer(
    midCount,
    Math.max(3.4, radius * 0.014),
    0.38,
    baseColors[0],
    baseColors[1],
  );
  buildLayer(
    glowCount,
    Math.max(7.5, radius * 0.03),
    0.28,
    baseColors[1],
    baseColors[2],
  );

  return group;
};
