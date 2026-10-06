/**
 * The docs register only the Lucide icons they draw, not all two thousand.
 * This keeps the list honest: every icon name the docs or a component page
 * writes must be in it, or that icon renders as a blank box.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import * as lucide from 'lucide';
import { describe, expect, it } from 'vitest';
import { getIcon, toKebabCase } from 'kanto-ds/icons';
import { DOCS_ICONS, registerDocsIcons } from './icons.js';

registerDocsIcons();

const LUCIDE = new Set(Object.keys(lucide).map(toKebabCase));

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === 'node_modules' ? [] : files(path);
    return /\.(ts|md)$/.test(name) && !name.endsWith('.test.ts') ? [path] : [];
  });
}

/** Names written as an icon: icon="…", name="…" (not a slot's), icon: '…'. */
function iconNames(): Set<string> {
  const names = new Set<string>();
  const root = process.cwd();
  for (const path of [...files(join(root, 'demo')), ...files(join(root, 'src/components'))]) {
    const text = readFileSync(path, 'utf8');
    // A <slot name="…"> names a slot, even when the name is also an icon's.
    for (const match of text.matchAll(
      /(?<!<slot\s)(?:icon|name)=\\?["']([a-z0-9-]+)|icon: ?'([a-z0-9-]+)'/g,
    )) {
      const name = match[1] ?? match[2]!;
      if (LUCIDE.has(name)) names.add(name);
    }
  }
  return names;
}

describe('the docs icon set', () => {
  it('has every icon the docs draw', () => {
    const missing = [...iconNames()].filter((name) => !getIcon(name));
    expect(missing).toEqual([]);
  });

  it('registers no icon the docs do not draw', () => {
    // Each one is weight in every page of the site.
    const drawn = iconNames();
    const unused = Object.keys(DOCS_ICONS)
      .map(toKebabCase)
      .filter((name) => !drawn.has(name));
    expect(unused).toEqual([]);
  });
});
