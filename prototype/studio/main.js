import { createIcons, Orbit, Undo2, Redo2, FilePlus2, FolderOpen, Save, Download, Trees, House, Eraser, Rotate3d, TreeDeciduous, Flower2, Mountain, Umbrella, TreePine, Eye, Pause, Play, X, FileCode2, Copy } from 'lucide';
import playerRuntime from 'virtual:planet-player';
import { createProject, createStore, parseProject, MAX_OBJECTS, MAX_FILE_BYTES } from './model.js';
import { createScene } from './scene.js';
import { buildHTML, embedCode, safeFilename } from './export.js';
import { BRUSHES } from './catalog.js';
import { t, loadLocale, saveLocale, errorMessage, localizedError } from './i18n.js';
import './style.css';

createIcons({ icons: { Orbit, Undo2, Redo2, FilePlus2, FolderOpen, Save, Download, Trees, House, Eraser, Rotate3d, TreeDeciduous, Flower2, Mountain, Umbrella, TreePine, Eye, Pause, Play, X, FileCode2, Copy } });
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
let mode = 'tree';
let previewing = false;
let paused = false;
let pointer = null;
let failed = false;
let sceneError = null;
let statusState = { key: 'ready', error: false, params: {} };
let saveState = 'newWork';
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
refresh({ fields: true });
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
  $('brush-radius').disabled = mode === 'rotate';
  scene?.brush(null);
}
document.querySelectorAll('button[data-mode]').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));
$('brush-radius').addEventListener('input', () => {
  cancelStroke();
  $('radius-value').value = `${$('brush-radius').value}°`;
  scene?.brush(null);
});
$('brush-density').addEventListener('input', () => { cancelStroke(); $('density-value').value = `${$('brush-density').value}%`; });
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
  const beforeCount = pointer.beforeCount;
  pointer = null;
  if (wasPainting) {
    const changed = store.commit();
    completeChange(changed ? 'strokeDone' : mode === 'house' && beforeCount === store.project.objects.length ? 'noSpace' : 'noChange');
  } else {
    store.project.view = scene.view();
    persist();
  }
}
canvas.addEventListener('pointerdown', (event) => {
  if (failed || pointer || event.button !== 0) return;
  event.preventDefault();
  canvas.focus({ preventScroll: true });
  pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, painting: !previewing && mode !== 'rotate', beforeCount: store.project.objects.length };
  canvas.setPointerCapture(event.pointerId);
  if (pointer.painting) {
    scene.freeze();
    store.begin(mode, radius(), density());
    const hit = scene.pick(event.clientX, event.clientY);
    store.sample(hit);
    scene.brush(hit, radius(), mode);
    refresh();
  }
});
canvas.addEventListener('pointermove', (event) => {
  if (failed) return;
  if (pointer && event.pointerId !== pointer.id) return;
  if (pointer && !pointer.painting) {
    scene.rotate((event.clientX - pointer.x) * 0.006, (event.clientY - pointer.y) * 0.004);
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    return;
  }
  if (previewing || mode === 'rotate') return;
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
  if (!value && scene) { store.project.view = scene.view(); persist(); }
}
$('preview').addEventListener('click', () => setPreview(!previewing));
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
  if (event.key === 'Escape') { cancelStroke(); scene?.brush(null); return; }
  if (document.querySelector('dialog[open]') || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.target.isContentEditable) return;
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
    event.preventDefault();
    history(event.shiftKey ? 'redo' : 'undo');
    return;
  }
  if (event.target !== canvas || failed) return;
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
    store.begin(mode, radius(), density());
    store.sample(scene.pick(box.x + box.width / 2, box.y + box.height / 2));
    store.commit();
    completeChange('strokeDone');
  }
});

function download(content, filename, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
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
function replaceProject(next) {
  cancelStroke();
  store.replace(next);
  scene?.setView(store.project.view);
  refresh({ fields: true });
  persist();
  announce('planetLoaded');
}
function requestReplace(next) {
  cancelStroke();
  if (hasUnsaved()) {
    pending = next;
    $('replace-dialog').showModal();
  } else replaceProject(next);
}
$('new-project').addEventListener('click', () => {
  const seed = crypto.getRandomValues(new Uint32Array(1))[0];
  const next = createProject(seed);
  next.name = t(locale, 'untitled');
  requestReplace(next);
});
$('confirm-replace').addEventListener('click', () => {
  if (pending) replaceProject(pending);
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
$('open-export').addEventListener('click', () => {
  cancelStroke();
  const filename = `${safeFilename(store.project.name)}.html`;
  $('export-filename').textContent = filename;
  $('export-object-count').textContent = t(locale, 'objectCount', { count: store.project.objects.length });
  $('embed-path').value = `/${filename}`;
  updateEmbed();
  $('export-dialog').showModal();
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
  scene?.dispose();
  urls.forEach((url) => URL.revokeObjectURL(url));
};
window.addEventListener('pagehide', dispose, { once: true });
if (import.meta.hot) import.meta.hot.dispose(dispose);
