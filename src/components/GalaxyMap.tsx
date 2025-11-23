import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useGameStore } from '@store/gameStore';
import type { StarSystem } from '@domain/types';
import {
  scienceMaterials,
  scienceLineMaterials,
  fleetMaterials,
} from '@three/materials';
import { createScene } from '@three/scene';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import '../styles/components/GalaxyMap.scss';
import { createSystemNode } from '@three/mapUtils';

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const BASE_TILT = Math.PI / 2;
const MAX_TILT_DOWN = BASE_TILT + Math.PI / 6;
const TILT_LERP_FACTOR = 0.18;
const TILT_EPSILON = 0.0005;
const devicePixelRatio =
  typeof window !== 'undefined' ? window.devicePixelRatio : 1;
const createGalaxyMaskTexture = (
  systems: StarSystem[],
  radius: number,
): THREE.Texture | null => {
  if (systems.length === 0) {
    return null;
  }
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return null;
  }
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, size, size);
  ctx.globalCompositeOperation = 'lighter';
  const baseRadius = size * 0.022;
  systems.forEach((system) => {
    const pos = toMapPosition(system);
    const nx = pos.x / Math.max(1, radius * 1.05);
    const ny = pos.y / Math.max(1, radius * 1.05);
    const px = size * 0.5 + nx * size * 0.45;
    const py = size * 0.5 + ny * size * 0.45;
    const r = baseRadius * (0.6 + Math.random() * 0.9);
    const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
    grad.addColorStop(0, 'rgba(255,255,255,0.4)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.filter = 'blur(3px)';
  const blurred = ctx.getImageData(0, 0, size, size);
  ctx.putImageData(blurred, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
};
const makeSeededRandom = (seed: string) => {
  let t =
    seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) +
    0x6d2b79f5;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
};

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

const createFallbackMask = (() => {
  let cache: THREE.DataTexture | null = null;
  return () => {
    if (cache) {
      return cache;
    }
    const data = new Uint8Array([255, 255, 255, 255]);
    const tex = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
    tex.needsUpdate = true;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    cache = tex;
    return tex;
  };
})();

const createNebulaLayer = ({
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
      const colorMix = Math.min(1, Math.max(0, falloff * 0.7 + random() * 0.4));
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

const disposeNebula = (nebula: THREE.Group | null) => {
  if (!nebula) {
    return;
  }
  const maskTex = nebula.userData.maskTexture as THREE.Texture | undefined;
  const ownsMask = nebula.userData.maskOwned as boolean | undefined;
  if (maskTex && ownsMask) {
    maskTex.dispose();
  }
  nebula.children.forEach((child) => {
    if (child instanceof THREE.Points || child instanceof THREE.Mesh) {
      child.geometry.dispose();
      const mat = child.material;
      if (Array.isArray(mat)) {
        mat.forEach((entry) => entry.dispose());
      } else if (mat) {
        mat.dispose();
      }
    }
  });
  nebula.clear();
};

const toMapPosition = (system: StarSystem) => ({
  x: system.mapPosition?.x ?? system.position.x,
  y: system.mapPosition?.y ?? system.position.y,
  z: system.mapPosition?.z ?? 0,
});

interface GalaxyMapProps {
  focusSystemId?: string | null;
  focusPlanetId?: string | null;
  focusTrigger?: number;
  onSystemSelect?: (
    systemId: string,
    anchor: { x: number; y: number },
  ) => void;
  onClearFocus?: () => void;
}

export const GalaxyMap = ({
  focusSystemId,
  focusPlanetId,
  focusTrigger = 0,
  onSystemSelect,
  onClearFocus,
}: GalaxyMapProps) => {
  const onSelectRef = useRef(onSystemSelect);
  const onClearRef = useRef(onClearFocus);
  useEffect(() => {
    onSelectRef.current = onSystemSelect;
    onClearRef.current = onClearFocus;
  }, [onClearFocus, onSystemSelect]);
  const systems = useGameStore((state) => state.session?.galaxy.systems ?? []);
  const colonies = useGameStore((state) => state.session?.economy.planets ?? []);
  const scienceShips = useGameStore(
    (state) => state.session?.scienceShips ?? [],
  );
  const fleets = useGameStore((state) => state.session?.fleets ?? []);
  const galaxyShape = useGameStore(
    (state) => state.session?.galaxy.galaxyShape ?? 'circle',
  );
  const galaxySeed = useGameStore(
    (state) => state.session?.galaxy.seed ?? 'default',
  );
  const empireWar = useGameStore(
    (state) =>
      state.session?.empires.some(
        (empire) => empire.kind === 'ai' && empire.warStatus === 'war',
      ) ?? false,
  );
  const recentCombatSystems = useGameStore(
    (state) =>
      new Set(
        (state.session?.combatReports ?? [])
          .slice(-3)
          .map((report) => report.systemId),
      ),
  );
  const activeBattles = useGameStore((state) => {
    const session = state.session;
    if (!session) {
      return new Set<string>();
    }
    const hostileSet = new Set(
      session.galaxy.systems
        .filter((system) => (system.hostilePower ?? 0) > 0)
        .map((system) => system.id),
    );
    const current = session.fleets
      .filter(
        (fleet) =>
          hostileSet.has(fleet.systemId) && fleet.targetSystemId === null,
      )
      .map((fleet) => fleet.systemId);
    return new Set(current);
  });
  const orbitBaseSpeed = useGameStore((state) => state.config.map.orbitSpeed);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const systemGroupRef = useRef<THREE.Group | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationRef = useRef<number | null>(null);
  const offsetTargetRef = useRef(new THREE.Vector3(0, 0, 0));
  const zoomTargetRef = useRef(170);
  const controlsRef = useRef<OrbitControls | null>(null);
  const tiltStateRef = useRef<{ current: number; target: number }>({
    current: BASE_TILT,
    target: BASE_TILT,
  });
  const tempSphericalRef = useRef(new THREE.Spherical());
  const tempOffsetRef = useRef(new THREE.Vector3());
  const lastFocusSystemRef = useRef<string | null>(null);
  const lastFocusPlanetRef = useRef<string | null>(null);
  const lastFocusAppliedRef = useRef<{ id: string | null; trigger: number }>({
    id: null,
    trigger: -1,
  });
  const planetAngleRef = useRef(new Map<string, number>());
  const planetLookupRef = useRef(new Map<string, THREE.Object3D>());
  const clockRef = useRef<THREE.Clock | null>(null);
  const vectorPoolRef = useRef<THREE.Vector3[]>([]);
  const matrixPoolRef = useRef<THREE.Matrix4[]>([]);
  const systemsSignatureRef = useRef<string>('');
  const blackHoleRef = useRef<THREE.Group | null>(null);
  const nebulaRef = useRef<THREE.Group | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);

  const getVector = () => {
    const pool = vectorPoolRef.current;
    return pool.pop() ?? new THREE.Vector3();
  };

  const releaseVector = (vec: THREE.Vector3) => {
    vec.set(0, 0, 0);
    vectorPoolRef.current.push(vec);
  };

  const getMatrix = () => {
    const pool = matrixPoolRef.current;
    return pool.pop() ?? new THREE.Matrix4();
  };

  const releaseMatrix = (m: THREE.Matrix4) => {
    m.identity();
    matrixPoolRef.current.push(m);
  };

  const systemsSignature = useMemo(
    () =>
      `${galaxyShape}:${galaxySeed}|` +
      systems
        .map(
          (system) =>
            `${system.id}:${system.visibility}:${system.ownerId ?? ''}:${system.hostilePower ?? 0}:${system.orbitingPlanets.length}`,
        )
        .join('|'),
    [systems, galaxyShape, galaxySeed],
  );
  const maxSystemRadius = useMemo(() => {
    if (!systems.length) {
      return 400;
    }
    return systems.reduce((max, system) => {
      const pos = system.mapPosition ?? system.position;
      const r = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
      return Math.max(max, r);
    }, 0);
  }, [systems]);
  const minZoom = useMemo(
    () => Math.max(0, Math.min(10, maxSystemRadius * 0.18)),
    [maxSystemRadius],
  );
  const maxZoom = useMemo(
    () => Math.max(220, maxSystemRadius * 1.5),
    [maxSystemRadius],
  );

  const colonizedLookup = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    colonies.forEach((planet) => {
      if (planet.systemId) {
        map.set(planet.systemId, { id: planet.id, name: planet.name });
      }
    });
    return map;
  }, [colonies]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const { scene, camera, renderer, dispose } = createScene(container);
    cameraRef.current = camera;
    clockRef.current = new THREE.Clock();

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.enableRotate = false;
    controls.minDistance = minZoom;
    controls.maxDistance = maxZoom;
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.PAN,
      MIDDLE: THREE.MOUSE.ROTATE,
      RIGHT: THREE.MOUSE.PAN,
    };
    controls.minAzimuthAngle = 0;
    controls.maxAzimuthAngle = 0;
    controls.minPolarAngle = BASE_TILT;
    controls.maxPolarAngle = MAX_TILT_DOWN;
    camera.position.set(0, 0, maxZoom);
    controls.target.set(0, 0, 0);
    controls.update();
    controlsRef.current = controls;
    tiltStateRef.current = { current: BASE_TILT, target: BASE_TILT };

    const systemGroup = new THREE.Group();
    systemGroupRef.current = systemGroup;
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(container.clientWidth, container.clientHeight),
      0.3,
      0.5,
      0.2,
    );
    composer.addPass(bloomPass);
    composerRef.current = composer;
    const createBlackHole = () => {
      const group = new THREE.Group();
      group.name = 'blackHole';

      const shaderMaterials: THREE.ShaderMaterial[] = [];

      const diskTilt = 0;

      // Event horizon (dark sphere)
      const horizon = new THREE.Mesh(
        new THREE.SphereGeometry(10, 64, 64),
        new THREE.MeshBasicMaterial({
          color: 0x000000,
          depthWrite: true,
        }),
      );
    group.add(horizon);

      const diskShader = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
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
          uniform float uTime;
          void main() {
            vec2 uv = vUv - 0.5;
            float r = length(uv);
            float angle = atan(uv.y, uv.x);

            float inner = smoothstep(0.12, 0.16, r);
            float outer = 1.0 - smoothstep(0.56, 0.62, r);
            float disc = inner * outer;

            float beaming = 0.6 + 0.4 * cos(angle - uTime * 0.9);
            float swirl = sin(r * 32.0 - uTime * 2.5 + sin(angle * 6.0) * 0.4) * 0.03;
            float band = exp(-pow((r - 0.24 + swirl) * 16.0, 2.0));

            vec3 warm = vec3(1.15, 0.95, 0.8);
            vec3 cool = vec3(0.45, 0.65, 1.0);
            vec3 color = mix(cool, warm, 0.55 + 0.45 * beaming);
            color *= band * disc * 0.6;

            float alpha = clamp(disc * (0.2 + 0.2 * band), 0.0, 0.6);
            gl_FragColor = vec4(color, alpha);
          }
        `,
      });
      shaderMaterials.push(diskShader);

      const accretionMaterial = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
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
          uniform float uTime;
          void main() {
            vec2 uv = vUv - 0.5;
            float r = length(uv);
            float angle = atan(uv.y, uv.x);

            // disc mask
            float inner = smoothstep(0.14, 0.18, r);
            float outer = 1.0 - smoothstep(0.48, 0.52, r);
            float disc = inner * outer;

            // relativistic brightening
            float beaming = 0.6 + 0.4 * cos(angle - uTime * 0.8);
            float swirl = sin(r * 28.0 - uTime * 2.0) * 0.2;
            float band = exp(-pow((r - 0.28 + swirl * 0.01) * 10.0, 2.0));

            vec3 warm = vec3(1.2, 1.0, 0.85);
            vec3 cool = vec3(0.4, 0.6, 1.0);
            vec3 color = mix(cool, warm, 0.65 + 0.35 * beaming);
            color *= band * disc * 0.55;

            // subtle lensing glow
            float glow = 1.0 - smoothstep(0.5, 0.9, r);
            color += vec3(0.1, 0.15, 0.25) * glow * 0.4;

            float alpha = clamp(disc * 0.8, 0.0, 0.5) * (0.25 + 0.35 * band);
            gl_FragColor = vec4(color, alpha);
          }
        `,
      });
      shaderMaterials.push(accretionMaterial);

      const accretionDisk = new THREE.Mesh(
        new THREE.PlaneGeometry(200, 200, 1, 1),
        diskShader,
      );
      accretionDisk.name = 'accretionOuter';
      accretionDisk.rotation.set(diskTilt, 0, 0);
      group.add(accretionDisk);

      const hotDisk = new THREE.Mesh(
        new THREE.PlaneGeometry(170, 170, 1, 1),
        accretionMaterial,
      );
      hotDisk.name = 'accretionInner';
      hotDisk.rotation.set(diskTilt, 0, 0);
      hotDisk.position.set(0, 0, 0.15);
      group.add(hotDisk);

      const lensMaterial = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
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
          uniform float uTime;
          void main() {
            vec2 uv = vUv - 0.5;
            float r = length(uv);
            float ring = smoothstep(0.32, 0.34, r) * (1.0 - smoothstep(0.38, 0.42, r));
            float pulse = 0.75 + 0.25 * sin(uTime * 1.2 + r * 8.0);
            vec3 color = mix(vec3(0.85, 0.9, 1.0), vec3(1.0, 0.9, 0.8), ring) * pulse;
            gl_FragColor = vec4(color, ring * 0.6);
          }
        `,
      });
      shaderMaterials.push(lensMaterial);

    const lensRing = new THREE.Mesh(
      new THREE.PlaneGeometry(220, 220, 1, 1),
      lensMaterial,
    );
      lensRing.name = 'glow';
      lensRing.rotation.set(diskTilt, 0, 0);
      lensRing.position.set(0, 0, 0.2);
      group.add(lensRing);

      group.userData.shaderMaterials = shaderMaterials;
      return group;
    };

    const blackHole = createBlackHole();
    blackHoleRef.current = blackHole;
    systemGroup.add(blackHole);

    scene.add(systemGroup);

    let isPanning = false;
    let lastPointer = { x: 0, y: 0 };

    const handleResize = () => {
      renderer.setSize(container.clientWidth, container.clientHeight);
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      composer.setSize(container.clientWidth, container.clientHeight);
    };

    const handleContextMenu = (event: MouseEvent) => event.preventDefault();
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      controls.enableZoom = true;
    };

    const handleMouseDown = (event: MouseEvent) => {
      if (event.button === 1) {
        event.preventDefault();
        event.stopPropagation();
        const isAtMax =
          Math.abs(tiltStateRef.current.target - MAX_TILT_DOWN) < 0.01;
        tiltStateRef.current.target = isAtMax ? BASE_TILT : MAX_TILT_DOWN;
        return;
      }
      if (event.button === 2) {
        isPanning = true;
        lastPointer = { x: event.clientX, y: event.clientY };
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isPanning) {
        return;
      }
      const deltaX = event.clientX - lastPointer.x;
      const deltaY = event.clientY - lastPointer.y;
      lastPointer = { x: event.clientX, y: event.clientY };
      const panScale = (camera.position.z / 400) * 0.8;
      offsetTargetRef.current.x += deltaX * -panScale;
      offsetTargetRef.current.y += deltaY * panScale;
    };

    const handleMouseUp = (event: MouseEvent) => {
      if (event.button === 2) {
        isPanning = false;
      }
    };

    window.addEventListener('resize', handleResize);
    renderer.domElement.addEventListener('contextmenu', handleContextMenu);
    renderer.domElement.addEventListener('wheel', handleWheel, { passive: false });
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = (event: MouseEvent) => {
      if (event.button !== 0 || !systemGroup.children.length) {
        return;
      }

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(systemGroup.children, true);
      const hit = intersects.find((intersect) => {
        let obj: THREE.Object3D | null = intersect.object;
        while (obj && !obj.userData.systemId) {
          obj = obj.parent;
        }
        return Boolean(obj?.userData.systemId);
      });
      if (!hit) {
        onClearRef.current?.();
        return;
      }
      let targetNode: THREE.Object3D | null = hit.object;
      while (targetNode && !targetNode.userData.systemId) {
        targetNode = targetNode.parent;
      }
      if (!targetNode) {
        return;
      }

      if (targetNode.userData.visibility === 'unknown') {
        onClearRef.current?.();
        return;
      }
      const worldPos = new THREE.Vector3();
      targetNode.getWorldPosition(worldPos);
      const currentOffset = systemGroup.position.clone();
      offsetTargetRef.current = currentOffset.sub(worldPos);
      zoomTargetRef.current = clamp(60, minZoom, maxZoom);
      const projected = worldPos.clone().project(camera);
      const anchorX = ((projected.x + 1) / 2) * renderer.domElement.clientWidth;
      const anchorY = ((-projected.y + 1) / 2) * renderer.domElement.clientHeight;
      onSelectRef.current?.(targetNode.userData.systemId as string, {
        x: anchorX,
        y: anchorY,
      });
    };

    renderer.domElement.addEventListener('click', handleClick);

    const renderLoop = () => {
      const delta = clockRef.current?.getDelta() ?? 0;
      const deltaFactor = delta > 0 ? Math.min(4, delta * 60) : 1;
      systemGroup.rotation.y = 0;
      systemGroup.rotation.x = 0;
      systemGroup.position.lerp(offsetTargetRef.current, 0.08);
      const controls = controlsRef.current;
      if (controls) {
        controls.minDistance = minZoom;
        controls.maxDistance = maxZoom;
        controls.minPolarAngle = BASE_TILT;
        controls.maxPolarAngle = MAX_TILT_DOWN;
        const tilt = tiltStateRef.current;
        const deltaTilt = tilt.target - tilt.current;
        if (Math.abs(deltaTilt) > TILT_EPSILON) {
          tilt.current += deltaTilt * TILT_LERP_FACTOR;
        }
        const appliedTilt = clamp(tilt.current, BASE_TILT, MAX_TILT_DOWN);
        const target = controls.target;
        const tempOffset = tempOffsetRef.current;
        const tempSpherical = tempSphericalRef.current;
        tempOffset.copy(camera.position).sub(target);
        tempSpherical.setFromVector3(tempOffset);
        tempSpherical.phi = appliedTilt;
        tempOffset.setFromSpherical(tempSpherical).add(target);
        camera.position.copy(tempOffset);
        camera.lookAt(target);
        controls.update();
      }

      const nebulaGroup = nebulaRef.current;
      if (nebulaGroup) {
        const zoomFactor = THREE.MathUtils.clamp(
          (camera.position.z - minZoom) / Math.max(1, maxZoom - minZoom),
          0,
          1,
        );
        nebulaGroup.children.forEach((child) => {
          if (child instanceof THREE.Points) {
            const mat = child.material as THREE.ShaderMaterial | THREE.PointsMaterial;
            const base = child.userData.baseOpacity ?? 0.2;
            if ('uniforms' in mat && mat.uniforms.uGlobalOpacity) {
              const uniform = mat.uniforms.uGlobalOpacity;
              if (uniform) {
                uniform.value = base * (0.85 + zoomFactor * 1.1);
              }
            } else if ('opacity' in mat) {
              mat.opacity = base * (0.85 + zoomFactor * 1.1);
            }
          } else if (child instanceof THREE.Mesh) {
            const mat = child.material as THREE.ShaderMaterial;
            if (mat.uniforms?.uOpacity) {
              const base =
                (child.userData.baseOpacity as number | undefined) ??
                (mat.uniforms.uOpacity.value as number) ??
                0.4;
              mat.uniforms.uOpacity.value = base * (0.55 + zoomFactor * 0.7);
            }
          }
        });
      }

      const showOrbits = camera.position.z < 105;
      const showLabels = camera.position.z < 240;
      const labelScale = showLabels
        ? THREE.MathUtils.clamp(150 / camera.position.z, 0.4, 2.5)
        : 1;

      systemGroup.children.forEach((node) => {
        const label = node.getObjectByName('label') as THREE.Sprite;
        if (label) {
          label.visible = showLabels;
          if (showLabels) {
            label.scale.set(
              label.userData.baseWidth * labelScale,
              label.userData.baseHeight * labelScale,
              1,
            );
          }
        }

        const orbitGroup = node.getObjectByName('orbits') as THREE.Group;
        if (orbitGroup) {
          orbitGroup.visible = showOrbits;
          if (showOrbits) {
            orbitGroup.children.forEach((child) => {
              const orbitData = child.userData;
              if (
                (orbitData?.kind === 'planet' || orbitData?.kind === 'colonized') &&
                typeof orbitData.orbitRadius === 'number'
              ) {
                const orbitSpeed = orbitData.orbitSpeed ?? 0;
                const nextAngle =
                  (orbitData.orbitAngle ?? 0) + orbitSpeed * deltaFactor;
                orbitData.orbitAngle = nextAngle;
                const targetX = Math.cos(nextAngle) * orbitData.orbitRadius;
                const targetY = Math.sin(nextAngle) * orbitData.orbitRadius;
                child.position.set(targetX, targetY, 0);

                if (orbitData.kind === 'planet') {
                  planetAngleRef.current.set(
                    orbitData.planetId as string,
                    nextAngle,
                  );
                }

                const planetLabel = (child as THREE.Object3D).getObjectByName(
                  'planetLabel',
                ) as THREE.Sprite | null;
                if (planetLabel) {
                  planetLabel.visible = showLabels;
                  if (showLabels) {
                    const scale = THREE.MathUtils.clamp(
                      120 / camera.position.z,
                      0.35,
                      2,
                    );
                    planetLabel.scale.set(
                      planetLabel.userData.baseWidth * scale,
                      planetLabel.userData.baseHeight * scale,
                      1,
                    );
                  }
                }
              }
            });
          }
        }

        const starGlow = node.getObjectByName('starGlow') as THREE.Sprite | null;
        const starGlowOuter = node.getObjectByName('starGlowOuter') as THREE.Sprite | null;
        const starStreak = node.getObjectByName('starStreak') as THREE.Sprite | null;
        const starSparkle = node.getObjectByName('starSparkle') as THREE.Sprite | null;
        const pulseSeed = (node.getObjectByName('starVisual')?.userData?.pulseSeed as number) ?? 0;
        const baseGlow =
          (node.getObjectByName('starVisual')?.userData?.baseGlow as number) ?? 1;
        if (starGlow) {
          const t = (clockRef.current?.elapsedTime ?? 0) + pulseSeed * 0.1;
          const pulse = 1 + Math.sin(t * 1.3) * 0.06;
          starGlow.scale.set(baseGlow * pulse, baseGlow * pulse, 1);
          starGlow.material.opacity = 0.7 + Math.sin(t * 1.1) * 0.12;
        }
        if (starGlowOuter) {
          const t = (clockRef.current?.elapsedTime ?? 0) + pulseSeed * 0.06;
          const pulse = 1 + Math.sin(t * 0.7) * 0.04;
          starGlowOuter.scale.set(baseGlow * 1.6 * pulse, baseGlow * 1.6 * pulse, 1);
          const mat = starGlowOuter.material as THREE.Material & { opacity?: number };
          if (mat.opacity !== undefined) {
            mat.opacity = 0.22 + Math.sin(t * 0.9) * 0.05;
          }
        }
        if (starStreak) {
          const t = (clockRef.current?.elapsedTime ?? 0) + pulseSeed * 0.12;
          const pulse = 1 + Math.sin(t * 0.6) * 0.05;
          starStreak.scale.set(
            (baseGlow * 1.8) * pulse,
            (baseGlow * 0.65) * (1 + Math.sin(t * 0.8) * 0.04),
            1,
          );
          const mat = starStreak.material as THREE.Material & { opacity?: number };
          if (mat.opacity !== undefined) {
            mat.opacity = 0.2 + Math.sin(t * 1.1) * 0.05;
          }
        }
        if (starSparkle) {
          const t = (clockRef.current?.elapsedTime ?? 0) + pulseSeed * 0.14;
          const pulse = 1 + Math.sin(t * 1.5) * 0.1;
          starSparkle.scale.set(baseGlow * 0.8 * pulse, baseGlow * 0.8 * pulse, 1);
          const mat = starSparkle.material as THREE.Material & { opacity?: number };
          if (mat.opacity !== undefined) {
            mat.opacity = 0.3 + Math.sin(t * 2.1) * 0.08;
          }
        }
      });

      const outer = blackHoleRef.current?.getObjectByName('accretionOuter') as THREE.Mesh | null;
      const glow = blackHoleRef.current?.getObjectByName('glow') as THREE.Mesh | null;
      const shaderMats =
        (blackHoleRef.current?.userData.shaderMaterials as THREE.ShaderMaterial[]) ?? [];
      shaderMats.forEach((mat) => {
        if (mat.uniforms.uTime) {
          mat.uniforms.uTime.value = (clockRef.current?.elapsedTime ?? 0);
        }
      });
      if (outer) {
        outer.rotation.z += delta * 0.35;
      }
      if (glow) {
        glow.rotation.z -= delta * 0.25;
      }

      if (composerRef.current) {
        composerRef.current.render();
      } else {
        renderer.render(scene, camera);
      }
      animationRef.current = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('click', handleClick);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('contextmenu', handleContextMenu);
      controls.dispose();
      disposeNebula(nebulaRef.current);
      nebulaRef.current = null;
      if (composerRef.current) { composerRef.current.dispose(); composerRef.current = null; }
      dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!focusSystemId || focusPlanetId) {
      if (!focusSystemId) {
        lastFocusSystemRef.current = null;
        lastFocusAppliedRef.current = { id: null, trigger: -1 };
      }
      return;
    }
    const alreadyApplied =
      lastFocusAppliedRef.current.id === focusSystemId &&
      lastFocusAppliedRef.current.trigger === focusTrigger;
    if (alreadyApplied) {
      return;
    }
    const target = systems.find((system) => system.id === focusSystemId);
    if (!target) {
      return;
    }
    if (target.visibility === 'unknown') {
      onClearRef.current?.();
      return;
    }
    const pos = toMapPosition(target);
    offsetTargetRef.current.set(-pos.x, -pos.y, 0);
    const group = systemGroupRef.current;
    if (group) {
      group.position.copy(offsetTargetRef.current);
    }
    zoomTargetRef.current = clamp(60, minZoom, maxZoom);
    if (cameraRef.current) {
      cameraRef.current.position.z = zoomTargetRef.current;
    }
    lastFocusSystemRef.current = focusSystemId;
    lastFocusAppliedRef.current = { id: focusSystemId, trigger: focusTrigger };
  }, [focusSystemId, focusPlanetId, systems, onClearRef, focusTrigger, minZoom, maxZoom]);

  useEffect(() => {
    if (!focusPlanetId) {
      lastFocusPlanetRef.current = null;
      return;
    }
    if (lastFocusPlanetRef.current === focusPlanetId) {
      return;
    }
    const planet = planetLookupRef.current.get(focusPlanetId);
    if (!planet) {
      const system =
        focusSystemId !== undefined && focusSystemId !== null
          ? systems.find((entry) => entry.id === focusSystemId)
          : null;
      if (system) {
        const pos = toMapPosition(system);
        offsetTargetRef.current.set(-pos.x, -pos.y, 0);
        const group = systemGroupRef.current;
        if (group) {
          group.position.copy(offsetTargetRef.current);
        }
        zoomTargetRef.current = clamp(60, minZoom, maxZoom);
        if (cameraRef.current) {
          cameraRef.current.position.z = zoomTargetRef.current;
        }
      }
      lastFocusPlanetRef.current = focusPlanetId;
      return;
    }
    const worldPos = new THREE.Vector3();
    planet.getWorldPosition(worldPos);
    const group = systemGroupRef.current;
    if (group) {
      const desiredOffset = new THREE.Vector3(-worldPos.x, -worldPos.y, 0);
      offsetTargetRef.current.copy(desiredOffset);
      group.position.copy(desiredOffset);
    } else {
      offsetTargetRef.current.set(-worldPos.x, -worldPos.y, 0);
    }
    zoomTargetRef.current = clamp(70, minZoom, maxZoom);
    if (cameraRef.current) {
      cameraRef.current.position.z = zoomTargetRef.current;
    }
    lastFocusPlanetRef.current = focusPlanetId;
  }, [focusPlanetId, systems, focusSystemId, minZoom, maxZoom]);

  useEffect(() => {
    const group = systemGroupRef.current;
    if (!group) {
      return;
    }

    const signature = systemsSignature;
    if (systemsSignatureRef.current === signature) {
      return;
    }
    systemsSignatureRef.current = signature;

    if (nebulaRef.current) {
      disposeNebula(nebulaRef.current);
      nebulaRef.current = null;
    }

    group.children.forEach((child) => {
      const orbit = child.getObjectByName('orbits') as THREE.Group | null;
      if (!orbit) {
        return;
      }
      orbit.children.forEach((entry) => {
        const planetId = entry.userData?.planetId as string | undefined;
        if (
          planetId &&
          typeof entry.userData?.orbitAngle === 'number'
        ) {
          planetAngleRef.current.set(planetId, entry.userData.orbitAngle);
        }
      });
    });
    group.clear();
    planetLookupRef.current.clear();

    const nebulaRadius = Math.max(maxSystemRadius * 1.08, 140);
    const maskTexture = createGalaxyMaskTexture(systems, nebulaRadius);
    const nebula = createNebulaLayer({
      radius: nebulaRadius,
      shape: galaxyShape,
      seed: galaxySeed,
      mask: maskTexture,
    });
    nebulaRef.current = nebula;
    group.add(nebula);

    if (blackHoleRef.current) {
      blackHoleRef.current.position.set(0, 0, 0);
      group.add(blackHoleRef.current);
    }

    const positions = new Map<string, THREE.Vector3>();

    systems.forEach((system) => {
      const colonizedPlanet = colonizedLookup.get(system.id);
      const node = createSystemNode(
        system,
        orbitBaseSpeed,
        planetAngleRef.current,
        planetLookupRef.current,
        recentCombatSystems,
        activeBattles,
        colonizedPlanet,
      );
      group.add(node);
      positions.set(system.id, node.position.clone());
    });

    const scienceTargetGroup = new THREE.Group();
    scienceTargetGroup.name = 'scienceTargets';
    const shipGeometry = new THREE.SphereGeometry(0.6, 12, 12);
    const targetMarkerGeometry = new THREE.SphereGeometry(0.35, 10, 10);

    (['idle', 'traveling', 'surveying'] as const).forEach((status) => {
      const list = scienceShips.filter((ship) => ship.status === status);
      if (list.length === 0) {
        return;
      }
      const mesh = new THREE.InstancedMesh(
        shipGeometry,
        scienceMaterials[status] ?? scienceMaterials.idle,
        list.length,
      );
      list.forEach((ship, idx) => {
        const pos = positions.get(ship.currentSystemId);
        if (!pos) {
          return;
        }
        const matrix = getMatrix().setPosition(pos.x, pos.y, pos.z + 4);
        mesh.setMatrixAt(idx, matrix);
        releaseMatrix(matrix);
        if (ship.targetSystemId && ship.targetSystemId !== ship.currentSystemId) {
          const from = positions.get(ship.currentSystemId);
          const to = positions.get(ship.targetSystemId);
          if (from && to) {
            const a = getVector().set(from.x, from.y, from.z + 0.5);
            const b = getVector().set(to.x, to.y, to.z + 0.5);
            const points = [a, b];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const lineMaterial =
              scienceLineMaterials[status] ?? scienceLineMaterials.idle;
            const line = new THREE.Line(geometry, lineMaterial);
            scienceTargetGroup.add(line);

            const targetMarker = new THREE.Mesh(
              targetMarkerGeometry,
              scienceMaterials[status] ?? scienceMaterials.idle,
            );
            targetMarker.position.set(to.x, to.y, to.z + 1.5);
            scienceTargetGroup.add(targetMarker);
            releaseVector(a);
            releaseVector(b);
          }
        }
      });
      mesh.instanceMatrix.needsUpdate = true;
      group.add(mesh);
    });
    group.add(scienceTargetGroup);

    const fleetTargetGroup = new THREE.Group();
    fleetTargetGroup.name = 'fleetTargets';
    const fleetGeometry = new THREE.SphereGeometry(0.8, 12, 12);
    const fleetTargetGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);

    (['idle', 'war'] as const).forEach((status) => {
      const list = fleets.filter(() =>
        status === 'war' ? empireWar : !empireWar,
      );
      if (list.length === 0) {
        return;
      }
      const material = status === 'war' ? fleetMaterials.war : fleetMaterials.idle;
      const mesh = new THREE.InstancedMesh(fleetGeometry, material, list.length);
      list.forEach((fleet, idx) => {
        const pos = positions.get(fleet.systemId);
        if (pos) {
          const matrix = getMatrix().setPosition(pos.x, pos.y, pos.z + 3);
          mesh.setMatrixAt(idx, matrix);
          releaseMatrix(matrix);
        }
        if (fleet.targetSystemId && fleet.targetSystemId !== fleet.systemId) {
          const from = positions.get(fleet.systemId);
          const to = positions.get(fleet.targetSystemId);
          if (from && to) {
            const a = getVector().set(from.x, from.y, from.z + 0.2);
            const b = getVector().set(to.x, to.y, to.z + 0.2);
            const points = [a, b];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(
              geometry,
              status === 'war' ? fleetMaterials.warLine : fleetMaterials.line,
            );
            fleetTargetGroup.add(line);

            const targetMarker = new THREE.Mesh(
              fleetTargetGeometry,
              status === 'war' ? fleetMaterials.war : fleetMaterials.idle,
            );
            targetMarker.position.set(to.x, to.y, to.z + 1.5);
            fleetTargetGroup.add(targetMarker);
            releaseVector(a);
            releaseVector(b);
          }
        }
      });
      mesh.instanceMatrix.needsUpdate = true;
      group.add(mesh);
    });
    group.add(fleetTargetGroup);

  }, [
    systems,
    orbitBaseSpeed,
    scienceShips,
    fleets,
    empireWar,
    recentCombatSystems,
    activeBattles,
    systemsSignature,
    colonizedLookup,
    galaxyShape,
    galaxySeed,
    maxSystemRadius,
  ]);

  return <div className="galaxy-map" ref={containerRef} />;
};
