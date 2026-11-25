const PAGE_SIZE = 24;

export function objectPage(objects, { type = 'all', query = '', page = 0 } = {}) {
  const needle = query.trim().toLowerCase();
  const matches = objects.filter((object) =>
    (type === 'all' || object.type === type) && object.id.toLowerCase().includes(needle));
  const pages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const current = Math.max(0, Math.min(pages - 1, Number.isInteger(page) ? page : 0));
  return {
    objects: matches.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE),
    total: matches.length, page: current, pages,
  };
}

export function objectView(direction, zoom) {
  // XYZ world rotation applies its fixed Z roll before yaw and pitch.
  const c = Math.cos(-0.04), s = Math.sin(-0.04);
  const x = c * direction[0] - s * direction[1];
  const y = s * direction[0] + c * direction[1];
  const z = direction[2];
  return {
    x: Math.max(-1.5, Math.min(1.5, Math.atan2(y, Math.hypot(x, z)))),
    y: -Math.atan2(x, z), zoom,
  };
}
