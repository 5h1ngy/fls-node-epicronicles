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
) => {
  const group = new THREE.Group();
  group.name = 'orbits';
  const speedBase = baseSpeed + (seed % 7) * 0.0004;

  planets.forEach((planet) => {
    const planetMesh = new THREE.Mesh(
      new THREE.SphereGeometry(planet.size, 16, 16),
      new THREE.MeshStandardMaterial({ color: planet.color }),
    );
    planetMesh.position.set(planet.orbitRadius, 0, 0);
    group.add(planetMesh);

    const orbitRing = new THREE.Mesh(
      new THREE.RingGeometry(planet.orbitRadius - 0.1, planet.orbitRadius + 0.1, 32),
      new THREE.MeshBasicMaterial({
        color: '#345',
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.3,
      }),
    );
    orbitRing.rotation.x = Math.PI / 2;
    group.add(orbitRing);
  });

  group.userData.speed = speedBase;
  group.visible = false;
  return group;
};

const materialCache = {
  friendly: new THREE.MeshStandardMaterial({ color: 0x74b0ff }),
  hostile: new THREE.MeshStandardMaterial({ color: 0xff6b6b }),
  ship: new THREE.MeshBasicMaterial({ color: 0xffffff }),
};

const toMapPosition = (system: StarSystem) => ({
  x: system.mapPosition?.x ?? system.position.x,
  y: system.mapPosition?.y ?? system.position.y,
  z: system.mapPosition?.z ?? 0,
});

interface GalaxyMapProps {
  onSystemFocus?: (payload: { systemId: string; screenX: number; screenY: number }) => void;
}

export const GalaxyMap = ({ onSystemFocus }: GalaxyMapProps) => {
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

    const ambient = new THREE.AmbientLight(0xffffff, 0.35);
    const keyLight = new THREE.PointLight(0xffffff, 1.2);
    keyLight.position.set(60, 60, 100);
    scene.add(ambient);
    scene.add(keyLight);

    const systemGroup = new THREE.Group();
    systemGroupRef.current = systemGroup;
    scene.add(systemGroup);

    let isDragging = false;
    let dragMode: 'rotate' | 'pan' | null = null;
    let lastPointer = { x: 0, y: 0 };
    let rotation = { x: 0, y: 0 };

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
        35,
        320,
      );
    };

    const handleMouseDown = (event: MouseEvent) => {
      if (event.button === 0) {
        dragMode = 'pan';
        isDragging = true;
        lastPointer = { x: event.clientX, y: event.clientY };
      } else if (event.button === 2) {
        dragMode = 'rotate';
        isDragging = true;
        lastPointer = { x: event.clientX, y: event.clientY };
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging || !dragMode) {
        return;
      }
      const deltaX = event.clientX - lastPointer.x;
      const deltaY = event.clientY - lastPointer.y;
      lastPointer = { x: event.clientX, y: event.clientY };
      if (dragMode === 'rotate') {
        rotation.x += deltaX * 0.004;
        rotation.y = clamp(rotation.y + deltaY * 0.004, -Math.PI / 2.5, Math.PI / 2.5);
      } else if (dragMode === 'pan') {
        const panScale = (camera.position.z / 400) * 0.8;
        offsetTargetRef.current.x += deltaX * -panScale;
        offsetTargetRef.current.y += deltaY * panScale;
      }
    };

    const handleMouseUp = (event: MouseEvent) => {
      if (
        (event.button === 0 && dragMode === 'pan') ||
        (event.button === 2 && dragMode === 'rotate')
      ) {
        isDragging = false;
        dragMode = null;
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
        return;
      }
      let targetNode: THREE.Object3D | null = hit.object;
      while (targetNode && !targetNode.userData.systemId) {
        targetNode = targetNode.parent;
      }
      if (!targetNode) {
        return;
      }

      const worldPos = new THREE.Vector3();
      targetNode.getWorldPosition(worldPos);
      offsetTargetRef.current = new THREE.Vector3(
        -worldPos.x,
        -worldPos.y,
        0,
      );
      zoomTargetRef.current = 90;
      if (onSystemFocus) {
        const projected = worldPos.clone().project(camera);
        const anchorX = ((projected.x + 1) / 2) * renderer.domElement.clientWidth;
        const anchorY = ((-projected.y + 1) / 2) * renderer.domElement.clientHeight;
        onSystemFocus({
          systemId: targetNode.userData.systemId as string,
          screenX: anchorX,
          screenY: anchorY,
        });
      }
    };

    renderer.domElement.addEventListener('click', handleClick);

    const renderLoop = () => {
      systemGroup.rotation.y = rotation.x;
      systemGroup.rotation.x = rotation.y;
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
          orbitGroup.rotation.y += orbitGroup.userData.speed;
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
    const group = systemGroupRef.current;
    if (!group) {
      return;
    }

    group.clear();
    const positions = new Map<string, THREE.Vector3>();

    const starGeometryMap = {
      surveyed: new THREE.SphereGeometry(2.1, 20, 20),
      other: new THREE.SphereGeometry(1.4, 16, 16),
    };

    systems.forEach((system) => {
      const node = new THREE.Group();
      node.name = system.id;
      node.userData.systemId = system.id;
      node.userData.systemId = system.id;
      const pos = toMapPosition(system);
      node.position.set(pos.x, pos.y, pos.z);
      positions.set(system.id, node.position);

      const geometry =
        system.visibility === 'surveyed' ? starGeometryMap.surveyed : starGeometryMap.other;

      const starMesh = new THREE.Mesh(
        geometry,
        system.hostilePower && system.hostilePower > 0
          ? materialCache.hostile
          : materialCache.friendly,
      );
      starMesh.userData.systemId = system.id;
      starMesh.castShadow = false;
      starMesh.receiveShadow = false;
      node.add(starMesh);

      const label = createLabelSprite(system.name);
      if (label) {
        node.add(label);
      }

      if (system.orbitingPlanets.length > 0) {
        const orbitGroup = createOrbitGroup(
          system.orbitingPlanets,
          system.id.charCodeAt(0),
          orbitBaseSpeed,
        );
        orbitGroup.userData.systemId = system.id;
        orbitGroup.traverse((child) => {
          child.userData = child.userData ?? {};
          child.userData.systemId = system.id;
        });
        node.add(orbitGroup);
      }

      group.add(node);
    });

    const shipGroup = new THREE.Group();
    shipGroup.name = 'ships';
    const shipGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    scienceShips.forEach((ship) => {
      const position = positions.get(ship.currentSystemId);
      if (!position) {
        return;
      }
      const shipMesh = new THREE.Mesh(shipGeometry, materialCache.ship);
      shipMesh.position.set(position.x, position.y, position.z + 4);
      shipGroup.add(shipMesh);
    });
    group.add(shipGroup);
  }, [systems, scienceShips]);

  return <div className="galaxy-map" ref={containerRef} />;
};
