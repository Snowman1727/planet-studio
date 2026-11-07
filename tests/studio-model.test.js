import test from 'node:test';
import assert from 'node:assert/strict';
import { createProject, createStore, parseProject, MAX_OBJECTS, MAX_FILE_BYTES } from '../prototype/studio/model.js';

const front = [0, 0, 1];
const at = (angle) => [Math.sin(angle), 0, Math.cos(angle)];
function paint(store, { type = 'tree', radius = 0.28, density = 0.8, points = [front] } = {}) {
  store.begin(type, radius, density);
  points.forEach((point) => store.sample(point));
  store.commit();
  return store.project.objects;
}
const fixture = (id) => ({ id, type: 'tree', direction: front, scale: 1, heading: 0 });

test('a blank project has no objects and saves exact final placements', () => {
  const store = createStore(createProject(1727));
  assert.deepEqual(store.project.objects, []);
  paint(store);
  assert.ok(store.project.objects.length > 0);
  assert.deepEqual(parseProject(JSON.stringify(store.project)), store.project);
});

test('larger brush area yields more objects without growing their scale', () => {
  const small = createStore(createProject(42));
  const large = createStore(createProject(42));
  paint(small, { radius: 0.14 });
  paint(large, { radius: 0.42 });
  assert.ok(large.project.objects.length > small.project.objects.length * 2);
  assert.ok(large.project.objects.every((object) => object.scale >= 0.75 && object.scale <= 1.2));
});

test('repainting a region is duplicate-free and never moves earlier placements', () => {
  const store = createStore(createProject(42));
  paint(store);
  const before = structuredClone(store.project.objects);
  paint(store);
  assert.deepEqual(store.project.objects, before);
  paint(store, { points: [at(0.4)] });
  assert.deepEqual(store.project.objects.slice(0, before.length), before);
});

test('fixed-arc sampling does not depend on pointer event frequency', () => {
  const sparse = createStore(createProject(42));
  const dense = createStore(createProject(42));
  paint(sparse, { points: [at(0), at(0.8)] });
  paint(dense, { points: Array.from({ length: 81 }, (_, i) => at(i / 100)) });
  assert.deepEqual(dense.project.objects, sparse.project.objects);
});

test('placements fit wholly inside a stamp and respect cross-type spacing', () => {
  const store = createStore(createProject(39));
  paint(store, { type: 'house', radius: 0.4 });
  paint(store, { radius: 0.45 });
  const objects = store.project.objects;
  assert.ok(objects.some((object) => object.type === 'house'));
  assert.ok(objects.some((object) => object.type === 'tree'));
  for (const object of objects) {
    const radius = (object.type === 'tree' ? 0.06 : 0.115) * object.scale;
    assert.ok(Math.abs(Math.hypot(...object.direction) - 1) < 1e-9);
    assert.ok(Math.acos(object.direction[2]) + radius <= (object.type === 'tree' ? 0.45 : 0.4) + 1e-8);
    for (const other of objects) {
      if (object === other) continue;
      const otherRadius = (other.type === 'tree' ? 0.06 : 0.115) * other.scale;
      const dot = object.direction.reduce((sum, n, i) => sum + n * other.direction[i], 0);
      assert.ok(Math.acos(Math.min(1, dot)) + 1e-8 >= radius + otherRadius);
    }
  }
});

test('a house never stretches into a brush smaller than its footprint', () => {
  const store = createStore(createProject(42));
  paint(store, { type: 'house', radius: 0.06 });
  assert.equal(store.project.objects.length, 0);
});

test('undo and redo group an entire stroke and restore erased poses exactly', () => {
  const store = createStore(createProject(42));
  paint(store, { points: [at(0), at(0.4), at(0.8)] });
  const before = structuredClone(store.project.objects);
  store.undo();
  assert.equal(store.project.objects.length, 0);
  store.redo();
  assert.deepEqual(store.project.objects, before);
  paint(store, { type: 'erase', radius: 0.7 });
  assert.ok(store.project.objects.length < before.length);
  store.undo();
  assert.deepEqual(store.project.objects, before);
});

