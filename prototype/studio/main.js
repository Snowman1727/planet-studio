import { createIcons, Orbit, Undo2, Redo2, FilePlus2, FolderOpen, Save, Download, Trees, House, Eraser, Rotate3d, TreeDeciduous, Flower2, Mountain, Umbrella, TreePine, Eye, Pause, Play, X, FileCode2, Copy, ZoomIn, ZoomOut, Bookmark, BookmarkPlus, Trash2, LayoutTemplate, ArrowUpRight, Library, CopyPlus, Pencil, MousePointer2, Check, LockKeyhole } from 'lucide';
import playerRuntime from 'virtual:planet-player';
import { createProject, createStore, parseProject, MAX_OBJECTS, MAX_FILE_BYTES, BOOKMARK_LIMIT } from './model.js';
import { createScene } from './scene.js';
import { buildHTML, embedCode, safeFilename } from './export.js';
import { BRUSHES } from './catalog.js';
import { t, loadLocale, saveLocale, errorMessage, localizedError } from './i18n.js';
import { bindNavigation } from './navigation.js';
import { createTemplate } from './templates.js';
import { bindLibrary } from './library-ui.js';
import { bindObjectInspector } from './object-inspector.js';
import { dragDirection } from './object-edit.js';
import './style.css';

createIcons({ icons: { Orbit, Undo2, Redo2, FilePlus2, FolderOpen, Save, Download, Trees, House, Eraser, Rotate3d, TreeDeciduous, Flower2, Mountain, Umbrella, TreePine, Eye, Pause, Play, X, FileCode2, Copy, ZoomIn, ZoomOut, Bookmark, BookmarkPlus, Trash2, LayoutTemplate, ArrowUpRight, Library, CopyPlus, Pencil, MousePointer2, Check, LockKeyhole } });
const $ = (id) => document.getElementById(id);
const canvas = $('studio-canvas');
const stage = $('stage');
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
const STORAGE_KEY = 'snowman:planet-studio:v1';
let preferenceStorage;
try { preferenceStorage = window.localStorage; } catch { /* Storage is optional. */ }
let locale = loadLocale(preferenceStorage);
let initial = createProject();
initial.name = t(locale, 'untitled');
let recovered = false;
let storageAvailable = true;
try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) { initial = parseProject(saved); recovered = true; }
} catch { storageAvailable = false; }
const store = createStore(initial);
let scene;
let navigation;
let libraryUI;
let inspector;
let mode = 'tree';
let previewing = false;
let paused = false;
let pointer = null;
let failed = false;
let sceneError = null;
let statusState = { key: 'ready', error: false, params: {} };
let saveState = 'newWork';
let exportingImage = false;
let exportStatus = null;
let bookmarkFeedback = null;
let pending = null;
let storageTimer;
let recoverySnapshot = null;
let savedJSON = recovered ? '' : JSON.stringify(store.project);
const urls = new Set();
const radius = () => Number($('brush-radius').value) * Math.PI / 180;
const density = () => Number($('brush-density').value) / 100;
const text = () => JSON.stringify(store.project);
const hasUnsaved = () => text() !== savedJSON;
function renderStatus() {
  const { key, error, params } = statusState;
  const values = params.environment ? { ...params, environment: t(locale, params.environment) } : params;
  $('status').textContent = t(locale, key, values);
  $('status').dataset.error = String(error);
}
function announce(key, error = false, params = {}) {
  statusState = { key, error, params };
  renderStatus();
}
function setSaveState(key) {
  saveState = key;
  $('save-state').textContent = t(locale, key);
}
function announceError(error, fallback) {
  // Store the key, so switching language also translates an existing error.
  const key = ['invalidProject', 'fileTooLarge', 'invalidBrush', 'contextLost'].includes(error?.code) ? error.code : fallback;
  announce(key, true);
}
function renderLanguage() {
  document.documentElement.lang = locale;
  document.title = t(locale, 'title');
  $('language-setting').value = locale;
  for (const [selector, attribute, dataKey] of [
    ['[data-i18n]', null, 'i18n'],
    ['[data-i18n-label]', 'aria-label', 'i18nLabel'],
    ['[data-i18n-title]', 'title', 'i18nTitle'],
  ]) {
    document.querySelectorAll(selector).forEach((element) => {
      const value = t(locale, element.dataset[dataKey]);
      if (attribute) element.setAttribute(attribute, value);
      else element.textContent = value;
    });
  }
  $('preview-label').textContent = t(locale, previewing ? 'returnToEdit' : 'preview');
  $('scene-mode').textContent = t(locale, previewing ? 'previewing' : 'editing');
  const playbackLabel = t(locale, paused ? 'playAnimation' : 'pauseAnimation');
  $('pause-preview').setAttribute('aria-label', playbackLabel);
  $('pause-preview').title = playbackLabel;
  if (sceneError) $('scene-error').textContent = errorMessage(sceneError, locale);
  $('export-object-count').textContent = t(locale, 'objectCount', { count: store.project.objects.length });
  setSaveState(saveState);
  renderStatus();
  updateEmbed();
  renderExportStatus();
  renderBookmarkDialog();
  if ($('library-dialog').open) libraryUI?.render();
  inspector?.render();
}
function renderBookmarkDialog() {
  const bookmarks = store.project.bookmarks;
  $('bookmark-count').textContent = t(locale, 'savedViewCount', { count: bookmarks.length });
  $('bookmark-empty').hidden = bookmarks.length > 0;
  $('bookmark-name').disabled = bookmarks.length >= BOOKMARK_LIMIT || failed;
  $('save-bookmark').disabled = bookmarks.length >= BOOKMARK_LIMIT || failed;
  $('bookmark-feedback').textContent = bookmarkFeedback ? t(locale, bookmarkFeedback.key) : '';
  $('bookmark-feedback').dataset.error = String(Boolean(bookmarkFeedback?.error));
  const list = $('bookmark-list');
  list.replaceChildren();
  bookmarks.forEach((bookmark, index) => {
    const row = document.createElement('li');
    const go = document.createElement('button');
    go.type = 'button';
    go.className = 'bookmark-go';
    go.dataset.bookmarkGo = String(index);
    go.setAttribute('aria-label', t(locale, 'jumpToView', { name: bookmark.name }));
    const name = document.createElement('span');
    name.textContent = bookmark.name;
    const zoom = document.createElement('small');
    zoom.textContent = `${Math.round(bookmark.view.zoom * 100)}%`;
    go.append(name, zoom);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'icon-button';
    remove.dataset.bookmarkDelete = String(index);
    remove.setAttribute('aria-label', t(locale, 'deleteView', { name: bookmark.name }));
    remove.title = t(locale, 'deleteView', { name: bookmark.name });
    remove.innerHTML = '<i data-bookmark-icon="trash-2"></i>';
    remove.disabled = failed;
    row.append(go, remove);
    list.append(row);
  });
  createIcons({ icons: { Trash2 }, nameAttr: 'data-bookmark-icon' });
}
function renderExportStatus() {
  $('export-status').textContent = exportStatus ? t(locale, exportStatus) : '';
  $('export-status').dataset.error = String(exportStatus === 'pngFailed');
  $('download-png').disabled = exportingImage || failed;
  $('png-panel').setAttribute('aria-busy', String(exportingImage));
}
function renderError(error) {
  cancelStroke();
  failed = true;
  sceneError = error;
  $('scene-error').hidden = false;
  $('scene-error').textContent = errorMessage(error, locale);
  $('stage-loading').hidden = true;
  document.querySelectorAll('button[data-mode]').forEach((button) => { button.disabled = true; });
  $('preview').disabled = true;
  $('open-bookmarks').disabled = true;
  $('erase-type').disabled = true;
  renderBookmarkDialog();
  navigation?.reset();
  navigation?.render();
  renderExportStatus();
  inspector?.render();
  announce('renderStatus', true);
}
function refresh({ fields = false } = {}) {
  const doc = store.project;
  scene?.sync(doc);
  stage.dataset.count = String(doc.objects.length);
  $('object-count').textContent = String(doc.objects.length);
  for (const type of Object.keys(BRUSHES)) {
    $(`${type}-count`).textContent = String(doc.objects.filter((o) => o.type === type).length);
  }
  $('environment-label').textContent = t(locale, doc.settings.environment);
  $('snow-option').hidden = doc.settings.environment !== 'snow';
  $('snow-setting').disabled = doc.settings.environment !== 'snow';
  $('object-meter').style.width = `${doc.objects.length / MAX_OBJECTS * 100}%`;
  $('scene-detail').textContent = doc.objects.length ? t(locale, 'objectCount', { count: doc.objects.length }) : t(locale, 'blankPlanet');
  $('seed-label').textContent = `SEED · ${doc.seed}`;
  $('undo').disabled = !store.canUndo;
  $('redo').disabled = !store.canRedo;
  navigation?.render();
  inspector?.render();
  if (fields) {
    $('project-name').value = doc.name;
    $('snow-setting').checked = doc.settings.snow;
    $('rotation-setting').checked = doc.settings.autoRotate;
    document.querySelectorAll('[name="environment"]').forEach((input) => {
      input.checked = input.value === doc.settings.environment;
    });
  }
}
function flushRecovery() {
  if (recoverySnapshot === null) return;
  try {
    localStorage.setItem(STORAGE_KEY, recoverySnapshot);
    recoverySnapshot = null;
    setSaveState('savedLocally');
    storageAvailable = true;
  } catch {
    storageAvailable = false;
    setSaveState('notSaved');
    announce('storageUnavailable', true);
  }
}
function persist() {
  clearTimeout(storageTimer);
  // Capture committed work now; a later gesture must not overwrite or skip it.
  recoverySnapshot = text();
  storageTimer = setTimeout(flushRecovery, 200);
}
function completeChange(key, params = {}) {
  refresh();
  persist();
  announce(store.project.objects.length >= MAX_OBJECTS ? 'objectLimit' : key, false, params);
}
function cancelStroke() {
  pointer = null;
  if (store.cancel()) refresh();
}
renderLanguage();
try {
  scene = createScene(canvas, store.project, { onError: renderError });
  $('stage-loading').hidden = true;
  document.body.dataset.ready = 'true';
} catch (error) { renderError(error); }
navigation = bindNavigation(canvas, {
  getZoom: () => store.project.view.zoom,
  setZoom: (zoom) => {
    scene.setZoom(zoom);
    store.project.view.zoom = zoom;
    persist();
  },
  onStart: () => {
    const rotating = pointer?.kind === 'rotate';
    cancelStroke();
    if (rotating) store.project.view = scene.view();
    scene?.brush(null);
  },
  enabled: () => !failed,
  outButton: $('zoom-out'), inButton: $('zoom-in'), resetButton: $('zoom-reset'),
  resetLabel: (percent) => t(locale, 'resetZoomValue', { percent }),
});
inspector = bindObjectInspector({
  store, getLocale: () => locale,
  enabled: () => !failed && !previewing && mode === 'select',
  onCancel: cancelStroke,
  onSelection: (id) => scene?.select(mode === 'select' ? id : null),
  onComplete: completeChange,
  announce,
});
refresh({ fields: true });
libraryUI = bindLibrary({
  storage: preferenceStorage,
  getLocale: () => locale,
  getProject: () => {
    cancelStroke();
    scene?.brush(null);
    if (previewing) { scene?.freeze(); setPreview(false); }
    if (scene) store.project.view = scene.view();
    return structuredClone(store.project);
  },
  onOpen: (next, id) => requestReplace(next, id),
  onSaved: (project) => {
    store.project.name = project.name;
    $('project-name').value = project.name;
    savedJSON = text();
    persist();
  },
  onRename: (name, originalName) => {
    if (store.project.name !== originalName) return store.project.name;
    const wasSaved = !hasUnsaved();
    store.project.name = name;
    $('project-name').value = name;
    if (wasSaved) savedJSON = text();
    persist();
    return name;
  },
  announce,
});
if (recovered) { setSaveState('localDraft'); if (!failed) announce('recovered'); }
else if (!storageAvailable && !failed) announce('recoveryUnavailable', true);
$('language-setting').addEventListener('change', () => {
  cancelStroke();
  scene?.brush(null);
  locale = $('language-setting').value;
  const saved = saveLocale(locale, preferenceStorage);
  renderLanguage();
  refresh();
  if (!saved) announce('localeNotSaved', true);
});

