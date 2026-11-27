import { createIcons, Check, Pencil, Trash2 } from 'lucide';
import { createBrushPresets, validateBrushSettings, PRESETS_KEY } from './brush-presets.js';
import { t, localizedError } from './i18n.js';

const $ = id => document.getElementById(id);
const dialogs = ['presets-dialog', 'rename-preset-dialog', 'delete-preset-dialog'];
const errors = new Set(['invalidPresetName', 'duplicatePresetName', 'invalidPresetSettings', 'presetLimit', 'invalidPresets',
  'presetsUnavailable', 'presetLockUnavailable', 'presetsChanged', 'presetMissing', 'presetRenderFailed', 'presetNeedsBrush']);

export function bindBrushPresets({ storage, getLocale, getSettings, canSave, canApply, onOpen, onApply, announce }) {
  const presets = createBrushPresets(storage);
  const translate = (key, params) => t(getLocale(), key, params);
  let busy = false, unreadable = false, feedback = null, renameId = null, deleteEntry = null, pendingFocus;
  function summary(settings) {
    const main = translate('presetSummary', { ...settings, mode: translate(settings.mode) });
    return settings.mode === 'mixed' ? `${main} · ${translate('presetMix', settings.mix)}` : main;
  }
  function renderControls() {
    for (const id of dialogs) {
      $(id).setAttribute('aria-busy', String(busy));
      $(id).querySelectorAll('button, input').forEach(element => { element.disabled = busy; });
    }
    $('save-preset').disabled = busy || unreadable || !canSave();
    $('preset-name').disabled = busy || !canSave();
    $('presets-list').querySelectorAll('[data-preset-action="apply"]').forEach(button => { button.disabled = busy || !canApply(); });
  }
  function showFeedback(key, error = false, target = 'presets-feedback') {
    feedback = { key, error, target };
    $('presets-feedback').textContent = translate(key);
    $('presets-feedback').dataset.error = String(error);
    if (target !== 'presets-feedback') $(target).textContent = translate(key);
    announce(key, error);
  }
  function showError(error, target) {
    showFeedback(errors.has(error?.code) ? error.code : 'presetsUnavailable', true, target);
  }
  function focusRow(id) {
    if (busy) { pendingFocus = id; return; }
    const row = [...$('presets-list').children].find(item => item.dataset.presetId === id);
    const control = row?.querySelector('button:not(:disabled)') ?? $('preset-name');
    (control.disabled ? $('presets-dialog').querySelector('[data-close]') : control).focus();
  }
  function action(kind, name, icon) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'icon-button';
    button.dataset.presetAction = kind;
    button.title = button.ariaLabel = translate(`${kind}Preset`, { name });
    const symbol = document.createElement('i'); symbol.setAttribute('data-preset-icon', icon);
    button.append(symbol);
    return button;
  }
  function render() {
    $('presets-feedback').textContent = feedback ? translate(feedback.key) : '';
    $('presets-feedback').dataset.error = String(Boolean(feedback?.error));
    for (const id of ['rename-preset-feedback', 'delete-preset-feedback']) {
      $(id).textContent = feedback?.target === id ? translate(feedback.key) : '';
    }
    if (deleteEntry) $('delete-preset-detail').textContent = translate('deletePresetDetail', { name: deleteEntry.name });
    let current;
    try {
      current = !canApply() ? translate('presetRenderFailed') : !canSave() ? translate('presetNeedsBrush') : summary(validateBrushSettings(getSettings()));
    } catch { current = translate('invalidPresetSettings'); }
    $('preset-current').textContent = current;
    const list = $('presets-list'); list.replaceChildren();
    let entries = [];
    unreadable = false;
    try { entries = presets.list(); }
    catch (error) { unreadable = true; showError(error); }
    $('presets-count').textContent = unreadable ? '' : translate('presetCount', { count: entries.length });
    $('presets-empty').hidden = unreadable || entries.length > 0;
    for (const entry of entries) {
      const row = document.createElement('li'); row.dataset.presetId = entry.id;
      const apply = action('apply', entry.name, 'check'); apply.className = 'library-open';
      const info = document.createElement('span'); info.className = 'library-project-info';
      const name = document.createElement('strong'); name.textContent = entry.name;
      const detail = document.createElement('small'); detail.textContent = summary(entry.settings);
      info.append(name, detail); apply.prepend(info);
      const actions = document.createElement('div'); actions.className = 'library-row-actions';
      actions.append(action('rename', entry.name, 'pencil'), action('delete', entry.name, 'trash-2'));
      row.append(apply, actions); list.append(row);
    }
    createIcons({ icons: { Check, Pencil, Trash2 }, nameAttr: 'data-preset-icon' });
    renderControls();
  }
  async function write(change, target = 'presets-feedback') {
    if (busy) return;
    busy = true; renderControls();
    try { await change(); }
    catch (error) { showError(error, target); }
    finally {
      busy = false; renderControls();
      if (pendingFocus !== undefined) { const id = pendingFocus; pendingFocus = undefined; focusRow(id); }
    }
  }
  $('open-presets').addEventListener('click', () => {
    onOpen(); feedback = null;
    render(); $('presets-dialog').showModal();
    if (!$('preset-name').disabled) $('preset-name').focus();
  });
  $('presets-form').addEventListener('submit', event => {
    event.preventDefault();
    write(async () => {
      if (!canApply()) throw localizedError('presetRenderFailed');
      if (!canSave()) throw localizedError('presetNeedsBrush');
      const entry = await presets.save($('preset-name').value, getSettings());
      $('preset-name').value = '';
      showFeedback('presetSaved'); render(); focusRow(entry.id);
    });
  });
  $('presets-list').addEventListener('click', event => {
    if (busy) return;
    const button = event.target.closest('button[data-preset-action]');
    if (!button) return;
    const id = button.closest('[data-preset-id]').dataset.presetId;
    try {
      const entry = presets.get(id);
      if (button.dataset.presetAction === 'apply') {
        if (!canApply()) throw localizedError('presetRenderFailed');
        onApply(validateBrushSettings(entry.settings));
        $('presets-dialog').close();
        showFeedback('presetApplied');
      } else if (button.dataset.presetAction === 'rename') {
        renameId = id; feedback = null;
        $('rename-preset-name').value = entry.name;
        $('rename-preset-feedback').textContent = '';
        $('rename-preset-dialog').showModal(); $('rename-preset-name').select();
      } else {
        deleteEntry = entry; feedback = null;
        $('delete-preset-detail').textContent = translate('deletePresetDetail', { name: entry.name });
        $('delete-preset-feedback').textContent = '';
        $('delete-preset-dialog').showModal(); $('cancel-preset-delete').focus();
      }
    } catch (error) { showError(error); render(); }
  });
  $('rename-preset-form').addEventListener('submit', event => {
    event.preventDefault();
    if (!renameId) return;
    write(async () => {
      const entry = await presets.rename(renameId, $('rename-preset-name').value);
      $('rename-preset-dialog').close();
      showFeedback('presetRenamed'); render(); focusRow(entry.id);
    }, 'rename-preset-feedback');
  });
  $('confirm-preset-delete').addEventListener('click', () => {
    if (!deleteEntry) return;
    write(async () => {
      await presets.remove(deleteEntry.id);
      $('delete-preset-dialog').close();
      showFeedback('presetDeleted'); render(); focusRow(null);
    }, 'delete-preset-feedback');
  });
  for (const id of dialogs) $(id).addEventListener('cancel', event => { if (busy) event.preventDefault(); });
  $('rename-preset-dialog').addEventListener('close', () => { renameId = null; });
  $('delete-preset-dialog').addEventListener('close', () => { deleteEntry = null; });
  window.addEventListener('storage', event => {
    if (event.key !== PRESETS_KEY && event.key !== null) return;
    if (!busy) { $('rename-preset-dialog').close(); $('delete-preset-dialog').close(); }
    showFeedback('presetsChanged', true);
    if ($('presets-dialog').open) render();
  });
  return { render };
}
