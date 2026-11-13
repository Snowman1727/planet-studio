import test from 'node:test';
import assert from 'node:assert/strict';
import * as image from '../prototype/studio/export.js';

test('PNG options allow only supported square sizes and explicit transparency', () => {
  assert.equal(typeof image.imageOptions, 'function', 'PNG options validation is available');
  for (const size of [1024, 2048]) {
    for (const transparent of [true, false]) {
      assert.deepEqual(image.imageOptions({ size, transparent }), { size, transparent });
    }
  }
  for (const size of [0, -1, 4096, 1024.5, '1024', Infinity, NaN, null]) {
    assert.throws(() => image.imageOptions({ size, transparent: true }));
  }
  for (const transparent of ['true', 1, null, undefined]) {
    assert.throws(() => image.imageOptions({ size: 1024, transparent }));
  }
  assert.throws(() => image.imageOptions(null));
});

test('square image framing fits the complete sphere and reserves edge clearance', () => {
  assert.equal(typeof image.fitImageDistance, 'function', 'PNG framing is available');
  // Sphere's angular radius is asin(radius / distance), not atan(radius / distance).
  for (const radius of [2.1, 2.9, 4]) {
    const distance = image.fitImageDistance(radius, 35);
    const projectedRadius = Math.tan(Math.asin(radius / distance)) / Math.tan(35 * Math.PI / 360);
    assert.ok(projectedRadius <= 0.84 + 1e-10 && projectedRadius > 0.8);
  }
  for (const radius of [0, -2, Infinity, NaN]) assert.throws(() => image.fitImageDistance(radius, 35));
  for (const fov of [0, 180, NaN]) assert.throws(() => image.fitImageDistance(2.5, fov));
});
