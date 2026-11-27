import { localizedError } from './i18n.js';
import { mixShares } from './mixed-brush.js';

export const PRESETS_KEY = 'planet-studio:brush-presets:v1';
export const PRESET_LIMIT = 24;
const MAX_BYTES = 64 * 1024;
const modes = new Set(['tree', 'house', 'broadleaf', 'flowers', 'rock', 'mushroom', 'mixed']);
const fail = code => { throw localizedError(code); };
const size = raw => new TextEncoder().encode(raw).byteLength;
function nameOf(name) {
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 40) fail('invalidPresetName');
  return name.trim();
}
export function validateBrushSettings(config) {
  if (!config || !modes.has(config.mode) || !Number.isInteger(config.radius) || config.radius < 7 || config.radius > 35 ||
      !Number.isInteger(config.density) || config.density < 10 || config.density > 100 || config.density % 5 !== 0) fail('invalidPresetSettings');
  if (config.mix === undefined) fail('invalidPresetSettings');
  try { mixShares(config.mix); } catch { fail('invalidPresetSettings'); }
  return { mode: config.mode, radius: config.radius, density: config.density, mix: { ...config.mix } };
}
function validate(raw) {
  if (raw === null) return { version: 1, entries: [] };
  try {
    if (typeof raw !== 'string' || size(raw) > MAX_BYTES) throw new Error();
    const doc = JSON.parse(raw);
    if (doc?.version !== 1 || !Array.isArray(doc.entries) || doc.entries.length > PRESET_LIMIT) throw new Error();
    const ids = new Set(), names = new Set();
    const entries = doc.entries.map(entry => {
      if (!entry || typeof entry.id !== 'string' || !/^[a-zA-Z0-9-]{1,64}$/.test(entry.id) || ids.has(entry.id) ||
          typeof entry.updatedAt !== 'string' || new Date(entry.updatedAt).toISOString() !== entry.updatedAt ||
          nameOf(entry.name) !== entry.name || names.has(entry.name.toLowerCase())) throw new Error();
      ids.add(entry.id); names.add(entry.name.toLowerCase());
      return { id: entry.id, name: entry.name, updatedAt: entry.updatedAt, settings: validateBrushSettings(entry.settings) };
    });
    return { version: 1, entries };
  } catch { fail('invalidPresets'); }
}

export function createBrushPresets(storage, locks = globalThis.navigator?.locks) {
  let observed, collection;
  function getRaw() {
    try {
      if (!storage) throw new Error();
      return storage.getItem(PRESETS_KEY);
    } catch { fail('presetsUnavailable'); }
  }
  function read() {
    const raw = getRaw(), next = validate(raw);
    observed = raw; collection = next;
    return next;
  }
  function find(doc, id) {
    const entry = doc.entries.find(item => item.id === id);
    if (!entry) fail('presetMissing');
    return entry;
  }
  function unique(doc, name, id = null) {
    if (doc.entries.some(entry => entry.id !== id && entry.name.toLowerCase() === name.toLowerCase())) fail('duplicatePresetName');
  }
  async function mutate(change) {
    if (observed === undefined) read();
    if (!locks?.request) fail('presetLockUnavailable');
    // A refresh during lock acquisition must not authorize a queued stale write.
    const expected = observed, before = collection;
    try {
      return await locks.request(PRESETS_KEY, { mode: 'exclusive' }, async () => {
        if (getRaw() !== expected) fail('presetsChanged');
        const next = structuredClone(before), result = change(next);
        const raw = JSON.stringify(next);
        if (size(raw) > MAX_BYTES) fail('invalidPresets');
        try { storage.setItem(PRESETS_KEY, raw); } catch { fail('presetsUnavailable'); }
        observed = raw; collection = next;
        return structuredClone(result);
      });
    } catch (error) {
      if (typeof error?.code === 'string') throw error;
      fail('presetLockUnavailable');
    }
  }
  return {
    list() { return structuredClone(read().entries); },
    get(id) { return structuredClone(find(read(), id)); },
    async save(name, config) {
      const trimmed = nameOf(name), settings = validateBrushSettings(config);
      return mutate(doc => {
        unique(doc, trimmed);
        if (doc.entries.length >= PRESET_LIMIT) fail('presetLimit');
        const entry = { id: crypto.randomUUID(), name: trimmed, settings, updatedAt: new Date().toISOString() };
        doc.entries.push(entry);
        return entry;
      });
    },
    async rename(id, name) {
      const trimmed = nameOf(name);
      return mutate(doc => {
        const entry = find(doc, id);
        unique(doc, trimmed, id);
        entry.name = trimmed; entry.updatedAt = new Date().toISOString();
        return entry;
      });
    },
    remove(id) {
      return mutate(doc => {
        find(doc, id);
        doc.entries = doc.entries.filter(entry => entry.id !== id);
        return true;
      });
    },
  };
}
