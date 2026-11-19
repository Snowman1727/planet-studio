import { createIcons, ArrowUpRight, Pencil, Copy, Trash2 } from 'lucide';
import { createLibrary, LIBRARY_KEY } from './library.js';
import { t } from './i18n.js';

const $ = (id) => document.getElementById(id);
const errors = ['libraryUnavailable', 'libraryLockUnavailable', 'invalidLibrary', 'libraryChanged', 'libraryMissing', 'invalidLibraryName', 'invalidProject', 'fileTooLarge'];

export function bindLibrary({ storage, getLocale, getProject, onOpen, onSaved, onRename, announce }) {
  const library = createLibrary(storage);
  let activeId = null;
  let feedback = null;
  let renameId = null;
  let renameOriginalName = '';
  let deleteEntry = null;
  let busy = false;
  let pendingFocus;
  const translate = (key, params) => t(getLocale(), key, params);
  function renderBusy() {
    for (const id of ['library-dialog', 'rename-library-dialog', 'delete-library-dialog']) {
      $(id).setAttribute('aria-busy', String(busy));
      $(id).querySelectorAll('button, input').forEach((element) => { element.disabled = busy; });
    }
  }
  async function write(change, target) {
    if (busy) return;
    busy = true;
    renderBusy();
    try { await change(); }
    catch (error) { showError(error, target); }
    finally {
      busy = false;
      renderBusy();
      if (pendingFocus !== undefined) {
        const id = pendingFocus;
        pendingFocus = undefined;
        focusList(id);
      }
    }
  }
  function showFeedback(key, error = false) {
    feedback = { key, error };
    $('library-feedback').textContent = translate(key);
    $('library-feedback').dataset.error = String(error);
    announce(key, error);
  }
  function showError(error, target = 'library-feedback') {
    const key = errors.includes(error?.code) ? error.code : 'libraryUnavailable';
    if (key === 'libraryChanged' || key === 'libraryMissing') activeId = null;
    showFeedback(key, true);
    if (target !== 'library-feedback') $(target).textContent = translate(key);
  }
  function action(action, name, icon) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'icon-button';
    button.dataset.libraryAction = action;
    button.title = button.ariaLabel = translate(`${action}LibraryProject`, { name });
    const symbol = document.createElement('i');
    symbol.setAttribute('data-library-icon', icon);
    button.append(symbol);
    return button;
  }
  function focusList(id) {
    if (busy) { pendingFocus = id; return; }
    const rows = [...$('library-list').children];
    const row = rows.find((item) => item.dataset.libraryId === id);
    (row?.querySelector('button') ?? $('library-name')).focus();
  }
  function render() {
    $('save-library-new').hidden = activeId === null;
    $('library-feedback').textContent = feedback ? translate(feedback.key) : '';
    $('library-feedback').dataset.error = String(Boolean(feedback?.error));
    if (deleteEntry) $('delete-library-detail').textContent = translate('deleteProjectDetail', { name: deleteEntry.project.name });
    const list = $('library-list');
    list.replaceChildren();
    let entries;
    try { entries = library.list(); }
    catch (error) {
      $('library-count').textContent = '';
      $('library-empty').hidden = true;
      showError(error);
      return;
    }
    $('library-count').textContent = translate('libraryCount', { count: entries.length });
    $('library-empty').hidden = entries.length > 0;
    for (const entry of entries) {
      const row = document.createElement('li');
      row.dataset.libraryId = entry.id;
      const open = action('open', entry.project.name, 'arrow-up-right');
      open.className = 'library-open';
      const content = document.createElement('span');
      content.className = 'library-project-info';
      const name = document.createElement('strong');
      name.textContent = entry.project.name;
      const detail = document.createElement('small');
      detail.textContent = `${translate(entry.project.settings.environment)} · ${translate('objectCount', { count: entry.project.objects.length })}`;
      const date = document.createElement('time');
      date.dateTime = entry.updatedAt;
      date.textContent = new Intl.DateTimeFormat(getLocale(), { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(entry.updatedAt));
      content.append(name, detail, date);
      if (entry.id === activeId) {
        const current = document.createElement('small');
        current.className = 'library-current';
        current.textContent = translate('libraryCurrent');
        content.append(current);
      }
      open.prepend(content);
      const actions = document.createElement('div');
      actions.className = 'library-row-actions';
      actions.append(action('rename', entry.project.name, 'pencil'), action('copy', entry.project.name, 'copy'), action('delete', entry.project.name, 'trash-2'));
      row.append(open, actions);
      list.append(row);
    }
    createIcons({ icons: { ArrowUpRight, Pencil, Copy, Trash2 }, nameAttr: 'data-library-icon' });
    renderBusy();
  }
  function save(asNew = false) {
    return write(async () => {
      const project = getProject();
      project.name = $('library-name').value;
      const entry = await library.save(project, asNew ? null : activeId);
      activeId = entry.id;
      onSaved(entry.project);
      $('library-name').value = entry.project.name;
      showFeedback('librarySaved');
      render();
    });
  }
  $('open-library').addEventListener('click', () => {
    feedback = null;
    $('library-name').value = getProject().name;
    render();
    $('library-dialog').showModal();
    $('library-name').focus();
  });
  $('library-form').addEventListener('submit', (event) => { event.preventDefault(); save(); });
  $('save-library-new').addEventListener('click', () => save(true));
  $('library-list').addEventListener('click', async (event) => {
    if (busy) return;
    const button = event.target.closest('button[data-library-action]');
    if (!button) return;
    const id = button.closest('[data-library-id]').dataset.libraryId;
    try {
      if (button.dataset.libraryAction === 'open') {
        const next = library.open(id);
        $('library-dialog').close();
        onOpen(next, id);
      } else if (button.dataset.libraryAction === 'copy') {
        const project = library.open(id);
        const suffix = translate('libraryCopyName', { name: '' });
        const name = translate('libraryCopyName', { name: project.name.slice(0, 80 - suffix.length) });
        await write(async () => {
          const entry = await library.copy(id, name);
          showFeedback('libraryCopied');
          render();
          focusList(entry.id);
        });
      } else if (button.dataset.libraryAction === 'rename') {
        const project = library.open(id);
        renameId = id;
        renameOriginalName = project.name;
        $('rename-library-name').value = project.name;
        $('rename-library-feedback').textContent = '';
        $('rename-library-dialog').showModal();
        $('rename-library-name').select();
      } else {
        deleteEntry = { id, project: library.open(id) };
        $('delete-library-detail').textContent = translate('deleteProjectDetail', { name: deleteEntry.project.name });
        $('delete-library-feedback').textContent = '';
        $('delete-library-dialog').showModal();
        $('cancel-library-delete').focus();
      }
    } catch (error) { showError(error); render(); }
  });
  $('rename-library-form').addEventListener('submit', (event) => {
    event.preventDefault();
    write(async () => {
      const entry = await library.rename(renameId, $('rename-library-name').value);
      if (entry.id === activeId) {
        $('library-name').value = onRename(entry.project.name, renameOriginalName);
      }
      $('rename-library-dialog').close();
      showFeedback('libraryRenamed');
      render();
      focusList(entry.id);
    }, 'rename-library-feedback');
  });
  $('confirm-library-delete').addEventListener('click', () => {
    if (!deleteEntry) return;
    write(async () => {
      await library.remove(deleteEntry.id);
      if (deleteEntry.id === activeId) activeId = null;
      $('delete-library-dialog').close();
      showFeedback('libraryDeleted');
      render();
      focusList(null);
    }, 'delete-library-feedback');
  });
  for (const id of ['library-dialog', 'rename-library-dialog', 'delete-library-dialog']) {
    $(id).addEventListener('cancel', (event) => { if (busy) event.preventDefault(); });
  }
  $('delete-library-dialog').addEventListener('close', () => { deleteEntry = null; });
  window.addEventListener('storage', (event) => {
    if (event.key !== LIBRARY_KEY && event.key !== null) return;
    activeId = null;
    if (!busy) {
      $('rename-library-dialog').close();
      $('delete-library-dialog').close();
    }
    showFeedback('libraryChanged', true);
    if ($('library-dialog').open) render();
  });
  return {
    render,
    setActive(id) { activeId = id; },
    validateOpen(project, id) {
      try { library.open(id, project); return true; }
      catch (error) { showError(error); return false; }
    },
  };
}
