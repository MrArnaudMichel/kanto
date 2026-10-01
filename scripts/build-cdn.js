/**
 * Builds `dist/cdn/kanto.min.js`: the whole system as one minified module,
 * Lit and the default icons included, for a page with no build step.
 *
 *     <script type="module" src="https://cdn.jsdelivr.net/npm/kanto-ds"></script>
 *
 * The package's `unpkg` and `jsdelivr` fields point at it, so the bare package
 * URL serves this file rather than a module whose imports a browser cannot
 * resolve. Built from `dist/index.js`, so it runs after `build:js`.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

await build({
  entryPoints: [join(root, 'dist/index.js')],
  outfile: join(root, 'dist/cdn/kanto.min.js'),
  bundle: true,
  format: 'esm',
  minify: true,
  target: 'es2022',
  legalComments: 'none',
  logLevel: 'warning',
});
console.log('built dist/cdn/kanto.min.js');
