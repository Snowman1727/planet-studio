export const MAX_OBJECTS = 2000;
export const MAX_FILE_BYTES = 2 * 1024 * 1024;
export const HISTORY_LIMIT = 40;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const angle = (a, b) => Math.acos(clamp(dot(a, b), -1, 1));
const clone = (value) => structuredClone(value);
const fail = () => { throw new Error('星球文件格式不正确，或包含不支持的数据。'); };
const bounded = (value, min, max) => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;

export function createProject(seed = 1727) {
  return {
    version: 2, generator: 1, name: '未命名星球', seed: seed >>> 0,
    settings: { environment: 'snow', snow: true, autoRotate: true },
    view: { x: 0.12, y: -0.2 },
    objects: [],
  };
}

export function parseProject(text) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > MAX_FILE_BYTES) {
    throw new Error('文件过大，请选择小于 2 MB 的星球 JSON 文件。');
  }
  let doc;
  try { doc = JSON.parse(text); } catch { fail(); }
  if (!doc || ![1, 2].includes(doc.version) || doc.generator !== 1 ||
      typeof doc.name !== 'string' || doc.name.length > 80 ||
      !Number.isInteger(doc.seed) || !bounded(doc.seed, 0, 4294967295) ||
      !Array.isArray(doc.objects) || doc.objects.length > MAX_OBJECTS ||
      typeof doc.settings?.snow !== 'boolean' || typeof doc.settings?.autoRotate !== 'boolean' ||
      !bounded(doc.view?.x, -1.5, 1.5) || !bounded(doc.view?.y, -100000, 100000)) fail();
  const environment = doc.version === 1 ? 'snow' : doc.settings.environment;
  if (typeof environment !== 'string' || !Object.hasOwn(ENVIRONMENTS, environment)) fail();
  const ids = new Set();
  const objects = doc.objects.map((object) => {
    if (!object || typeof object.id !== 'string' || !/^[\w:-]{1,64}$/.test(object.id) ||
        ids.has(object.id) || typeof object.type !== 'string' || !Object.hasOwn(BRUSHES, object.type) ||
        (doc.version === 1 && !['tree', 'house'].includes(object.type)) ||
        !Array.isArray(object.direction) || object.direction.length !== 3 ||
        !object.direction.every((n) => bounded(n, -1, 1)) ||
        Math.abs(Math.hypot(...object.direction) - 1) > 0.0001 ||
        !bounded(object.scale, 0.75, 1.2) || !bounded(object.heading, 0, Math.PI * 2)) fail();
    ids.add(object.id);
    return { id: object.id, type: object.type, direction: [...object.direction], scale: object.scale, heading: object.heading };
  });
  return {
    version: 2, generator: 1, name: doc.name, seed: doc.seed,
    settings: { environment, snow: doc.settings.snow, autoRotate: doc.settings.autoRotate },
    view: { x: doc.view.x, y: doc.view.y }, objects,
  };
}

function hash(value) {
  let n = value >>> 0;
  n = Math.imul(n ^ n >>> 16, 0x21f0aaad);
  n = Math.imul(n ^ n >>> 15, 0x735a2d97);
  return ((n ^ n >>> 15) >>> 0) / 4294967296;
}

// Conservative angular bounds cover canopies/roof corners on the lowest land.
const footprint = (object) => BRUSHES[object.type].footprint * object.scale;
const maxFootprint = Math.max(...Object.values(BRUSHES).map((brush) => brush.footprint)) * 1.2;
function candidates(seed, type) {
  const count = BRUSHES[type].candidates;
  const phase = hash(seed + 73) * Math.PI * 2;
  return Array.from({ length: count }, (_, i) => {
    const y = 1 - 2 * (i + 0.5) / count;
    const r = Math.sqrt(1 - y * y);
    const phi = i * Math.PI * (3 - Math.sqrt(5)) + phase;
    const base = (seed ^ Math.imul(i + 1, 0x9e3779b1)) >>> 0;
    return {
      id: `${type}:${i}`, type, direction: [r * Math.cos(phi), y, r * Math.sin(phi)],
      scale: 0.75 + hash(base + 17) * 0.45,
      heading: hash(base + 29) * Math.PI * 2,
      chance: hash(base + 41),
    };
  }).sort((a, b) => a.chance - b.chance);
}

// Cartesian buckets avoid longitude seams and singularities at the poles.
class SpatialIndex {
  cells = new Map();
  key(x, y, z) { return `${x},${y},${z}`; }
  coords(direction) { return direction.map((n) => Math.floor(n / 0.16)); }
  add(object) {
    const key = this.key(...this.coords(object.direction));
    if (!this.cells.has(key)) this.cells.set(key, []);
    this.cells.get(key).push(object);
  }
  fits(object) {
    const [x, y, z] = this.coords(object.direction);
    const radius = footprint(object);
    const reach = Math.ceil((radius + maxFootprint) / 0.16);
    for (let a = x - reach; a <= x + reach; a++) {
      for (let b = y - reach; b <= y + reach; b++) {
        for (let c = z - reach; c <= z + reach; c++) {
          for (const other of this.cells.get(this.key(a, b, c)) ?? []) {
            if (dot(object.direction, other.direction) > Math.cos(radius + footprint(other))) return false;
          }
        }
      }
    }
    return true;
  }
}

