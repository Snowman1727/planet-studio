import test from 'node:test';
import assert from 'node:assert/strict';
import { createBrushPresets, validateBrushSettings, PRESETS_KEY } from '../prototype/studio/brush-presets.js';
import { createProject, createStore, parseProject } from '../prototype/studio/model.js';
import { buildHTML } from '../prototype/studio/export.js';

const settings = () => ({ mode: 'mixed', radius: 28, density: 85, mix: { tree: 6, flowers: 3, rock: 1 } });
const code = (expected) => (error) => error.code === expected;
function memoryStorage() {
  const values = new Map([['snowman:planet-studio:v1', 'draft'], ['planet-studio:library:v1', 'library']]);
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)) };
}

test('presets persist detached raw settings across reloads without touching projects', async () => {
  const storage = memoryStorage(), presets = createBrushPresets(storage);
  const input = settings();
  const saved = await presets.save('  Woodland  ', input);
  input.mix.tree = 100; saved.settings.radius = 7;
  const listed = presets.list(); listed[0].settings.mix.rock = 0;
  const restored = createBrushPresets(storage).get(saved.id);
  assert.equal(restored.name, 'Woodland');
  assert.deepEqual(restored.settings, settings());
  assert.equal(storage.getItem('snowman:planet-studio:v1'), 'draft');
  assert.equal(storage.getItem('planet-studio:library:v1'), 'library');
});

test('every painting mode and slider boundary saves without normalizing relative weights', async () => {
  const presets = createBrushPresets(memoryStorage());
  for (const mode of ['tree', 'house', 'broadleaf', 'flowers', 'rock', 'mushroom', 'mixed']) {
    const input = { ...settings(), mode, radius: 7, density: 10 };
    const saved = await presets.save(mode, input);
    assert.deepEqual(presets.get(saved.id).settings, input);
  }
  const high = { ...settings(), radius: 35, density: 100, mix: { tree: 0, flowers: 100, rock: 0 } };
  assert.deepEqual(validateBrushSettings(high), high);
});

test('invalid painting controls reject before writes or mutating inputs', async () => {
  const storage = memoryStorage(), presets = createBrushPresets(storage);
  const invalid = [null, [], {}, ...['select', 'rotate', 'erase', '__proto__'].map(mode => ({ ...settings(), mode })),
    ...[6, 36, 7.5, NaN, Infinity, '28'].map(radius => ({ ...settings(), radius })),
    ...[5, 105, 11, 82.5, '85'].map(density => ({ ...settings(), density })),
    ...[undefined, null, [], {}, { tree: 0, flowers: 0, rock: 0 }, { tree: -1, flowers: 1, rock: 0 },
      { tree: 101, flowers: 1, rock: 0 }, { tree: '6', flowers: 3, rock: 1 },
      { tree: 0.5, flowers: 3, rock: 1 }, { tree: 6, flowers: 3, rock: 1, house: 5 }].map(mix => ({ ...settings(), mix }))];
  for (const config of invalid) {
    assert.throws(() => validateBrushSettings(config), code('invalidPresetSettings'));
    await assert.rejects(() => presets.save('Invalid', config), code('invalidPresetSettings'));
  }
  assert.equal(storage.getItem(PRESETS_KEY), null);
});

test('names trim, allow literal markup, enforce length and case-insensitive uniqueness', async () => {
  const storage = memoryStorage(), presets = createBrushPresets(storage);
  const first = await presets.save('Forest', settings());
  const second = await presets.save('<img src=x onerror=alert(1)>', settings());
  const before = storage.getItem(PRESETS_KEY);
  for (const name of ['', ' ', null, 42, {}, 'x'.repeat(41)]) {
    await assert.rejects(() => presets.save(name, settings()), code('invalidPresetName'));
    await assert.rejects(() => presets.rename(first.id, name), code('invalidPresetName'));
  }
  await assert.rejects(() => presets.save(' forest ', settings()), code('duplicatePresetName'));
  await assert.rejects(() => presets.rename(second.id, 'FOREST'), code('duplicatePresetName'));
  assert.equal(storage.getItem(PRESETS_KEY), before);
  await presets.rename(first.id, ' FOREST ');
  assert.equal(presets.get(first.id).name, 'FOREST');
});

