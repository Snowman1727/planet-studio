export const MIN_ZOOM = 0.65;
export const MAX_ZOOM = 1.8;

export function clampZoom(value) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value)) : 1;
}

export function cameraDistance(aspect, zoom) {
  return Math.max(9.7, 9.2 / aspect) / clampZoom(zoom);
}

export function wheelZoom(zoom, delta, mode, pageHeight) {
  if (!Number.isFinite(delta)) return clampZoom(zoom);
  const pixels = delta * (mode === 1 ? 16 : mode === 2 ? pageHeight : 1);
  return clampZoom(clampZoom(zoom) * Math.exp(-Math.max(-1000, Math.min(1000, pixels)) * 0.0015));
}
