/**
 * Checks the built docs site, not its sources: every icon the docs register
 * must be in the production bundle, and the files for AI agents served.
 *
 * The dev server bundles nothing away, so a module imported only for its side
 * effects — the docs' icon set — works there and can vanish from the
 * production build, leaving every docs icon blank on the live site. Runs
 * after `npm run build:demo`.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// `--demos`: only the live demos — what the Pages deploy checks before upload.
const demosOnly = process.argv.includes('--demos');

// Each template's live demo, built beside the site from its vanilla stack.
const demos = readdirSync(join(root, 'templates'))
  .filter((name) => name.endsWith('-vanilla'))
  .map((name) => name.replace(/-vanilla$/, ''));
const missingDemos = demos.filter((id) => {
  const page = join(root, 'dist-demo/templates', id, 'index.html');
  return (
    !existsSync(page) ||
    !/<script type="module"[^>]+src="\.\/assets\//.test(readFileSync(page, 'utf8'))
  );
});
if (missingDemos.length) {
  console.error(`\n✗ The site has no live demo for: ${missingDemos.join(', ')}\n`);
  process.exit(1);
}
console.log(`ok   the docs site serves a live demo of ${demos.join(', ')}`);
if (demosOnly) process.exit(0);
const source = readFileSync(join(root, 'demo/lib/icons.ts'), 'utf8');
const registered = /DOCS_ICONS = \{([^}]*)\}/.exec(source)?.[1] ?? '';
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

// What AI agents are pointed at: the index, every page in one file, and the
// instructions for a project — all at the site's root.
const forAgents = ['llms.txt', 'llms-full.txt', 'agents.md'];
const absent = forAgents.filter((file) => !existsSync(join(root, 'dist-demo', file)));
if (absent.length) {
  console.error(`\n✗ The docs site does not serve ${absent.join(', ')} for AI agents.\n`);
  process.exit(1);
}
console.log(`ok   the docs site serves ${forAgents.join(', ')}`);
