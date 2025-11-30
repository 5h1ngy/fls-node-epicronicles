import {
  CanvasTexture,
  SpriteMaterial,
  Sprite,
  MeshStandardMaterial,
  SphereGeometry,
  Mesh,
  RingGeometry,
  Group,
  DoubleSide,
  Object3D,
  PlaneGeometry,
  AdditiveBlending,
  LinearFilter,
  ClampToEdgeWrapping,
  MeshBasicMaterial,
  ShaderMaterial,
  Vector3,
  Color,
  DataTexture,
  RGBFormat,
} from 'three';
import type { Texture } from 'three';
import type { OrbitingPlanet, StarClass, StarSystem } from '@domain/types';
import {
  materialCache,
  hostileIndicatorMaterial,
  combatIndicatorMaterial,
  battleIconMaterial,
  ownerMaterials,
} from './materials';

const orbitPalette = ['#72fcd5', '#f9d976', '#f58ef6', '#8ec5ff', '#c7ddff'];
const planetGeometryCache = new Map<number, SphereGeometry>();
const ringGeometryCache = new Map<string, RingGeometry>();
const starGlowTexture = (() => {
  let cache: CanvasTexture | null = null;
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
    gradient.addColorStop(0.4, 'rgba(255,255,255,0.65)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    cache = new CanvasTexture(canvas);
    cache.needsUpdate = true;
    cache.minFilter = LinearFilter;
    cache.magFilter = LinearFilter;
    cache.wrapS = ClampToEdgeWrapping;
    cache.wrapT = ClampToEdgeWrapping;
    return cache;
  };
})();
const starStreakTexture = (() => {
  let cache: CanvasTexture | null = null;
  return () => {
    if (cache) {
      return cache;
    }
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return null;
    }
    const gradient = ctx.createLinearGradient(0, size / 2, size, size / 2);
    gradient.addColorStop(0, 'rgba(255,255,255,0)');
    gradient.addColorStop(0.2, 'rgba(255,255,255,0.55)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.9)');
    gradient.addColorStop(0.8, 'rgba(255,255,255,0.55)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, size / 2 - size * 0.08, size, size * 0.16);
    cache = new CanvasTexture(canvas);
    cache.needsUpdate = true;
    cache.minFilter = LinearFilter;
    cache.magFilter = LinearFilter;
    cache.wrapS = ClampToEdgeWrapping;
    cache.wrapT = ClampToEdgeWrapping;
    return cache;
  };
})();
type StarVisual = {
  coreColor: string;
  glowColor: string;
  coreRadius: number;
  glowScale: number;
  plasmaSpeed: number;
  jetIntensity: number;
  streakOpacity: number;
};

const fallbackStarVisuals: Record<StarClass, StarVisual> = {
  O: {
    coreColor: '#b9d8ff',
    glowColor: '#7ecbff',
    coreRadius: 1.6,
    glowScale: 5.6,
    plasmaSpeed: 1.4,
    jetIntensity: 0.32,
    streakOpacity: 0.2,
  },
  B: {
    coreColor: '#9fc4ff',
    glowColor: '#7ac8ff',
    coreRadius: 1.5,
    glowScale: 5.4,
    plasmaSpeed: 1.25,
    jetIntensity: 0.28,
    streakOpacity: 0.18,
  },
  A: {
    coreColor: '#c7d6ff',
    glowColor: '#9cc5ff',
    coreRadius: 1.4,
    glowScale: 5.0,
    plasmaSpeed: 1.1,
    jetIntensity: 0.22,
    streakOpacity: 0.16,
  },
  F: {
    coreColor: '#f7f2d0',
    glowColor: '#ffd27a',
    coreRadius: 1.3,
    glowScale: 5.0,
    plasmaSpeed: 1.05,
    jetIntensity: 0.2,
    streakOpacity: 0.15,
  },
  G: {
    coreColor: '#ffd27a',
    glowColor: '#ffbe55',
    coreRadius: 1.2,
    glowScale: 4.8,
    plasmaSpeed: 1,
    jetIntensity: 0.18,
    streakOpacity: 0.14,
  },
  K: {
    coreColor: '#ffb36b',
    glowColor: '#ff9b5f',
    coreRadius: 1.1,
    glowScale: 4.6,
    plasmaSpeed: 0.95,
    jetIntensity: 0.16,
    streakOpacity: 0.12,
  },
  M: {
    coreColor: '#ff8a5c',
    glowColor: '#ff6b5f',
    coreRadius: 1,
    glowScale: 4.2,
    plasmaSpeed: 0.9,
    jetIntensity: 0.14,
    streakOpacity: 0.1,
  },
};

