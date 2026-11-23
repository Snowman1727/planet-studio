import { Quaternion, Vector3 } from 'three';
import { localizedError } from './i18n.js';

const DEG = Math.PI / 180;

export function coordinatesFromDirection(direction) {
  return {
    latitude: Math.asin(Math.max(-1, Math.min(1, direction[1]))) / DEG,
    longitude: Math.atan2(direction[0], direction[2]) / DEG,
  };
}

export function directionFromCoordinates(latitude, longitude) {
  const radius = Math.cos(latitude * DEG);
  return [radius * Math.sin(longitude * DEG), Math.sin(latitude * DEG), radius * Math.cos(longitude * DEG)];
}

export function dragDirection(from, to, anchor) {
  const rotation = new Quaternion().setFromUnitVectors(new Vector3().fromArray(from), new Vector3().fromArray(to));
  return new Vector3().fromArray(anchor).applyQuaternion(rotation).normalize().toArray();
}

export function poseFields(object) {
  const { latitude, longitude } = coordinatesFromDirection(object.direction);
  return {
    latitude: latitude.toFixed(6), longitude: longitude.toFixed(6),
    heading: (object.heading / DEG).toFixed(4), scale: (object.scale * 100).toFixed(4),
  };
}

export function posePatch(values, baseline) {
  const limits = { latitude: [-90, 90], longitude: [-180, 180], heading: [0, 360], scale: [75, 120] };
  for (const [key, [min, max]] of Object.entries(limits)) {
    const value = Number(values[key]);
    if (String(values[key]).trim() === '' || !Number.isFinite(value) || value < min || value > max) {
      throw localizedError('invalidObjectEdit');
    }
  }
  const changed = (key) => Number(values[key]) !== Number(baseline[key]);
  const patch = {};
  if (changed('latitude') || changed('longitude')) {
    patch.direction = directionFromCoordinates(Number(values.latitude), Number(values.longitude));
  }
  if (changed('heading')) patch.heading = Number(values.heading) * DEG;
  if (changed('scale')) patch.scale = Number(values.scale) / 100;
  return patch;
}
