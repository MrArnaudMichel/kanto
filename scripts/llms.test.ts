import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { componentDocs, llmsTxt } from './llms.js';

const root = process.cwd();
const groups = readdirSync(join(root, 'src/components'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
const tags = groups.flatMap((group) =>
  readdirSync(join(root, 'src/components', group)).filter((name) => name.startsWith('kt-')),
);

describe('llms.txt', () => {
  it('is what the generator writes — run node scripts/llms.js', () => {
    expect(readFileSync(join(root, 'demo/public/llms.txt'), 'utf8')).toBe(llmsTxt());
  });

  it('links every component to its documentation', () => {
    const text = llmsTxt();
    for (const tag of tags) expect(text, tag).toContain(`/${tag}.md)`);
  });

  it('opens on what an assistant needs first: install, the two rules, theming', () => {
    const text = llmsTxt();
    expect(text).toMatch(/^# Kanto\n\n> /);
    expect(text).toContain('npm install kanto-ds');
    expect(text).toContain('properties, not attributes');
    expect(text).toContain('setAppearance');
  });
});

describe('component docs in the package', () => {
  it('maps every component page to dist/docs/<tag>.md', () => {
    const docs = componentDocs();
    expect(docs.map((doc) => doc.tag).sort()).toEqual([...tags].sort());
    for (const doc of docs) expect(doc.to).toBe(`dist/docs/${doc.tag}.md`);
  });
});