function setMode(value) {
  cancelStroke();
  mode = value;
  stage.dataset.mode = mode;
  document.querySelectorAll('button[data-mode]').forEach((button) => { button.setAttribute('aria-pressed', String(button.dataset.mode === mode)); });
  $('brush-density').disabled = mode === 'erase' || mode === 'rotate';
  $('density-label').hidden = $('brush-density').hidden = mode === 'erase';
  $('erase-options').hidden = mode !== 'erase';
  $('brush-radius').disabled = mode === 'rotate';
  $('brush-options').hidden = mode === 'select';
  $('object-inspector').hidden = mode !== 'select';
  if (mode !== 'select') inspector.select(null);
  else inspector.render();
  scene?.brush(null);
}
document.querySelectorAll('button[data-mode]').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));
$('brush-radius').addEventListener('input', () => {
  cancelStroke();
  $('radius-value').value = `${$('brush-radius').value}°`;
  scene?.brush(null);
});
$('brush-density').addEventListener('input', () => { cancelStroke(); $('density-value').value = `${$('brush-density').value}%`; });
$('erase-type').addEventListener('change', () => { cancelStroke(); scene?.brush(null); });
document.querySelectorAll('[name="environment"]').forEach((input) => {
  input.addEventListener('change', () => {
    if (!input.checked) return;
    cancelStroke();
    store.project.settings.environment = input.value;
    completeChange('environmentChanged', { environment: input.value });
  });
});
for (const [id, field] of [['snow-setting', 'snow'], ['rotation-setting', 'autoRotate']]) {
  $(id).addEventListener('change', () => { cancelStroke(); store.project.settings[field] = $(id).checked; completeChange('sceneUpdated'); });
}
$('project-name').addEventListener('input', () => { cancelStroke(); store.project.name = $('project-name').value; persist(); });

