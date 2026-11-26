import test from 'node:test';
import assert from 'node:assert/strict';
import { createProject, createStore, parseProject, MAX_OBJECTS } from '../prototype/studio/model.js';
import { buildHTML } from '../prototype/studio/export.js';

const at = (a) => [Math.sin(a), 0, Math.cos(a)];
const front = at(0);
const bounds = { tree: 0.06, flowers: 0.05, rock: 0.08, house: 0.115 };
function paint(store, { mix, radius = 0.6, density = 1, points = [front] } = {}) {
  store.begin('mixed', radius, density, 'all', mix);
  points.forEach((point) => store.sample(point));
  store.commit();
  return structuredClone(store.project.objects);
}
function spacing(objects) {
  for (let i = 0; i < objects.length; i++) {
    const a = objects[i];
    for (const b of objects.slice(i + 1)) {
      const dot = a.direction.reduce((sum, n, k) => sum + n * b.direction[k], 0);
      assert.ok(Math.acos(Math.min(1, dot)) + 1e-8 >= bounds[a.type] * a.scale + bounds[b.type] * b.scale, `${a.id}/${b.id}`);
    }
  }
}

test('one mixed stroke emits all three saved types with deterministic poses and no duplicates', () => {
  const a = createStore(createProject(42)), b = createStore(createProject(42));
  const first = paint(a);
  assert.ok(first.length > 20);
  assert.deepEqual(new Set(first.map(o => o.type)), new Set(['tree', 'flowers', 'rock']));
  assert.deepEqual(paint(b), first);
  assert.deepEqual(paint(a), first);
  assert.equal(new Set(first.map(o => o.id)).size, first.length);
  const c = createStore(createProject(43));
  assert.notDeepEqual(paint(c), first);
});

test('relative weights are proportional, exclude zero types and remain frozen during a stroke', () => {
  const a = createStore(createProject(17)), b = createStore(createProject(17));
  assert.deepEqual(paint(a, { mix: { tree: 60, flowers: 30, rock: 10 } }), paint(b, { mix: { tree: 6, flowers: 3, rock: 1 } }));
  for (const type of ['tree', 'flowers', 'rock']) {
    const store = createStore(createProject(42));
    const mix = { tree: 0, flowers: 0, rock: 0, [type]: 100 };
    store.begin('mixed', 0.6, 1, 'all', mix);
    mix[type] = 0;
    store.sample(front); store.commit();
    assert.ok(store.project.objects.length > 10);
    assert.ok(store.project.objects.every(o => o.type === type));
  }
});

test('higher requested weights change realized composition without promising exact constrained quotas', () => {
  const counts = [];
  for (const tree of [5, 95]) {
    const store = createStore(createProject(42));
    const objects = paint(store, { mix: { tree, flowers: 100 - tree, rock: 0 }, points: [at(-0.6), at(0.6)] });
    counts.push(objects.filter(o => o.type === 'tree').length / objects.length);
  }
  assert.ok(counts[0] < 0.25 && counts[1] > 0.75, counts.join(','));
});

test('mixed density and radius control population, not scale or type selection', () => {
  const run = (options) => paint(createStore(createProject(42)), options);
  const small = run({ radius: 0.2 }), large = run({ radius: 0.6 });
  assert.ok(large.length > small.length * 2);
  assert.equal(run({ density: 0 }).length, 0);
  assert.ok(run({ density: 0.05 }).length < large.length);
  assert.ok(large.every(o => o.scale >= 0.75 && o.scale <= 1.2));
});

test('fixed-arc mixed paths reproduce across sparse/dense samples and handle gaps and poles', () => {
  const run = points => paint(createStore(createProject(42)), { points, radius: 0.28 });
  assert.deepEqual(run([at(0), at(0.8)]), run(Array.from({ length: 81 }, (_, i) => at(i / 100))));
  const separated = run([at(-0.7), null, at(0.7)]);
  assert.ok(separated.length > 0 && separated.every(o => Math.abs(o.direction[0]) > 0.3));
  const store = createStore(createProject(42));
  paint(store, { points: [[0, 1, 0], null, [0, -1, 0], null, at(Math.PI)] });
  assert.doesNotThrow(() => parseProject(JSON.stringify(store.project)));
  spacing(store.project.objects);
});

