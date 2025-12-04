import { makeSeededRandom } from '../common/spaceMath';

export type NebulaShape = 'circle' | 'spiral';

export const createPositionSampler = (
  seed: string,
  radius: number,
  shape: NebulaShape,
) => {
  const random = makeSeededRandom(seed);
  return () => {
    const rNorm = Math.pow(random(), shape === 'spiral' ? 0.92 : 1.1);
    const r = (0.35 + rNorm * 0.7) * radius;
    const armCount = 3;
    let angle = random() * Math.PI * 2;
    if (shape === 'spiral') {
      const arm = Math.floor(random() * armCount);
      const armOffset = (arm / armCount) * Math.PI * 2;
      const twist = (r / radius) * Math.PI * 3.6;
      angle = armOffset + twist + (random() - 0.5) * 0.6;
    } else {
      angle += (random() - 0.5) * 0.4;
    }
    const wobble = (random() - 0.5) * radius * 0.12 * (1 - r / radius);
    const x = Math.cos(angle) * r + wobble;
    const y = Math.sin(angle) * r + wobble;
    const z = (random() - 0.5) * Math.max(18, radius * 0.05);
    const falloff = 1 - Math.min(1, r / radius);
    return { x, y, z, falloff, random };
  };
};