function endStroke(event) {
  if (!pointer || pointer.id !== event.pointerId) return;
  const wasPainting = pointer.painting;
  const kind = pointer.kind;
  const blocked = pointer.blocked;
  const beforeCount = pointer.beforeCount;
  pointer = null;
  if (kind === 'edit') {
    const changed = store.commit();
    completeChange(changed ? 'objectUpdated' : 'noChange');
    if (blocked) announce('objectOccupied', true);
  } else if (wasPainting) {
    const changed = store.commit();
    completeChange(changed ? 'strokeDone' : mode === 'house' && beforeCount === store.project.objects.length ? 'noSpace' : 'noChange');
  } else if (kind === 'rotate') {
    store.project.view = scene.view();
    persist();
  }
}
canvas.addEventListener('pointerdown', (event) => {
  if (failed || pointer || event.button !== 0) return;
  event.preventDefault();
  canvas.focus({ preventScroll: true });
  const kind = previewing || mode === 'rotate' ? 'rotate' : mode === 'select' ? 'select' : 'paint';
  pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, kind, painting: kind === 'paint', beforeCount: store.project.objects.length };
  canvas.setPointerCapture(event.pointerId);
  if (kind === 'select') {
    scene.freeze();
    const id = scene.pickObject(event.clientX, event.clientY);
    inspector.select(id);
    const object = store.project.objects.find((item) => item.id === id);
    if (object && store.beginEdit(id)) {
      pointer.kind = 'edit';
      pointer.anchor = [...object.direction];
      pointer.from = scene.pick(event.clientX, event.clientY) ?? [...object.direction];
    }
    return;
  }
  if (pointer.painting) {
    scene.freeze();
    store.begin(mode, radius(), density(), $('erase-type').value);
    const hit = scene.pick(event.clientX, event.clientY);
    store.sample(hit);
    scene.brush(hit, radius(), mode);
    refresh();
  }
});
canvas.addEventListener('pointermove', (event) => {
  if (failed) return;
  if (pointer && event.pointerId !== pointer.id) return;
  if (pointer?.kind === 'edit') {
    if (Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) < 4 && !pointer.dragging) return;
    pointer.dragging = true;
    const hit = scene.pick(event.clientX, event.clientY);
    if (!hit) return;
    pointer.blocked = !store.edit({ direction: dragDirection(pointer.from, hit, pointer.anchor) });
    refresh();
    if (pointer.blocked) announce('objectOccupied', true);
    return;
  }
  if (pointer?.kind === 'rotate') {
    scene.rotate((event.clientX - pointer.x) * 0.006, (event.clientY - pointer.y) * 0.004);
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    return;
  }
  if (previewing || mode === 'rotate' || mode === 'select') return;
  const hit = scene.pick(event.clientX, event.clientY);
  scene.brush(hit, radius(), mode);
  if (pointer?.painting) { store.sample(hit); refresh(); }
});
canvas.addEventListener('pointerup', endStroke);
canvas.addEventListener('pointercancel', (event) => {
  if (pointer?.id !== event.pointerId) return;
  cancelStroke();
  scene?.brush(null);
});
canvas.addEventListener('lostpointercapture', (event) => { if (pointer?.id === event.pointerId) cancelStroke(); });
canvas.addEventListener('pointerleave', () => { if (!pointer) scene?.brush(null); });
canvas.addEventListener('blur', () => { cancelStroke(); scene?.brush(null); });
window.addEventListener('blur', () => { cancelStroke(); scene?.brush(null); });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { cancelStroke(); flushRecovery(); }
});

