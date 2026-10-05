/**
 * On a release, create-kanto takes the library's version, and every template
 * asks for that minor of kanto-ds — so a project made today installs the
 * release it was tested against, and the fixes after it.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/** @returns {string[]} The files changed, relative to `root`. */
export function bumpTemplates(root, version) {
  const [major, minor] = version.split('.');
  const range = version.includes('-') ? `^${version}` : `^${major}.${minor}.0`;
  const changed = [];
  const update = (path, edit) => {
    const file = join(root, path);
    const before = readFileSync(file, 'utf8');
    const pkg = JSON.parse(before);
    edit(pkg);
    const after = `${JSON.stringify(pkg, null, 2)}\n`;
    if (after !== before) {
      writeFileSync(file, after);
      changed.push(path);
    }
  };

  update('packages/create-kanto/package.json', (pkg) => {
    pkg.version = version;
  });
  const templates = join(root, 'templates');
  for (const name of existsSync(templates) ? readdirSync(templates) : []) {
    const path = `templates/${name}/package.json`;
    if (!existsSync(join(root, path))) continue;
    update(path, (pkg) => {
      if (pkg.dependencies?.['kanto-ds']) pkg.dependencies['kanto-ds'] = range;
    });
  }
  return changed;
}
