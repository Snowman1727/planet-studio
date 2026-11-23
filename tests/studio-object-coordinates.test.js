import test from 'node:test';
import assert from 'node:assert/strict';

const helpers = await import('../prototype/studio/object-edit.js').catch(() => ({}));
const close = (actual, expected) => actual.forEach((n, i) => assert.ok(Math.abs(n - expected[i]) < 1e-10));

test('geographic fields represent equator, poles and both sides of the longitude seam', () => {
  close(helpers.directionFromCoordinates(0, 0), [0, 0, 1]);
  close(helpers.directionFromCoordinates(0, 90), [1, 0, 0]);
  close(helpers.directionFromCoordinates(90, 0), [0, 1, 0]);
  close(helpers.directionFromCoordinates(-90, 180), [0, -1, 0]);
  for (const [lat, lon] of [[40, 179.9], [-40, -179.9], [89.99, 45]]) {
    const actual = helpers.coordinatesFromDirection(helpers.directionFromCoordinates(lat, lon));
    close([actual.latitude, actual.longitude], [lat, lon]);
  }
});

test('spherical dragging transports the anchor without a canopy-to-ground jump', () => {
  close(helpers.dragDirection([0, 0, 1], [1, 0, 0], [0, 0, 1]), [1, 0, 0]);
  close(helpers.dragDirection([0, 0, 1], [0, 0, 1], [0, 0.6, 0.8]), [0, 0.6, 0.8]);
  const moved = helpers.dragDirection([0, 0, 1], [0, 1, 0], [0, 0.6, 0.8]);
  close(moved, [0, 0.8, -0.6]);
  assert.ok(Math.abs(Math.hypot(...moved) - 1) < 1e-10);
});

test('unchanged displayed coordinates produce no patch and rotation never rounds position', () => {
  const object = { direction: [0.123456789, 0, Math.sqrt(1 - 0.123456789 ** 2)], heading: 0.713321, scale: 0.923456 };
  const fields = helpers.poseFields(object);
  assert.deepEqual(helpers.posePatch(fields, fields), {});
  assert.deepEqual(helpers.posePatch({ ...fields, heading: '180' }, fields), { heading: Math.PI });
  assert.deepEqual(helpers.posePatch({ ...fields, scale: '120' }, fields), { scale: 1.2 });
});

test('numeric edits reject blanks, nonfinite and out-of-range coordinates before a transaction', () => {
  const fields = { latitude: '0', longitude: '0', heading: '0', scale: '100' };
  for (const change of [
    { latitude: '' }, { longitude: '181' }, { latitude: '91' }, { latitude: '-91' },
    { longitude: '-181' }, { heading: '361' }, { heading: '-1' },
    { scale: '74' }, { scale: '121' }, { heading: 'Infinity' }, { scale: 'NaN' },
  ]) {
    assert.throws(() => helpers.posePatch({ ...fields, ...change }, fields), { code: 'invalidObjectEdit' });
  }
});
