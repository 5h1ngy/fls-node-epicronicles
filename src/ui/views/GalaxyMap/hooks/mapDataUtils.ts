export const computeZoomBounds = (maxSystemRadius: number) => {
  const rawMin = Math.min(80, maxSystemRadius * 0.05);
  const minZoom = Math.max(3, rawMin);
  const maxZoom = Math.max(220, maxSystemRadius * 1.5);
  return { minZoom, maxZoom };
};
