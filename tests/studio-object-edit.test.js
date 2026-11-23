import test from 'node:test';
import assert from 'node:assert/strict';
import { createProject, createStore, parseProject } from '../prototype/studio/model.js';
import { buildHTML } from '../prototype/studio/export.js';

const at = (a) => [Math.sin(a), 0, Math.cos(a)];
const object = (id, a, type = 'house', scale = 1) => ({ id, type, direction: at(a), scale, heading: 0.7 });
function project() {
  const doc = createProject(42);
  doc.objects = [object('a', 0), object('b', 0.5, 'tree')];
  return doc;
}
function edit(store, patch, id = 'a') {
  assert.equal(store.beginEdit(id), true);
  const accepted = store.edit(patch);
  const changed = store.commit();
  return { accepted, changed };
}

test('moving one object keeps identity and all unrelated data exactly', () => {
  const initial = project();
  const store = createStore(initial);
  assert.deepEqual(edit(store, { direction: [0, 3, 0] }), { accepted: true, changed: true });
  assert.deepEqual(store.project.objects[0], { ...initial.objects[0], direction: [0, 1, 0] });
  assert.deepEqual(store.project.objects[1], initial.objects[1]);
  assert.deepEqual(parseProject(JSON.stringify(store.project)), store.project);
});

test('heading edits do not round anchors and scale stays within the existing schema', () => {
  const initial = project();
  const store = createStore(initial);
  edit(store, { heading: Math.PI });
  assert.deepEqual(store.project.objects[0], { ...initial.objects[0], heading: Math.PI });
  edit(store, { scale: 1.2 });
  assert.deepEqual(store.project.objects[0], { ...initial.objects[0], heading: Math.PI, scale: 1.2 });
});

test('multiple drag samples commit as one exact undo/redo step preserving later metadata', () => {
  const initial = project();
  const store = createStore(initial);
  store.beginEdit('a');
  for (const a of [-0.2, -0.3, -0.4]) assert.equal(store.edit({ direction: at(a) }), true);
  assert.equal(store.commit(), true);
  const after = structuredClone(store.project.objects);
  store.project.name = 'Later';
  store.project.settings.environment = 'desert';
  store.project.view.zoom = 1.3;
  assert.equal(store.undo(), true);
  assert.deepEqual(store.project.objects, initial.objects);
  assert.equal(store.canUndo, false);
  assert.equal(store.project.name, 'Later');
  assert.equal(store.project.settings.environment, 'desert');
  assert.equal(store.project.view.zoom, 1.3);
  assert.equal(store.redo(), true);
  assert.deepEqual(store.project.objects, after);
});

test('collision rejects moves and growth but excludes the selected object itself', () => {
  const initial = project();
  initial.objects[1] = object('b', 0.24, 'house');
  const store = createStore(initial);
  store.beginEdit('a');
  assert.equal(store.edit({ heading: 2 }), true);
  assert.equal(store.edit({ scale: 1.2 }), false);
  assert.equal(store.edit({ direction: at(0.12) }), false);
  assert.deepEqual(store.project.objects[0], { ...initial.objects[0], heading: 2 });
  assert.equal(store.edit({ direction: at(-0.1), scale: 1.2 }), true);
  store.commit();
});

test('invalid patches never destroy an active valid edit or permit identity changes', () => {
  const store = createStore(project());
  store.beginEdit('a');
  store.edit({ heading: 2 });
  const during = structuredClone(store.project);
  for (const patch of [null, [], { id: 'b' }, { type: 'tree' }, { x: 1 }, { scale: NaN },
    { scale: 0.74 }, { scale: 1.21 }, { heading: -1 }, { heading: Infinity },
    { heading: 7 }, { direction: null }, { direction: [0, 0, 0] }, { direction: [1, 0] },
    { direction: [Infinity, 0, 0] }, { direction: [Number.MAX_VALUE, Number.MAX_VALUE, 0] }]) {
    assert.throws(() => store.edit(patch), { code: 'invalidObjectEdit' });
    assert.equal(store.active, true);
    assert.deepEqual(store.project, during);
  }
});

test('cancel and no-op preserve pending redo, including a drag returning to its start', () => {
  const initial = project();
  const store = createStore(initial);
  edit(store, { heading: 2 });
  store.undo();
  store.beginEdit('a');
  store.edit({ direction: at(-0.4) });
  store.cancel();
  assert.deepEqual(store.project, initial);
  assert.equal(store.canRedo, true);
  assert.deepEqual(edit(store, {}), { accepted: true, changed: false });
  store.beginEdit('a');
  store.edit({ heading: 3 });
  store.edit({ heading: 0.7 });
  assert.equal(store.commit(), false);
  assert.equal(store.canUndo, false);
  assert.equal(store.canRedo, true);
});

