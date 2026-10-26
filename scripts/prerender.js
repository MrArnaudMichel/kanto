#!/usr/bin/env node
/**
 * Writes each page of the built docs site as HTML a crawler reads, without
 * running a script: dist-demo/components/kt-button/index.html, each with its title, description and canonical
 * address; then sitemap.xml, robots.txt and 404.html — the app, for an
 * address no file answers (GitHub Pages serves it there).
 *
 * The pages are found the way a crawler finds them: from the home page,
 * following the site's own links, so a page nothing links to is not written.
 * Runs after `npm run build:demo`'s builds, in Chromium.
 */
/* global document, location -- the page's own, in what runs in the browser */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { preview } from 'vite';
import { bodyOf, filesOf, pageHtml, robotsOf, sitemapOf, templateOf } from './prerender-lib.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'dist-demo');
const SITE = 'https://kanto.arnaudmichel.fr';
const TABS = 6;

const built = (file) =>
  existsSync(join(out, file)) ? readFileSync(join(out, file), 'utf8') : undefined;
const template = templateOf(built('index.html'), built('404.html'));
writeFileSync(join(out, '404.html'), template);

const server = await preview({
  configFile: join(root, 'demo/vite.config.ts'),
  preview: { port: 4791, open: false },
  logLevel: 'warn',
});
const base = server.resolvedUrls.local[0].replace(/\/$/, '');
const browser = await chromium.launch();
const context = await browser.newContext();
// Only the site itself: GitHub's API and the fonts would make the HTML depend on the network.
await context.route('**/*', (route) =>
  route.request().url().startsWith(base) ? route.continue() : route.abort(),
);

/** @type {Map<string, { title: string, description: string, canonical: string, robots: string, body: string }>} */
const pages = new Map();
const queue = ['/'];
const seen = new Set(queue);

async function visit(tab, path) {
  await tab.goto(`${base}${path}`, { waitUntil: 'load' });
  await tab.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  const page = await tab.evaluate(() => {
    const content = (selector) =>
      document.head.querySelector(selector)?.getAttribute('content') ?? '';
    const links = [...document.querySelectorAll('a[href]')]
      .map((link) => new URL(link.href, location.href))
      .filter((url) => url.origin === location.origin && !url.pathname.startsWith('/live/'))
      .filter((url) => !/\.[a-z0-9]+$/i.test(url.pathname))
      .map((url) => url.pathname.replace(/\/?$/, '/'));
    return {
      title: document.title,
      description: content('meta[name="description"]'),
      canonical: document.head.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '',
      robots: content('meta[name="robots"]'),
      body: document.querySelector('#app').innerHTML,
      links,
    };
  });
  page.body = bodyOf(page.body);
  pages.set(path, page);
  for (const link of page.links) {
    if (seen.has(link)) continue;
    seen.add(link);
    queue.push(link);
  }
}

// A few tabs at once, each taking the next address any page has linked.
let busy = 0;
await Promise.all(
  Array.from({ length: TABS }, async () => {
    const tab = await context.newPage();
    for (;;) {
      const path = queue.shift();
      if (path === undefined) {
        // Nothing queued: done, unless another tab is still finding links.
        if (!busy) break;
        await new Promise((resolve) => setTimeout(resolve, 50));
        continue;
      }
      busy += 1;
      await visit(tab, path).finally(() => (busy -= 1));
    }
    await tab.close();
  }),
);
await browser.close();
await new Promise((resolve) => server.httpServer.close(resolve));

const indexed = [...pages].filter(([, page]) => page.robots !== 'noindex');
for (const [path, page] of indexed) {
  for (const file of filesOf(path)) {
    mkdirSync(dirname(join(out, file)), { recursive: true });
    writeFileSync(join(out, file), pageHtml(template, page, page.body));
  }
}
const addresses = [...new Set(indexed.map(([, page]) => page.canonical))].sort((a, b) =>
  a === `${SITE}/` ? -1 : b === `${SITE}/` ? 1 : a.localeCompare(b),
);
writeFileSync(join(out, 'sitemap.xml'), sitemapOf(addresses));
writeFileSync(join(out, 'robots.txt'), robotsOf(SITE));
console.log(`prerendered ${indexed.length} addresses, ${addresses.length} pages in the sitemap.`);
