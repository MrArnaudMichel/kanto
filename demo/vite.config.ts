import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

/**
 * The demo and documentation site.
 *
 * It imports Kanto from `src/`, not from `dist/`, so the dev server reflects a
 * source edit immediately and the site is a genuine check that the library
 * works — if a component breaks, the docs break with it.
 */
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: './',
  resolve: {
    // Exact matches, not prefixes: an object alias for "kanto-ds" would also
    // swallow "kanto-ds/styles.css" and rewrite it to src/index.ts/styles.css.
    alias: [
      {
        find: /^kanto-ds$/,
        replacement: fileURLToPath(new URL('../src/index.ts', import.meta.url)),
      },
      {
        find: /^kanto-ds\/styles\.css$/,
        replacement: fileURLToPath(new URL('../src/styles.css', import.meta.url)),
      },
      { find: /^kanto-ds\//, replacement: fileURLToPath(new URL('../src/', import.meta.url)) },
    ],
  },
  build: {
    outDir: fileURLToPath(new URL('../dist-demo', import.meta.url)),
    emptyOutDir: true,
  },
});
