import test from 'node:test';
import assert from 'node:assert/strict';
import { createLibrary } from '../prototype/studio/library.js';
import { createProject, parseProject } from '../prototype/studio/model.js';
import { createTemplate } from '../prototype/studio/templates.js';
import { buildHTML } from '../prototype/studio/export.js';

const KEY = 'planet-studio:library:v1';
const DRAFT = 'snowman:planet-studio:v1';
function memoryStorage() {
  const values = new Map([[DRAFT, 'untouched legacy draft']]);
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, String(value)); },
  };
}
const code = (expected) => (error) => error.code === expected;
function project(name = 'My planet') { return { ...createProject(), name }; }

test('saving several snapshots preserves the draft and isolates returned data', async () => {
  const storage = memoryStorage();
  const library = createLibrary(storage);
  const input = createTemplate('forest', 'en');
  const first = await library.save(input);
  input.objects.length = 0;
  const second = await library.save(project('Second'));
  assert.notEqual(first.id, second.id);
  assert.equal(library.list().length, 2);
  assert.equal(library.open(first.id).objects.length, 69);
  const opened = library.open(first.id);
  opened.name = 'Changed editor';
  opened.objects.length = 0;
  first.project.name = 'Changed result';
  assert.equal(library.open(first.id).name, 'Woodland Garden');
  assert.equal(library.open(first.id).objects.length, 69);
  assert.equal(storage.getItem(DRAFT), 'untouched legacy draft');
  assert.equal(createLibrary(storage).open(second.id).name, 'Second');
});

test('explicit save updates only its ID and keeps the collection size', async () => {
  const library = createLibrary(memoryStorage());
  const first = await library.save(project('One'));
  const second = await library.save(project('Two'));
  const changed = project('Edited');
  changed.view.zoom = 1.6;
  await library.save(changed, first.id);
  assert.equal(library.list().length, 2);
  assert.equal(library.open(first.id).name, 'Edited');
  assert.equal(library.open(first.id).view.zoom, 1.6);
  assert.equal(library.open(second.id).name, 'Two');
});

test('rename, independent duplicate and delete survive a reload', async () => {
  const storage = memoryStorage();
  const library = createLibrary(storage);
  const first = await library.save(project('Original'));
  await library.rename(first.id, '  Renamed  ');
  const duplicate = await library.copy(first.id, 'Renamed copy');
  assert.notEqual(duplicate.id, first.id);
  assert.equal(duplicate.project.name, 'Renamed copy');
  await library.rename(duplicate.id, '<img src=x onerror=alert(1)>');
  await library.remove(first.id);
  const restored = createLibrary(storage);
  assert.equal(restored.list().length, 1);
  assert.equal(restored.open(duplicate.id).name, '<img src=x onerror=alert(1)>');
  assert.throws(() => restored.open(first.id), code('libraryMissing'));
  assert.equal(storage.getItem(DRAFT), 'untouched legacy draft');
});

test('missing IDs cannot accidentally become a new or overwritten entry', async () => {
  const storage = memoryStorage();
  const library = createLibrary(storage);
  await library.save(project());
  const before = storage.getItem(KEY);
  for (const operation of [
    () => library.save(project(), 'missing'), () => library.rename('missing', 'Name'),
    () => library.copy('missing', 'Copy'), () => library.remove('missing'),
  ]) await assert.rejects(operation, code('libraryMissing'));
  assert.equal(storage.getItem(KEY), before);
});

test('blank, non-string and overlong names are rejected without writes', async () => {
  const storage = memoryStorage();
  const library = createLibrary(storage);
  const entry = await library.save(project());
  const before = storage.getItem(KEY);
  for (const name of ['', '  ', 'x'.repeat(81), null, {}]) {
    await assert.rejects(() => library.rename(entry.id, name), code('invalidLibraryName'));
    await assert.rejects(() => library.copy(entry.id, name), code('invalidLibraryName'));
    await assert.rejects(() => library.save(project(name)), code('invalidLibraryName'));
  }
  assert.equal(storage.getItem(KEY), before);
});

