/**
 * Resolves every entry point declared in the package's `exports` map against
 * the built `dist/`.
 *
 * A broken exports map typecheck-passes, builds, and then fails only in a
 * consuming application — which is much too late to find out.
 */
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = require(join(root, 'package.json'));

/** A concrete example for each wildcard entry, so `*` can be resolved. */
const SAMPLES = {
  './tokens/*': 'index.css',
  './assets/*': 'fonts/README.md',
};

const failures = [];

function check(label, target) {
  if (typeof target !== 'string') return;

  const path = resolve(root, target);
  if (existsSync(path)) {
    console.log(`ok   ${label} -> ${target}`);
    return;
  }
  failures.push(`${label} -> ${target}`);
  console.error(`FAIL ${label} -> ${target} (missing)`);
}

for (const [entry, target] of Object.entries(pkg.exports)) {
  const sample = Object.entries(SAMPLES).find(([pattern]) => entry.endsWith(pattern));
  const concrete = sample ? entry.replace('*', sample[1]) : entry;

  const resolveTarget = (value) => (sample ? value.replace('*', sample[1]) : value);

  if (typeof target === 'string') {
    check(concrete, resolveTarget(target));
    continue;
  }
  for (const [condition, value] of Object.entries(target)) {
    check(`${concrete} (${condition})`, resolveTarget(value));
  }
}

// Fields tools read outside the exports map: the manifest for Storybook and
// docs generators, web-types for JetBrains IDEs.
for (const field of ['customElements', 'web-types']) check(field, pkg[field]);

if (failures.length > 0) {
  console.error(`\n${failures.length} entry point(s) do not exist. Did the build change shape?`);
  process.exit(1);
}
console.log(`\nAll ${Object.keys(pkg.exports).length} entry points resolve.`);
