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
import PoissonDiskSampling from 'poisson-disk-sampling';

export interface GalaxyGenerationParams {
  seed: string;
  systemCount?: number;
  galaxyRadius?: number;
  galaxyShape?: GalaxyShape;
  starClasses?: Array<{ id: StarClass; weight: number }>;
}

export type GalaxyShape = 'circle' | 'spiral';

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

const generatePoissonPositions = (
  random: () => number,
  count: number,
  shape: GalaxyShape,
  maxRadius: number,
): Array<{ radius: number; angle: number }> => {
  const minDistance = Math.max(0.05, Math.min(0.18, 1 / Math.sqrt(count + 1)));
  const sampler = new PoissonDiskSampling(
    {
      shape: [2, 2], // mapped to [-1,1]^2
      minDistance,
      maxDistance: minDistance * 1.6,
      tries: 30,
    },
    random,
  );
  const raw = sampler.fill();
  const points = raw
    .map(([x, y]) => [x - 1, y - 1] as [number, number])
    .filter(([x, y]) => x * x + y * y <= 1.05);

  while (points.length < count) {
    const i = points.length;
    const golden = Math.PI * (3 - Math.sqrt(5));
    const r = Math.pow((i + 1) / (count + 1), 0.6);
    const theta = i * golden;
    points.push([Math.cos(theta) * r, Math.sin(theta) * r]);
  }

  return points.slice(0, count).map(([x, y], idx) => {
    const rNorm = Math.max(0.02, Math.sqrt(x * x + y * y));
    const baseAngle = Math.atan2(y, x);
    const arms = 2;
    if (shape === 'spiral') {
      const arm = idx % arms;
      const armOffset = (arm / arms) * Math.PI * 2;
      const twist = rNorm * Math.PI * 3;
      return {
        radius: rNorm * maxRadius,
        angle: baseAngle + twist + armOffset,
      };
    }
    return { radius: rNorm * maxRadius, angle: baseAngle };
  });
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
  basePositions: Array<{ radius: number; angle: number }>,
  starClass: StarClass,
): StarSystem => {
  const pos = basePositions[index] ?? { radius: 0, angle: 0 };
  const radius = pos.radius;
  const angle = pos.angle;

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
  starClasses,
}: GalaxyGenerationParams): GalaxyState => {
  const random = createRandom(seed);
  const starPool =
    starClasses && starClasses.length > 0
      ? starClasses
      : [
          { id: 'G' as StarClass, weight: 6 },
          { id: 'K' as StarClass, weight: 5 },
          { id: 'M' as StarClass, weight: 7 },
          { id: 'F' as StarClass, weight: 3 },
          { id: 'A' as StarClass, weight: 2 },
          { id: 'B' as StarClass, weight: 1 },
          { id: 'O' as StarClass, weight: 1 },
        ];
  const totalWeight = starPool.reduce((sum, entry) => sum + (entry.weight ?? 1), 0);
  const pickStarClass = () => {
    const roll = random() * totalWeight;
    let acc = 0;
    for (const entry of starPool) {
      acc += entry.weight ?? 1;
      if (roll <= acc) {
        return entry.id;
      }
    }
    return starPool[starPool.length - 1]?.id ?? 'G';
  };
  const basePositions = generatePoissonPositions(
    random,
    systemCount,
    galaxyShape,
    galaxyRadius,
  );
  const systems = Array.from({ length: systemCount }, (_, index) =>
    createStarSystem(random, index, basePositions, pickStarClass()),
  );
  return {
    seed,
    galaxyShape,
    systems,
  };
};

