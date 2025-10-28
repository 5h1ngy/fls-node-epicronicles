import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import type { OrbitingPlanet, StarSystem } from '../../domain/types';

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

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
  ctx.fillStyle = 'rgba(7, 10, 18, 0.75)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#e5ecff';
  ctx.fillText(text, 20, fontSize);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });

  const sprite = new THREE.Sprite(material);
  sprite.userData.baseWidth = canvas.width / 30;
  sprite.userData.baseHeight = canvas.height / 30;
  sprite.scale.set(sprite.userData.baseWidth, sprite.userData.baseHeight, 1);
  sprite.position.set(0, 8, 0);
  sprite.name = 'label';
  return sprite;
};

const createOrbitGroup = (
  planets: OrbitingPlanet[],
  seed: number,
  baseSpeed: number,
  systemId: string,
  angleStore: Map<string, number>,
  planetLookup: Map<string, THREE.Object3D>,
) => {
  const group = new THREE.Group();
  group.name = 'orbits';
  group.userData.systemId = systemId;
  group.visible = false;
  const base = baseSpeed + (seed % 7) * 0.0004;

  planets.forEach((planet) => {
    const initialAngle =
      angleStore.get(planet.id) ?? Math.random() * Math.PI * 2;
    angleStore.set(planet.id, initialAngle);
    const meshMaterial = new THREE.MeshStandardMaterial({ color: planet.color });
    const planetMesh = new THREE.Mesh(
      new THREE.SphereGeometry(planet.size, 16, 16),
      meshMaterial,
    );
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
    group.add(planetMesh);

    const orbitRing = new THREE.Mesh(
      new THREE.RingGeometry(
        planet.orbitRadius - 0.1,
        planet.orbitRadius + 0.1,
        32,
      ),
      new THREE.MeshBasicMaterial({
        color: '#345',
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.3,
      }),
    );
    orbitRing.userData = {
      ...orbitRing.userData,
      kind: 'ring',
      systemId,
    };
    group.add(orbitRing);
  });

  return group;
};

const materialCache = {
  friendly: new THREE.MeshStandardMaterial({ color: 0x74b0ff }),
  hostile: new THREE.MeshStandardMaterial({ color: 0xff6b6b }),
  revealed: new THREE.MeshStandardMaterial({
    color: 0x4c5e82,
    emissive: 0x05070d,
    transparent: true,
    opacity: 0.8,
  }),
  fogged: new THREE.MeshStandardMaterial({
    color: 0x1a2132,
    emissive: 0x05070d,
    transparent: true,
    opacity: 0.5,
  }),
  ship: new THREE.MeshBasicMaterial({ color: 0xffffff }),
};

const scienceMaterials: Record<
  'idle' | 'traveling' | 'surveying',
  THREE.Material
> = {
  idle: new THREE.MeshBasicMaterial({ color: 0x7fe38f }),
  traveling: new THREE.MeshBasicMaterial({ color: 0xffc857 }),
  surveying: new THREE.MeshBasicMaterial({ color: 0x4de2ff }),
};

const scienceLineMaterials: Record<
  'idle' | 'traveling' | 'surveying',
  THREE.LineBasicMaterial
> = {
  idle: new THREE.LineBasicMaterial({
    color: 0x7fe38f,
    transparent: true,
    opacity: 0.35,
  }),
  traveling: new THREE.LineBasicMaterial({
    color: 0xffc857,
    transparent: true,
    opacity: 0.45,
  }),
  surveying: new THREE.LineBasicMaterial({
    color: 0x4de2ff,
    transparent: true,
    opacity: 0.45,
  }),
};

const toMapPosition = (system: StarSystem) => ({
  x: system.mapPosition?.x ?? system.position.x,
  y: system.mapPosition?.y ?? system.position.y,
  z: system.mapPosition?.z ?? 0,
});

interface GalaxyMapProps {
  focusSystemId?: string | null;
  focusPlanetId?: string | null;
  onSystemSelect?: (
    systemId: string,
    anchor: { x: number; y: number },
  ) => void;
  onClearFocus?: () => void;
}