test('legacy projects normalize without losing view, bookmarks or export content', async () => {
  const library = createLibrary(memoryStorage());
  const legacy = project('Legacy');
  legacy.version = 1;
  delete legacy.settings.environment;
  delete legacy.view.zoom;
  delete legacy.bookmarks;
  const entry = await library.save(legacy);
  assert.equal(entry.project.version, 2);
  assert.equal(entry.project.settings.environment, 'snow');
  assert.equal(entry.project.view.zoom, 1);
  assert.deepEqual(entry.project.bookmarks, []);
  const current = createTemplate('village', 'en');
  current.view.zoom = 1.4;
  current.bookmarks.push({ name: 'Front', view: { x: 0.2, y: 0.4, zoom: 1.6 } });
  const saved = await library.save(current);
  const opened = library.open(saved.id);
  assert.deepEqual(parseProject(JSON.stringify(opened)), current);
  const html = buildHTML(opened, '', 'en');
  const data = JSON.parse(html.match(/<script id="planet-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
  assert.deepEqual(data, current);
});

test('invalid project data is not stored', async () => {
  const storage = memoryStorage();
  const library = createLibrary(storage);
  const input = project();
  input.view.zoom = 50;
  await assert.rejects(() => library.save(input), code('invalidProject'));
  assert.equal(storage.getItem(KEY), null);
});

test('corrupt, unsupported and malformed collections are preserved and never overwritten', async () => {
  for (const raw of ['{bad', 'null', '{"version":2,"entries":[]}', '{"version":1,"entries":{}}',
    '{"version":1,"entries":[{}]}', '']) {
    const storage = memoryStorage();
    storage.setItem(KEY, raw);
    const library = createLibrary(storage);
    assert.throws(() => library.list(), code('invalidLibrary'));
    await assert.rejects(() => library.save(project()), code('invalidLibrary'));
    assert.equal(storage.getItem(KEY), raw);
    assert.equal(storage.getItem(DRAFT), 'untouched legacy draft');
  }
});

test('duplicate IDs, invalid timestamps and invalid stored planets block mutations', async () => {
  const storage = memoryStorage();
  const library = createLibrary(storage);
  await library.save(project());
  const valid = JSON.parse(storage.getItem(KEY));
  for (const mutate of [
    (doc) => doc.entries.push(structuredClone(doc.entries[0])),
    (doc) => { doc.entries[0].updatedAt = 'not a date'; },
    (doc) => { doc.entries[0].id = '__proto__'; },
    (doc) => { doc.entries[0].project.view.zoom = 100; },
  ]) {
    const doc = structuredClone(valid);
    mutate(doc);
    const raw = JSON.stringify(doc);
    storage.setItem(KEY, raw);
    const corrupted = createLibrary(storage);
    assert.throws(() => corrupted.list(), code('invalidLibrary'));
    await assert.rejects(() => corrupted.remove(valid.entries[0].id), code('invalidLibrary'));
    assert.equal(storage.getItem(KEY), raw);
  }
});

test('quota failures preserve the collection, draft and previously returned snapshots', async () => {
  const storage = memoryStorage();
  const library = createLibrary(storage);
  const entry = await library.save(project('Original'));
  const before = storage.getItem(KEY);
  const working = { getItem: storage.getItem, setItem() { throw new Error('quota'); } };
  const full = createLibrary(working);
  full.list();
  for (const operation of [
    () => full.save(project('New')), () => full.save(project('Edit'), entry.id),
    () => full.rename(entry.id, 'Rename'), () => full.copy(entry.id, 'Copy'),
    () => full.remove(entry.id),
  ]) await assert.rejects(operation, code('libraryUnavailable'));
  assert.equal(storage.getItem(KEY), before);
  assert.equal(library.open(entry.id).name, 'Original');
  assert.equal(storage.getItem(DRAFT), 'untouched legacy draft');
});

test('missing or blocked storage produces a recoverable error', async () => {
  for (const storage of [undefined, { getItem() { throw new Error('blocked'); } }]) {
    const library = createLibrary(storage);
    assert.throws(() => library.list(), code('libraryUnavailable'));
    await assert.rejects(() => library.save(project()), code('libraryUnavailable'));
  }
});

test('a stale tab cannot overwrite newer saves or recreate a removed entry', async () => {
  const storage = memoryStorage();
  const first = createLibrary(storage);
  const entry = await first.save(project('Original'));
  const second = createLibrary(storage);
  second.list();
  await first.rename(entry.id, 'Newer');
  await assert.rejects(() => second.save(project('Stale'), entry.id), code('libraryChanged'));
  assert.equal(first.open(entry.id).name, 'Newer');
  second.list();
  await first.remove(entry.id);
  await assert.rejects(() => second.save(project('Stale'), entry.id), code('libraryChanged'));
  assert.equal(first.list().length, 0);
  second.list();
  await assert.rejects(() => second.save(project(), entry.id), code('libraryMissing'));
  assert.equal(first.list().length, 0);
});

test('simultaneous writes cannot report success while losing another saved project', async () => {
  const storage = memoryStorage();
  const first = createLibrary(storage);
  await first.save(project('Original'));
  const second = createLibrary(storage);
  first.list();
  second.list();
  const write = storage.setItem;
  let concurrent;
  storage.setItem = (key, value) => {
    storage.setItem = write;
    concurrent = Promise.resolve(second.save(project('Concurrent B')));
    return write(key, value);
  };
  await first.save(project('Concurrent A'));
  const result = await Promise.allSettled([concurrent]);
  const names = createLibrary(storage).list().map((entry) => entry.project.name);
  if (result[0].status === 'fulfilled') assert.ok(names.includes('Concurrent B'), 'a successful concurrent save must still exist');
  else assert.equal(result[0].reason.code, 'libraryChanged');
  assert.ok(names.includes('Original') && names.includes('Concurrent A'));
});

test('opening a previously selected snapshot refuses changed or deleted records', async () => {
  const storage = memoryStorage();
  const library = createLibrary(storage);
  const entry = await library.save(project('Selected'));
  const selected = library.open(entry.id);
  await library.rename(entry.id, 'Changed elsewhere');
  assert.throws(() => library.open(entry.id, selected), code('libraryChanged'));
  await library.remove(entry.id);
  assert.throws(() => library.open(entry.id, selected), code('libraryMissing'));
});

test('without exclusive locking writes fail clearly and preserve all saved bytes', async () => {
  const storage = memoryStorage();
  const library = createLibrary(storage, null);
  await assert.rejects(async () => library.save(project()), code('libraryLockUnavailable'));
  assert.equal(storage.getItem(KEY), null);
  assert.equal(storage.getItem(DRAFT), 'untouched legacy draft');
});
