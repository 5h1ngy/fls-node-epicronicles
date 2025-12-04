declare module 'poisson-disk-sampling' {
  interface PoissonDiskOptions {
    shape: [number, number];
    minDistance: number;
    maxDistance?: number;
    tries?: number;
  }
  class PoissonDiskSampling {
    constructor(options: PoissonDiskOptions, rng?: () => number);
    fill(): number[][];
    addPoint(point: number[]): boolean;
  }
  export default PoissonDiskSampling;
}
