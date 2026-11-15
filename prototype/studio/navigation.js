import { clampZoom, wheelZoom, MIN_ZOOM, MAX_ZOOM } from './view.js';

export function bindNavigation(canvas, {
  getZoom, setZoom, onStart = () => {}, enabled = () => true,
  outButton, inButton, resetButton, resetLabel,
}) {
  const touches = new Map();
  const listeners = [];
  let pinch = null;
  let suppress = false;
  function listen(target, name, handler, options) {
    target.addEventListener(name, handler, options);
    listeners.push(() => target.removeEventListener(name, handler, options));
  }
  function render() {
    const zoom = getZoom();
    outButton.disabled = !enabled() || zoom <= MIN_ZOOM;
    inButton.disabled = !enabled() || zoom >= MAX_ZOOM;
    resetButton.disabled = !enabled();
    const percent = Math.round(zoom * 100);
    resetButton.textContent = `${percent}%`;
    resetButton.setAttribute('aria-label', resetLabel(percent));
    resetButton.title = resetLabel(percent);
  }
  function change(value) {
    if (!enabled()) return;
    onStart();
    setZoom(clampZoom(value));
    render();
  }
  function reset() {
    const ids = [...touches.keys()];
    touches.clear();
    pinch = null;
    suppress = false;
    for (const id of ids) {
      if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
    }
  }
  const distance = () => {
    const [a, b] = [...touches.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };
  const block = (event) => { event.preventDefault(); event.stopImmediatePropagation(); };
  listen(canvas, 'wheel', (event) => {
    if (!enabled()) return;
    event.preventDefault();
    change(wheelZoom(getZoom(), event.deltaY, event.deltaMode, canvas.clientHeight));
  }, { passive: false });
  // Capture before the editor's paint handlers: a second finger cancels, not commits.
  listen(canvas, 'pointerdown', (event) => {
    if (!enabled() || event.pointerType !== 'touch') return;
    touches.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (touches.size >= 2) {
      if (!suppress) {
        onStart();
        suppress = true;
      }
      pinch = touches.size === 2 ? { distance: Math.max(1, distance()), zoom: getZoom() } : null;
      canvas.setPointerCapture(event.pointerId);
      block(event);
    } else if (suppress) {
      canvas.setPointerCapture(event.pointerId);
      block(event);
    }
  }, { capture: true });
  listen(canvas, 'pointermove', (event) => {
    if (!touches.has(event.pointerId)) return;
    touches.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (!suppress) return;
    block(event);
    if (enabled() && pinch && touches.size === 2) {
      setZoom(clampZoom(pinch.zoom * distance() / pinch.distance));
      render();
    }
  }, { capture: true });
  const end = (event) => {
    if (!touches.has(event.pointerId)) return;
    touches.delete(event.pointerId);
    if (suppress) {
      block(event);
      pinch = touches.size === 2 ? { distance: Math.max(1, distance()), zoom: getZoom() } : null;
      if (!touches.size) suppress = false;
    }
  };
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    listen(canvas, name, end, { capture: true });
  }
  listen(window, 'blur', reset);
  listen(canvas, 'blur', reset);
  listen(document, 'visibilitychange', () => { if (document.hidden) reset(); });
  listen(outButton, 'click', () => change(getZoom() / 1.15));
  listen(inButton, 'click', () => change(getZoom() * 1.15));
  listen(resetButton, 'click', () => change(1));
  listen(canvas, 'keydown', (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey || !enabled()) return;
    const value = ['+', '='].includes(event.key) ? getZoom() * 1.15
      : event.key === '-' ? getZoom() / 1.15 : event.key === '0' ? 1 : null;
    if (value === null) return;
    event.preventDefault();
    change(value);
  });
  render();
  return { render, reset, dispose() { reset(); listeners.forEach((remove) => remove()); } };
}
