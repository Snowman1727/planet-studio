import test from 'node:test';
import assert from 'node:assert/strict';
import { createProject, createStore, parseProject } from '../prototype/studio/model.js';
import { buildHTML } from '../prototype/studio/export.js';

const at = (angle) => [Math.sin(angle), 0, Math.cos(angle)];
const object = (id, angle, type = 'house', locked = true) => ({
  id, type, direction: at(angle), heading: 0.7, scale: 1, ...(locked ? { locked: true } : {}),
});
function project() {
  const doc = createProject(42);
  doc.settings.autoRotate = false;
  doc.objects = [object('protected', 0), object('free', 0.4, 'tree', false)];
  return doc;
}
function erase(store, type = 'all') {
  store.begin('erase', 0.7, 1, type);
  store.sample(at(0));
  return store.commit();
}

test('parser preserves true locks, canonicalizes false and defaults old projects to unlocked', () => {
  const doc = project();
  assert.deepEqual(parseProject(JSON.stringify(doc)), doc);
  doc.objects[1].locked = false;
  assert.equal(Object.hasOwn(parseProject(JSON.stringify(doc)).objects[1], 'locked'), false);
  for (const version of [1, 2]) {
    const legacy = { ...createProject(), version, objects: [object('legacy', 0, 'house', false)] };
    const store = createStore(parseProject(JSON.stringify(legacy)));
    assert.equal(store.beginEdit('legacy'), true);
    assert.equal(store.edit({ heading: 2 }), true);
    assert.equal(store.commit(), true);
    assert.equal(store.setObjectLocked('legacy', true), true);
    assert.equal(store.project.objects[0].locked, true);
  }
});

test('invalid persisted lock values are rejected rather than silently unprotecting objects', () => {
  for (const locked of ['true', 'false', 0, 1, null, {}, []]) {
    const doc = project();
    doc.objects[0].locked = locked;
    assert.throws(() => parseProject(JSON.stringify(doc)), { code: 'invalidProject' });
  }
});

test('lock and unlock each form one exact history step without changing poses or metadata', () => {
  const doc = project();
  const store = createStore(doc);
  assert.equal(store.setObjectLocked('free', true), true);
  assert.deepEqual(store.project.objects, [doc.objects[0], { ...doc.objects[1], locked: true }]);
  store.project.name = 'Later';
  assert.equal(store.undo(), true);
  assert.deepEqual(store.project.objects, doc.objects);
  assert.equal(store.project.name, 'Later');
  assert.equal(store.canUndo, false);
  assert.equal(store.redo(), true);
  assert.equal(store.project.objects[1].locked, true);
  assert.equal(store.setObjectLocked('protected', false), true);
  assert.equal(Object.hasOwn(store.project.objects[0], 'locked'), false);
  assert.equal(store.undo(), true);
  assert.equal(store.project.objects[0].locked, true);
  assert.equal(store.redo(), true);
  assert.equal(Object.hasOwn(store.project.objects[0], 'locked'), false);
});

test('locked objects reject direct edits and deletion but are editable after unlocking', () => {
  const doc = project();
  const store = createStore(doc);
  assert.equal(store.beginEdit('protected'), false);
  assert.equal(store.edit({ heading: 3, direction: at(-0.5), scale: 1.2 }), false);
  assert.equal(store.deleteObject('protected'), false);
  assert.deepEqual(store.project, doc);
  assert.equal(store.canUndo, false);
  store.setObjectLocked('protected', false);
  assert.equal(store.beginEdit('protected'), true);
  assert.equal(store.edit({ heading: 3, direction: at(-0.5), scale: 1.2 }), true);
  assert.equal(store.commit(), true);
  assert.equal(store.deleteObject('protected'), true);
  assert.deepEqual(store.project.objects, [doc.objects[1]]);
});

test('all and type erasers preserve locked poses, order and exact undo redo', () => {
  for (const type of ['all', 'tree', 'house', 'broadleaf', 'flowers', 'rock', 'mushroom']) {
    const doc = project();
    doc.objects = [object('first', -0.1, type === 'all' ? 'tree' : type),
      object('middle', 0, type === 'all' ? 'tree' : type, false),
      object('last', 0.1, type === 'all' ? 'tree' : type)];
    const store = createStore(doc);
    assert.equal(erase(store, type), true);
    assert.deepEqual(store.project.objects, [doc.objects[0], doc.objects[2]]);
    assert.equal(store.undo(), true);
    assert.deepEqual(store.project.objects, doc.objects);
    assert.equal(store.canUndo, false);
    assert.equal(store.redo(), true);
    assert.deepEqual(store.project.objects, [doc.objects[0], doc.objects[2]]);
  }
});