function history(action) {
  cancelStroke();
  if (store[action]()) { refresh({ fields: true }); persist(); announce(action === 'undo' ? 'undone' : 'redone'); }
}
$('undo').addEventListener('click', () => history('undo'));
$('redo').addEventListener('click', () => history('redo'));
function setPreview(value) {
  cancelStroke();
  previewing = value;
  scene?.preview(value);
  document.body.dataset.preview = stage.dataset.preview = String(value);
  $('preview').setAttribute('aria-pressed', String(value));
  $('preview-label').textContent = t(locale, value ? 'returnToEdit' : 'preview');
  $('scene-mode').textContent = t(locale, value ? 'previewing' : 'editing');
  $('pause-preview').hidden = !value || motion.matches;
  inspector.render();
  if (!value && scene) { store.project.view = scene.view(); persist(); }
}
$('preview').addEventListener('click', () => setPreview(!previewing));
$('open-bookmarks').addEventListener('click', () => {
  cancelStroke();
  scene?.brush(null);
  if (previewing) {
    scene?.freeze();
    setPreview(false);
  }
  bookmarkFeedback = null;
  renderBookmarkDialog();
  $('bookmarks-dialog').showModal();
  if (!$('bookmark-name').disabled) $('bookmark-name').focus();
});
$('bookmark-form').addEventListener('submit', (event) => {
  event.preventDefault();
  cancelStroke();
  try {
    store.addBookmark($('bookmark-name').value, scene?.view() ?? store.project.view);
    $('bookmark-name').value = '';
    bookmarkFeedback = { key: 'bookmarkSaved', error: false };
    persist();
    announce('bookmarkSaved');
  } catch (error) {
    const key = ['invalidBookmark', 'bookmarkDuplicate', 'bookmarkLimit'].includes(error?.code) ? error.code : 'invalidBookmark';
    bookmarkFeedback = { key, error: true };
    announce(key, true);
  }
  renderBookmarkDialog();
});
$('bookmark-list').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-bookmark-go],button[data-bookmark-delete]');
  if (!button) return;
  const index = Number(button.dataset.bookmarkGo ?? button.dataset.bookmarkDelete);
  const bookmark = store.project.bookmarks[index];
  if (!bookmark) return;
  if (button.hasAttribute('data-bookmark-delete')) {
    store.removeBookmark(index);
    bookmarkFeedback = { key: 'bookmarkDeleted', error: false };
    persist();
    renderBookmarkDialog();
    $('bookmark-name').focus();
    announce('bookmarkDeleted');
    return;
  }
  cancelStroke();
  scene?.setView(bookmark.view);
  store.project.view = { ...bookmark.view };
  navigation.render();
  persist();
  $('bookmarks-dialog').close();
  canvas.focus({ preventScroll: true });
  announce('bookmarkLoaded', false, { name: bookmark.name });
});
$('pause-preview').addEventListener('click', () => {
  paused = !paused;
  scene?.pause(paused);
  $('pause-preview').setAttribute('aria-label', t(locale, paused ? 'playAnimation' : 'pauseAnimation'));
  $('pause-preview').title = t(locale, paused ? 'playAnimation' : 'pauseAnimation');
  $('pause-preview').innerHTML = `<i data-playback-icon="${paused ? 'play' : 'pause'}"></i>`;
  createIcons({ icons: { Play, Pause }, nameAttr: 'data-playback-icon' });
});
const updatePlaybackControl = () => { $('pause-preview').hidden = !previewing || motion.matches; };
motion.addEventListener('change', updatePlaybackControl);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') { cancelStroke(); inspector.render(); scene?.brush(null); return; }
  if (document.querySelector('dialog[open]') || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.target.isContentEditable) return;
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
    event.preventDefault();
    history(event.shiftKey ? 'redo' : 'undo');
    return;
  }
  if (event.target !== canvas || failed) return;
  if (mode === 'select' && !previewing && ['Delete', 'Backspace'].includes(event.key)) {
    event.preventDefault();
    inspector.remove();
    return;
  }
  const moves = { ArrowLeft: [-0.12, 0], ArrowRight: [0.12, 0], ArrowUp: [0, -0.1], ArrowDown: [0, 0.1] };
  if (moves[event.key]) {
    event.preventDefault();
    cancelStroke();
    scene.rotate(...moves[event.key]);
    store.project.view = scene.view();
    persist();
  }
  if (event.key === 'Enter' && !event.repeat && !previewing && mode !== 'rotate') {
    event.preventDefault();
    cancelStroke();
    scene.freeze();
    const box = canvas.getBoundingClientRect();
    if (mode === 'select') {
      inspector.select(scene.pickObject(box.x + box.width / 2, box.y + box.height / 2));
      return;
    }
    store.begin(mode, radius(), density(), $('erase-type').value);
    store.sample(scene.pick(box.x + box.width / 2, box.y + box.height / 2));
    store.commit();
    completeChange('strokeDone');
  }
});

