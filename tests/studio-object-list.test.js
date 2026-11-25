import test from 'node:test';
import assert from 'node:assert/strict';
import { Euler, Vector3 } from 'three';
import { createProject, createStore, parseProject } from '../prototype/studio/model.js';
import { buildHTML } from '../prototype/studio/export.js';

const helpers = () => import('../prototype/studio/object-list.js');
const item = (id, type = 'tree', direction = [0, 0, 1]) => ({ id, type, direction, scale: 1, heading: 0 });

test('object search intersects type and literal case-insensitive ID without changing order or data', async () => {
  const { objectPage } = await helpers();
  const objects = [item('TREE:10'), item('house:10', 'house'), item('tree:11'), item('tree:100')];
  const before = structuredClone(objects);
  assert.deepEqual(objectPage(objects, { type: 'tree', query: ' :10 ' }).objects.map(o => o.id), ['TREE:10', 'tree:100']);
  assert.deepEqual(objectPage(objects, { type: 'house', query: ':10' }).objects.map(o => o.id), ['house:10']);
  assert.equal(objectPage(objects, { query: '.*' }).total, 0);
  assert.equal(objectPage(objects, { query: '<img onerror=x>' }).total, 0);
  assert.deepEqual(objects, before);
});

test('object pages cover 2000 entries exactly once while bounding each result', async () => {
  const { objectPage } = await helpers();
  const objects = Array.from({ length: 2000 }, (_, i) => item(`tree:${i}`));
  const seen = [];
  for (let page = 0; page < 84; page++) {
    const result = objectPage(objects, { page });
    assert.equal(result.total, 2000);
    assert.equal(result.pages, 84);
    assert.equal(result.page, page);
    assert.equal(result.objects.length, page === 83 ? 8 : 24);
    seen.push(...result.objects.map(o => o.id));
  }
  assert.deepEqual(seen, objects.map(o => o.id));
});

test('empty results and stale pages clamp after filtering or deletion', async () => {
  const { objectPage } = await helpers();
  assert.deepEqual(objectPage([], { page: 9 }), { objects: [], total: 0, page: 0, pages: 1 });
  const objects = Array.from({ length: 25 }, (_, i) => item(`tree:${i}`));
  assert.equal(objectPage(objects, { page: 999 }).objects[0].id, 'tree:24');
  objects.pop();
  assert.equal(objectPage(objects, { page: 1 }).page, 0);
  assert.equal(objectPage(objects, { page: -1 }).objects[0].id, 'tree:0');
  assert.equal(objectPage(objects, { page: NaN }).page, 0);
  assert.equal(objectPage(objects, { query: 'missing', page: 99 }).page, 0);
});

test('located view brings cardinal and polar anchors forward using the actual XYZ roll', async () => {
  const { objectView } = await helpers();
  for (const direction of [[0, 0, 1], [0, 0, -1], [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0],
    [0.6, 0.8, 0], [-0.36, 0.48, -0.8]]) {
    const view = objectView(direction, 1.7);
    const point = new Vector3(...direction).applyEuler(new Euler(view.x, view.y, -0.04, 'XYZ'));
    assert.ok(Math.abs(point.x) < 1e-10);
    assert.ok(Math.abs(point.y) < 0.071);
    assert.ok(point.z > 0.997);
    assert.equal(view.zoom, 1.7);
    assert.ok(view.x >= -1.5 && view.x <= 1.5);
    assert.ok(Math.abs(view.y) <= Math.PI);
  }
});

test('targeting preserves lock data and history while view survives JSON and HTML', async () => {
  const { objectView } = await helpers();
  const doc = createProject(42);
  doc.objects = [{ ...item('locked:1', 'house', [0, 0, -1]), locked: true }];
  const store = createStore(doc);
  store.setObjectLocked('locked:1', false);
  store.undo();
  const before = structuredClone(store.project.objects);
  store.project.view = objectView(before[0].direction, 1.4);
  store.addBookmark('Located', store.project.view);
  const restored = parseProject(JSON.stringify(store.project));
  assert.deepEqual(restored.objects, before);
  assert.deepEqual(restored.view, store.project.view);
  assert.deepEqual(restored.bookmarks, [{ name: 'Located', view: restored.view }]);
  assert.equal(store.canUndo, false);
  assert.equal(store.canRedo, true);
  const html = buildHTML(restored, '/* runtime */', 'en');
  const embedded = JSON.parse(html.match(/<script id="planet-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
  assert.deepEqual(embedded.objects, before);
  assert.deepEqual(embedded.view, restored.view);
  assert.deepEqual(embedded.bookmarks, restored.bookmarks);
  assert.ok(store.redo());
  assert.equal(store.project.objects[0].locked, undefined);
  assert.deepEqual(store.project.view, restored.view);
});

test('legacy projects can be listed and focused without changing their poses', async () => {
  const { objectPage, objectView } = await helpers();
  for (const version of [1, 2]) {
    const doc = createProject();
    doc.version = version;
    doc.objects = [item('old:1', 'house', [0, 0, -1])];
    delete doc.view.zoom;
    delete doc.bookmarks;
    const parsed = parseProject(JSON.stringify(doc));
    const found = objectPage(parsed.objects, { query: 'old:' }).objects[0];
    parsed.view = objectView(found.direction, parsed.view.zoom);
    assert.deepEqual(parseProject(JSON.stringify(parsed)).objects, doc.objects);
  }
});
