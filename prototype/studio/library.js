import { parseProject } from './model.js';
import { localizedError } from './i18n.js';

export const LIBRARY_KEY = 'planet-studio:library:v1';
const fail = (code) => { throw localizedError(code); };
function nameOf(name) {
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 80) fail('invalidLibraryName');
  return name.trim();
}
function validate(raw) {
  if (raw === null) return { version: 1, entries: [] };
  try {
    const doc = JSON.parse(raw);
    if (doc?.version !== 1 || !Array.isArray(doc.entries)) throw new Error();
    const ids = new Set();
    const entries = doc.entries.map((entry) => {
      if (!entry || typeof entry.id !== 'string' || !/^[a-zA-Z0-9-]{1,64}$/.test(entry.id) ||
          ids.has(entry.id) || typeof entry.updatedAt !== 'string' ||
          new Date(entry.updatedAt).toISOString() !== entry.updatedAt) throw new Error();
      ids.add(entry.id);
      const project = parseProject(JSON.stringify(entry.project));
      if (nameOf(project.name) !== project.name) throw new Error();
      return { id: entry.id, updatedAt: entry.updatedAt, project };
    });
    return { version: 1, entries };
  } catch { fail('invalidLibrary'); }
}

export function createLibrary(storage, locks = globalThis.navigator?.locks) {
  let observed;
  let collection;
  function getRaw() {
    try {
      if (!storage) throw new Error();
      return storage.getItem(LIBRARY_KEY);
    } catch { fail('libraryUnavailable'); }
  }
  function read() {
    const raw = getRaw();
    const next = validate(raw);
    observed = raw;
    collection = next;
    return next;
  }
  function find(doc, id) {
    const entry = doc.entries.find((item) => item.id === id);
    if (!entry) fail('libraryMissing');
    return entry;
  }
  async function mutate(change) {
    if (observed === undefined) read();
    if (!locks?.request) fail('libraryLockUnavailable');
    const expected = observed;
    const before = collection;
    try {
      return await locks.request(LIBRARY_KEY, { mode: 'exclusive' }, async () => {
        // Capture the revision before waiting: later list refreshes cannot
        // authorize an already queued save against someone else's changes.
        if (getRaw() !== expected) fail('libraryChanged');
        const next = structuredClone(before);
        const result = change(next);
        const raw = JSON.stringify(next);
        try { storage.setItem(LIBRARY_KEY, raw); }
        catch { fail('libraryUnavailable'); }
        observed = raw;
        collection = next;
        return structuredClone(result);
      });
    } catch (error) {
      if (error?.code && typeof error.code === 'string') throw error;
      fail('libraryLockUnavailable');
    }
  }
  return {
    list() { return structuredClone(read().entries).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)); },
    open(id, expected) {
      const project = find(read(), id).project;
      if (expected && JSON.stringify(project) !== JSON.stringify(expected)) fail('libraryChanged');
      return structuredClone(project);
    },
    async save(project, id = null) {
      const name = nameOf(project?.name);
      const validated = parseProject(JSON.stringify({ ...project, name }));
      return mutate((doc) => {
        const entry = id === null ? { id: crypto.randomUUID() } : find(doc, id);
        entry.project = validated;
        entry.updatedAt = new Date().toISOString();
        if (id === null) doc.entries.push(entry);
        return entry;
      });
    },
    async rename(id, name) {
      const trimmed = nameOf(name);
      return mutate((doc) => {
        const entry = find(doc, id);
        entry.project.name = trimmed;
        entry.updatedAt = new Date().toISOString();
        return entry;
      });
    },
    async copy(id, name) {
      const trimmed = nameOf(name);
      return mutate((doc) => {
        const entry = structuredClone(find(doc, id));
        entry.id = crypto.randomUUID();
        entry.project.name = trimmed;
        entry.updatedAt = new Date().toISOString();
        doc.entries.push(entry);
        return entry;
      });
    },
    remove(id) {
      return mutate((doc) => {
        find(doc, id);
        doc.entries = doc.entries.filter((entry) => entry.id !== id);
        return true;
      });
    },
  };
}
