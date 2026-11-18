import { createProject, createStore } from './model.js';
import { t } from './i18n.js';

export const TEMPLATE_IDS = Object.freeze(['forest', 'village', 'desert']);

const recipes = {
  forest: {
    seed: 34071, environment: 'grass', view: { x: 0.18, y: -0.18, zoom: 1.08 },
    strokes: [
      ['tree', 0.34, 0.9, [[-30, 13], [-12, 21]]],
      ['tree', 0.32, 0.86, [[21, 9], [40, 18]]],
      ['tree', 0.26, 0.8, [[0, -28]]],
      ['broadleaf', 0.25, 0.8, [[-36, -16]]],
      ['broadleaf', 0.23, 0.75, [[36, -24]]],
      ['flowers', 0.22, 0.85, [[0, 5]]],
      ['mushroom', 0.17, 0.75, [[-18, -28]]],
      ['rock', 0.16, 0.7, [[16, 31]]],
    ],
  },
  village: {
    seed: 203108, environment: 'grass', view: { x: 0.14, y: -0.13, zoom: 1.12 },
    strokes: [
      ['house', 0.3, 1, [[-16, 5], [4, 7]]],
      ['house', 0.23, 0.96, [[20, -18]]],
      ['tree', 0.31, 0.88, [[-46, 12]]],
      ['tree', 0.28, 0.84, [[46, 15]]],
      ['broadleaf', 0.23, 0.75, [[14, 33]]],
      ['flowers', 0.25, 0.9, [[-15, -24]]],
      ['mushroom', 0.17, 0.65, [[34, -25]]],
      ['rock', 0.17, 0.6, [[-39, -25]]],
    ],
  },
  desert: {
    seed: 885017, environment: 'desert', view: { x: 0.12, y: -0.25, zoom: 1.08 },
    strokes: [
      ['rock', 0.34, 0.98, [[-24, 7], [-5, 14]]],
      ['rock', 0.28, 0.88, [[38, -10]]],
      ['rock', 0.22, 0.75, [[-8, -31]]],
      ['house', 0.24, 1, [[16, -24]]],
      ['broadleaf', 0.23, 0.78, [[18, 27]]],
      ['tree', 0.2, 0.65, [[38, 33]]],
      ['flowers', 0.18, 0.6, [[19, -6]]],
    ],
  },
};

function direction(longitude, latitude) {
  const lon = longitude * Math.PI / 180;
  const lat = latitude * Math.PI / 180;
  return [Math.sin(lon) * Math.cos(lat), Math.sin(lat), Math.cos(lon) * Math.cos(lat)];
}

export function createTemplate(id, locale = 'zh-CN') {
  if (!Object.hasOwn(recipes, id)) throw new RangeError('Unknown template');
  const recipe = recipes[id];
  const project = createProject(recipe.seed);
  project.name = t(locale, `${id}Template`);
  project.settings.environment = recipe.environment;
  project.settings.snow = false;
  project.settings.autoRotate = false;
  project.view = { ...recipe.view };
  const store = createStore(project);
  for (const [type, radius, density, points] of recipe.strokes) {
    store.begin(type, radius, density);
    for (const [longitude, latitude] of points) store.sample(direction(longitude, latitude));
    store.commit();
  }
  return store.project;
}
