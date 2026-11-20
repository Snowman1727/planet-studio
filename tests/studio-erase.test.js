import test from 'node:test';
import assert from 'node:assert/strict';
import { createProject, createStore, parseProject } from '../prototype/studio/model.js';

const types = ['tree', 'house', 'broadleaf', 'flowers', 'rock', 'mushroom'];
const at = (angle) => [Math.sin(angle), 0, Math.cos(angle)];
const object = (id, type, angle) => ({ id, type, direction: at(angle), scale: 1, heading: 0.7 });
function mixed() {
  const project = createProject(42);
  project.objects = types.flatMap((type, i) => [
    object(`${type}:near`, type, (i - 2.5) * 0.12),
    object(`${type}:far`, type, 1.3),
  ]);
  return project;
}
function erase(store, target, points = [at(0)], radius = 0.4) {
  store.begin('erase', radius, 0, target);
  points.forEach((point) => store.sample(point));
  return store.commit();
}

for (const type of types) {
  test(`erasing ${type} preserves every other type and out-of-radius pose`, () => {
    const project = mixed();
    const store = createStore(project);
    assert.equal(erase(store, type), true);
    assert.deepEqual(store.project.objects, project.objects.filter((item) => item.id !== `${type}:near`));
    assert.deepEqual(parseProject(JSON.stringify(store.project)), store.project);
  });
}

test('omitted and explicit all filters preserve the original all-type eraser', () => {
  for (const target of [undefined, 'all']) {
    const store = createStore(mixed());
    erase(store, target);
    assert.deepEqual(store.project.objects.map((item) => item.id), types.map((type) => `${type}:far`));
  }
});

test('a selective multi-sample stroke is one undo step and restores exact poses', () => {
  const project = mixed();
  project.objects.push(object('tree:second', 'tree', 0.55));
  const store = createStore(project);
  erase(store, 'tree', [at(-0.3), at(0.6)], 0.12);
  const after = structuredClone(store.project.objects);
  assert.deepEqual(after, project.objects.filter((item) => !['tree:near', 'tree:second'].includes(item.id)));
  store.project.name = 'Later name';
  store.project.settings.environment = 'desert';
  assert.equal(store.undo(), true);
  assert.deepEqual(store.project.objects, project.objects);
  assert.equal(store.canUndo, false);
  assert.equal(store.project.name, 'Later name');
  assert.equal(store.project.settings.environment, 'desert');
  assert.equal(store.redo(), true);
  assert.deepEqual(store.project.objects, after);
});

test('canceled selective strokes restore changes and preserve a pending redo', () => {
  const project = mixed();
  const store = createStore(project);
  erase(store, 'tree');
  const after = structuredClone(store.project.objects);
  store.undo();
  store.begin('erase', 0.4, 1, 'rock');
  store.sample(at(0));
  assert.deepEqual(store.project.objects, project.objects.filter((item) => item.id !== 'rock:near'));
  assert.equal(store.cancel(), true);
  assert.deepEqual(store.project, project);
  assert.equal(store.canRedo, true);
  store.redo();
  assert.deepEqual(store.project.objects, after);
});

test('erasing a missing type or empty area adds no history and keeps redo', () => {
  const project = mixed();
  project.objects = project.objects.filter((item) => item.type !== 'mushroom');
  const store = createStore(project);
  erase(store, 'tree');
  store.undo();
  assert.equal(erase(store, 'mushroom'), false);
  assert.equal(erase(store, 'tree', [at(-1.3)], 0.12), false);
  assert.equal(store.canUndo, false);
  assert.equal(store.canRedo, true);
  assert.deepEqual(store.project, project);
});

test('invalid erase filters reject before changing an existing stroke', () => {
  const store = createStore(mixed());
  store.begin('erase', 0.4, 1, 'tree');
  store.sample(at(0));
  const during = structuredClone(store.project);
  for (const target of [null, '', 'unknown', '__proto__', 'toString', {}, ['tree']]) {
    assert.throws(() => store.begin('erase', 0.4, 1, target), { code: 'invalidBrush' });
    assert.equal(store.active, true);
    assert.deepEqual(store.project, during);
  }
  store.cancel();
  assert.deepEqual(store.project, mixed());
});

test('selective sampling is event-frequency invariant and respects off-globe gaps', () => {
  const project = mixed();
  const sparse = createStore(project);
  const dense = createStore(project);
  erase(sparse, 'flowers', [at(-0.5), at(0.5)], 0.12);
  erase(dense, 'flowers', Array.from({ length: 101 }, (_, i) => at(-0.5 + i / 100)), 0.12);
  assert.deepEqual(sparse.project.objects, dense.project.objects);
  assert.deepEqual(sparse.project.objects, project.objects.filter((item) => item.id !== 'flowers:near'));
  const gap = createStore(project);
  assert.equal(erase(gap, 'flowers', [at(-0.5), null, at(0.5)], 0.12), false);
  assert.deepEqual(gap.project, project);
});

test('selective erase rebuilds occupancy so the same type can be painted again', () => {
  const store = createStore(createProject(42));
  store.begin('tree', 0.4, 1);
  store.sample(at(0));
  store.commit();
  const trees = structuredClone(store.project.objects);
  assert.ok(trees.length > 0);
  erase(store, 'tree', [at(0)], 0.5);
  assert.equal(store.project.objects.length, 0);
  store.begin('tree', 0.4, 1);
  store.sample(at(0));
  store.commit();
  assert.deepEqual(store.project.objects, trees);
});
