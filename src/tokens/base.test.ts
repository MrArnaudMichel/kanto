import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const css = readFileSync(join(root, 'src/tokens/base.css'), 'utf8');

/** Every kt-* tag the sources define, read from their defineElement calls. */
function definedTags(): string[] {
  const tags = new Set<string>();
  const files = readdirSync(join(root, 'src/components'), { recursive: true, encoding: 'utf8' });
  for (const file of files) {
    if (!file.endsWith('.ts') || file.endsWith('.test.ts')) continue;
    const source = readFileSync(join(root, 'src/components', file), 'utf8');
    for (const [, tag] of source.matchAll(/defineElement\('(kt-[a-z-]+)'/g)) tags.add(tag!);
  }
  return [...tags].sort();
}

describe('base.css', () => {
  it('hides every Kanto element until its definition loads, and only those', () => {
    const block = /:is\(([^)]+)\):not\(:defined\)\s*\{\s*visibility: hidden;/.exec(css);
    expect(block, 'no :not(:defined) rule').not.toBeNull();

    const listed = block![1]!
      .split(',')
      .map((tag) => tag.trim())
      .sort();
    // A new element missing here shows raw, unstyled, before it upgrades.
    expect(listed).toEqual(definedTags());
    expect(listed.length).toBeGreaterThan(40);
  });
});
