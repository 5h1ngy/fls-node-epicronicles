import type { Planet, PopulationJobId } from '@domain/types';

export const updatePlanetPopulation = (
  planet: Planet,
  updates: Partial<Planet['population']>,
): Planet => ({
  ...planet,
  population: {
    ...planet.population,
    ...updates,
  },
});

export const updatePopulationCounts = (
  planet: Planet,
  changes: Partial<Record<PopulationJobId, number>>,
): Planet => {
  const next = { ...planet.population };
  (Object.keys(changes) as PopulationJobId[]).forEach((jobId) => {
    const delta = changes[jobId] ?? 0;
    next[jobId] = Math.max(0, next[jobId] + delta);
  });
  return updatePlanetPopulation(planet, next);
};