export const GalaxyMap = ({
  focusSystemId,
  focusPlanetId,
  onSystemSelect,
  onClearFocus,
}: GalaxyMapProps) => {
  const systems = useGameStore((state) => state.session?.galaxy.systems ?? []);
  const scienceShips = useGameStore(
    (state) => state.session?.scienceShips ?? [],
  );
  const orbitBaseSpeed = useGameStore((state) => state.config.map.orbitSpeed);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const systemGroupRef = useRef<THREE.Group | null>(null);
  const animationRef = useRef<number | null>(null);
  const offsetTargetRef = useRef(new THREE.Vector3(0, 0, 0));
  const zoomTargetRef = useRef(170);
  const planetAngleRef = useRef(new Map<string, number>());
  const planetLookupRef = useRef(new Map<string, THREE.Object3D>());
  const clockRef = useRef<THREE.Clock | null>(null);
  const minZoomRef = useRef(35);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05070d);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000,
    );
    camera.position.set(0, 0, 170);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    clockRef.current = new THREE.Clock();

    const ambient = new THREE.AmbientLight(0xffffff, 0.35);
    const keyLight = new THREE.PointLight(0xffffff, 1.2);
    keyLight.position.set(60, 60, 100);
    scene.add(ambient);
    scene.add(keyLight);

    const systemGroup = new THREE.Group();
    systemGroupRef.current = systemGroup;
    scene.add(systemGroup);

    let isPanning = false;
    let lastPointer = { x: 0, y: 0 };

    const handleResize = () => {
      renderer.setSize(container.clientWidth, container.clientHeight);
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
    };

    const handleContextMenu = (event: MouseEvent) => event.preventDefault();
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      zoomTargetRef.current = clamp(
        zoomTargetRef.current + event.deltaY * 0.1,
        minZoomRef.current,
        320,
      );
    };

    const handleMouseDown = (event: MouseEvent) => {
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
        onClearFocus?.();
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
        onClearFocus?.();
        return;
      }
      const worldPos = new THREE.Vector3();
      targetNode.getWorldPosition(worldPos);
      const currentOffset = systemGroup.position.clone();
      offsetTargetRef.current = currentOffset.sub(worldPos);
      zoomTargetRef.current = 90;
      const projected = worldPos.clone().project(camera);
      const anchorX = ((projected.x + 1) / 2) * renderer.domElement.clientWidth;
      const anchorY = ((-projected.y + 1) / 2) * renderer.domElement.clientHeight;
      onSystemSelect?.(targetNode.userData.systemId as string, {
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
      camera.position.z += (zoomTargetRef.current - camera.position.z) * 0.08;

      const showOrbits = camera.position.z < 110;
      const labelScale = THREE.MathUtils.clamp(150 / camera.position.z, 0.4, 2.5);

      systemGroup.children.forEach((node) => {
        const label = node.getObjectByName('label') as THREE.Sprite;
        if (label) {
          label.visible = camera.position.z < 260;
          label.scale.set(
            label.userData.baseWidth * labelScale,
            label.userData.baseHeight * labelScale,
            1,
          );
        }

        const orbitGroup = node.getObjectByName('orbits') as THREE.Group;
        if (orbitGroup) {
          orbitGroup.visible = showOrbits;
          orbitGroup.children.forEach((child) => {
            const orbitData = child.userData;
            if (
              orbitData?.kind === 'planet' &&
              typeof orbitData.orbitRadius === 'number'
            ) {
              const orbitSpeed = orbitData.orbitSpeed ?? 0;
              const nextAngle =
                (orbitData.orbitAngle ?? 0) + orbitSpeed * deltaFactor;
              orbitData.orbitAngle = nextAngle;
              planetAngleRef.current.set(
                orbitData.planetId as string,
                nextAngle,
              );
              child.position.set(
                Math.cos(nextAngle) * orbitData.orbitRadius,
                Math.sin(nextAngle) * orbitData.orbitRadius,
                0,
              );
            }
          });
        }
      });

      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
      renderer.dispose();
      renderer.domElement.remove();
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('click', handleClick);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  useEffect(() => {
    if (!focusSystemId || focusPlanetId) {
      if (!focusSystemId) {
        minZoomRef.current = 35;
      }
      return;
    }
    const target = systems.find((system) => system.id === focusSystemId);
    if (!target) {
      return;
    }
    if (target.visibility === 'unknown') {
      onClearFocus?.();
      return;
    }
    if (target.visibility !== 'surveyed') {
      minZoomRef.current = 140;
    } else {
      minZoomRef.current = 50;
    }
    const pos = toMapPosition(target);
    const group = systemGroupRef.current;
    if (group) {
      const local = new THREE.Vector3(pos.x, pos.y, pos.z);
      const world = local.clone();
      group.localToWorld(world);
      offsetTargetRef.current = group.position.clone().sub(world);
    } else {
      offsetTargetRef.current = new THREE.Vector3(-pos.x, -pos.y, 0);
    }
    const targetMinZoom =
      target.visibility === 'surveyed' ? 50 : 140;
    minZoomRef.current = targetMinZoom;
    zoomTargetRef.current = Math.max(targetMinZoom, 110);
  }, [focusSystemId, focusPlanetId, onClearFocus, systems]);

  useEffect(() => {
    if (!focusPlanetId) {
      return;
    }
    const planet = planetLookupRef.current.get(focusPlanetId);
    if (!planet) {
      return;
    }
    const worldPos = new THREE.Vector3();
    planet.getWorldPosition(worldPos);
    const group = systemGroupRef.current;
    if (group) {
      offsetTargetRef.current = group.position.clone().sub(worldPos);
    } else {
      offsetTargetRef.current = new THREE.Vector3(-worldPos.x, -worldPos.y, 0);
    }
    zoomTargetRef.current = 70;
    minZoomRef.current = 50;
  }, [focusPlanetId, systems]);

  useEffect(() => {
    const group = systemGroupRef.current;
    if (!group) {
      return;
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

    const positions = new Map<string, THREE.Vector3>();

    systems.forEach((system) => {
      const node = new THREE.Group();
      node.name = system.id;
      node.userData.systemId = system.id;
      node.userData.visibility = system.visibility;
      const pos = toMapPosition(system);
      node.position.set(pos.x, pos.y, 0);

      const starSizes: Record<string, number> = {
        mainSequence: 2.1,
        dwarf: 1.2,
        giant: 3.1,
      };
      const baseSize = starSizes[system.starClass] ?? 1.8;
      const sizeMultiplier = system.visibility === 'unknown' ? 0.55 : 1;
      const geometry = new THREE.SphereGeometry(
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

      const starMesh = new THREE.Mesh(
        geometry,
        starMaterial,
      );
      starMesh.userData.systemId = system.id;
      starMesh.castShadow = false;
      starMesh.receiveShadow = false;
      node.add(starMesh);

      const label = isRevealed ? createLabelSprite(system.name) : null;
      if (label) {
        node.add(label);
      }

      if (isSurveyed && system.orbitingPlanets.length > 0) {
        const orbitGroup = createOrbitGroup(
          system.orbitingPlanets,
          system.id.charCodeAt(0),
          orbitBaseSpeed,
          system.id,
          planetAngleRef.current,
          planetLookupRef.current,
        );
        node.add(orbitGroup);
      }

      group.add(node);
      positions.set(system.id, node.position.clone());
    });

    const scienceGroup = new THREE.Group();
    scienceGroup.name = 'scienceShips';
    const shipGeometry = new THREE.SphereGeometry(0.6, 12, 12);
    const targetMarkerGeometry = new THREE.SphereGeometry(0.35, 10, 10);
    const targetGroup = new THREE.Group();
    targetGroup.name = 'scienceTargets';

    scienceShips.forEach((ship) => {
      const position = positions.get(ship.currentSystemId);
      if (position) {
        const material =
          scienceMaterials[ship.status] ?? scienceMaterials.idle;
        const marker = new THREE.Mesh(shipGeometry, material);
        marker.position.set(position.x, position.y, position.z + 4);
        scienceGroup.add(marker);
      }

      if (ship.targetSystemId && ship.targetSystemId !== ship.currentSystemId) {
        const from = positions.get(ship.currentSystemId);
        const to = positions.get(ship.targetSystemId);
        if (from && to) {
          const points = [
            new THREE.Vector3(from.x, from.y, from.z + 0.5),
            new THREE.Vector3(to.x, to.y, to.z + 0.5),
          ];
          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          const lineMaterial =
            scienceLineMaterials[ship.status] ?? scienceLineMaterials.idle;
          const line = new THREE.Line(geometry, lineMaterial);
          targetGroup.add(line);

          const targetMarker = new THREE.Mesh(
            targetMarkerGeometry,
            scienceMaterials[ship.status] ?? scienceMaterials.idle,
          );
          targetMarker.position.set(to.x, to.y, to.z + 1.5);
          targetGroup.add(targetMarker);
        }
      }
    });
    group.add(targetGroup);
    group.add(scienceGroup);

  }, [systems, orbitBaseSpeed, scienceShips]);

  return <div className="galaxy-map" ref={containerRef} />;
};
