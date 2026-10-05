#!/usr/bin/env node
/**
 * Shoots every template screen the catalog lists, from the live demos in
 * dist-demo, into demo/public/templates/. Run after `npm run build:demo`, and
 * commit the PNGs — like the share image, they change when a template does.
 *
 *   npm run build:demo && node scripts/screenshot-templates.js
 */
import { mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 5197;
/** Screens of the way in are shot signed out. */
const PUBLIC_SCREENS = new Set(['#/sign-in', '#/sign-up']);

// The catalog is TypeScript: let Vite load it.
const loader = await createServer({
  configFile: false,
  server: { middlewareMode: true },
  logLevel: 'silent',
});
const { TEMPLATE_CATALOG } = await loader.ssrLoadModule(join(root, 'demo/lib/templates.ts'));
await loader.close();

const server = spawn(
  'npx',
  ['vite', 'preview', '--config', 'demo/vite.config.ts', '--port', String(PORT), '--strictPort'],
  {
    cwd: root,
    stdio: 'ignore',
  },
);
const base = `http://localhost:${PORT}`;
for (let tries = 0; tries < 100; tries += 1) {
  try {
    if ((await fetch(base)).ok) break;
  } catch {
    // Not up yet.
  }
  await new Promise((resolve) => setTimeout(resolve, 200));
}

const out = join(root, 'demo/public/templates');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
try {
  for (const entry of TEMPLATE_CATALOG) {
    for (const screen of entry.screens) {
      const page = await browser.newPage({
        viewport: { width: 1400, height: 860 },
        colorScheme: 'dark',
      });
      const seed = PUBLIC_SCREENS.has(screen.hash) ? {} : (entry.seed ?? {});
      await page.addInitScript((pairs) => {
        for (const [key, value] of Object.entries(pairs)) localStorage.setItem(key, value);
      }, seed);
      await page.goto(`${base}/templates/${entry.id}/${screen.hash}`);
      await page.waitForLoadState('networkidle');
      // The fixtures answer after ~300ms; let them land and the motion settle.
      await page.waitForTimeout(1500);
      await page.screenshot({ path: join(out, screen.file) });
      await page.close();
      console.log(`shot ${screen.file}`);
    }
  }
} finally {
  await browser.close();
  server.kill();
}
