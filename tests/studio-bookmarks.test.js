import test from 'node:test';
import assert from 'node:assert/strict';
import { createProject, createStore, parseProject } from '../prototype/studio/model.js';
import { buildHTML } from '../prototype/studio/export.js';

const roundtrip = (value) => parseProject(JSON.stringify(value));

test('legacy schema 1 and 2 projects migrate to an empty saved-view list', () => {
  for (const version of [1, 2]) {
    const project = createProject(9);
    project.version = version;
    delete project.bookmarks;
    const restored = roundtrip(project);
    assert.deepEqual(restored.bookmarks, []);
    assert.deepEqual(restored.view, project.view);
  }
  assert.deepEqual(createProject().bookmarks, []);
});

test('saved views capture independent coordinates and enforce names and the eight-view limit', () => {
  const store = createStore(createProject(9));
  const view = { x: 0.3, y: -0.5, zoom: 1.4 };
  store.addBookmark('  North  ', view);
  view.x = 1;
  assert.deepEqual(store.project.bookmarks[0], { name: 'North', view: { x: 0.3, y: -0.5, zoom: 1.4 } });
  assert.throws(() => store.addBookmark('north', store.project.view), { code: 'bookmarkDuplicate' });
  assert.throws(() => store.addBookmark('   ', store.project.view), { code: 'invalidBookmark' });
  assert.throws(() => store.addBookmark('x'.repeat(41), store.project.view), { code: 'invalidBookmark' });
  assert.throws(() => store.addBookmark('Bad', { x: 0, y: 0, zoom: 3 }), { code: 'invalidBookmark' });
  for (let i = 1; i < 8; i++) store.addBookmark(`View ${i}`, store.project.view);
  assert.equal(store.project.bookmarks.length, 8);
  assert.throws(() => store.addBookmark('Ninth', store.project.view), { code: 'bookmarkLimit' });
  assert.equal(store.removeBookmark(2), true);
  assert.equal(store.project.bookmarks.length, 7);
  assert.equal(store.removeBookmark(99), false);
  store.addBookmark('Ninth', store.project.view);
  assert.equal(store.project.bookmarks.length, 8);
});

test('saved views survive JSON and exported standalone HTML with inert names', () => {
  const store = createStore(createProject(9));
  store.addBookmark('<img src=x onerror=alert(1)>', { x: -0.3, y: 0.4, zoom: 0.8 });
  const project = roundtrip(store.project);
  assert.deepEqual(project.bookmarks, store.project.bookmarks);
  const html = buildHTML(project, '', 'en');
  const embedded = JSON.parse(html.match(/<script id="planet-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
  assert.deepEqual(embedded.bookmarks, project.bookmarks);
  assert.match(html, /id="player-views"/);
  assert.ok(!html.includes('<img src=x onerror=alert(1)>'));
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
});

test('explicit malformed saved-view data is rejected without changing the input', () => {
  const project = createProject(9);
  const valid = { name: 'North', view: { x: 0.3, y: -0.5, zoom: 1.4 } };
  const invalid = [null, {}, 'views', Array(9).fill(valid), [null], [{ ...valid, name: '' }],
    [{ ...valid, name: '  ' }], [{ ...valid, name: 'x'.repeat(41) }],
    [{ ...valid, view: { x: 0, y: 0, zoom: null } }],
    [{ ...valid, view: { x: 2, y: 0, zoom: 1 } }],
    [valid, { ...valid, name: 'north' }]];
  for (const bookmarks of invalid) {
    const input = { ...project, bookmarks };
    const before = JSON.stringify(input);
    assert.throws(() => parseProject(before), { code: 'invalidProject' });
    assert.equal(JSON.stringify(input), before);
  }
});

test('bookmark edits and view jumps preserve object undo and redo', () => {
  const store = createStore(createProject(9));
  store.begin('tree', 0.4, 1);
  store.sample([0, 0, 1]);
  store.commit();
  const objects = structuredClone(store.project.objects);
  assert.ok(objects.length > 0);
  store.undo();
  store.addBookmark('Home', { x: 0.2, y: 0.4, zoom: 1.2 });
  store.project.view = { ...store.project.bookmarks[0].view };
  assert.equal(store.canRedo, true);
  store.redo();
  assert.deepEqual(store.project.objects, objects);
  assert.deepEqual(store.project.bookmarks.map((bookmark) => bookmark.name), ['Home']);
  assert.deepEqual(store.project.view, { x: 0.2, y: 0.4, zoom: 1.2 });
  store.undo();
  store.removeBookmark(0);
  store.redo();
  assert.deepEqual(store.project.bookmarks, []);
});
