import { parseProject } from './model.js';
import { normalizeLocale, t } from './i18n.js';

const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function imageOptions(options) {
  if (!options || ![1024, 2048].includes(options.size) || typeof options.transparent !== 'boolean') {
    throw new Error('Invalid PNG options');
  }
  return { size: options.size, transparent: options.transparent };
}

export function fitImageDistance(radius, fov) {
  if (!Number.isFinite(radius) || radius <= 0 || !Number.isFinite(fov) || fov <= 0 || fov >= 180) {
    throw new Error('Invalid image framing');
  }
  const halfAngle = Math.atan(0.84 * Math.tan(fov * Math.PI / 360));
  return radius / Math.sin(halfAngle);
}

export function safeFilename(name) {
  return String(name).normalize('NFKC').replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'my-planet';
}

export function embedCode(path = '/my-planet.html', locale = 'zh-CN') {
  return `<iframe src="${escapeHTML(path)}" title="${t(locale, 'embedTitle')}" loading="lazy" style="width:100%;height:500px;border:0"></iframe>`;
}

export function buildHTML(project, runtime, locale = 'zh-CN') {
  locale = normalizeLocale(locale);
  const validated = parseProject(JSON.stringify(project));
  const data = JSON.stringify(validated).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  const script = runtime.replace(/<\/script/gi, '<\\/script');
  return `<!doctype html>
<html lang="${locale}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHTML(validated.name)}</title>
<style>
html,body{margin:0;width:100%;height:100%;overflow:hidden;background:transparent;color:#e6f4ed;font:14px system-ui,sans-serif}
canvas{display:block;width:100%;height:100%;touch-action:none}
button{border:1px solid #62766d;border-radius:5px;padding:8px 12px;background:#17231f;color:#e6f4ed;font:inherit;cursor:pointer;min-height:40px}
button:disabled{opacity:.4;cursor:not-allowed}
button:hover:not(:disabled){background:#263c32}
button svg{width:18px;height:18px;display:block}
.player-controls{position:fixed;bottom:16px;right:16px;display:flex;gap:8px;align-items:center}
.player-zoom{display:flex;gap:3px}
#player-zoom-reset{width:64px;font-variant-numeric:tabular-nums}
select{position:fixed;top:16px;left:16px;max-width:min(220px,calc(100vw - 32px));height:40px;padding:7px 10px;border:1px solid #62766d;border-radius:5px;background:#17231f;color:#e6f4ed;font:inherit}
button:focus-visible,select:focus-visible{outline:2px solid #9de9cd;outline-offset:3px}
#player-error{position:fixed;inset:40% 16px auto;text-align:center;color:#738f82}
[hidden]{display:none!important}
</style></head>
<body><canvas id="planet-player" tabindex="0" aria-label="${escapeHTML(t(locale, 'playerCanvas', { name: validated.name }))}"></canvas>
<select id="player-views" aria-label="${t(locale, 'savedViews')}" ${validated.bookmarks.length ? '' : 'hidden'}>
<option value="" disabled selected>${t(locale, 'savedViews')}</option>
${validated.bookmarks.map((bookmark, index) => `<option value="${index}">${escapeHTML(bookmark.name)}</option>`).join('')}
</select>
<div class="player-controls">
<div class="player-zoom" role="group" aria-label="${t(locale, 'cameraZoom')}">
<button id="player-zoom-out" type="button" aria-label="${t(locale, 'zoomOut')}" title="${t(locale, 'zoomOut')}"><i data-lucide="zoom-out"></i></button>
<button id="player-zoom-reset" type="button" aria-label="${t(locale, 'resetZoom')}" title="${t(locale, 'resetZoom')}">100%</button>
<button id="player-zoom-in" type="button" aria-label="${t(locale, 'zoomIn')}" title="${t(locale, 'zoomIn')}"><i data-lucide="zoom-in"></i></button>
</div>
<button id="player-pause" type="button" aria-label="${t(locale, 'pauseAnimation')}">${t(locale, 'pause')}</button>
</div>
<p id="player-error" role="alert" hidden></p>
<script id="planet-data" type="application/json">${data}</script>
<script>${script}</script>
</body></html>`;
}