test('rename and confirmed removal affect only the chosen snapshot and survive reload', async () => {
  const storage = memoryStorage(), presets = createBrushPresets(storage);
  const a = await presets.save('One', settings()), b = await presets.save('Two', { ...settings(), mode: 'house' });
  await presets.rename(a.id, 'Renamed');
  assert.deepEqual(presets.get(a.id).settings, settings());
  await presets.remove(b.id);
  assert.equal(createBrushPresets(storage).list()[0].name, 'Renamed');
  const before = storage.getItem(PRESETS_KEY);
  assert.throws(() => presets.get(b.id), code('presetMissing'));
  await assert.rejects(() => presets.rename(b.id, 'Missing'), code('presetMissing'));
  await assert.rejects(() => presets.remove('missing'), code('presetMissing'));
  assert.equal(storage.getItem(PRESETS_KEY), before);
});

test('a full collection refuses additions but still supports rename and delete', async () => {
  const storage = memoryStorage(), presets = createBrushPresets(storage);
  for (let i = 0; i < 24; i++) await presets.save(`Preset ${i}`, settings());
  const before = storage.getItem(PRESETS_KEY);
  await assert.rejects(() => presets.save('Extra', settings()), code('presetLimit'));
  assert.equal(storage.getItem(PRESETS_KEY), before);
  const first = presets.list()[0];
  await presets.rename(first.id, 'New name');
  await presets.remove(first.id);
  await presets.save('Replacement', settings());
  assert.equal(presets.list().length, 24);
});

test('corrupt and oversized collection bytes are preserved rather than replaced', async () => {
  for (const raw of ['', '{bad', 'null', '[]', '{"version":2,"entries":[]}', '{"version":1,"entries":{}}',
    '{"version":1,"entries":[{}]}', JSON.stringify({ version: 1, entries: [], padding: 'x'.repeat(65536) }),
    JSON.stringify({ version: 1, entries: [], padding: '\u732b'.repeat(23000) })]) {
    const storage = memoryStorage(); storage.setItem(PRESETS_KEY, raw);
    const presets = createBrushPresets(storage);
    assert.throws(() => presets.list(), code('invalidPresets'));
    await assert.rejects(() => presets.save('New', settings()), code('invalidPresets'));
    assert.equal(storage.getItem(PRESETS_KEY), raw);
  }
});

test('malformed IDs, dates, duplicate names and invalid stored controls block all mutations', async () => {
  const storage = memoryStorage(), valid = createBrushPresets(storage);
  await valid.save('One', settings()); await valid.save('Two', settings());
  const original = JSON.parse(storage.getItem(PRESETS_KEY));
  for (const mutate of [
    doc => { doc.entries[1].id = doc.entries[0].id; },
    doc => { doc.entries[0].id = '__proto__'; },
    doc => { doc.entries[0].updatedAt = 'yesterday'; },
    doc => { doc.entries[1].name = 'ONE'; },
    doc => { doc.entries[0].name = ' One '; },
    doc => { doc.entries[0].settings.mode = 'erase'; },
    doc => { doc.entries[0].settings.mix.tree = -1; },
    doc => { doc.entries = Array.from({ length: 25 }, (_, i) => ({ ...doc.entries[0], id: `id-${i}`, name: `Name ${i}` })); },
  ]) {
    const doc = structuredClone(original); mutate(doc);
    const raw = JSON.stringify(doc); storage.setItem(PRESETS_KEY, raw);
    const presets = createBrushPresets(storage);
    assert.throws(() => presets.get(original.entries[0].id), code('invalidPresets'));
    await assert.rejects(() => presets.remove(original.entries[0].id), code('invalidPresets'));
    assert.equal(storage.getItem(PRESETS_KEY), raw);
  }
});

test('quota failures leave old bytes and returned settings intact for every mutation', async () => {
  const storage = memoryStorage(), presets = createBrushPresets(storage);
  const a = await presets.save('Original', settings());
  const before = storage.getItem(PRESETS_KEY);
  const full = createBrushPresets({ getItem: storage.getItem, setItem() { throw new Error('quota'); } });
  for (const run of [() => full.save('New', settings()), () => full.rename(a.id, 'Renamed'), () => full.remove(a.id)]) {
    await assert.rejects(run, code('presetsUnavailable'));
    assert.equal(storage.getItem(PRESETS_KEY), before);
    assert.equal(full.get(a.id).name, 'Original');
  }
});