function download(content, filename, type) {
  const url = URL.createObjectURL(content instanceof Blob ? content : new Blob([content], { type }));
  urls.add(url);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); urls.delete(url); }, 60000);
}
function saveJSON() {
  cancelStroke();
  if (scene) store.project.view = scene.view();
  savedJSON = text();
  download(JSON.stringify(store.project, null, 2), `${safeFilename(store.project.name)}.planet.json`, 'application/json');
  setSaveState('jsonSaved');
  persist();
  announce('jsonExported');
}
$('save-project').addEventListener('click', saveJSON);
function replaceProject(next, libraryId = null) {
  if (libraryId && !libraryUI.validateOpen(next, libraryId)) return;
  navigation.reset();
  cancelStroke();
  if (previewing) setPreview(false);
  store.replace(next);
  inspector.select(null);
  libraryUI.setActive(libraryId);
  savedJSON = libraryId ? text() : '';
  scene?.setView(store.project.view);
  refresh({ fields: true });
  bookmarkFeedback = null;
  renderBookmarkDialog();
  persist();
  announce('planetLoaded');
}
function requestReplace(next, libraryId = null) {
  cancelStroke();
  if (hasUnsaved()) {
    pending = { project: next, libraryId };
    $('replace-dialog').showModal();
  } else replaceProject(next, libraryId);
}
$('new-project').addEventListener('click', () => {
  const seed = crypto.getRandomValues(new Uint32Array(1))[0];
  const next = createProject(seed);
  next.name = t(locale, 'untitled');
  requestReplace(next);
});
$('open-templates').addEventListener('click', () => {
  cancelStroke();
  scene?.brush(null);
  $('templates-dialog').showModal();
});
$('templates-dialog').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-template]');
  if (!button) return;
  const next = createTemplate(button.dataset.template, locale);
  $('templates-dialog').close();
  requestReplace(next);
});
$('confirm-replace').addEventListener('click', () => {
  if (pending) replaceProject(pending.project, pending.libraryId);
  pending = null;
  $('replace-dialog').close();
});
$('save-before-replace').addEventListener('click', () => { saveJSON(); announce('savedBeforeReplace'); });
$('import-project').addEventListener('click', () => { cancelStroke(); $('project-file').click(); });
$('project-file').addEventListener('change', async () => {
  const file = $('project-file').files[0];
  if (!file) return;
  cancelStroke();
  try {
    if (file.size > MAX_FILE_BYTES) throw localizedError('fileTooLarge');
    const next = parseProject(await file.text());
    requestReplace(next);
  } catch (error) { announceError(error, 'importFailed'); }
  finally { $('project-file').value = ''; }
});
document.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => $(button.dataset.close).close()));
$('replace-dialog').addEventListener('close', () => { pending = null; });

