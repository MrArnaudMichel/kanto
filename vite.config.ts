import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const root = fileURLToPath(new URL('.', import.meta.url));
const src = join(root, 'src');

/** Recursively collect files under `dir` matching `test`. */
function walk(dir: string, test: (file: string) => boolean, found: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, test, found);
    else if (test(full)) found.push(full);
  }
  return found;
}

/**
 * One entry per public module, so consumers can import the whole system
 * (`kanto`) or a single element (`kanto/components/core/kt-button`) and let
 * their bundler drop the rest.
 */
function entries(): Record<string, string> {
  const files = [
    join(src, 'index.ts'),
    join(src, 'icons/index.ts'),
    join(src, 'react/index.ts'),
    join(src, 'vue/index.ts'),
    ...walk(join(src, 'components'), (f) => /kt-[a-z-]+\.ts$/.test(f) && !f.endsWith('.test.ts')),
  ];
  return Object.fromEntries(files.map((file) => [relative(src, file).replace(/\.ts$/, ''), file]));
}

export default defineConfig({
  build: {
    target: 'es2022',
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      entry: entries(),
      formats: ['es'],
    },
    rollupOptions: {
      // Everything the consumer already has, or chooses to install.
      external: [/^lit($|\/)/, /^lucide($|\/)/, /^react($|\/)/, /^vue($|\/)/, /^@lit\//],
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        // Keep the shared base class in one chunk instead of inlining it in
        // every element.
        manualChunks: undefined,
      },
    },
  },
});
