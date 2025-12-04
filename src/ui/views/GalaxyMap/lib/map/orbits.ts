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
  BufferGeometry,
  Line,
  LineDashedMaterial,
  Float32BufferAttribute,
  MeshBasicMaterial,
} from 'three';
import type { OrbitingPlanet } from '@domain/types';

const orbitPalette = ['#72fcd5', '#f9d976', '#f58ef6', '#8ec5ff', '#c7ddff'];
const planetGeometryCache = new Map<number, SphereGeometry>();
const orbitLineGeometryCache = new Map<string, BufferGeometry>();
const orbitLineMaterial = new LineDashedMaterial({
  color: '#4c5c7a',
  dashSize: 1.4,
  gapSize: 0.9,
  transparent: true,
  opacity: 0.45,
});

const createLabelSprite = (text: string) => {
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
    depthTest: false,
    depthWrite: false,
  });

  const sprite = new Sprite(material);
  sprite.userData.baseWidth = canvas.width / 30;
  sprite.userData.baseHeight = canvas.height / 30;
  sprite.scale.set(sprite.userData.baseWidth, sprite.userData.baseHeight, 1);
  sprite.position.set(0, 8, 0);
  // Keep labels above planets and other meshes
  sprite.renderOrder = 20;
  sprite.raycast = () => null;
  sprite.name = 'label';
  return sprite;
};

const createOrbitingPlanets = (
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
  group.raycast = () => null;
  const base = baseSpeed + (seed % 7) * 0.0004;

  const colonizedAnchorId =
    colonizedPlanet && planets.length > 0
      ? planets.find((p) => p.id === colonizedPlanet.id)?.id ?? planets[0]?.id ?? null
      : null;

  planets.forEach((planet) => {
    const initialAngle = angleStore.get(planet.id) ?? Math.random() * Math.PI * 2;
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
      label.raycast = () => null;
      planetMesh.add(label);
    }

    if (isColonizedAnchor) {
      const ring = new Mesh(
        new RingGeometry(planet.size * 1.3, planet.size * 1.6, 40),
        new MeshBasicMaterial({
          color: '#6fe6a5',
          transparent: true,
          opacity: 0.08,
          depthWrite: false,
          side: DoubleSide,
        }),
      );
      ring.raycast = () => null;
      ring.rotation.set(0, 0, 0);
      ring.userData = {
        planetId: planet.id,
        systemId,
      };
      ring.raycast = () => null;
      planetMesh.add(ring);

      if (colonizedPlanet) {
        planetLookup.set(colonizedPlanet.id, planetMesh);
      }
    }

    group.add(planetMesh);

    const ringKey = `${planet.orbitRadius.toFixed(2)}`;
    const lineGeometry =
      orbitLineGeometryCache.get(ringKey) ??
      (() => {
        const segments = 96;
        const positions: number[] = [];
        let dist = 0;
        const distances: number[] = [];
        for (let i = 0; i <= segments; i += 1) {
          const t = (i / segments) * Math.PI * 2;
          const x = Math.cos(t) * planet.orbitRadius;
          const y = Math.sin(t) * planet.orbitRadius;
          positions.push(x, y, 0);
          if (i > 0) {
            const px = positions[(i - 1) * 3];
            const py = positions[(i - 1) * 3 + 1];
            const dx = x - px;
            const dy = y - py;
            dist += Math.sqrt(dx * dx + dy * dy);
          }
          distances.push(dist);
        }
        const geom = new BufferGeometry();
        geom.setAttribute('position', new Float32BufferAttribute(positions, 3));
        geom.setAttribute('lineDistance', new Float32BufferAttribute(distances, 1));
        geom.computeBoundingSphere();
        orbitLineGeometryCache.set(ringKey, geom);
        return geom;
      })();
    const orbitLine = new Line(lineGeometry, orbitLineMaterial);
    orbitLine.computeLineDistances();
    orbitLine.raycast = () => null;
    orbitLine.userData = {
      ...orbitLine.userData,
      kind: 'ring',
      systemId,
    };
    group.add(orbitLine);
  });

  return group;
};

export { createLabelSprite, createOrbitingPlanets };
