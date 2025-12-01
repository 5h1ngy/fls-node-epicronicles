import {
  Group,
  Mesh,
  RingGeometry,
  MeshBasicMaterial,
  DoubleSide,
  PlaneGeometry,
} from 'three';
import type { Object3D } from 'three';
import type { StarSystem, StarClass } from '@domain/types';
import {
  hostileIndicatorMaterial,
  combatIndicatorMaterial,
  battleIconMaterial,
  ownerMaterials,
} from '@three/materials';
import { createOrbitingPlanets, createLabelSprite } from './orbits';
import { createStarVisual } from './starVisual';
import { fallbackStarVisuals, type StarVisual } from './starCoreMaterial';

const addOwnerRings = ({
  node,
  systemId,
  baseRadius,
  maxOrbitRadius,
  orbitVisible,
  ownerKey,
}: { node: Group; systemId: string; baseRadius: number; maxOrbitRadius: number; orbitVisible: boolean; ownerKey: keyof typeof ownerMaterials }) => {
  const baseInner = baseRadius + 3.6;
  const baseOuter = baseInner + 2.5;
  const orbitInner = orbitVisible ? maxOrbitRadius + 1 : baseInner;
  const orbitOuter = orbitVisible ? maxOrbitRadius + 1.6 : baseOuter;

  const baseRing = new Mesh(new RingGeometry(baseInner, baseOuter, 32), ownerMaterials[ownerKey] ?? ownerMaterials.player);
  baseRing.material.side = DoubleSide;
  baseRing.userData.systemId = systemId;
  baseRing.userData.kind = 'ownerBase';
  baseRing.raycast = () => null;
  node.add(baseRing);
  const orbitRing = new Mesh(new RingGeometry(orbitInner, orbitOuter, 32), ownerMaterials[ownerKey] ?? ownerMaterials.player);
  orbitRing.material.side = DoubleSide;
  orbitRing.userData.systemId = systemId;
  orbitRing.userData.kind = 'ownerOrbit';
  orbitRing.userData.orbitVisible = orbitVisible;
  orbitRing.visible = false;
  orbitRing.raycast = () => null;
  node.add(orbitRing);
};
const addHostileIndicator = (node: Group, system: StarSystem, baseRadius: number) => {
  if (!system.hostilePower || system.hostilePower <= 0) return;
  const ring = new Mesh(new RingGeometry(baseRadius + 1.2, baseRadius + 2.1, 24), hostileIndicatorMaterial);
  ring.material.side = DoubleSide;
  ring.userData.systemId = system.id;
  ring.userData.kind = 'hostile';
  ring.raycast = () => null;
  node.add(ring);
};
const addCombatIndicator = (
  node: Group,
  systemId: string,
  baseRadius: number,
  recentCombatSystems: Set<string>,
) => {
  if (!recentCombatSystems.has(systemId)) return;
  const ring = new Mesh(new RingGeometry(baseRadius + 2.2, baseRadius + 3.6, 24), combatIndicatorMaterial);
  ring.material.side = DoubleSide;
  ring.userData.systemId = systemId;
  ring.userData.kind = 'combat';
  ring.raycast = () => null;
  node.add(ring);
};
const addBattleIndicator = (
  node: Group,
  systemId: string,
  baseRadius: number,
  activeBattles: Set<string>,
) => {
  if (!activeBattles.has(systemId)) return;
  const cross = new Mesh(new PlaneGeometry((baseRadius + 3) * 1.6, (baseRadius + 3) * 1.6), battleIconMaterial);
  cross.position.z = 0.5;
  cross.material.side = DoubleSide;
  cross.userData.systemId = systemId;
  battleIconMaterial.depthWrite = false;
  cross.scale.set(1, 0.2, 1);
  cross.raycast = () => null;
  node.add(cross);
};
const addShipyardMarker = ({
  node,
  system,
  baseRadius,
  planetLookup,
}: { node: Group; system: StarSystem; baseRadius: number; planetLookup: Map<string, Object3D> }) => {
  if (!system.hasShipyard) return;
  const square = new Mesh(new PlaneGeometry(baseRadius * 1.6, baseRadius * 1.6), new MeshBasicMaterial({
    color: '#7fc1ff',
    opacity: 0.35,
    transparent: true,
    depthWrite: false,
  }));
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
    return;
  }
  square.position.set(0, baseRadius + 2.5, 1);
  node.add(square);
};
const createSystemNode = (
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
  const visuals = (starVisuals ?? fallbackStarVisuals) as Record<StarClass, StarVisual>;
  const baseRadius = visuals[system.starClass]?.coreRadius ?? 2.1;

  const starVisual = createStarVisual(
    system.starClass,
    system.visibility,
    system.id.charCodeAt(0),
    visuals,
  );
  starVisual.userData.systemId = system.id;
  node.add(starVisual);

  const label = isRevealed ? createLabelSprite(system.name) : null;
  if (label) {
    label.position.y = baseRadius + 6;
    node.add(label);
  }

  const maxOrbitRadius = isSurveyed
    ? system.orbitingPlanets.reduce(
        (max, p) => Math.max(max, p.orbitRadius + (p.size ?? 0)),
        0,
      )
    : 0;
  const orbitVisible = isSurveyed && maxOrbitRadius > 0;

  if (system.ownerId) {
    const ownerKey = system.ownerId === 'player' ? 'player' : 'ai';
    addOwnerRings({
      node,
      systemId: system.id,
      baseRadius,
      maxOrbitRadius,
      orbitVisible,
      ownerKey,
    });
  }

  addHostileIndicator(node, system, baseRadius);
  addCombatIndicator(node, system.id, baseRadius, recentCombatSystems);
  addBattleIndicator(node, system.id, baseRadius, activeBattles);
  addShipyardMarker({ node, system, baseRadius, planetLookup });

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

export { createSystemNode };
