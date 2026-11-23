import { poseFields, posePatch } from './object-edit.js';
import { t } from './i18n.js';

export function bindObjectInspector({ store, getLocale, enabled, onCancel, onSelection, onComplete, announce }) {
  const $ = (id) => document.getElementById(id);
  const keys = ['latitude', 'longitude', 'heading', 'scale'];
  let selected = null;
  let baseline = null;
  const current = () => store.project.objects.find((object) => object.id === selected);
  function render() {
    const object = current();
    if (!object) selected = null;
    const disabled = !object || !enabled();
    $('object-fields').disabled = disabled;
    $('selected-object').textContent = object ? `${t(getLocale(), object.type)} · ${object.id}` : t(getLocale(), 'noObjectSelected');
    $('selected-object').title = object?.id ?? '';
    baseline = object ? poseFields(object) : null;
    keys.forEach((key) => { $(`object-${key}`).value = baseline?.[key] ?? ''; });
    onSelection(selected);
  }
  function select(id) {
    selected = id;
    render();
    if (selected) announce('objectSelected');
  }
  $('object-form').addEventListener('submit', (event) => {
    event.preventDefault();
    if (!enabled() || !current()) return;
    const id = selected;
    const values = Object.fromEntries(keys.map((key) => [key, $(`object-${key}`).value]));
    try {
      const patch = posePatch(values, baseline);
      onCancel();
      if (!store.beginEdit(id)) { render(); return; }
      if (!store.edit(patch)) {
        store.cancel();
        announce('objectOccupied', true);
        return;
      }
      const changed = store.commit();
      onComplete(changed ? 'objectUpdated' : 'noChange');
    } catch {
      store.cancel();
      announce('invalidObjectEdit', true);
    }
  });
  function remove() {
    if (!enabled() || !current()) return;
    const id = selected;
    onCancel();
    if (store.deleteObject(id)) onComplete('objectDeleted');
  }
  $('delete-object').addEventListener('click', remove);
  $('clear-selection').addEventListener('click', () => { onCancel(); select(null); });
  return { get selected() { return selected; }, select, render, remove };
}
