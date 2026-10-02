/**
 * Checks the built docs site, not its sources: every icon the docs register
 * must be in the production bundle.
 *
 * The dev server bundles nothing away, so a module imported only for its side
 * effects — the docs' icon set — works there and can vanish from the
 * production build, leaving every docs icon blank on the live site. Runs
 * after `npm run build:demo`.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(join(root, 'demo/lib/icons.ts'), 'utf8');
const registered = /registerIcons\(\{([^}]*)\}\)/.exec(source)?.[1] ?? '';
const names = registered
  .split(',')
  .map((name) => name.trim())
  .filter(Boolean);

const assets = join(root, 'dist-demo/assets');
const bundle = readdirSync(assets)
  .filter((file) => file.endsWith('.js'))
  .map((file) => readFileSync(join(assets, file), 'utf8'))
  .join('\n');

const missing = names.filter((name) => !bundle.includes(name));
if (names.length === 0 || missing.length) {
  console.error(
    `\n✗ The built docs site lacks icons it registers: ${missing.slice(0, 8).join(', ') || 'none found in demo/lib/icons.ts'}${missing.length > 8 ? '…' : ''}\n`,
  );
  process.exit(1);
}
console.log(`ok   the built docs site holds all ${names.length} docs icons`);

// The demo apps load when opened, not with every page: the entry script must
// not carry them. "Operations console" is written in the console alone.
const entry = /<script[^>]+src="\.?\/?(assets\/[^"]+\.js)"/.exec(
  readFileSync(join(root, 'dist-demo/index.html'), 'utf8'),
)?.[1];
const entryCode = entry ? readFileSync(join(root, 'dist-demo', entry), 'utf8') : '';
if (!entry || entryCode.includes('Operations console')) {
  console.error(
    '\n✗ The docs site loads the demo apps with every page: they belong in chunks of their own.\n',
  );
  process.exit(1);
}
console.log(
  `ok   the demo apps load on their own (${(entryCode.length / 1024).toFixed(0)} kB entry)`,
);
