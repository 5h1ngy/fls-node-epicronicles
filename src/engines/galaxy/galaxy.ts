import type {
  GalaxyState,
  HabitableWorldTemplate,
  OrbitingPlanet,
  PlanetKind,
  ResourceType,
  StarClass,
  StarSystem,
  SystemVisibility,
  Vector3,
} from '@domain/types';

export interface GalaxyGenerationParams {
  seed: string;
  systemCount?: number;
  galaxyRadius?: number;
  galaxyShape?: GalaxyShape;
}

export type GalaxyShape = 'circle' | 'spiral';

const starClasses: StarClass[] = ['mainSequence', 'giant', 'dwarf'];
const planetKinds: PlanetKind[] = ['terrestrial', 'desert', 'tundra'];

const baseProductionByKind: Record<
  PlanetKind,
  { yields: Partial<Record<ResourceType, number>>; upkeep: Partial<Record<ResourceType, number>> }
> = {
  terrestrial: {
    yields: { food: 4, energy: 2, minerals: 2 },
    upkeep: { food: 2 },
  },
  desert: {
    yields: { minerals: 4, energy: 3 },
    upkeep: { food: 3 },
  },
  tundra: {
    yields: { minerals: 3, research: 2 },
    upkeep: { food: 4 },
  },
};

const baseHabitabilityByKind: Record<PlanetKind, number> = {
  terrestrial: 0.9,
  desert: 0.6,
  tundra: 0.65,
};

const stringToSeed = (value: string) =>
  value.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

const createRandom = (seed: string) => {
  let t = stringToSeed(seed) + 0x6d2b79f5;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
};

const createHabitableWorld = (
  random: () => number,
  systemName: string,
): HabitableWorldTemplate | undefined => {
  if (random() > 0.45) {
    return undefined;
  }

  const kind =
    planetKinds[Math.floor(random() * planetKinds.length)] ?? 'terrestrial';
  const base = baseProductionByKind[kind];
  const size = 12 + Math.round(random() * 8);
  const habitability = baseHabitabilityByKind[kind] ?? 0.7;

  return {
    name: `${systemName} Prime`,
    kind,
    size,
    baseProduction: { ...base.yields },
    upkeep: { ...base.upkeep },
    habitability,
  };
};

const orbitPalette = ['#72fcd5', '#f9d976', '#f58ef6', '#8ec5ff', '#c7ddff'];

const createOrbitingPlanets = (
  random: () => number,
  systemName: string,
): OrbitingPlanet[] => {
  const count = 2 + Math.floor(random() * 3);
  return Array.from({ length: count }, (_, index) => ({
    id: `${systemName}-ORB-${index}`,
    name: `${systemName}-${String.fromCharCode(65 + index)}`,
    orbitRadius: 8 + index * 5 + random() * 3,
    size: 0.6 + random() * 0.8,
    color: orbitPalette[Math.floor(random() * orbitPalette.length)],
    orbitSpeed: 0.7 + random() * 0.9,
  }));
};

const createMapPosition = (
  x: number,
  y: number,
  random: () => number,
): Vector3 => ({
  x,
  y,
  z: (random() - 0.5) * 40,
});

const createStarSystem = (
  random: () => number,
  index: number,
  maxRadius: number,
  shape: GalaxyShape,
  total: number,
): StarSystem => {
  const arms = 2;
  const radius = maxRadius * 0.9; // keep all systems far from the core
  let angle: number;

  if (shape === 'spiral') {
    const perArm = Math.ceil(total / arms);
    const armIndex = index % arms;
    const idxInArm = Math.floor(index / arms);
    const armAngle = (armIndex / arms) * Math.PI * 2;
    const angleStep = (Math.PI * 2) / arms / perArm;
    const twist = idxInArm * 0.35;
    const jitter = (random() - 0.5) * 0.08;
    angle = armAngle + idxInArm * angleStep + twist + jitter;
  } else {
    const angleStep = (Math.PI * 2) / Math.max(1, total);
    angle = index * angleStep;
  }

  const starClass = starClasses[Math.floor(random() * starClasses.length)];
  const name = `SYS-${(index + 1).toString().padStart(3, '0')}`;

  const visibility: SystemVisibility = index === 0 ? 'surveyed' : 'unknown';

  return {
    id: `${name}-${Math.round(random() * 10000)}`,
    name,
    starClass,
    position: {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    },
    mapPosition: createMapPosition(Math.cos(angle) * radius, Math.sin(angle) * radius, random),
    visibility,
    habitableWorld: createHabitableWorld(random, name),
    orbitingPlanets: createOrbitingPlanets(random, name),
    hostilePower:
      index === 0 || random() > 0.35 ? 0 : Math.round(6 + random() * 10),
  };
};

export const createTestGalaxy = ({
  seed,
  systemCount = 12,
  galaxyRadius = 200,
  galaxyShape = 'circle',
}: GalaxyGenerationParams): GalaxyState => {
  const random = createRandom(seed);
  const systems = Array.from({ length: systemCount }, (_, index) =>
    createStarSystem(random, index, galaxyRadius, galaxyShape, systemCount),
  );
  return {
    seed,
    galaxyShape,
    systems,
  };
};