test('all mixed footprints fit the painted cap and respect locked and single-brush neighbors', () => {
  const doc = createProject(42);
  doc.objects = [{ id: 'locked:cabin', type: 'house', direction: front, scale: 1.2, heading: 0, locked: true }];
  const store = createStore(doc);
  const mixed = paint(store);
  assert.deepEqual(mixed[0], doc.objects[0]);
  assert.ok(mixed.length > 10);
  mixed.slice(1).forEach(o => assert.ok(Math.acos(o.direction[2]) + bounds[o.type] * o.scale <= 0.6 + 1e-8));
  store.begin('tree', 0.6, 1); store.sample(at(0.65)); store.commit();
  spacing(store.project.objects);
});

test('invalid ratios reject atomically before canceling a valid stroke or losing redo', () => {
  const store = createStore(createProject(42));
  paint(store); store.undo();
  store.begin('tree', 0.2, 1); store.sample(front);
  const before = structuredClone(store.project);
  for (const mix of [null, [], {}, { tree: 0, flowers: 0, rock: 0 }, { tree: -1, flowers: 10, rock: 10 },
    { tree: 101, flowers: 10, rock: 10 }, { tree: '60', flowers: 25, rock: 15 },
    { tree: NaN, flowers: 25, rock: 15 }, { tree: 0.5, flowers: 1, rock: 1 },
    { tree: 60, flowers: 25, rock: 15, house: 5 }]) {
    assert.throws(() => store.begin('mixed', 0.6, 1, 'all', mix), e => e.code === 'invalidMix');
    assert.deepEqual(store.project, before);
    assert.equal(store.active, true);
    assert.equal(store.canRedo, true);
  }
  store.cancel();
});

test('whole mixed stroke cancel, undo, redo and typed erasure preserve exact saved objects', () => {
  const store = createStore(createProject(42));
  store.begin('mixed', 0.6, 1); store.sample(front);
  assert.ok(store.project.objects.length > 0);
  store.cancel(); assert.equal(store.project.objects.length, 0); assert.equal(store.canUndo, false);
  const objects = paint(store, { points: [at(0), at(0.6)] });
  store.undo(); assert.equal(store.project.objects.length, 0); assert.equal(store.canUndo, false);
  store.redo(); assert.deepEqual(store.project.objects, objects);
  store.begin('erase', 0.7, 1, 'rock'); store.sample(front); store.commit();
  assert.ok(store.project.objects.length < objects.length);
  assert.deepEqual(store.project.objects.filter(o => o.type !== 'rock'), objects.filter(o => o.type !== 'rock'));
  store.undo(); assert.deepEqual(store.project.objects, objects);
});

test('mixed painting stops at the object cap without changing pre-existing objects', () => {
  const doc = createProject(42);
  doc.objects = Array.from({ length: MAX_OBJECTS - 2 }, (_, i) => ({ id: `old:${i}`, type: 'tree', direction: [0, 0, -1], scale: 1, heading: 0 }));
  const store = createStore(doc);
  paint(store);
  assert.equal(store.project.objects.length, MAX_OBJECTS);
  assert.deepEqual(store.project.objects.slice(0, MAX_OBJECTS - 2), doc.objects);
  const before = structuredClone(store.project.objects);
  paint(store); assert.deepEqual(store.project.objects, before);
  store.undo(); assert.deepEqual(store.project.objects, doc.objects);
});

test('old projects accept mixed painting and JSON plus HTML retain final poses without brush state', () => {
  for (const version of [1, 2]) {
    const doc = createProject(42); doc.version = version;
    delete doc.view.zoom; delete doc.bookmarks;
    const store = createStore(doc); paint(store);
    const project = store.project;
    assert.equal(project.version, 2);
    assert.deepEqual(parseProject(JSON.stringify(project)), project);
    const html = buildHTML(project, 'console.log("offline")');
    const data = JSON.parse(html.match(/<script id="planet-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
    assert.deepEqual(data, project);
    assert.equal(Object.hasOwn(project, 'mix'), false);
    assert.equal(Object.hasOwn(project.settings, 'mix'), false);
  }
});
