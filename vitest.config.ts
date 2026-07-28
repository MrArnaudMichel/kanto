import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // The documentation site imports the library by its public name; the
    // smoke test needs the same alias the demo's own Vite config sets up.
    alias: [
      { find: /^kanto$/, replacement: fileURLToPath(new URL('./src/index.ts', import.meta.url)) },
      {
        find: /^kanto\/styles\.css$/,
        replacement: fileURLToPath(new URL('./src/styles.css', import.meta.url)),
      },
    ],
  },
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.ts', 'demo/**/*.test.ts'],
    setupFiles: ['src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/test/**', 'src/**/index.ts'],
      reporter: ['text', 'lcov'],
      /* A floor, not a target. Set just under where the suite actually sits,
         so a change that guts coverage fails CI while an honest refactor that
         moves it a point does not. */
      thresholds: {
        statements: 90,
        branches: 80,
        functions: 90,
        lines: 92,
      },
    },
  },
});
