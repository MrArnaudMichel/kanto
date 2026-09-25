/**
 * Holds every public entry point to a size budget.
 *
 * Each entry in dist/ is bundled the way an application's bundler would take
 * it — minified, gzipped, with its shared chunks pulled in — leaving out the
 * packages the application provides itself (lit, lucide, react, vue). Those
 * byte counts are compared with size-budget.json.
 *
 * A budget is the size when it was last set, plus 10%: room for honest work,
 * none for an accidental import that drags half the library into a button.
 * When a component grows on purpose, raise its budget in the same change:
 *
 *     node scripts/check-size.js --update
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { build } from 'esbuild';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const budgetFile = join(root, 'size-budget.json');
const update = process.argv.includes('--update');
const HEADROOM = 1.1;

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

/** The JavaScript entry points of the exports map, by their public name. */
const entries = Object.entries(pkg.exports)
  .map(([name, target]) => [name, typeof target === 'string' ? target : target.default])
  .filter(([name, file]) => !name.includes('*') && file?.endsWith('.js'));

async function gzippedSize(file) {
  const result = await build({
    entryPoints: [join(root, file)],
    bundle: true,
    minify: true,
    format: 'esm',
    write: false,
    logLevel: 'silent',
    external: ['lit', 'lit/*', '@lit/*', 'lucide', 'react', 'react/*', 'vue'],
  });
  return gzipSync(result.outputFiles[0].contents).length;
}

const sizes = {};
for (const [name, file] of entries) sizes[name] = await gzippedSize(file);

if (update) {
  const budgets = Object.fromEntries(
    Object.entries(sizes).map(([name, size]) => [name, Math.ceil((size * HEADROOM) / 100) * 100]),
  );
  writeFileSync(budgetFile, `${JSON.stringify(budgets, null, 2)}\n`);
  console.log(`Wrote ${Object.keys(budgets).length} budgets to size-budget.json.`);
  process.exit(0);
}

const budgets = JSON.parse(readFileSync(budgetFile, 'utf8'));
const kb = (bytes) => `${(bytes / 1024).toFixed(1)} kB`;
const failures = [];

for (const [name, size] of Object.entries(sizes)) {
  const budget = budgets[name];
  if (budget === undefined) {
    failures.push(`${name} has no budget. Run node scripts/check-size.js --update.`);
    continue;
  }
  const over = size > budget;
  console.log(
    `${over ? 'OVER' : 'ok  '} ${name.padEnd(48)} ${kb(size).padStart(8)} / ${kb(budget)}`,
  );
  if (over) failures.push(`${name} is ${kb(size)}, over its ${kb(budget)} budget.`);
}
for (const name of Object.keys(budgets)) {
  if (!(name in sizes)) failures.push(`${name} has a budget but is no longer an entry point.`);
}

if (failures.length > 0) {
  console.error(`\n${failures.join('\n')}`);
  console.error(
    '\nIf the growth is intended, raise the budget: node scripts/check-size.js --update',
  );
  process.exit(1);
}
console.log(`\nAll ${Object.keys(sizes).length} entry points are within budget.`);
