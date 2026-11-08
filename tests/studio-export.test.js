import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { buildHTML, embedCode, safeFilename } from '../prototype/studio/export.js';
import { createProject } from '../prototype/studio/model.js';

test('export embeds an exact inert project and executable standalone runtime', () => {
  const project = createProject(8);
  project.name = '</script><script>globalThis.pwned=true</script>';
  const html = buildHTML(project, 'globalThis.rendered = JSON.parse(document.getElementById("planet-data").textContent);');
  const dataMatch = html.match(/<script id="planet-data" type="application\/json">([\s\S]*?)<\/script>/);
  const runtimeMatch = html.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(dataMatch);
  assert.ok(runtimeMatch);
  assert.deepEqual(JSON.parse(dataMatch[1]), project);
  const context = { document: { getElementById: () => ({ textContent: dataMatch[1] }) } };
  vm.runInNewContext(runtimeMatch[1], context);
  assert.equal(context.rendered.name, project.name);
  assert.equal(context.pwned, undefined);
  assert.equal((html.match(/<script/g) ?? []).length, 2);
  assert.ok(!/<script[^>]+src=|<link[^>]+href=/.test(html));
});

test('embedded script-closing text cannot break the exported runtime', () => {
  const html = buildHTML(createProject(), 'globalThis.text = "</script>";');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const context = {};
  vm.runInNewContext(script, context);
  assert.equal(context.text, '</script>');
});

test('filenames cannot escape a download directory or become empty', () => {
  assert.equal(safeFilename('../hello / world'), 'hello-world');
  assert.equal(safeFilename('...///'), 'my-planet');
  assert.equal(safeFilename('圆圆的星球'), '圆圆的星球');
});

test('iframe path is escaped rather than creating new HTML attributes', () => {
  const code = embedCode('x" onload="alert(1)');
  assert.ok(code.includes('x&quot; onload=&quot;alert(1)'));
  assert.ok(!code.includes('src="x" onload='));
});

test('HTML export retains the environment and exact poses of all six brushes', () => {
  const project = createProject(42);
  project.settings.environment = 'desert';
  project.objects = ['tree', 'house', 'broadleaf', 'flowers', 'rock', 'mushroom'].map((type, i) => ({
    id: `${type}:${i}`, type, direction: [0, 0, 1], scale: 1, heading: i,
  }));
  const html = buildHTML(project, 'globalThis.ready = true;');
  const saved = JSON.parse(html.match(/<script id="planet-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(saved.version, 2);
  assert.equal(saved.settings.environment, 'desert');
  assert.deepEqual(saved.objects, project.objects);
});
