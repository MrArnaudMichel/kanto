import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import './defaults.js';
import { getIcon } from './registry.js';

describe('the icons Kanto ships', () => {
  it('include those its own elements draw', () => {
    for (const name of ['chevron-down', 'x', 'check', 'search', 'calendar', 'loader-circle']) {
      expect(getIcon(name), name).toBeDefined();
    }
  });

  it('include every icon a component draws, read from the sources', () => {
    const components = join(process.cwd(), 'src/components');
    const sources = readdirSync(components, { recursive: true, encoding: 'utf8' })
      .filter((file) => file.endsWith('.ts') && !file.includes('.test.'))
      .map((file) => readFileSync(join(components, file), 'utf8'));
    const names = new Set<string>();
    for (const file of sources) {
      // Code, not the examples in doc comments.
      const source = file
        .split('\n')
        .filter((line) => !/^\s*(\*|\/\/)/.test(line))
        .join('\n');
      // icon="x" on kt-button, name="x" on kt-icon…
      for (const match of source.matchAll(/<kt-button[^>]*?\bicon="([a-z0-9-]+)"/g))
        names.add(match[1]!);
      for (const match of source.matchAll(/<kt-icon[^>]*?\bname="([a-z0-9-]+)"/g))
        names.add(match[1]!);
      // …and the icons a bound icon=${...} chooses between: the quoted results
      // of a ternary, or a lone quoted name — not the values it compares.
      for (const match of source.matchAll(/\bicon=\$\{([^}]*)\}/g)) {
        const expression = match[1]!.trim();
        const lone = /^'([a-z][a-z0-9-]*)'$/.exec(expression);
        if (lone) names.add(lone[1]!);
        for (const result of expression.matchAll(/[?:]\s*'([a-z][a-z0-9-]*)'/g))
          names.add(result[1]!);
      }
    }
    expect(names.size).toBeGreaterThan(10);
    const missing = [...names].filter((name) => !getIcon(name));
    expect(missing).toEqual([]);
  });

  it('include the few a first screen reaches for, so the docs examples draw', () => {
    for (const name of [
      'plus',
      'pencil',
      'settings',
      'download',
      'upload',
      'external-link',
      'filter',
      'ellipsis',
      'refresh-cw',
    ]) {
      expect(getIcon(name), name).toBeDefined();
    }
  });
});
