import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { createAssets } from '../prototype/studio/assets.js';

test('every decoration fits its placement footprint and has a visible body in non-snow worlds', () => {
  const { parts, materials } = createAssets();
  const bounds = { tree: 0.12, house: 0.23, broadleaf: 0.21, flowers: 0.1, rock: 0.16, mushroom: 0.134 };
  const point = new Vector3();
  try {
    for (const [type, radius] of Object.entries(bounds)) {
      const recipe = parts.filter((p) => p.type === type);
      assert.ok(recipe.some((p) => !p.snow), `${type} disappears without snow`);
      for (const part of recipe) {
        const positions = part.geometry.getAttribute('position');
        assert.ok(positions.count > 0);
        for (let i = 0; i < positions.count; i++) {
          point.fromBufferAttribute(positions, i).applyMatrix4(part.local);
          assert.ok(Math.hypot(point.x, point.z) <= radius, `${type} exceeds footprint`);
          assert.ok(point.y <= 0.7 && point.y >= -0.03, `${type} floats or exceeds camera framing`);
        }
      }
    }
  } finally {
    new Set(parts.map((p) => p.geometry)).forEach((g) => g.dispose());
    Object.values(materials).forEach((m) => m.dispose());
  }
});
