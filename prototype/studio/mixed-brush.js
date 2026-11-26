import { localizedError } from './i18n.js';

export const DEFAULT_MIX = Object.freeze({ tree: 60, flowers: 25, rock: 15 });

export function mixShares(weights = DEFAULT_MIX) {
  const types = Object.keys(DEFAULT_MIX);
  if (!weights || Array.isArray(weights) || typeof weights !== 'object' ||
      Object.keys(weights).length !== types.length ||
      !types.every(type => Object.hasOwn(weights, type) && Number.isInteger(weights[type]) && weights[type] >= 0 && weights[type] <= 100)) {
    throw localizedError('invalidMix');
  }
  const total = types.reduce((sum, type) => sum + weights[type], 0);
  if (!total) throw localizedError('invalidMix');
  return Object.fromEntries(types.map(type => [type, weights[type] / total]));
}
