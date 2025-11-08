import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useGameStore } from '@store/gameStore';
import type { StarSystem } from '@domain/types';
import {
  scienceMaterials,
  scienceLineMaterials,
  fleetMaterials,
} from '@three/materials';
import { createScene } from '@three/scene';
import { createSystemNode } from '@three/mapUtils';

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

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
  const fleets = useGameStore((state) => state.session?.fleets ?? []);
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
  const animationRef = useRef<number | null>(null);
  const offsetTargetRef = useRef(new THREE.Vector3(0, 0, 0));
  const zoomTargetRef = useRef(170);
  const planetAngleRef = useRef(new Map<string, number>());
  const planetLookupRef = useRef(new Map<string, THREE.Object3D>());
  const clockRef = useRef<THREE.Clock | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const { scene, camera, renderer, dispose } = createScene(container);
    clockRef.current = new THREE.Clock();

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
        35,
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
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('click', handleClick);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('contextmenu', handleContextMenu);
      dispose();
    };
  }, [onClearFocus, onSystemSelect]);

  useEffect(() => {
    if (!focusSystemId || focusPlanetId) {
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
    zoomTargetRef.current = target.visibility === 'surveyed' ? 90 : 120;
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
      const node = createSystemNode(
        system,
        orbitBaseSpeed,
        planetAngleRef.current,
        planetLookupRef.current,
        recentCombatSystems,
        activeBattles,
      );
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

    const fleetGroup = new THREE.Group();
    fleetGroup.name = 'fleets';
    const fleetTargetGroup = new THREE.Group();
    fleetTargetGroup.name = 'fleetTargets';
    const fleetGeometry = new THREE.SphereGeometry(0.8, 12, 12);
    const fleetTargetGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);

    fleets.forEach((fleet) => {
      const position = positions.get(fleet.systemId);
      if (position) {
        const marker = new THREE.Mesh(
          fleetGeometry,
          empireWar ? fleetMaterials.war : fleetMaterials.idle,
        );
        marker.position.set(position.x, position.y, position.z + 3);
        fleetGroup.add(marker);
      }
      if (
        fleet.targetSystemId &&
        fleet.targetSystemId !== fleet.systemId
      ) {
        const from = positions.get(fleet.systemId);
        const to = positions.get(fleet.targetSystemId);
        if (from && to) {
          const points = [
            new THREE.Vector3(from.x, from.y, from.z + 0.2),
            new THREE.Vector3(to.x, to.y, to.z + 0.2),
          ];
          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          const line = new THREE.Line(
            geometry,
            empireWar ? fleetMaterials.warLine : fleetMaterials.line,
          );
          fleetTargetGroup.add(line);

          const targetMarker = new THREE.Mesh(
            fleetTargetGeometry,
            empireWar ? fleetMaterials.war : fleetMaterials.idle,
          );
          targetMarker.position.set(to.x, to.y, to.z + 1.5);
          fleetTargetGroup.add(targetMarker);
        }
      }
    });
    group.add(fleetTargetGroup);
    group.add(fleetGroup);

  }, [
    systems,
    orbitBaseSpeed,
    scienceShips,
    fleets,
    empireWar,
    recentCombatSystems,
    activeBattles,
  ]);

  return <div className="galaxy-map" ref={containerRef} />;
};

