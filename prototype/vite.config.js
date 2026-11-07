import { defineConfig } from 'vite';
import { rolldown } from 'rolldown';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
let runtime;
async function bundlePlayer() {
  const bundle = await rolldown({ input: `${root}prototype/studio/player.js` });
  try {
    const { output } = await bundle.generate({ format: 'iife', minify: true });
    const notice = await readFile(`${root}node_modules/three/LICENSE`, 'utf8');
    return `/* Three.js license:\n${notice}\n*/\n${output.find((item) => item.type === 'chunk').code}`;
  } finally { await bundle.close(); }
}

export default defineConfig({
  base: './',
  plugins: [{
    name: 'standalone-planet-player',
    resolveId(id) { if (id === 'virtual:planet-player') return '\0planet-player'; },
    async load(id) {
      if (id !== '\0planet-player') return;
      runtime ??= bundlePlayer();
      return `export default ${JSON.stringify(await runtime)};`;
    },
    handleHotUpdate({ file, server }) {
      if (!file.includes('/studio/') || file.endsWith('/main.js') || file.endsWith('/style.css')) return;
      runtime = undefined;
      const module = server.moduleGraph.getModuleById('\0planet-player');
      if (module) server.moduleGraph.invalidateModule(module);
    },
  }],
  build: {
    emptyOutDir: true,
    rolldownOptions: {
      input: {
        studio: `${root}prototype/index.html`,
      },
    },
  },
});