test('erasing only protected objects is a no-op preserving redo and cancel preserves locks', () => {
  const store = createStore(project());
  store.deleteObject('free');
  store.undo();
  assert.equal(erase(store, 'house'), false);
  assert.equal(store.canRedo, true);
  store.begin('erase', 0.7, 1);
  store.sample(at(0));
  store.cancel();
  assert.deepEqual(store.project, project());
  assert.equal(store.canRedo, true);
});

test('no-op, missing and malformed lock calls preserve redo and an active edit', () => {
  const store = createStore(project());
  store.setObjectLocked('free', true);
  store.undo();
  store.beginEdit('free');
  store.edit({ heading: 3 });
  const during = structuredClone(store.project);
  assert.equal(store.setObjectLocked('protected', true), false);
  assert.equal(store.setObjectLocked('free', false), false);
  assert.equal(store.setObjectLocked('missing', true), false);
  for (const value of [undefined, null, 1, 'true', {}, []]) {
    assert.throws(() => store.setObjectLocked('free', value), { code: 'invalidObjectLock' });
  }
  assert.equal(store.active, true);
  assert.deepEqual(store.project, during);
  store.cancel();
  assert.equal(store.canRedo, true);
});

test('changing a lock cancels a pending transform or eraser before its own history step', () => {
  for (const gesture of ['edit', 'erase']) {
    const doc = project();
    const store = createStore(doc);
    if (gesture === 'edit') {
      store.beginEdit('free');
      store.edit({ direction: at(-0.5), heading: 3 });
    } else {
      store.begin('erase', 0.7, 1);
      store.sample(at(0));
    }
    assert.equal(store.setObjectLocked('free', true), true);
    assert.equal(store.active, false);
    assert.deepEqual(store.project.objects, [doc.objects[0], { ...doc.objects[1], locked: true }]);
    assert.equal(store.undo(), true);
    assert.deepEqual(store.project.objects, doc.objects);
    assert.equal(store.canUndo, false);
  }
});

test('locked objects remain in painting occupancy and protect generated IDs', () => {
  const store = createStore(createProject(42));
  store.begin('tree', 0.3, 1);
  store.sample(at(0));
  store.commit();
  const original = structuredClone(store.project.objects);
  assert.ok(original.length > 0);
  const locked = original[0];
  store.setObjectLocked(locked.id, true);
  store.begin('erase', 0.7, 1);
  store.sample(at(0));
  store.commit();
  assert.deepEqual(store.project.objects, [{ ...locked, locked: true }]);
  store.begin('house', 0.3, 1);
  store.sample(locked.direction);
  store.commit();
  for (const item of store.project.objects.filter((o) => o.id !== locked.id)) {
    const separation = Math.acos(Math.max(-1, Math.min(1,
      item.direction.reduce((sum, n, i) => sum + n * locked.direction[i], 0))));
    assert.ok(separation >= 0.115 * item.scale + 0.06 * locked.scale);
  }
  store.begin('tree', 0.3, 1);
  store.sample(at(0));
  store.commit();
  assert.equal(store.project.objects.filter((o) => o.id === locked.id).length, 1);
  assert.deepEqual(store.project.objects.find((o) => o.id === locked.id), { ...locked, locked: true });
});

test('moves cannot enter locked footprints and edit patches cannot bypass protection', () => {
  const store = createStore(project());
  store.beginEdit('free');
  assert.equal(store.edit({ direction: at(0) }), false);
  assert.throws(() => store.edit({ locked: true }), { code: 'invalidObjectEdit' });
  assert.throws(() => store.edit({ locked: false, heading: 2 }), { code: 'invalidObjectEdit' });
  store.cancel();
  assert.deepEqual(store.project, project());
});

test('locks survive JSON HTML replacement and a fresh store while selection stays transient', () => {
  const store = createStore(project());
  store.setObjectLocked('free', true);
  const restored = parseProject(JSON.stringify(store.project));
  const html = buildHTML(restored, '/* runtime */', 'en');
  const embedded = JSON.parse(html.match(/<script id="planet-data" type="application\/json">([^]*?)<\/script>/)[1]);
  assert.deepEqual(embedded.objects, [
    object('protected', 0), object('free', 0.4, 'tree'),
  ]);
  store.replace(embedded);
  assert.equal(store.canUndo, false);
  const fresh = createStore(restored);
  assert.equal(fresh.beginEdit('protected'), false);
  assert.equal(fresh.deleteObject('free'), false);
  assert.equal(erase(fresh), false);
  assert.equal(Object.hasOwn(embedded, 'selection'), false);
});

test('lock history shares the existing 40-step bound', () => {
  const store = createStore(project());
  for (let i = 0; i < 45; i++) assert.equal(store.setObjectLocked('free', i % 2 === 0), true);
  let count = 0;
  while (store.undo()) count++;
  assert.equal(count, 40);
});
