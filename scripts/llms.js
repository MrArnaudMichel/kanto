/**
 * What AI assistants read: `llms.txt` at the docs site's root, and every
 * component's page shipped in the package as `dist/docs/<tag>.md`, where an
 * assistant working in a project finds it under node_modules.
 *
 *     node scripts/llms.js          writes demo/public/llms.txt
 *     node scripts/llms.js --docs   also copies the pages into dist/docs/
 *
 * llms.txt (https://llmstxt.org) is a short markdown index: what Kanto is,
 * the few rules that make code right the first time, and a link to each page.
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const RAW = 'https://raw.githubusercontent.com/MrArnaudMichel/kanto/main';
const SITE = 'https://kanto.arnaudmichel.fr';

const GROUPS = {
  core: 'Core',
  forms: 'Forms',
  navigation: 'Navigation',
  feedback: 'Feedback',
  overlays: 'Overlays',
  data: 'Data',
};

/**
 * A page's summary: its first paragraph, joined, cut at the end of its first
 * sentence — a line of a wrapped paragraph can stop mid-thought.
 */
function summaryOf(from) {
  const paragraph = readFileSync(join(root, from), 'utf8')
    .split('\n\n')[1]
    .replace(/\s*\n\s*/g, ' ')
    .trim();
  const sentence = /^.*?[.!?)](?=\s|$)/.exec(paragraph);
  return sentence ? sentence[0] : paragraph;
}

/** A page as it ships: dist/docs is flat, so a sibling link loses its folder. */
export function docForPackage(doc) {
  return readFileSync(join(root, doc.from), 'utf8').replace(
    /\]\(\.\.\/(kt-[a-z-]+)\/\1\.md/g,
    '](./$1.md',
  );
}

/** Every component page: its tag, group, source and place in the package. */
export function componentDocs() {
  return Object.keys(GROUPS).flatMap((group) =>
    readdirSync(join(root, 'src/components', group))
      .filter((name) => name.startsWith('kt-'))
      .sort()
      .map((tag) => {
        const from = `src/components/${group}/${tag}/${tag}.md`;
        return { tag, group, from, to: `dist/docs/${tag}.md`, summary: summaryOf(from) };
      }),
  );
}

export function llmsTxt() {
  const docs = componentDocs();
  const sections = Object.entries(GROUPS).map(([group, title]) => {
    const lines = docs
      .filter((doc) => doc.group === group)
      .map((doc) => `- [${doc.tag}](${RAW}/${doc.from}): ${doc.summary}`);
    return `### ${title}\n\n${lines.join('\n')}`;
  });

  return `# Kanto

> Forty-nine accessible web components for dashboards, admin tools and forms,
> shipped as standard custom elements: the same \`<kt-button>\` runs in React,
> Vue, Angular, Svelte and plain HTML. Two themes, themeable in one line.

## Write it right the first time

- Install with \`npm install kanto-ds\`, then \`import 'kanto-ds';\` and
  \`import 'kanto-ds/styles.css';\` once at the root. Without a bundler, use
  \`<script type="module" src="https://cdn.jsdelivr.net/npm/kanto-ds@1"></script>\`
  and the stylesheet \`https://cdn.jsdelivr.net/npm/kanto-ds@1/dist/styles.css\`.
- Data goes in as properties, not attributes: \`options\`, \`data\`,
  \`columns\`, \`items\` — anything that is not a string or a boolean — are set
  from script (\`table.data = rows\`), or as \`.data=\${rows}\` in Lit,
  \`:data\` in Vue, \`[data]\` in Angular, a plain prop in React 19.
- Events are \`kt-\`-prefixed CustomEvents with the payload in \`detail\`:
  \`select.addEventListener('kt-change', (e) => e.detail.value)\`.
- Style with tokens, never literal colours: \`var(--surface-card)\`,
  \`var(--text-body)\`, \`var(--color-primary-base)\`. Dark is the default
  theme; \`<html data-theme="light">\` or \`"auto"\` switches.
- Theme the whole system with attributes — \`data-accent="teal"\`,
  \`data-font="inter"\`, \`data-radius="round"\`, \`data-density="compact"\`,
  \`data-text-size="large"\` — or \`setAppearance({ accent: '#e11d48' })\`.
- Icons are Lucide names: \`<kt-button icon="plus">\`. Kanto ships the common
  ones; register others with \`registerIcons({ Rocket })\` from
  \`kanto-ds/icons\`.

In a project, every page below is also at
\`node_modules/kanto-ds/dist/docs/<tag>.md\`.

## Guides

- [Frameworks](${RAW}/docs/frameworks.md): setup for React 18 and 19, Vue, Angular and Svelte.
- [Tokens and appearance](${RAW}/src/tokens/README.md): colour, type and spacing tokens, themes, accent and appearance settings.
- [Live docs and playground](${SITE}): every component with examples.

## Components

${sections.join('\n\n')}
`;
}

const run = process.argv[1] === fileURLToPath(import.meta.url);
if (run) {
  writeFileSync(join(root, 'demo/public/llms.txt'), llmsTxt());
  console.log('wrote demo/public/llms.txt');
  if (process.argv.includes('--docs')) {
    mkdirSync(join(root, 'dist/docs'), { recursive: true });
    for (const doc of componentDocs()) writeFileSync(join(root, doc.to), docForPackage(doc));
    console.log(`copied ${componentDocs().length} component pages to dist/docs/`);
  }
}
