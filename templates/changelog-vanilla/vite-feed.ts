/**
 * Writes `public/rss.xml` from the releases whenever the app starts or builds,
 * so the feed never lags behind `src/content.ts`. Commit the file it writes:
 * a static host serves it beside the page.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';
import { RELEASES, SITE } from './src/content';
import { buildRss } from './src/rss';

export function feed(): Plugin {
  let path = '';
  return {
    name: 'changelog-feed',
    configResolved(config) {
      path = join(config.publicDir, 'rss.xml');
    },
    buildStart() {
      const xml = buildRss(RELEASES, SITE);
      let written = '';
      try {
        written = readFileSync(path, 'utf8');
      } catch {
        // Not written yet.
      }
      if (written !== xml) writeFileSync(path, xml);
    },
  };
}