function updateEmbed() { $('embed-code').value = embedCode($('embed-path').value, locale); }
function setExportTab(format) {
  for (const tab of ['html', 'png']) {
    const selected = tab === format;
    $(`${tab}-tab`).setAttribute('aria-selected', String(selected));
    $(`${tab}-tab`).tabIndex = selected ? 0 : -1;
    $(`${tab}-panel`).hidden = !selected;
  }
}
for (const format of ['html', 'png']) {
  $(`${format}-tab`).addEventListener('click', () => setExportTab(format));
  $(`${format}-tab`).addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 'html' : event.key === 'End' ? 'png' : format === 'html' ? 'png' : 'html';
    setExportTab(next);
    $(`${next}-tab`).focus();
  });
}
$('open-export').addEventListener('click', () => {
  cancelStroke();
  const filename = `${safeFilename(store.project.name)}.html`;
  $('export-filename').textContent = filename;
  $('export-object-count').textContent = t(locale, 'objectCount', { count: store.project.objects.length });
  $('embed-path').value = `/${filename}`;
  updateEmbed();
  setExportTab('html');
  if (!exportingImage) exportStatus = null;
  renderExportStatus();
  $('export-dialog').showModal();
});
$('download-png').addEventListener('click', async () => {
  if (exportingImage || failed || !scene) return;
  cancelStroke();
  const filename = `${safeFilename(store.project.name)}.png`;
  exportingImage = true;
  exportStatus = 'pngExporting';
  renderExportStatus();
  try {
    const blob = await scene.captureImage({
      size: Number($('image-size').value),
      transparent: $('image-transparent').checked,
    });
    if (failed) throw localizedError('contextLost');
    download(blob, filename);
    exportStatus = 'pngExported';
    announce('pngExported');
  } catch {
    exportStatus = 'pngFailed';
    announce('pngFailed', true);
  } finally {
    exportingImage = false;
    renderExportStatus();
  }
});
$('embed-path').addEventListener('input', updateEmbed);
$('copy-embed').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText($('embed-code').value);
    announce('embedCopied');
  } catch {
    $('embed-code').focus();
    $('embed-code').select();
    announce('copyUnavailable', true);
  }
});
$('download-html').addEventListener('click', () => {
  cancelStroke();
  if (scene) store.project.view = scene.view();
  try {
    download(buildHTML(store.project, playerRuntime, locale), `${safeFilename(store.project.name)}.html`, 'text/html;charset=utf-8');
    announce('htmlExported');
  } catch (error) { announceError(error, 'exportFailed'); }
});
window.addEventListener('beforeunload', (event) => {
  if (store.active) cancelStroke();
  flushRecovery();
  if (!storageAvailable && hasUnsaved()) { event.preventDefault(); event.returnValue = ''; }
});
const dispose = () => {
  clearTimeout(storageTimer);
  flushRecovery();
  motion.removeEventListener('change', updatePlaybackControl);
  navigation.dispose();
  scene?.dispose();
  urls.forEach((url) => URL.revokeObjectURL(url));
};
window.addEventListener('pagehide', dispose, { once: true });
if (import.meta.hot) import.meta.hot.dispose(dispose);
