import { cpSync, existsSync, readdirSync, renameSync, rmSync } from 'node:fs';
import { join, relative } from 'node:path';

const SKIPPED = /(^|[\\/])(node_modules|dist|package-lock\.json)([\\/]|$)/;

/**
 * Copies every template folder from `from` into `to`, leaving installs,
 * builds and lockfiles behind. npm drops `.gitignore` from a published
 * package, so it travels as `_gitignore`; scaffold() names it back.
 */
export function bundle(from, to) {
  rmSync(to, { recursive: true, force: true });
  const names = readdirSync(from, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  for (const name of names) {
    const source = join(from, name);
    const target = join(to, name);
    cpSync(source, target, {
      recursive: true,
      filter: (path) => !SKIPPED.test(relative(source, path)),
    });
    if (existsSync(join(target, '.gitignore'))) {
      renameSync(join(target, '.gitignore'), join(target, '_gitignore'));
    }
  }
  return names;
}
