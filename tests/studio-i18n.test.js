import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLocale, t, loadLocale, saveLocale, errorMessage, localizedError } from '../prototype/studio/i18n.js';
import { createProject, parseProject } from '../prototype/studio/model.js';

test('unsupported language preferences fall back to Chinese without accepting object keys', () => {
  for (const input of [undefined, null, '', 'fr', '__proto__', {}, 'en" onload="evil']) {
    assert.equal(normalizeLocale(input), 'zh-CN');
    assert.equal(t(input, 'preview'), '预览');
  }
  assert.equal(normalizeLocale('en'), 'en');
  assert.equal(t('en', 'preview'), 'Preview');
});

test('dynamic messages render counts and user values in the selected language', () => {
  assert.equal(t('en', 'objectCount', { count: 1 }), '1 object');
  assert.equal(t('en', 'objectCount', { count: 12 }), '12 objects');
  assert.equal(t('zh-CN', 'objectCount', { count: 0 }), '0 个物件');
  assert.equal(t('en', 'environmentChanged', { environment: 'Grassland' }), 'Switched to Grassland.');
  assert.equal(t('zh-CN', 'environmentChanged', { environment: '草地' }), '已切换为草地。');
  assert.equal(t('en', 'playerCanvas', { name: '<圆圆>' }), '<圆圆>: interactive 3D planet');
});

test('language preference persists separately and never touches a legacy draft', () => {
  const legacy = JSON.stringify({ ...createProject(), version: 1, settings: { snow: true, autoRotate: true } });
  const values = new Map([['snowman:planet-studio:v1', legacy]]);
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  assert.equal(loadLocale(storage), 'zh-CN');
  assert.equal(saveLocale('en', storage), true);
  assert.equal(loadLocale(storage), 'en');
  assert.equal(values.get('snowman:planet-studio:v1'), legacy);
  assert.equal(parseProject(values.get('snowman:planet-studio:v1')).version, 2);
});

test('blocked or missing preference storage never prevents using a language', () => {
  const unavailable = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('quota'); } };
  assert.equal(loadLocale(unavailable), 'zh-CN');
  assert.equal(saveLocale('en', unavailable), false);
  assert.equal(loadLocale(undefined), 'zh-CN');
  assert.equal(saveLocale('en', undefined), false);
  assert.equal(t('en', 'ready'), 'Ready');
});

test('coded validation errors translate without exposing browser or imported exception text', () => {
  const error = localizedError('invalidProject');
  assert.match(error.message, /星球文件格式/);
  assert.equal(errorMessage(error, 'en'), 'Invalid planet file or unsupported data.');
  assert.equal(errorMessage(new Error('<private browser detail>'), 'en', 'importFailed'), 'Could not import this planet file.');
  assert.throws(() => t('en', '__proto__'), /Unknown translation/);
});

test('real project validation errors expose translatable codes', () => {
  let invalid;
  try { parseProject('{bad json'); } catch (error) { invalid = error; }
  assert.equal(errorMessage(invalid, 'en', 'importFailed'), 'Invalid planet file or unsupported data.');
  let tooLarge;
  try { parseProject(' '.repeat(2 * 1024 * 1024 + 1)); } catch (error) { tooLarge = error; }
  assert.equal(errorMessage(tooLarge, 'en', 'importFailed'), 'File too large. Choose a planet JSON file smaller than 2 MB.');
});
