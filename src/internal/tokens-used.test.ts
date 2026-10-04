/**
 * Every custom property a component reads exists. A var() naming nothing makes
 * the whole declaration invalid — a `font:` shorthand drops to the inherited
 * font, a transition loses its easing — and nothing says so: four components
 * did this, for months.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

function files(dir: string, pattern: RegExp): string[] {
  return readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((file) => pattern.test(file) && !file.includes('.test.'))
    .map((file) => join(dir, file));
}

/** Custom properties a stylesheet or a template sets: `--x:`, `'--x':`, `--x-${…}`. */
function definitions(text: string): Set<string> {
  const names = new Set<string>();
  for (const match of text.matchAll(/(--[a-z0-9-]+)['"]?\s*:/g)) names.add(match[1]!);
  // Set from script: style.setProperty('--x', …).
  for (const match of text.matchAll(/setProperty\(\s*['"`](--[a-z0-9-]+)/g)) names.add(match[1]!);
  // A name built at run time, `--chart-series-${n}`: its prefix is defined.
  for (const match of text.matchAll(/(--[a-z0-9-]+-)\$\{/g)) names.add(match[1]!);
  return names;
}

/** Defined for everyone: the tokens, and the shared styles and controllers in src/internal. */
const tokens = new Set(
  [
    ...files(join(root, 'src/tokens'), /\.css$/),
    ...files(join(root, 'src/internal'), /\.ts$/),
  ].flatMap((file) => [...definitions(readFileSync(file, 'utf8'))]),
);

describe('the custom properties components read', () => {
  it('are all defined: by the tokens, or by the component itself', () => {
    const missing: string[] = [];
    for (const file of files(join(root, 'src/components'), /\.ts$/)) {
      const text = readFileSync(file, 'utf8');
      const own = definitions(text);
      // var(--x) with no fallback; one with a fallback says it may be unset.
      for (const match of text.matchAll(/var\((--[a-z0-9-]+)\s*\)/g)) {
        const name = match[1]!;
        const prefixed = [...tokens, ...own].some(
          (defined) => defined.endsWith('-') && name.startsWith(defined),
        );
        if (!tokens.has(name) && !own.has(name) && !prefixed) {
          missing.push(`${file.replace(`${root}/`, '')}: ${name}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });
});
