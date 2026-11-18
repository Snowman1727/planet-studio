const preferenceKey = 'planet-studio:locale';
const messages = {
  title: ['Planet Studio · 星球画室', 'Planet Studio · Planet Editor'],
  home: ['Planet Studio 首页', 'Planet Studio home'],
  language: ['界面语言', 'Interface language'],
  projectName: ['星球名称', 'Planet name'],
  untitled: ['未命名星球', 'Untitled planet'],
  newWork: ['新作品', 'New project'],
  localDraft: ['本地草稿', 'Local draft'],
  savedLocally: ['已存本地', 'Saved locally'],
  notSaved: ['未自动保存', 'Not saved locally'],
  jsonSaved: ['已导出 JSON', 'JSON exported'],
  undo: ['撤销', 'Undo'],
  redo: ['重做', 'Redo'],
  newPlanet: ['新建星球', 'New planet'],
  templates: ['示例模板', 'Example templates'],
  closeTemplates: ['关闭示例模板', 'Close example templates'],
  forestTemplate: ['林间花园', 'Woodland Garden'],
  villageTemplate: ['山坡村落', 'Hillside Village'],
  desertTemplate: ['沙丘驿站', 'Dune Outpost'],
  forestTemplateDetail: ['树林、野花与蘑菇', 'Trees, flowers and mushrooms'],
  villageTemplateDetail: ['木屋与环绕的林地', 'Cabins among the trees'],
  desertTemplateDetail: ['岩丘与绿洲驿站', 'Rocky hills and a small oasis'],
  importJSON: ['导入 JSON', 'Import JSON'],
  saveJSON: ['保存 JSON', 'Save JSON'],
  export: ['导出', 'Export'],
  editorTools: ['编辑工具', 'Editing tools'],
  studio: ['星球画室', 'Planet Studio'],
  tools: ['工具', 'Tools'],
  tree: ['森林', 'Forest'],
  house: ['木屋', 'Cabin'],
  broadleaf: ['阔叶树', 'Broadleaf'],
  flowers: ['花丛', 'Flowers'],
  rock: ['岩石', 'Rocks'],
  mushroom: ['蘑菇', 'Mushroom'],
  erase: ['橡皮', 'Eraser'],
  rotate: ['旋转', 'Rotate'],
  brush: ['画笔', 'Brush'],
  radius: ['范围', 'Radius'],
  density: ['密度', 'Density'],
  environment: ['环境', 'Environment'],
  snow: ['雪原', 'Snow'],
  grass: ['草地', 'Grassland'],
  desert: ['沙漠', 'Desert'],
  snowfall: ['飘雪', 'Snowfall'],
  autoRotate: ['自动旋转', 'Auto-rotate'],
  objects: ['物件', 'Objects'],
  treeCount: ['松林数量', 'Pine tree count'],
  houseCount: ['木屋数量', 'Cabin count'],
  broadleafCount: ['阔叶树数量', 'Broadleaf tree count'],
  flowersCount: ['花丛数量', 'Flower patch count'],
  rockCount: ['岩石数量', 'Rock count'],
  mushroomCount: ['蘑菇数量', 'Mushroom count'],
  planetCanvas: ['星球画布', 'Planet canvas'],
  canvas: ['三维星球画布', '3D planet canvas'],
  cameraZoom: ['镜头缩放', 'Camera zoom'],
  zoomOut: ['缩小', 'Zoom out'],
  zoomIn: ['放大', 'Zoom in'],
  resetZoom: ['重置缩放', 'Reset zoom'],
  resetZoomValue: ['重置缩放 ({percent}%)', 'Reset zoom ({percent}%)'],
  invalidBookmark: ['请输入 1–40 个字符的视角名称。', 'Enter a view name of 1–40 characters.'],
  bookmarkDuplicate: ['这个视角名称已存在。', 'A view with this name already exists.'],
  bookmarkLimit: ['最多只能收藏 8 个视角。', 'You can save up to 8 views.'],
  savedViews: ['视角收藏', 'Saved views'],
  closeSavedViews: ['关闭视角收藏', 'Close saved views'],
  viewName: ['视角名称', 'View name'],
  saveView: ['收藏当前视角', 'Save current view'],
  savedViewCount: ['已收藏 {count} / 8', '{count} / 8 saved'],
  noSavedViews: ['还没有收藏视角。', 'No saved views yet.'],
  jumpToView: ['跳转到 {name}', 'Go to {name}'],
  deleteView: ['删除 {name}', 'Delete {name}'],
  bookmarkSaved: ['视角已收藏。', 'View saved.'],
  bookmarkDeleted: ['视角已删除。', 'View deleted.'],
  bookmarkLoaded: ['已切换到 {name}。', 'Switched to {name}.'],
  editing: ['编辑中', 'Editing'],
  previewing: ['预览中', 'Previewing'],
  preview: ['预览', 'Preview'],
  returnToEdit: ['返回编辑', 'Back to editor'],
  pauseAnimation: ['暂停动画', 'Pause animation'],
  playAnimation: ['播放动画', 'Play animation'],
  pause: ['暂停', 'Pause'],
  play: ['播放', 'Play'],
  blankPlanet: ['空白星球', 'Blank planet'],
  objectCount: ['{count} 个物件', ({ count }) => `${count} ${count === 1 ? 'object' : 'objects'}`],
  ready: ['已就绪', 'Ready'],
  history: ['撤销历史 40 步', '40-step undo history'],
  replaceTitle: ['替换当前星球？', 'Replace this planet?'],
  cancelReplace: ['取消替换', 'Cancel replacement'],
  replaceDescription: ['当前作品尚未导出 JSON。', 'This planet has not been exported as JSON.'],
  saveFirst: ['先保存 JSON', 'Save JSON first'],
  replace: ['替换', 'Replace'],
  exportTitle: ['导出星球', 'Export planet'],
  closeExport: ['关闭导出', 'Close export'],
  standaloneHTML: ['独立 HTML', 'Standalone HTML'],
  filePath: ['网页中的文件路径', 'File path on your website'],
  embedCode: ['嵌入代码', 'Embed code'],
  copyEmbed: ['复制嵌入代码', 'Copy embed code'],
  downloadHTML: ['下载 HTML', 'Download HTML'],
  exportFormat: ['导出格式', 'Export format'],
  imageSize: ['图片尺寸', 'Image size'],
  transparentBackground: ['透明背景', 'Transparent background'],
  downloadPNG: ['下载 PNG', 'Download PNG'],
  pngExporting: ['正在生成 PNG…', 'Creating PNG…'],
  pngExported: ['PNG 图片已导出。', 'PNG image exported.'],
  pngFailed: ['无法生成 PNG，请重试或保存 JSON。', 'Could not create PNG. Try again or save JSON.'],
  recovered: ['已恢复上次的星球。', 'Your last planet has been restored.'],
  recoveryUnavailable: ['本地恢复不可用，请手动保存 JSON。', 'Local recovery is unavailable. Save a JSON copy.'],
  storageUnavailable: ['本地存储不可用，请保存 JSON。', 'Local storage is unavailable. Save a JSON copy.'],
  localeNotSaved: ['语言已切换，但无法保存语言偏好。', 'Language changed, but the preference could not be saved.'],
  environmentChanged: ['已切换为{environment}。', 'Switched to {environment}.'],
  sceneUpdated: ['场景已更新。', 'Scene updated.'],
  strokeDone: ['笔画已完成。', 'Stroke completed.'],
  noSpace: ['当前范围没有可放置的位置，请扩大范围或擦除已有物件。', 'No space here. Increase the brush radius or erase some objects.'],
  noChange: ['此区域没有新的变化。', 'No new changes in this area.'],
  objectLimit: ['已达到 2,000 个物件上限，可擦除后继续。', 'The 2,000-object limit is reached. Erase objects to continue.'],
  undone: ['已撤销。', 'Undone.'],
  redone: ['已重做。', 'Redone.'],
  jsonExported: ['JSON 已导出。', 'JSON exported.'],
  planetLoaded: ['星球已载入。', 'Planet loaded.'],
  savedBeforeReplace: ['JSON 已导出，可以继续替换。', 'JSON exported. You can now replace the planet.'],
  embedCopied: ['嵌入代码已复制。', 'Embed code copied.'],
  copyUnavailable: ['自动复制不可用，嵌入代码已选中。', 'Clipboard unavailable. The embed code is selected.'],
  htmlExported: ['独立 HTML 已导出。', 'Standalone HTML exported.'],
  importFailed: ['无法导入此星球文件。', 'Could not import this planet file.'],
  exportFailed: ['无法导出星球，请保存 JSON 后重试。', 'Could not export this planet. Save JSON and try again.'],
  invalidProject: ['星球文件格式不正确，或包含不支持的数据。', 'Invalid planet file or unsupported data.'],
  fileTooLarge: ['文件过大，请选择小于 2 MB 的星球 JSON 文件。', 'File too large. Choose a planet JSON file smaller than 2 MB.'],
  invalidBrush: ['画笔参数无效。', 'Invalid brush settings.'],
  renderUnavailable: ['此浏览器无法显示三维星球。JSON 存档仍可保存。', 'This browser cannot display the 3D planet. You can still save JSON.'],
  renderStatus: ['三维画面不可用，仍可保存 JSON。', '3D rendering is unavailable. You can still save JSON.'],
  contextLost: ['三维画面已中断。请先保存 JSON，再刷新页面。', '3D rendering was interrupted. Save JSON before reloading.'],
  playerUnavailable: ['此浏览器无法显示三维星球。', 'This browser cannot display the 3D planet.'],
  playerCanvas: ['{name}，可旋转的三维星球', '{name}: interactive 3D planet'],
  embedTitle: ['我的小星球', 'My miniature planet'],
};

export function normalizeLocale(locale) {
  return locale === 'en' ? 'en' : 'zh-CN';
}

export function t(locale, key, params = {}) {
  if (!Object.hasOwn(messages, key)) throw new Error(`Unknown translation: ${key}`);
  const value = messages[key][normalizeLocale(locale) === 'en' ? 1 : 0];
  return typeof value === 'function' ? value(params)
    : value.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? ''));
}

export function loadLocale(storage) {
  try { return normalizeLocale(storage?.getItem(preferenceKey)); }
  catch { return 'zh-CN'; }
}

export function saveLocale(locale, storage) {
  try {
    if (!storage) return false;
    storage.setItem(preferenceKey, normalizeLocale(locale));
    return true;
  } catch { return false; }
}

export function localizedError(code) {
  return Object.assign(new Error(t('zh-CN', code)), { code });
}

export function errorMessage(error, locale, fallback = 'renderUnavailable') {
  const codes = ['invalidProject', 'fileTooLarge', 'invalidBrush', 'contextLost'];
  return t(locale, codes.includes(error?.code) ? error.code : fallback);
}
