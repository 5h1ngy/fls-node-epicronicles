import {
  Group,
  Mesh,
  RingGeometry,
  MeshBasicMaterial,
  DoubleSide,
  PlaneGeometry,
  CanvasTexture,
  SpriteMaterial,
  Sprite,
} from 'three';
import type { StarSystem, StarClass } from '@domain/types';
import {
  hostileIndicatorMaterial,
  combatIndicatorMaterial,
  battleIconMaterial,
  ownerMaterials,
} from '@three/materials';
import { createStarVisual, fallbackStarVisuals, type StarVisual } from './starVisual';

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
  sprite.renderOrder = 20;
  sprite.raycast = () => null;
  sprite.name = 'label';
  return sprite;
};

const addOwnerRings = ({
  node,
  systemId,
  baseRadius,
  ownerKey,
  hasColonized,
}: {
  node: Group;
  systemId: string;
  baseRadius: number;
  ownerKey: keyof typeof ownerMaterials;
  hasColonized: boolean;
}) => {
  const baseInner = baseRadius + 3.6;
  const baseOuter = baseInner + 2.5;

  const baseRing = new Mesh(new RingGeometry(baseInner, baseOuter, 32), ownerMaterials[ownerKey] ?? ownerMaterials.player);
  baseRing.material.side = DoubleSide;
  baseRing.userData.systemId = systemId;
  baseRing.userData.kind = 'ownerBase';
  baseRing.raycast = () => null;
  baseRing.rotation.x = -Math.PI / 2;
  node.add(baseRing);

  if (hasColonized && ownerKey === 'player') {
    const colonizedInner = baseRadius + 2.1;
    const colonizedOuter = colonizedInner + 1.2;
    const colonizedRing = new Mesh(
      new RingGeometry(colonizedInner, colonizedOuter, 32),
      new MeshBasicMaterial({
        color: '#6fe6a5',
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
      }),
    );
    colonizedRing.material.side = DoubleSide;
    colonizedRing.userData.systemId = systemId;
    colonizedRing.userData.kind = 'colonizedSystem';
    colonizedRing.raycast = () => null;
    colonizedRing.rotation.x = -Math.PI / 2;
    node.add(colonizedRing);
  }
};

const addHostileIndicator = (node: Group, system: StarSystem, baseRadius: number) => {
  if (!system.hostilePower || system.hostilePower <= 0) return;
  const ring = new Mesh(new RingGeometry(baseRadius + 1.2, baseRadius + 2.1, 24), hostileIndicatorMaterial);
  ring.material.side = DoubleSide;
  ring.userData.systemId = system.id;
  ring.userData.kind = 'hostile';
  ring.raycast = () => null;
  ring.rotation.x = -Math.PI / 2;
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
  ring.rotation.x = -Math.PI / 2;
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
  cross.position.y = 0.5;
  cross.material.side = DoubleSide;
  cross.userData.systemId = systemId;
  battleIconMaterial.depthWrite = false;
  cross.scale.set(1, 0.2, 1);
  cross.raycast = () => null;
  cross.rotation.x = -Math.PI / 2;
  node.add(cross);
};

const addShipyardMarker = ({
  node,
  system,
  baseRadius,
}: { node: Group; system: StarSystem; baseRadius: number }) => {
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
  square.rotation.x = -Math.PI / 2;
  square.position.set(0, baseRadius + 2.5, 0);
  node.add(square);
};

const createSystemNode = (
  system: StarSystem,
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
  const depth = pos.y ?? 0;
  node.position.set(pos.x, 0, depth);

  const isRevealed = system.visibility !== 'unknown';
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

  const hasColonized = Boolean(colonizedPlanet);

  if (system.ownerId) {
    const ownerKey = system.ownerId === 'player' ? 'player' : 'ai';
    addOwnerRings({
      node,
      systemId: system.id,
      baseRadius,
      ownerKey,
      hasColonized,
    });
  }

  addHostileIndicator(node, system, baseRadius);
  addCombatIndicator(node, system.id, baseRadius, recentCombatSystems);
  addBattleIndicator(node, system.id, baseRadius, activeBattles);
  addShipyardMarker({ node, system, baseRadius });

  return node;
};

export { createSystemNode };

