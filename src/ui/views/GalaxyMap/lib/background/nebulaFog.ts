import * as THREE from 'three';
import type { NebulaShape } from './nebulaSampling';
import { makeSeededRandom } from '../common/spaceMath';

export const buildNebulaFog = ({
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
  const fogSeed = makeSeededRandom(`${seed}-fog`);
  const fogMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uColorA: { value: baseColors[0].clone() },
      uColorB: { value: baseColors[2].clone() },
      uOpacity: { value: 0.04 },
      uScale: { value: shape === 'spiral' ? 2.4 : 1.9 },
      uOffset: {
        value: new THREE.Vector2(
          fogSeed() * 500.0,
          fogSeed() * 500.0,
        ),
      },
      uRotation: { value: fogSeed() * Math.PI * 2 },
    },
    vertexShader: `
      precision mediump float;
      precision mediump int;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision mediump float;
      precision mediump int;
      varying vec2 vUv;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform float uOpacity;
      uniform float uScale;
      uniform vec2 uOffset;
      uniform float uRotation;

      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }
      float fbm(vec2 p) {
        float sum = 0.0;
        float amp = 0.5;
        float freq = 1.0;
        for (int i = 0; i < 4; i++) {
          sum += amp * noise(p * freq);
          freq *= 2.2;
          amp *= 0.55;
        }
        return sum;
      }

      void main() {
        vec2 centered = vUv - 0.5;
        float r = length(centered) * 2.0;
        float mask = smoothstep(1.0, 0.4, r);
        float angle = uRotation;
        float cs = cos(angle);
        float sn = sin(angle);
        mat2 rot = mat2(cs, -sn, sn, cs);
        vec2 p = (rot * centered) * uScale + uOffset;
        float n = fbm(p);
        float d = smoothstep(0.25, 0.75, n);
        vec3 col = mix(uColorA, uColorB, d);
        float alpha = mask * d * uOpacity;
        if (alpha <= 0.001) discard;
        gl_FragColor = vec4(col, alpha);
      }
    `,
  });
  const fog = new THREE.Mesh(
    new THREE.PlaneGeometry(radius * 2.1, radius * 2.1, 1, 1),
    fogMat,
  );
  fog.name = 'nebulaFog';
  fog.userData.baseOpacity = 0.12;
  fog.position.set(0, 0, -6);
  fog.rotation.z = shape === 'spiral' ? fogSeed() * 0.6 : 0;
  fog.renderOrder = -20;
  return fog;
};
