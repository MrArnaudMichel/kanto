import { fileURLToPath } from 'node:url';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Source and tests import the library by its public name, so the suite
    // resolves it to src/ the way the demo's own Vite config does — otherwise
    // "kanto-ds/icons" would come from a stale dist/. Exact match first: an
    // object alias for "kanto-ds" would also swallow "kanto-ds/icons".
    alias: [
      {
        find: /^kanto-ds$/,
        replacement: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      },
      { find: /^kanto-ds\//, replacement: fileURLToPath(new URL('./src/', import.meta.url)) },
    ],
  },
  test: {
    setupFiles: ['src/test/setup.ts'],
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'happy-dom',
          include: ['src/**/*.test.ts', 'demo/**/*.test.ts', 'scripts/**/*.test.ts'],
          exclude: ['**/*.browser.test.ts'],
        },
      },
      /* What a simulated DOM cannot answer — layout, the top layer, real focus,
         hit testing, computed colour contrast — runs in Chromium. Kept to its
         own files so the fast suite stays fast. */
      {
        extends: true,
        test: {
          name: 'browser',
          include: ['src/**/*.browser.test.ts'],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
            screenshotFailures: false,
          },
        },
      },
    ],
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
