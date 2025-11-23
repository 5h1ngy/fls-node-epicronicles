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
  TextureLoader,
  MeshBasicMaterial,
  CanvasTexture as ThreeCanvasTexture,
  ShaderMaterial,
  Vector3,
  Color,
} from 'three';
import type { Texture } from 'three';
import type { OrbitingPlanet, StarSystem } from '@domain/types';
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
const textureLoader = new TextureLoader();
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
  let cache: ThreeCanvasTexture | null = null;
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
    cache = new ThreeCanvasTexture(canvas);
    cache.needsUpdate = true;
    cache.minFilter = LinearFilter;
    cache.magFilter = LinearFilter;
    cache.wrapS = ClampToEdgeWrapping;
    cache.wrapT = ClampToEdgeWrapping;
    return cache;
  };
})();
const starClassVisuals: Record<
  string,
  { coreColor: string; glowColor: string; coreRadius: number; glowScale: number }
> = {
  mainSequence: {
    coreColor: '#9fc4ff',
    glowColor: '#7ac8ff',
    coreRadius: 1.4,
    glowScale: 5.2,
  },
  giant: {
    coreColor: '#ffb36b',
    glowColor: '#ff8f5f',
    coreRadius: 2.2,
    glowScale: 6.4,
  },
  dwarf: {
    coreColor: '#b0b5ff',
    glowColor: '#98b0ff',
    coreRadius: 1,
    glowScale: 4.2,
  },
};

const getStarCoreTexture = (() => {
  let cache: Texture | null = null;
  return () => {
    if (cache) {
      return cache;
    }
    const tex = textureLoader.load('/galaxy-map/star-basic-texture.jpg');
    tex.minFilter = LinearFilter;
    tex.magFilter = LinearFilter;
    tex.wrapS = ClampToEdgeWrapping;
    tex.wrapT = ClampToEdgeWrapping;
    tex.needsUpdate = true;
    cache = tex;
    return cache;
  };
})();

const createStarCoreMaterial = ({
  preset,
  visibility,
}: {
  preset: (typeof starClassVisuals)[string];
  visibility: StarSystem['visibility'];
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
        float amp = 0.6;
        float freq = 1.6;
        for (int i = 0; i < 4; i++) {
          value += amp * noise(p * freq);
          freq *= 2.0;
          amp *= 0.55;
        }
        return value;
      }

      void main() {
        vec3 tex = texture2D(uTexture, vUv).rrr;
        float plasma = fbm(vUv * 6.0 + uTime * 0.15) * 0.8 + fbm((vUv + vec2(0.3, -0.2)) * 3.2 - uTime * 0.1) * 0.6;
        float fresnel = pow(1.0 - max(dot(normalize(vNormal), normalize(vViewDir)), 0.0), uFresnelPower);
        float plasmaMask = clamp(plasma, 0.0, 1.0);
        vec3 color = (tex * 0.9 + plasmaMask * 0.4) * uTint * (0.8 + uGlow * 0.5) + fresnel * vec3(1.0, 1.0, 1.0);
        float alpha = clamp(max(max(tex.r, plasmaMask), fresnel), 0.0, 1.0);
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
  ctx.fillStyle = 'rgba(7, 10, 18, 0.75)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
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
    planetMesh.raycast = () => null;
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
      ring.rotation.x = Math.PI / 2;
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
) => {
  const preset = starClassVisuals[starClass] ?? starClassVisuals.mainSequence;
  const group = new Group();
  group.name = 'starVisual';
  group.userData = {
    ...group.userData,
    pulseSeed,
    baseGlow: preset.glowScale,
  };

  const coreMaterial = createStarCoreMaterial({ preset, visibility });

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
            opacity: 0.25,
          }),
        );
        streak.name = 'starStreak';
        streak.userData.systemId = null;
        streak.scale.set(preset.glowScale * 1.8, preset.glowScale * 0.65, 1);
        group.add(streak);
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
): Group => {
  const node = new Group();
  node.name = system.id;
  node.userData.systemId = system.id;
  node.userData.visibility = system.visibility;
  const pos = system.mapPosition ?? system.position;
  node.position.set(pos.x, pos.y, 0);

  const isRevealed = system.visibility !== 'unknown';
  const isSurveyed = system.visibility === 'surveyed';
  const baseRadius = starClassVisuals[system.starClass]?.coreRadius ?? 2.1;
  const starVisual = createStarVisual(
    system.starClass,
    system.visibility,
    system.id.charCodeAt(0),
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
