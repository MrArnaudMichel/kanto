import { readdirSync } from 'node:fs';
import type { Server } from 'node:http';
import { fileURLToPath } from 'node:url';
import { createServer, defineConfig, type Alias, type Plugin, type ViteDevServer } from 'vite';

const at = (path: string) => fileURLToPath(new URL(path, import.meta.url));

/** Kanto from src/: exact matches before the prefix — the build of the template demos uses the same. */
const alias: Alias[] = [
  { find: /^kanto-ds$/, replacement: at('../src/index.ts') },
  { find: /^kanto-ds\/styles\.css$/, replacement: at('../src/styles.css') },
  { find: /^kanto-ds\//, replacement: at('../src/') },
];

/**
 * The template pages frame `./templates/<id>/`, which the build fills from
 * each template's vanilla project (scripts/build-template-demos.js). In dev,
 * each project runs live under that path instead — without this the frame
 * fell back to the docs page and showed the site itself.
 */
function templateDemos(): Plugin {
  const servers: ViteDevServer[] = [];
  return {
    name: 'kanto-template-demos',
    apply: 'serve',
    async configureServer(docs) {
      const ids = readdirSync(at('../templates'))
        .filter((name) => name.endsWith('-vanilla'))
        .map((name) => name.replace(/-vanilla$/, ''));
      for (const id of ids) {
        const base = `/templates/${id}/`;
        const demo = await createServer({
          root: at(`../templates/${id}-vanilla`),
          base,
          configFile: false,
          logLevel: 'warn',
          resolve: { alias },
          // Live reload through the docs server's own connection.
          server: {
            middlewareMode: true,
            hmr: docs.httpServer ? { server: docs.httpServer as Server } : false,
          },
          appType: 'spa',
        });
        servers.push(demo);
        docs.middlewares.use((request, response, next) => {
          const url = request.url ?? '';
          // `/templates/saas` without its slash: send it to the page.
          if (url === base.slice(0, -1)) {
            response.writeHead(301, { Location: base }).end();
          } else if (url.startsWith(base)) demo.middlewares(request, response, next);
          else next();
        });
      }
      docs.httpServer?.once('close', () => {
        for (const demo of servers) void demo.close();
      });
    },
  };
}

/**
 * The demo and documentation site.
 *
 * It imports Kanto from `src/`, not from `dist/`, so the dev server reflects a
 * source edit immediately and the site is a genuine check that the library
 * works — if a component breaks, the docs break with it.
 */
export default defineConfig({
  root: at('.'),
  base: './',
  // Exact matches, not prefixes: an object alias for "kanto-ds" would also
  // swallow "kanto-ds/styles.css" and rewrite it to src/index.ts/styles.css.
  resolve: { alias },
  plugins: [templateDemos()],
  build: {
    outDir: at('../dist-demo'),
    emptyOutDir: true,
  },
});
