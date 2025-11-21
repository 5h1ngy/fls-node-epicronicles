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
import '../styles/components/GalaxyMap.scss';
import { createSystemNode } from '@three/mapUtils';
import type { Group } from 'three';

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
  const blackHoleRef = useRef<Group | null>(null);

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
      systems
        .map(
          (system) =>
            `${system.id}:${system.visibility}:${system.ownerId ?? ''}:${system.hostilePower ?? 0}:${system.orbitingPlanets.length}`,
        )
        .join('|'),
    [systems],
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

    const systemGroup = new THREE.Group();
    systemGroupRef.current = systemGroup;
    const createBlackHole = () => {
      const group = new THREE.Group();
      group.name = 'blackHole';

      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const gradient = ctx.createRadialGradient(128, 128, 8, 128, 128, 128);
        gradient.addColorStop(0, 'rgba(0,0,0,1)');
        gradient.addColorStop(0.35, 'rgba(20, 24, 38, 0.95)');
        gradient.addColorStop(0.65, 'rgba(60, 85, 140, 0.45)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 256, 256);
      }
      const coreTexture = new THREE.CanvasTexture(canvas);
      const coreMaterial = new THREE.SpriteMaterial({
        map: coreTexture,
        transparent: true,
        depthWrite: false,
        opacity: 1,
      });
      const core = new THREE.Sprite(coreMaterial);
      core.scale.set(58, 58, 1);
      group.add(core);

      const accretion = new THREE.Mesh(
        new THREE.RingGeometry(22, 32, 80),
        new THREE.MeshBasicMaterial({
          color: 0x7aa8ff,
          transparent: true,
          opacity: 0.45,
          side: THREE.DoubleSide,
        }),
      );
      accretion.rotation.set(0, 0, 0);
      accretion.position.set(0, 0, -0.4);
      group.add(accretion);

      const innerRing = new THREE.Mesh(
        new THREE.RingGeometry(12, 20, 80),
        new THREE.MeshBasicMaterial({
          color: 0x1b1e2f,
          transparent: true,
          opacity: 0.65,
          side: THREE.DoubleSide,
        }),
      );
      innerRing.rotation.set(0, 0, 0);
      innerRing.position.set(0, 0, -0.2);
      group.add(innerRing);

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
      zoomTargetRef.current = 90;
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
      camera.position.z += (zoomTargetRef.current - camera.position.z) * 0.08;

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
    zoomTargetRef.current = 60;
    if (cameraRef.current) {
      cameraRef.current.position.z = zoomTargetRef.current;
    }
    lastFocusSystemRef.current = focusSystemId;
    lastFocusAppliedRef.current = { id: focusSystemId, trigger: focusTrigger };
  }, [focusSystemId, focusPlanetId, systems, onClearRef, focusTrigger]);

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
        zoomTargetRef.current = 60;
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
    zoomTargetRef.current = 70;
    if (cameraRef.current) {
      cameraRef.current.position.z = zoomTargetRef.current;
    }
    lastFocusPlanetRef.current = focusPlanetId;
  }, [focusPlanetId, systems]);

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
  ]);

  return <div className="galaxy-map" ref={containerRef} />;
};
