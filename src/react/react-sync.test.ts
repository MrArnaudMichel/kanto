/**
 * The two React entry points describe the same elements twice: the React 18
 * wrappers in index.ts, and the React 19 JSX types in jsx.ts. Nothing in the
 * type system ties them together, so this test does — same tags, same
 * events, same detail types — and a new event added to one fails until it is
 * added to the other.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');
const squash = (type: string) =>
  type
    .replace(/\s+/g, ' ')
    .replace(/;\s*\}/g, ' }')
    .trim();

type Events = Record<string, Record<string, string>>;

/** index.ts: `createComponent({ tagName: 'kt-x', events: { onKtY: 'kt-y' as Kt<T> } })`. */
function wrapperEvents(): Events {
  const out: Events = {};
  const source = read('src/react/index.ts');
  for (const [block, tag] of source.matchAll(
    /createComponent\(\{\s*tagName: '([^']+)'[\s\S]*?\n\}\);/g,
  )) {
    out[tag!] = {};
    for (const [, name, type] of block.matchAll(/\w+: '([^']+)' as Kt<([^>]*)>/g)) {
      out[tag!]![name!] = squash(type!);
    }
  }
  return out;
}

/** Splits `{ 'a': T; 'b': { x: U; y: V } }` into its entries, at brace depth one. */
function entries(map: string): [string, string][] {
  const inner = map.trim().slice(1, -1);
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const char of inner) {
    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;
    if (char === ';' && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [, name, type] = /^'([^']+)':\s*([\s\S]+)$/.exec(part)!;
      return [name!, squash(type!)];
    });
}

/** jsx.ts: `'kt-x': KtProps<KtX, { 'kt-y': T }>` or `'kt-x': KtProps<KtX>`. */
function jsxEvents(): Events {
  const out: Events = {};
  const source = read('src/react/jsx.ts');
  const body = source.slice(source.indexOf('interface IntrinsicElements'));
  // Detail types hold no generics, so the first `>;` closes each entry.
  for (const [, tag, map] of body.matchAll(
    /'(kt-[a-z-]+)': KtProps<\s*\w+(?:,\s*([\s\S]*?))?\s*>;/g,
  )) {
    out[tag!] = map ? Object.fromEntries(entries(map)) : {};
  }
  return out;
}

function definedTags(): string[] {
  const tags = new Set<string>();
  const dir = join(root, 'src/components');
  for (const file of readdirSync(dir, { recursive: true, encoding: 'utf8' })) {
    if (!file.endsWith('.ts') || file.endsWith('.test.ts')) continue;
    for (const [, tag] of readFileSync(join(dir, file), 'utf8').matchAll(
      /defineElement\('(kt-[a-z-]+)'/g,
    )) {
      tags.add(tag!);
    }
  }
  return [...tags].sort();
}

describe('kanto-ds/react and kanto-ds/react/jsx', () => {
  it('both cover every element', () => {
    expect(Object.keys(wrapperEvents()).sort()).toEqual(definedTags());
    expect(Object.keys(jsxEvents()).sort()).toEqual(definedTags());
  });

  it('declare the same events with the same detail types', () => {
    expect(jsxEvents()).toEqual(wrapperEvents());
  });
});
