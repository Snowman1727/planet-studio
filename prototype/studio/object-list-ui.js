import { createIcons, Trees, House, TreeDeciduous, Flower2, Mountain, Umbrella, LockKeyhole, ArrowUpRight } from 'lucide';
import { objectPage } from './object-list.js';
import { t } from './i18n.js';

const symbols = { tree: 'trees', house: 'house', broadleaf: 'tree-deciduous', flowers: 'flower-2', rock: 'mountain', mushroom: 'umbrella' };

export function bindObjectList({ getObjects, getLocale, getSelected, enabled, onOpen, onSelect }) {
  const $ = (id) => document.getElementById(id);
  const dialog = $('objects-dialog');
  const list = $('object-list');
  let page = 0;
  function render() {
    if (!dialog.open) return;
    const locale = getLocale();
    const all = getObjects();
    const result = objectPage(all, { type: $('object-filter').value, query: $('object-search').value, page });
    page = result.page;
    $('object-results').textContent = t(locale, 'objectResults', { count: result.total, total: all.length });
    $('object-page').textContent = t(locale, 'objectPage', { page: page + 1, pages: result.pages });
    $('object-previous').disabled = page === 0;
    $('object-next').disabled = page + 1 === result.pages;
    $('object-list-empty').hidden = result.total !== 0;
    $('object-list-empty').textContent = t(locale, all.length ? 'noMatchingObjects' : 'noObjects');
    list.replaceChildren();
    for (const object of result.objects) {
      const row = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'object-list-go';
      button.dataset.objectId = object.id;
      button.disabled = !enabled();
      button.setAttribute('aria-label', t(locale, 'locateObject', { type: t(locale, object.type), id: object.id }) +
        (object.locked ? ` · ${t(locale, 'locked')}` : ''));
      if (object.id === getSelected()) button.setAttribute('aria-current', 'true');
      const symbol = document.createElement('span');
      symbol.className = `tool-symbol ${object.type === 'tree' ? 'forest' : object.type}-symbol`;
      symbol.innerHTML = `<i data-object-icon="${symbols[object.type]}"></i>`;
      const info = document.createElement('span');
      info.className = 'object-list-info';
      const type = document.createElement('strong');
      type.textContent = t(locale, object.type);
      const id = document.createElement('small');
      id.textContent = object.id;
      info.append(type, id);
      const end = document.createElement('span');
      end.className = 'object-list-end';
      if (object.locked) {
        const lock = document.createElement('span');
        lock.title = t(locale, 'locked');
        lock.innerHTML = '<i data-object-icon="lock-keyhole"></i>';
        end.append(lock);
      }
      const arrow = document.createElement('span');
      arrow.innerHTML = '<i data-object-icon="arrow-up-right"></i>';
      end.append(arrow);
      button.append(symbol, info, end);
      row.append(button);
      list.append(row);
    }
    createIcons({ icons: { Trees, House, TreeDeciduous, Flower2, Mountain, Umbrella, LockKeyhole, ArrowUpRight }, nameAttr: 'data-object-icon' });
  }
  $('open-objects').addEventListener('click', () => {
    onOpen();
    dialog.showModal();
    render();
    $('object-search').focus();
  });
  $('object-search').addEventListener('input', () => { page = 0; render(); list.scrollTop = 0; });
  $('object-filter').addEventListener('change', () => { page = 0; render(); list.scrollTop = 0; });
  for (const [id, delta] of [['object-previous', -1], ['object-next', 1]]) {
    $(id).addEventListener('click', () => {
      page += delta;
      render();
      list.scrollTop = 0;
      if ($(id).disabled) $(delta < 0 ? 'object-next' : 'object-previous').focus();
    });
  }
  list.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-object-id]');
    if (!button || !enabled() || !getObjects().some((object) => object.id === button.dataset.objectId)) return;
    dialog.close();
    onSelect(button.dataset.objectId);
  });
  function reset() {
    page = 0;
    $('object-filter').value = 'all';
    $('object-search').value = '';
    render();
  }
  return { render, reset };
}
