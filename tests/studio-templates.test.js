import test from 'node:test';
import assert from 'node:assert/strict';
import { createTemplate, TEMPLATE_IDS } from '../prototype/studio/templates.js';
import { parseProject, MAX_OBJECTS } from '../prototype/studio/model.js';
import { BRUSHES } from '../prototype/studio/catalog.js';
import { buildHTML } from '../prototype/studio/export.js';

test('three template IDs build distinct editable planets in their intended environments', () => {
  assert.deepEqual(TEMPLATE_IDS, ['forest', 'village', 'desert']);
  const projects = TEMPLATE_IDS.map((id) => createTemplate(id, 'en'));
  assert.deepEqual(projects.map((project) => project.settings.environment), ['grass', 'grass', 'desert']);
  assert.equal(new Set(projects.map((project) => project.seed)).size, 3);
  for (const project of projects) {
    assert.ok(project.objects.length >= 20 && project.objects.length <= MAX_OBJECTS);
    assert.deepEqual(parseProject(JSON.stringify(project)), project);
    assert.deepEqual(project.bookmarks, []);
    assert.ok(project.name.length > 0);
  }
  const counts = projects.map((project) => Object.fromEntries(Object.keys(BRUSHES).map((type) => [type, project.objects.filter((object) => object.type === type).length])));
  assert.ok(counts[0].tree >= 10 && counts[0].broadleaf > 0 && counts[0].flowers > 0);
  assert.ok(counts[1].house >= 2 && counts[1].tree > 0 && counts[1].flowers > 0);
  assert.ok(counts[2].rock >= 10 && counts[2].house > 0 && counts[2].broadleaf > 0);
  assert.notDeepEqual(projects[0].objects, projects[1].objects);
  assert.notDeepEqual(projects[1].objects, projects[2].objects);
});

test('template recipes are deterministic, fresh and bilingual', () => {
  for (const id of TEMPLATE_IDS) {
    const first = createTemplate(id, 'en');
    const second = createTemplate(id, 'en');
    assert.deepEqual(first, second);
    assert.notEqual(first, second);
    first.objects.pop();
    assert.notDeepEqual(first.objects, second.objects);
    const chinese = createTemplate(id, 'zh-CN');
    assert.notEqual(chinese.name, second.name);
    assert.deepEqual(chinese.objects, second.objects);
  }
  assert.throws(() => createTemplate('unknown', 'en'), RangeError);
});

test('template objects retain valid spacing and survive standalone HTML export', () => {
  for (const id of TEMPLATE_IDS) {
    const project = createTemplate(id, 'en');
    for (let i = 0; i < project.objects.length; i++) {
      const a = project.objects[i];
      const ar = BRUSHES[a.type].footprint * a.scale;
      for (let j = i + 1; j < project.objects.length; j++) {
        const b = project.objects[j];
        const br = BRUSHES[b.type].footprint * b.scale;
        const cosine = a.direction.reduce((sum, coordinate, k) => sum + coordinate * b.direction[k], 0);
        assert.ok(Math.acos(Math.max(-1, Math.min(1, cosine))) + 1e-8 >= ar + br, `${id}: ${a.id} overlaps ${b.id}`);
      }
    }
    const html = buildHTML(project, '', 'en');
    const embedded = JSON.parse(html.match(/<script id="planet-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
    assert.deepEqual(embedded, project);
  }
});