test('cancel rolls back intermediate changes and clears redo only on actual commit', () => {
  const store = createStore(createProject(42));
  paint(store);
  const before = structuredClone(store.project);
  store.begin('erase', 0.6, 1);
  store.sample(front);
  assert.equal(store.project.objects.length, 0);
  store.cancel();
  assert.deepEqual(store.project, before);
  store.undo();
  assert.equal(store.canRedo, true);
  paint(store, { density: 0 });
  assert.equal(store.canRedo, true);
});

test('off-globe gaps do not interpolate into unpainted territory', () => {
  const store = createStore(createProject(42));
  paint(store, { radius: 0.12, points: [at(-0.6), null, at(0.6)] });
  assert.ok(store.project.objects.length > 0);
  assert.ok(store.project.objects.every((object) => Math.abs(object.direction[0]) > 0.35));
});

test('poles and longitude seams can be painted without invalid positions', () => {
  const store = createStore(createProject(42));
  paint(store, { points: [[0, 1, 0], [0.01, 0.99995, 0]] });
  paint(store, { points: [[0.01, 0, -0.99995], [-0.01, 0, -0.99995]] });
  assert.ok(store.project.objects.length > 0);
  assert.doesNotThrow(() => parseProject(JSON.stringify(store.project)));
});

test('invalid settings and over-limit documents are rejected', () => {
  const doc = createProject(42);
  for (const patch of [
    { version: 2 }, { seed: NaN }, { name: {} },
    { objects: [fixture('same'), fixture('same')] },
    { objects: [{ ...fixture('x'), direction: [0, 0, 0] }] },
    { objects: [{ ...fixture('x'), direction: [2, 0, 0] }] },
    { objects: [{ ...fixture('x'), type: 'script' }] },
    { objects: [{ ...fixture('x'), scale: 999 }] },
    { objects: Array.from({ length: MAX_OBJECTS + 1 }, (_, i) => fixture(`t${i}`)) },
    { view: { x: Infinity, y: 0 } },
  ]) assert.throws(() => parseProject(JSON.stringify({ ...doc, ...patch })));
  assert.throws(() => parseProject(' '.repeat(MAX_FILE_BYTES + 1)));
  assert.throws(() => parseProject('{"objects":'));
});

test('object cap preserves existing work and a fresh stroke invalidates redo', () => {
  const doc = createProject(42);
  doc.objects = Array.from({ length: MAX_OBJECTS }, (_, i) => fixture(`t${i}`));
  const store = createStore(doc);
  paint(store, { points: [[0, 1, 0]] });
  assert.equal(store.project.objects.length, MAX_OBJECTS);
  const small = createStore(createProject(42));
  paint(small);
  small.undo();
  paint(small, { points: [at(1)] });
  assert.equal(small.canRedo, false);
});

test('undoing a brush stroke does not undo later name or environment edits', () => {
  const store = createStore(createProject(42));
  paint(store);
  store.project.name = '圆圆的星球';
  store.project.settings.snow = false;
  store.undo();
  assert.equal(store.project.name, '圆圆的星球');
  assert.equal(store.project.settings.snow, false);
  assert.equal(store.project.objects.length, 0);
});

test('spacing covers actual tree canopies and cabin roof corners, not just anchors', () => {
  const store = createStore(createProject(18));
  paint(store, { type: 'house', radius: 0.5, density: 1 });
  paint(store, { type: 'tree', radius: 0.55, density: 1 });
  const objects = store.project.objects;
  assert.ok(objects.length > 3);
  for (let i = 0; i < objects.length; i++) {
    for (let j = i + 1; j < objects.length; j++) {
      const a = objects[i];
      const b = objects[j];
      const dot = a.direction.reduce((sum, n, k) => sum + n * b.direction[k], 0);
      // Minimum supported land radius is > 2.0; these are asset-space bounds.
      const separation = 2 * Math.acos(Math.min(1, dot));
      const aRadius = (a.type === 'tree' ? 0.115 : 0.224) * a.scale;
      const bRadius = (b.type === 'tree' ? 0.115 : 0.224) * b.scale;
      assert.ok(separation >= aRadius + bRadius, `overlapping ${a.id} and ${b.id}`);
    }
  }
});