test('missing storage or exclusive locks fails explicitly, never falls back to unsafe writes', async () => {
  for (const storage of [null, undefined, { getItem() { throw new Error('blocked'); } }]) {
    const presets = createBrushPresets(storage);
    assert.throws(() => presets.list(), code('presetsUnavailable'));
    await assert.rejects(() => presets.save('New', settings()), code('presetsUnavailable'));
  }
  const storage = memoryStorage();
  for (const locks of [null, {}, { request() { throw new Error('security'); } }]) {
    await assert.rejects(() => createBrushPresets(storage, locks).save('New', settings()), code('presetLockUnavailable'));
    assert.equal(storage.getItem(PRESETS_KEY), null);
  }
});

test('stale writers must refresh explicitly before editing a newer collection', async () => {
  const storage = memoryStorage(), a = createBrushPresets(storage), b = createBrushPresets(storage);
  const first = await a.save('One', settings()); b.list();
  await a.rename(first.id, 'Newer');
  for (const run of [() => b.save('Stale', settings()), () => b.rename(first.id, 'Stale'), () => b.remove(first.id)]) {
    await assert.rejects(run, code('presetsChanged'));
    assert.equal(a.get(first.id).name, 'Newer');
  }
  b.list(); await b.rename(first.id, 'Refreshed');
  assert.equal(a.get(first.id).name, 'Refreshed');
});

test('a list refresh while a write waits for a lock cannot authorize overwriting another tab', async () => {
  const storage = memoryStorage(), a = createBrushPresets(storage), b = createBrushPresets(storage);
  await a.save('One', settings()); b.list();
  let release, started;
  const ready = new Promise(resolve => { started = resolve; });
  const held = navigator.locks.request(PRESETS_KEY, async () => {
    started(); await new Promise(resolve => { release = resolve; });
  });
  await ready;
  const first = a.save('A', settings()), stale = b.save('B', settings());
  const staleResult = Promise.allSettled([stale]);
  // Observe A's completed bytes before B's exclusive callback gets its turn.
  const write = storage.setItem;
  storage.setItem = (key, raw) => { write(key, raw); b.list(); };
  release(); await held; await first;
  const [result] = await staleResult;
  assert.equal(result.status, 'rejected');
  assert.equal(result.reason.code, 'presetsChanged');
  assert.deepEqual(a.list().map(entry => entry.name), ['One', 'A']);
});

test('saved controls reproduce painting without embedding presets into old/current projects or HTML', async () => {
  const presets = createBrushPresets(memoryStorage());
  const saved = await presets.save('Forest', settings());
  for (const version of [1, 2]) {
    const doc = createProject(42); doc.version = version;
    const store = createStore(doc);
    const s = presets.get(saved.id).settings;
    store.begin(s.mode, s.radius * Math.PI / 180, s.density / 100, 'all', s.mix);
    store.sample([0, 0, 1]); store.commit();
    const objects = structuredClone(store.project.objects);
    assert.ok(objects.length > 10);
    store.begin('tree', 0.4, 1); store.sample([1, 0, 0]); store.cancel();
    assert.deepEqual(store.project.objects, objects);
    store.undo(); assert.equal(store.project.objects.length, 0);
    store.redo(); assert.deepEqual(store.project.objects, objects);
    const roundTrip = parseProject(JSON.stringify(store.project));
    assert.deepEqual(roundTrip, store.project);
    const data = JSON.parse(buildHTML(store.project, '', 'en').match(/<script id="planet-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
    assert.deepEqual(data, store.project);
    assert.equal(Object.hasOwn(data, 'presets'), false);
    assert.equal(Object.hasOwn(data.settings, 'mix'), false);
    const replay = createStore(createProject(42));
    replay.begin('mixed', 28 * Math.PI / 180, 0.85, 'all', { tree: 6, flowers: 3, rock: 1 });
    replay.sample([0, 0, 1]); replay.commit();
    assert.deepEqual(replay.project.objects, objects);
  }
});
