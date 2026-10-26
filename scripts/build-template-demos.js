#!/usr/bin/env node
/**
 * Builds each template's vanilla stack into dist-demo/live/<id>/, beside
 * the docs site, as its live demo. Like the site, it takes Kanto from src/ —
 * no install, no network — so the demo is the library at this commit.
 * Runs after the site's own build, which empties dist-demo.
 */
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = (path) => join(root, 'src', path);

// The docs site's aliases (demo/vite.config.ts): exact matches before the prefix.
const alias = [
  { find: /^kanto-ds$/, replacement: src('index.ts') },
  { find: /^kanto-ds\/styles\.css$/, replacement: src('styles.css') },
  { find: /^kanto-ds\//, replacement: `${src('')}/` },
];

const ids = readdirSync(join(root, 'templates'))
  .filter((name) => name.endsWith('-vanilla'))
  .map((name) => name.replace(/-vanilla$/, ''));

for (const id of ids) {
  await build({
    root: join(root, 'templates', `${id}-vanilla`),
    base: './',
    configFile: false,
    logLevel: 'warn',
    resolve: { alias },
    build: { outDir: join(root, 'dist-demo/live', id), emptyOutDir: true },
  });
  console.log(`built the ${id} live demo`);
}
