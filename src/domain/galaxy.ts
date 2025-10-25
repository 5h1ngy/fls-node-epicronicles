import type {
  GalaxyState,
  StarClass,
  StarSystem,
  SystemVisibility,
} from './types';

export interface GalaxyGenerationParams {
  seed: string;
  systemCount?: number;
  galaxyRadius?: number;
}

const starClasses: StarClass[] = ['mainSequence', 'giant', 'dwarf'];

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

const createStarSystem = (
  random: () => number,
  index: number,
  maxRadius: number,
): StarSystem => {
  const angle = random() * Math.PI * 2;
  const radius = Math.sqrt(random()) * maxRadius;
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
    visibility,
  };
};

export const createTestGalaxy = ({
  seed,
  systemCount = 12,
  galaxyRadius = 200,
}: GalaxyGenerationParams): GalaxyState => {
  const random = createRandom(seed);
  const systems = Array.from({ length: systemCount }, (_, index) =>
    createStarSystem(random, index, galaxyRadius),
  );
  return {
    seed,
    systems,
  };
};
