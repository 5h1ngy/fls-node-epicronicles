import * as THREE from 'three';
import { makeSeededRandom } from '../utils';
import { createFallbackMask } from './mask';

const devicePixelRatio =
  typeof window !== 'undefined' ? window.devicePixelRatio : 1;

const getNebulaTexture = (() => {
  let cache: THREE.Texture | null = null;
  return () => {
    if (cache) {
      return cache;
    }
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      cache = null;
      return null;
    }
    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      size * 0.08,
      size / 2,
      size / 2,
      size * 0.5,
    );
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.4, 'rgba(255,255,255,0.45)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    cache = texture;
    return cache;
  };
})();

export const createNebulaLayer = ({
  radius,
  shape,
  seed,
  mask,
}: {
  radius: number;
  shape: 'circle' | 'spiral';
  seed: string;
  mask: THREE.Texture | null;
}): THREE.Group => {
  const random = makeSeededRandom(`${seed}-nebula`);
  const group = new THREE.Group();
  group.name = 'nebula';
  const maskTexture = mask ?? createFallbackMask();
  group.userData.maskTexture = maskTexture;
  group.userData.maskOwned = Boolean(mask);

  const baseColors = [
    new THREE.Color('#3b6fcf'),
    new THREE.Color('#72e3ff'),
    new THREE.Color('#c39bff'),
  ];

  const samplePosition = () => {
    const rNorm = Math.pow(random(), shape === 'spiral' ? 0.92 : 1.1);
    const r = (0.35 + rNorm * 0.7) * radius;
    const armCount = 3;
    let angle = random() * Math.PI * 2;
    if (shape === 'spiral') {
      const arm = Math.floor(random() * armCount);
      const armOffset = (arm / armCount) * Math.PI * 2;
      const twist = (r / radius) * Math.PI * 3.6;
      angle = armOffset + twist + (random() - 0.5) * 0.6;
    } else {
      angle += (random() - 0.5) * 0.4;
    }
    const wobble = (random() - 0.5) * radius * 0.12 * (1 - r / radius);
    const x = Math.cos(angle) * r + wobble;
    const y = Math.sin(angle) * r + wobble;
    const z = (random() - 0.5) * Math.max(18, radius * 0.05);
    const falloff = 1 - Math.min(1, r / radius);
    return { x, y, z, falloff };
  };

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
      const { x, y, z, falloff } = samplePosition();
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
  group.add(fog);

  const starTexture = getNebulaTexture();
  if (starTexture) {
    const starfield = new THREE.Group();
    starfield.name = 'starfield';

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
        const { x, y, z, falloff } = samplePosition();
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

    starfield.add(dust);
    starfield.add(brightStars);
    group.add(starfield);
  }

  return group;
};