const getStarCoreTexture = (() => {
  let cache: Texture | null = null;
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
      // fallback flat
      const data = new Uint8Array(size * size * 3).fill(255);
      const tex = new DataTexture(data, size, size, RGBFormat);
      tex.needsUpdate = true;
      cache = tex;
      return tex;
    }
    const imgData = ctx.createImageData(size, size);
    let seed = 1337;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const dx = x - size / 2;
        const dy = y - size / 2;
        const r = Math.sqrt(dx * dx + dy * dy) / (size * 0.5);
        const falloff = Math.max(0, 1 - r);
        const noise = (rand() * 0.5 + rand() * 0.35) * falloff;
        const value = Math.min(1, 0.5 * falloff + noise);
        const idx = (y * size + x) * 4;
        const channel = Math.floor(value * 255);
        imgData.data[idx] = channel;
        imgData.data[idx + 1] = channel;
        imgData.data[idx + 2] = channel;
        imgData.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    const tex = new CanvasTexture(canvas);
    tex.needsUpdate = true;
    tex.minFilter = LinearFilter;
    tex.magFilter = LinearFilter;
    tex.wrapS = ClampToEdgeWrapping;
    tex.wrapT = ClampToEdgeWrapping;
    cache = tex;
    return tex;
  };
})();

const createStarBurstTexture = (() => {
  let cache: CanvasTexture | null = null;
  return () => {
    if (cache) {
      return cache;
    }
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return null;
    }
    ctx.translate(size / 2, size / 2);
    const radial = ctx.createRadialGradient(0, 0, size * 0.04, 0, 0, size * 0.5);
    radial.addColorStop(0, 'rgba(255,255,255,1)');
    radial.addColorStop(0.25, 'rgba(255,255,255,0.65)');
    radial.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = radial;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
    ctx.fill();

    const drawSpike = (width: number, opacity: number, angle: number) => {
      ctx.save();
      ctx.rotate(angle);
      const grad = ctx.createLinearGradient(-size / 2, 0, size / 2, 0);
      grad.addColorStop(0, `rgba(255,255,255,0)`);
      grad.addColorStop(0.5, `rgba(255,255,255,${opacity})`);
      grad.addColorStop(1, `rgba(255,255,255,0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(-size / 2, -width / 2, size, width);
      ctx.restore();
    };

    drawSpike(size * 0.08, 0.6, 0);
    drawSpike(size * 0.05, 0.4, Math.PI / 4);

    cache = new CanvasTexture(canvas);
    cache.needsUpdate = true;
    cache.minFilter = LinearFilter;
    cache.magFilter = LinearFilter;
    cache.wrapS = ClampToEdgeWrapping;
    cache.wrapT = ClampToEdgeWrapping;
    return cache;
  };
})();

const createStarCoreMaterial = ({
  preset,
  visibility,
  seed,
}: {
  preset: StarVisual;
  visibility: StarSystem['visibility'];
  seed: number;
}) => {
  if (visibility === 'unknown') {
    return materialCache.fogged;
  }
  const texture = getStarCoreTexture();
  const tint = new Color(preset.coreColor);
  const tintVec = new Vector3(tint.r, tint.g, tint.b);
  return new ShaderMaterial({
    transparent: true,
    depthWrite: true,
    blending: AdditiveBlending,
    uniforms: {
      uTexture: { value: texture },
      uTint: { value: tintVec },
      uGlow: { value: 1.2 },
      uFresnelPower: { value: 2.8 },
      uTime: { value: 0 },
      uSeed: { value: seed },
      uSpeed: { value: preset.plasmaSpeed },
      uJetIntensity: { value: preset.jetIntensity },
    },
    vertexShader: `
      precision mediump float;
      precision mediump int;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      void main() {
        vUv = uv;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewDir = normalize(cameraPosition - worldPos.xyz);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      precision mediump float;
      precision mediump int;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      uniform sampler2D uTexture;
      uniform vec3 uTint;
      uniform float uGlow;
      uniform float uFresnelPower;
      uniform float uTime;
      uniform float uSeed;
      uniform float uSpeed;
      uniform float uJetIntensity;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

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
        float value = 0.0;
        float amp = 0.7;
        float freq = 1.6;
        for (int i = 0; i < 5; i++) {
          value += amp * noise(p * freq);
          freq *= 2.05;
          amp *= 0.52;
        }
        return value;
      }

      void main() {
        vec2 uvCentered = vUv - 0.5;
        float time = uTime * uSpeed;
        vec2 warped = uvCentered + fbm(uvCentered * 5.2 + time * 0.28 + uSeed) * 0.06;
        vec3 tex = texture2D(uTexture, warped + 0.5).rrr;
        float plasma = fbm(warped * 9.0 + time * 0.26) * 0.95 + fbm((warped + vec2(0.28, -0.18)) * 5.4 - time * 0.18) * 0.8;
        float angle = atan(uvCentered.y, uvCentered.x);
        float jetBurst = sin(time * 0.65 + uSeed * 3.7) * 0.5 + 0.5;
        float jets = pow(max(0.0, sin(angle * 6.2 + uSeed * 12.0 + time * 0.92)), 3.0) * jetBurst;
        jets *= smoothstep(0.2, 0.75, length(uvCentered)) * uJetIntensity;
        plasma += jets * 0.5;
        float fresnel = pow(1.0 - max(dot(normalize(vNormal), normalize(vViewDir)), 0.0), uFresnelPower);
        float plasmaMask = clamp(plasma, 0.0, 1.0);
        vec3 color = (tex * 0.9 + plasmaMask * 0.6 + jets * 0.35) * uTint * (0.88 + uGlow * 0.6) + fresnel * vec3(1.0, 1.0, 1.0);
        float alpha = clamp(max(max(tex.r, plasmaMask), fresnel) + jets * 0.3, 0.0, 1.0);
        gl_FragColor = vec4(color, alpha);
      }
    `,
    name: 'starCoreMaterial',
  });
};

export const createLabelSprite = (text: string) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return null;
  }

  const fontSize = 48;
  ctx.font = `600 ${fontSize}px Inter`;
  const textWidth = ctx.measureText(text).width + 40;
  canvas.width = textWidth;
  canvas.height = fontSize * 1.8;

  ctx.font = `600 ${fontSize}px Inter`;
  ctx.fillStyle = '#e5ecff';
  ctx.fillText(text, 20, fontSize);

  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  const material = new SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });

  const sprite = new Sprite(material);
  sprite.userData.baseWidth = canvas.width / 30;
  sprite.userData.baseHeight = canvas.height / 30;
  sprite.scale.set(sprite.userData.baseWidth, sprite.userData.baseHeight, 1);
  sprite.position.set(0, 8, 0);
  sprite.name = 'label';
  return sprite;
};

export const createOrbitingPlanets = (
  planets: OrbitingPlanet[],
  seed: number,
  baseSpeed: number,
  systemId: string,
  angleStore: Map<string, number>,
  planetLookup: Map<string, Object3D>,
  colonizedPlanet?: { id: string; name: string } | null,
) => {
  const group = new Group();
  group.name = 'orbits';
  group.userData.systemId = systemId;
  group.visible = false;
   // Disabilita il raycast sugli elementi di orbita per velocizzare i click di selezione sistema
  group.raycast = () => null;
  const base = baseSpeed + (seed % 7) * 0.0004;

  const colonizedAnchorId =
    colonizedPlanet && planets.length > 0
      ? planets.find((p) => p.id === colonizedPlanet.id)?.id ?? planets[0]?.id ?? null
      : null;

  planets.forEach((planet) => {
    const initialAngle =
      angleStore.get(planet.id) ?? Math.random() * Math.PI * 2;
    angleStore.set(planet.id, initialAngle);
    const meshMaterial = new MeshStandardMaterial({
      color: planet.color ?? orbitPalette[seed % orbitPalette.length],
    });
    const baseGeom =
      planetGeometryCache.get(planet.size) ??
      (() => {
        const geom = new SphereGeometry(planet.size, 16, 16);
        planetGeometryCache.set(planet.size, geom);
        return geom;
      })();
    const planetMesh = new Mesh(baseGeom, meshMaterial);
    // Abilita il raycast per poter selezionare i pianeti dalla mappa
    const orbitSpeed = base * planet.orbitSpeed;
    planetMesh.userData = {
      ...planetMesh.userData,
      kind: 'planet',
      systemId,
      planetId: planet.id,
      orbitRadius: planet.orbitRadius,
      orbitSpeed,
      orbitAngle: initialAngle,
    };
    planetMesh.position.set(
      Math.cos(initialAngle) * planet.orbitRadius,
      Math.sin(initialAngle) * planet.orbitRadius,
      0,
    );
    planetLookup.set(planet.id, planetMesh);

    const isColonizedAnchor = colonizedAnchorId === planet.id;
    const displayName = isColonizedAnchor ? colonizedPlanet?.name ?? planet.name : planet.name;
    const label = createLabelSprite(displayName);
    if (label) {
      label.name = 'planetLabel';
      label.position.set(0, planet.size + 2.5, 0.2);
      planetMesh.add(label);
    }

    if (isColonizedAnchor) {
      const ring = new Mesh(
        new RingGeometry(planet.size * 1.3, planet.size * 1.6, 40),
        new MeshBasicMaterial({
          color: '#6fe6a5',
          transparent: true,
          opacity: 0.9,
          side: DoubleSide,
        }),
      );
      ring.raycast = () => null;
      ring.rotation.set(0, 0, 0);
      ring.userData = {
        planetId: planet.id,
        systemId,
      };
      planetMesh.add(ring);

      // Map colonized id to this mesh for focus
      if (colonizedPlanet) {
        planetLookup.set(colonizedPlanet.id, planetMesh);
      }
    }

    group.add(planetMesh);

    const ringKey = `${planet.orbitRadius.toFixed(2)}`;
    const ringGeometry =
      ringGeometryCache.get(ringKey) ??
      (() => {
        const geom = new RingGeometry(
          planet.orbitRadius - 0.1,
          planet.orbitRadius + 0.1,
          32,
        );
        ringGeometryCache.set(ringKey, geom);
        return geom;
      })();
    const orbitRing = new Mesh(
      ringGeometry,
      new MeshBasicMaterial({
        color: '#345',
        side: DoubleSide,
        transparent: true,
        opacity: 0.3,
      }),
    );
    orbitRing.raycast = () => null;
    orbitRing.userData = {
      ...orbitRing.userData,
      kind: 'ring',
      systemId,
    };
    group.add(orbitRing);
  });

  return group;
};

const createStarVisual = (
  starClass: StarSystem['starClass'],
  visibility: StarSystem['visibility'],
  pulseSeed: number,
  visuals: Record<StarClass, StarVisual>,
) => {
  const preset =
    visuals[starClass] ?? fallbackStarVisuals[starClass] ?? fallbackStarVisuals.G;
  const group = new Group();
  group.name = 'starVisual';
  group.userData = {
    ...group.userData,
    pulseSeed,
    baseGlow: preset.glowScale,
    timeSpeed: preset.plasmaSpeed,
  };

  const coreMaterial = createStarCoreMaterial({ preset, visibility, seed: pulseSeed });

  const core = new Mesh(
    new SphereGeometry(preset.coreRadius, 32, 32),
    coreMaterial,
  );
  core.userData.systemId = null;
  core.name = 'starCore';
  group.add(core);

  if (visibility !== 'unknown') {
    const glowTexture = starGlowTexture();
    if (glowTexture) {
      const glow = new Sprite(
        new SpriteMaterial({
          map: glowTexture,
          color: preset.glowColor,
          transparent: true,
          depthWrite: false,
          blending: AdditiveBlending,
          opacity: 0.7,
          name: 'starGlowMaterial',
        }),
      );
      glow.name = 'starGlow';
      glow.userData.systemId = null;
      glow.scale.set(preset.glowScale, preset.glowScale, 1);
      group.add(glow);

      const outerGlow = new Sprite(
        new SpriteMaterial({
          map: glowTexture,
          color: preset.glowColor,
          transparent: true,
          depthWrite: false,
          blending: AdditiveBlending,
          opacity: 0.28,
          name: 'starGlowOuterMaterial',
        }),
      );
      outerGlow.name = 'starGlowOuter';
      outerGlow.userData.systemId = null;
      const outerScale = preset.glowScale * 1.6;
      outerGlow.scale.set(outerScale, outerScale, 1);
      group.add(outerGlow);

      const streakTex = starStreakTexture();
      if (streakTex) {
        const streak = new Sprite(
          new SpriteMaterial({
            map: streakTex,
            color: preset.glowColor,
            transparent: true,
            depthWrite: false,
            blending: AdditiveBlending,
            opacity: preset.streakOpacity,
          }),
        );
        streak.name = 'starStreak';
        streak.userData.systemId = null;
        streak.scale.set(preset.glowScale * 1.8, preset.glowScale * 0.65, 1);
        group.add(streak);

        const streakCross = new Sprite(
          new SpriteMaterial({
            map: streakTex,
            color: preset.glowColor,
            transparent: true,
            depthWrite: false,
            blending: AdditiveBlending,
            opacity: preset.streakOpacity * 0.75,
          }),
        );
        streakCross.name = 'starStreakCross';
        streakCross.userData.systemId = null;
        streakCross.scale.set(preset.glowScale * 1.6, preset.glowScale * 0.55, 1);
        streakCross.material.rotation = Math.PI / 2;
          group.add(streakCross);
      }

      const sparkle = new Sprite(
        new SpriteMaterial({
          map: glowTexture,
          color: '#ffffff',
          transparent: true,
          depthWrite: false,
          blending: AdditiveBlending,
          opacity: 0.4,
        }),
      );
      sparkle.name = 'starSparkle';
      sparkle.userData.systemId = null;
      sparkle.scale.set(preset.glowScale * 0.8, preset.glowScale * 0.8, 1);
      group.add(sparkle);

      const corona = new Sprite(
        new SpriteMaterial({
          map: glowTexture,
          color: preset.glowColor,
          transparent: true,
          depthWrite: false,
          blending: AdditiveBlending,
          opacity: 0.18,
        }),
      );
      corona.name = 'starCorona';
      corona.userData.systemId = null;
      corona.scale.set(preset.glowScale * 1.2, preset.glowScale * 1.2, 1);
      group.add(corona);

      const burstTex = createStarBurstTexture();
      if (burstTex) {
        const burst = new Sprite(
          new SpriteMaterial({
            map: burstTex,
            color: preset.glowColor,
            transparent: true,
            depthWrite: false,
            blending: AdditiveBlending,
            opacity: 0.12,
          }),
        );
        burst.name = 'starBurst';
        burst.userData.systemId = null;
        burst.scale.set(preset.glowScale * 2, preset.glowScale * 2, 1);
        group.add(burst);
      }
    }
  }

  return group;
};

export const createSystemNode = (
  system: StarSystem,
  orbitBaseSpeed: number,
  angleStore: Map<string, number>,
  planetLookup: Map<string, Object3D>,
  recentCombatSystems: Set<string>,
  activeBattles: Set<string>,
  colonizedPlanet?: { id: string; name: string } | null,
  starVisuals?: Record<StarClass, StarVisual>,
): Group => {
  const node = new Group();
  node.name = system.id;
  node.userData.systemId = system.id;
  node.userData.visibility = system.visibility;
  const pos = system.mapPosition ?? system.position;
  node.position.set(pos.x, pos.y, 0);

  const isRevealed = system.visibility !== 'unknown';
  const isSurveyed = system.visibility === 'surveyed';
  const baseRadius =
    (starVisuals ?? fallbackStarVisuals)[system.starClass]?.coreRadius ?? 2.1;
  const starVisual = createStarVisual(
    system.starClass,
    system.visibility,
    system.id.charCodeAt(0),
    starVisuals ?? fallbackStarVisuals,
  );
  starVisual.userData.systemId = system.id;
  node.add(starVisual);

  const label = isRevealed ? createLabelSprite(system.name) : null;
  if (label) {
    label.position.y = baseRadius + 6;
    node.add(label);
  }

  if (system.ownerId) {
    const ownerKey = system.ownerId === 'player' ? 'player' : 'ai';
    const ring = new Mesh(
      new RingGeometry(
        baseRadius + 3.6,
        baseRadius + 5.2,
        32,
      ),
      ownerMaterials[ownerKey] ?? ownerMaterials.player,
    );
    ring.material.side = DoubleSide;
    ring.userData.systemId = system.id;
    ring.userData.kind = 'owner';
    node.add(ring);
  }

  if (system.hostilePower && system.hostilePower > 0) {
    const ring = new Mesh(
      new RingGeometry(
        baseRadius + 1.2,
        baseRadius + 2.1,
        24,
      ),
      hostileIndicatorMaterial,
    );
    ring.material.side = DoubleSide;
    ring.userData.systemId = system.id;
    ring.userData.kind = 'hostile';
    node.add(ring);
  }

  if (recentCombatSystems.has(system.id)) {
    const ring = new Mesh(
      new RingGeometry(
        baseRadius + 2.2,
        baseRadius + 3.6,
        24,
      ),
      combatIndicatorMaterial,
    );
    ring.material.side = DoubleSide;
    ring.userData.systemId = system.id;
    ring.userData.kind = 'combat';
    node.add(ring);
  }

  if (activeBattles.has(system.id)) {
    const cross = new Mesh(
      new PlaneGeometry(
        (baseRadius + 3) * 1.6,
        (baseRadius + 3) * 1.6,
      ),
      battleIconMaterial,
    );
    cross.position.z = 0.5;
    cross.material.side = DoubleSide;
    cross.userData.systemId = system.id;
    battleIconMaterial.depthWrite = false;
    cross.scale.set(1, 0.2, 1);
    node.add(cross);
  }

  if (system.hasShipyard) {
    const square = new Mesh(
      new PlaneGeometry(baseRadius * 1.6, baseRadius * 1.6),
      new MeshBasicMaterial({
        color: '#7fc1ff',
        opacity: 0.35,
        transparent: true,
        depthWrite: false,
      }),
    );
    square.userData.systemId = system.id;
    square.userData.kind = 'shipyard';
    square.rotation.z = Math.PI / 4;
    const anchorPlanet =
      system.shipyardAnchorPlanetId && planetLookup
        ? planetLookup.get(system.shipyardAnchorPlanetId)
        : null;
    if (anchorPlanet) {
      const planetMesh = anchorPlanet as Mesh;
      if (planetMesh.geometry && !planetMesh.geometry.boundingSphere) {
        planetMesh.geometry.computeBoundingSphere();
      }
      const radius = planetMesh.geometry?.boundingSphere?.radius ?? 2.5;
      square.position.set(0, radius + 1.5, 0.6);
      anchorPlanet.add(square);
    } else {
      square.position.set(0, baseRadius + 2.5, 1);
      node.add(square);
    }
  }

  if (isSurveyed && system.orbitingPlanets.length > 0) {
    const orbitGroup = createOrbitingPlanets(
      system.orbitingPlanets,
      system.id.charCodeAt(0),
      orbitBaseSpeed,
      system.id,
      angleStore,
      planetLookup,
      colonizedPlanet ?? null,
    );
    node.add(orbitGroup);
  }

  return node;
};