function unit(direction) {
  if (!Array.isArray(direction) || direction.length !== 3 || !direction.every(Number.isFinite)) return null;
  const length = Math.hypot(...direction);
  return length > 0.00001 ? direction.map((n) => n / length) : null;
}
function interpolate(a, b, t) {
  const arc = angle(a, b);
  if (arc < 1e-8) return [...b];
  const denominator = Math.sin(arc);
  return unit(a.map((n, i) => n * Math.sin((1 - t) * arc) / denominator + b[i] * Math.sin(t * arc) / denominator));
}

export function createStore(initial) {
  let project = parseProject(JSON.stringify(initial));
  let index;
  let ids;
  let population;
  let stroke = null;
  const past = [];
  const future = [];
  function rebuild() {
    index = new SpatialIndex();
    project.objects.forEach((object) => index.add(object));
    ids = new Set(project.objects.map((object) => object.id));
  }
  function resetCandidates() {
    population = Object.fromEntries(Object.keys(BRUSHES).map((type) => [type, candidates(project.seed, type)]));
    rebuild();
  }
  resetCandidates();

  function stamp(center) {
    if (stroke.type === 'erase') {
      const cos = Math.cos(stroke.radius);
      project.objects = project.objects.filter((object) => dot(center, object.direction) < cos);
      rebuild();
      return;
    }
    if (project.objects.length >= MAX_OBJECTS) return;
    for (const candidate of population[stroke.type]) {
      if (candidate.chance > stroke.density) break;
      const margin = stroke.radius - footprint(candidate);
      if (margin <= 0 || ids.has(candidate.id) || dot(center, candidate.direction) < Math.cos(margin)) continue;
      if (!index.fits(candidate)) continue;
      const { chance: unused, ...object } = candidate;
      project.objects.push(object);
      ids.add(object.id);
      index.add(object);
      if (project.objects.length >= MAX_OBJECTS) break;
    }
  }
  function cancel() {
    if (!stroke) return false;
    project = stroke.before;
    stroke = null;
    rebuild();
    return true;
  }
  function finishSegment() {
    if (stroke?.last) stamp(stroke.last);
  }
  return {
    get project() { return project; },
    get active() { return Boolean(stroke); },
    get canUndo() { return past.length > 0; },
    get canRedo() { return future.length > 0; },
    begin(type, radius, density) {
      if ((type !== 'erase' && !Object.hasOwn(BRUSHES, type)) || !bounded(radius, 0.04, 0.7) || !bounded(density, 0, 1)) {
        throw new Error('画笔参数无效。');
      }
      cancel();
      stroke = { type, radius, density, before: clone(project), last: null, needed: radius / 4 };
    },
    sample(direction) {
      if (!stroke) return;
      const next = unit(direction);
      if (!next) {
        finishSegment();
        stroke.last = null;
        stroke.needed = stroke.radius / 4;
        return;
      }
      if (!stroke.last) {
        stamp(next);
        stroke.last = next;
        return;
      }
      let from = stroke.last;
      let remaining = angle(from, next);
      // Missed/backside hits are separate segments, not enormous brush bridges.
      if (remaining > Math.PI / 2) {
        finishSegment();
        stamp(next);
        stroke.last = next;
        stroke.needed = stroke.radius / 4;
        return;
      }
      let steps = 0;
      while (remaining + 1e-10 >= stroke.needed && steps++ < 160) {
        const point = interpolate(from, next, Math.min(1, stroke.needed / remaining));
        stamp(point);
        remaining = Math.max(0, remaining - stroke.needed);
        from = point;
        stroke.needed = stroke.radius / 4;
      }
      stroke.needed = Math.max(1e-8, stroke.needed - remaining);
      stroke.last = next;
    },
    commit() {
      if (!stroke) return false;
      finishSegment();
      const before = stroke.before;
      stroke = null;
      if (JSON.stringify(before.objects) === JSON.stringify(project.objects)) return false;
      past.push(before);
      if (past.length > HISTORY_LIMIT) past.shift();
      future.length = 0;
      return true;
    },
    cancel,
    undo() {
      cancel();
      if (!past.length) return false;
      future.push(clone(project));
      project = { ...project, objects: past.pop().objects };
      rebuild();
      return true;
    },
    redo() {
      cancel();
      if (!future.length) return false;
      past.push(clone(project));
      project = { ...project, objects: future.pop().objects };
      rebuild();
      return true;
    },
    replace(next) {
      const validated = parseProject(JSON.stringify(next));
      cancel();
      project = validated;
      past.length = future.length = 0;
      resetCandidates();
    },
  };
}
import { BRUSHES, ENVIRONMENTS } from './catalog.js';
