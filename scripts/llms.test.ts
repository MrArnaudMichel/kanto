import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { componentDocs, docForPackage, llmsTxt } from './llms.js';

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

describe('what the pages and the index say', () => {
  it('summarises each component in whole sentences', () => {
    for (const doc of componentDocs()) expect(doc.summary, doc.tag).toMatch(/[.!?)]$/);
  });

  it('rewrites sibling links for the flat dist/docs folder', () => {
    const toast = componentDocs().find((doc) => doc.tag === 'kt-toast')!;
    const text = docForPackage(toast);
    expect(text).not.toMatch(/\]\(\.\.\/kt-[a-z-]+\/kt-[a-z-]+\.md/);
    expect(text).toMatch(/\]\(\.\/kt-[a-z-]+\.md/);
  });

  it('counts the components it claims, wherever the count is written', () => {
    const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty'];
    const n = tags.length;
    const word = n % 10 ? `${tens[Math.floor(n / 10)]}-${words[n % 10]}` : tens[n / 10]!;
    for (const file of [
      'package.json',
      'README.md',
      'demo/index.html',
      'demo/pages/guide.ts',
      'demo/apps/landing.ts',
    ]) {
      const text = readFileSync(join(root, file), 'utf8').toLowerCase();
      const claims = [
        ...text.matchAll(
          /\b((?:twenty|thirty|forty|fifty|sixty)-[a-z]+) (?:accessible )?(?:web |custom )?(?:components|elements)\b/g,
        ),
      ];
      for (const claim of claims) expect(claim[1], file).toBe(word);
    }
    expect(llmsTxt().toLowerCase()).toContain(`${word} accessible web components`);
  });
});
