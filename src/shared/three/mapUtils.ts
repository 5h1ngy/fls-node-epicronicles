import {
  CanvasTexture,
  SpriteMaterial,
  Sprite,
  MeshStandardMaterial,
  SphereGeometry,
  Mesh,
  RingGeometry,
  MeshBasicMaterial,
  Group,
  DoubleSide,
  Object3D,
  PlaneGeometry,
} from 'three';
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

    const label = createLabelSprite(planet.name);
    if (label) {
      label.name = 'planetLabel';
      label.position.set(0, planet.size + 2.5, 0.2);
      planetMesh.add(label);
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

  if (colonizedPlanet) {
    const colonizedOrbitRadius =
      planets[0]?.orbitRadius ?? (baseSpeed + seed % 7) * 3 + 8;
    const colonizedAngle =
      angleStore.get(`colonized-${systemId}`) ?? Math.random() * Math.PI * 2;
    angleStore.set(`colonized-${systemId}`, colonizedAngle);
    const colonizedOrbitSpeed = base * 0.6;

    const colonyGroup = new Group();
    colonyGroup.name = 'colonizedPlanet';
    colonyGroup.userData = {
      kind: 'colonized',
      planetId: colonizedPlanet.id,
      orbitRadius: colonizedOrbitRadius,
      orbitSpeed: colonizedOrbitSpeed,
      orbitAngle: colonizedAngle,
    };

    const ring = new Mesh(
      new RingGeometry(1.25, 1.75, 40),
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
      planetId: colonizedPlanet.id,
      systemId,
    };
    colonyGroup.add(ring);

    const label = createLabelSprite(colonizedPlanet.name);
    if (label) {
      label.name = 'planetLabel';
      label.position.set(0, 2.6, 0.2);
      colonyGroup.add(label);
    }

    const x = Math.cos(colonizedAngle) * colonizedOrbitRadius;
    const y = Math.sin(colonizedAngle) * colonizedOrbitRadius;
    colonyGroup.position.set(x, y, 0);
    planetLookup.set(colonizedPlanet.id, colonyGroup);
    group.add(colonyGroup);
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

  const starSizes: Record<string, number> = {
    mainSequence: 2.1,
    dwarf: 1.2,
    giant: 3.1,
  };
  const baseSize = starSizes[system.starClass] ?? 1.8;
  const sizeMultiplier = system.visibility === 'unknown' ? 0.55 : 1;
  const geometry = new SphereGeometry(
    baseSize * sizeMultiplier,
    20,
    20,
  );

  const isRevealed = system.visibility !== 'unknown';
  const isSurveyed = system.visibility === 'surveyed';
  const starMaterial = !isRevealed
    ? materialCache.fogged
    : system.hostilePower && system.hostilePower > 0
      ? materialCache.hostile
      : isSurveyed
        ? materialCache.friendly
        : materialCache.revealed;

  const starMesh = new Mesh(geometry, starMaterial);
  starMesh.userData.systemId = system.id;
  node.add(starMesh);

  const label = isRevealed ? createLabelSprite(system.name) : null;
  if (label) {
    node.add(label);
  }

  if (system.ownerId) {
    const ownerKey = system.ownerId === 'player' ? 'player' : 'ai';
    const ring = new Mesh(
      new RingGeometry(
        starMesh.geometry.parameters.radius + 3.6,
        starMesh.geometry.parameters.radius + 5.2,
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
        starMesh.geometry.parameters.radius + 1.2,
        starMesh.geometry.parameters.radius + 2.1,
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
        starMesh.geometry.parameters.radius + 2.2,
        starMesh.geometry.parameters.radius + 3.6,
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
        (starMesh.geometry.parameters.radius + 3) * 1.6,
        (starMesh.geometry.parameters.radius + 3) * 1.6,
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
