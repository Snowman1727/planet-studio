import { parseProject } from './model.js';
import { normalizeLocale, t } from './i18n.js';

const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

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
button{position:fixed;bottom:16px;right:16px;border:1px solid #62766d;border-radius:6px;padding:8px 14px;background:#17231f;color:#e6f4ed;font:inherit;cursor:pointer}
button:focus-visible{outline:2px solid #9de9cd;outline-offset:3px}
#player-error{position:fixed;inset:40% 16px auto;text-align:center;color:#738f82}
[hidden]{display:none!important}
</style></head>
<body><canvas id="planet-player" tabindex="0" aria-label="${escapeHTML(t(locale, 'playerCanvas', { name: validated.name }))}"></canvas>
<button id="player-pause" type="button" aria-label="${t(locale, 'pauseAnimation')}">${t(locale, 'pause')}</button>
<p id="player-error" role="alert" hidden></p>
<script id="planet-data" type="application/json">${data}</script>
<script>${script}</script>
</body></html>`;
}