test('deletion is one undoable operation and missing IDs never delete another object', () => {
  const initial = project();
  const store = createStore(initial);
  assert.equal(store.deleteObject('a'), true);
  assert.deepEqual(store.project.objects, [initial.objects[1]]);
  assert.equal(store.deleteObject('missing'), false);
  store.undo();
  assert.deepEqual(store.project.objects, initial.objects);
  assert.equal(store.canUndo, false);
  store.redo();
  assert.deepEqual(store.project.objects, [initial.objects[1]]);
});

test('replacement and stale selection cannot edit or delete a different project', () => {
  const store = createStore(project());
  store.beginEdit('a');
  store.edit({ heading: 2 });
  store.replace(createProject(7));
  assert.equal(store.active, false);
  assert.equal(store.beginEdit('a'), false);
  assert.equal(store.edit({ heading: 1 }), false);
  assert.equal(store.deleteObject('a'), false);
  assert.deepEqual(store.project.objects, []);
  assert.equal(store.canUndo, false);
});

test('brush and object transactions cancel one another rather than mixing samples', () => {
  const initial = project();
  const store = createStore(initial);
  store.beginEdit('a');
  store.edit({ heading: 3 });
  store.sample(at(0));
  assert.equal(store.project.objects.length, 2);
  store.begin('erase', 0.15, 1);
  store.sample(at(0));
  store.cancel();
  assert.deepEqual(store.project, initial);
  store.begin('erase', 0.15, 1);
  store.sample(at(0));
  store.beginEdit('b');
  store.edit({ heading: 3 });
  store.cancel();
  assert.deepEqual(store.project, initial);
});

test('the spatial index tracks moved, canceled, deleted and restored objects', () => {
  const store = createStore(project());
  edit(store, { direction: at(-0.5) });
  assert.equal(edit(store, { direction: at(0) }, 'b').accepted, true);
  store.undo();
  store.undo();
  assert.equal(edit(store, { direction: at(0) }, 'b').accepted, false);
  store.deleteObject('a');
  assert.equal(edit(store, { direction: at(0) }, 'b').accepted, true);
});

test('pole and longitude seam neighbors still enforce footprint spacing', () => {
  for (const directions of [
    [[0, 1, 0], [0.02, Math.sqrt(1 - 0.02 ** 2), 0]],
    [[0.001, 0, -Math.sqrt(1 - 0.001 ** 2)], [-0.001, 0, -Math.sqrt(1 - 0.001 ** 2)]],
  ]) {
    const doc = project();
    doc.objects[1].direction = directions[0];
    const store = createStore(doc);
    assert.equal(edit(store, { direction: directions[1] }).accepted, false);
    assert.deepEqual(store.project.objects, doc.objects);
  }
});

test('existing overlap permits heading changes and shrinking but never growth', () => {
  const doc = project();
  doc.objects[1].direction = at(0.1);
  const store = createStore(doc);
  assert.equal(edit(store, { heading: 2 }).accepted, true);
  assert.equal(edit(store, { scale: 0.75 }).accepted, true);
  assert.equal(edit(store, { scale: 0.76 }).accepted, false);
});

test('history remains bounded for independent object edits', () => {
  const store = createStore(project());
  for (let i = 0; i < 45; i++) edit(store, { heading: i % 2 ? 2 : 3 });
  let undos = 0;
  while (store.undo()) undos++;
  assert.equal(undos, 40);
});

test('legacy poses remain editable and final poses survive JSON and HTML', () => {
  const legacy = { ...project(), version: 1, settings: { snow: true, autoRotate: false } };
  const store = createStore(parseProject(JSON.stringify(legacy)));
  edit(store, { direction: [0, 1, 0], heading: 2, scale: 1.2 });
  const restored = parseProject(JSON.stringify(store.project));
  assert.deepEqual(restored.objects[0], { ...legacy.objects[0], direction: [0, 1, 0], heading: 2, scale: 1.2 });
  const html = buildHTML(restored, '/* runtime */', 'en');
  const embedded = JSON.parse(html.match(/<script id="planet-data" type="application\/json">([^]*?)<\/script>/)[1]);
  assert.deepEqual(embedded.objects, restored.objects);
  assert.equal(Object.hasOwn(embedded, 'selection'), false);
});

test('moving a generated object does not let the brush duplicate its ID', () => {
  const store = createStore(createProject(42));
  store.begin('tree', 0.3, 1);
  store.sample(at(0));
  store.commit();
  const chosen = store.project.objects[0];
  assert.ok(chosen);
  edit(store, { direction: [0, -1, 0] }, chosen.id);
  store.begin('tree', 0.3, 1);
  store.sample(at(0));
  store.commit();
  assert.equal(store.project.objects.filter((item) => item.id === chosen.id).length, 1);
  assert.deepEqual(store.project.objects.find((item) => item.id === chosen.id).direction, [0, -1, 0]);
});
