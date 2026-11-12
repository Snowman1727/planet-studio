import { createScene } from './scene.js';
import { normalizeLocale, t, errorMessage } from './i18n.js';

const locale = normalizeLocale(document.documentElement.lang);
const canvas = document.querySelector('#planet-player');
const button = document.querySelector('#player-pause');
const error = document.querySelector('#player-error');
let scene;
let pointer = null;
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
let paused = motion.matches;
function showError(reason) {
  error.hidden = false;
  error.textContent = errorMessage(reason, locale, 'playerUnavailable');
  button.hidden = true;
}
try {
  const project = JSON.parse(document.querySelector('#planet-data').textContent);
  scene = createScene(canvas, project, { onError: showError });
  scene.preview(true);
  scene.pause(paused);
  const update = () => {
    button.textContent = t(locale, paused ? 'play' : 'pause');
    button.setAttribute('aria-label', t(locale, paused ? 'playAnimation' : 'pauseAnimation'));
    button.setAttribute('aria-pressed', String(paused));
    button.hidden = motion.matches;
  };
  update();
  motion.addEventListener('change', update);
  button.addEventListener('click', () => { paused = !paused; scene.pause(paused); update(); });
  canvas.addEventListener('pointerdown', (event) => {
    if (pointer || event.button !== 0) return;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (pointer?.id !== event.pointerId) return;
    scene.rotate((event.clientX - pointer.x) * 0.006, (event.clientY - pointer.y) * 0.004);
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  });
  const end = (event) => { if (!event.pointerId || event.pointerId === pointer?.id) pointer = null; };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('lostpointercapture', end);
  window.addEventListener('blur', end);
  canvas.addEventListener('keydown', (event) => {
    const moves = { ArrowLeft: [-0.12, 0], ArrowRight: [0.12, 0], ArrowUp: [0, -0.1], ArrowDown: [0, 0.1] };
    if (moves[event.key]) { event.preventDefault(); scene.rotate(...moves[event.key]); }
    if (event.code === 'Space') { event.preventDefault(); button.click(); }
  });
  window.addEventListener('pagehide', () => {
    motion.removeEventListener('change', update);
    scene.dispose();
  }, { once: true });
} catch (reason) { showError(reason); }
