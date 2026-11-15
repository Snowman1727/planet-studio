import test from 'node:test';
import assert from 'node:assert/strict';
import { createProject, createStore, parseProject } from '../prototype/studio/model.js';
import { buildHTML } from '../prototype/studio/export.js';
import * as view from '../prototype/studio/view.js';

test('legacy schema 1 and 2 views gain default zoom without moving their world', () => {
  for (const version of [1, 2]) {
    const project = createProject(42);
    project.version = version;
    delete project.view.zoom;
    const saved = JSON.stringify(project);
    const restored = parseProject(saved);
    assert.deepEqual(restored.view, { x: 0.12, y: -0.2, zoom: 1 });
    assert.deepEqual(restored.objects, project.objects);
    assert.equal(JSON.stringify(project), saved);
  }
});

test('valid zoom survives project JSON and actual embedded HTML data', () => {
  for (const zoom of [0.65, 1, 1.37, 1.8]) {
    const project = createProject(42);
    project.view.zoom = zoom;
    const restored = parseProject(JSON.stringify(project));
    assert.deepEqual(restored, project);
    const html = buildHTML(restored, '');
    const embedded = JSON.parse(html.match(/<script id="planet-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
    assert.equal(embedded.view.zoom, zoom);
  }
});

test('explicit malformed or unsafe saved zoom is rejected rather than silently changed', () => {
  for (const zoom of [null, '1', false, {}, [], 0, -1, 0.649, 1.801, 1000]) {
    const project = createProject(42);
    project.view.zoom = zoom;
    assert.throws(() => parseProject(JSON.stringify(project)), { code: 'invalidProject' });
  }
});

test('brush undo and redo preserve later zoom and still restore exact placements', () => {
  const store = createStore(createProject(42));
  store.begin('tree', 0.4, 1);
  store.sample([0, 0, 1]);
  store.commit();
  const objects = structuredClone(store.project.objects);
  assert.ok(objects.length > 0);
  store.project.view.zoom = 1.5;
  store.undo();
  assert.equal(store.project.view.zoom, 1.5);
  store.project.view.zoom = 0.8;
  store.redo();
  assert.equal(store.project.view.zoom, 0.8);
  assert.deepEqual(store.project.objects, objects);
});

test('camera zoom is bounded and cannot enter the globe at any supported aspect', () => {
  assert.equal(typeof view.cameraDistance, 'function');
  for (const aspect of [0.2, 0.5, 1, 1.5, 4]) {
    const near = view.cameraDistance(aspect, 999);
    const far = view.cameraDistance(aspect, -999);
    assert.ok(near >= 9.7 / 1.8);
    assert.ok(far > near);
    assert.ok(view.cameraDistance(aspect, 1) > near);
  }
  assert.equal(view.cameraDistance(2, 1), 9.7);
  assert.equal(view.cameraDistance(0.5, 1), 18.4);
  for (const value of [NaN, Infinity, null, '2']) assert.equal(view.clampZoom(value), 1);
});

test('wheel pixel, line and page units zoom equivalently and extreme deltas stay safe', () => {
  assert.equal(typeof view.wheelZoom, 'function');
  const pixel = view.wheelZoom(1, 160, 0, 800);
  assert.ok(pixel < 1 && pixel > 0.65);
  assert.equal(view.wheelZoom(1, 10, 1, 800), pixel);
  assert.equal(view.wheelZoom(1, 0.2, 2, 800), pixel);
  assert.ok(view.wheelZoom(1, -100, 0, 800) > 1);
  assert.equal(view.wheelZoom(1, 1e20, 0, 800), 0.65);
  assert.equal(view.wheelZoom(1, -1e20, 0, 800), 1.8);
  assert.equal(view.wheelZoom(1.2, NaN, 0, 800), 1.2);
});
