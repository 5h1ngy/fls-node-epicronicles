export const computeZoomBounds = (maxSystemRadius: number) => {
  const rawMin = Math.min(120, maxSystemRadius * 0.18);
  const minZoom = Math.max(10, rawMin);
  const maxZoom = Math.max(220, maxSystemRadius * 1.5);
  return { minZoom, maxZoom };
};
