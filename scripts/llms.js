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

/** The rules that make code right the first time: llms.txt and AGENTS.md both say them. */
export function rules() {
  return `- Install with \`npm install kanto-ds\`, then \`import 'kanto-ds';\` and
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
`;
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

> Fifty-six accessible web components for dashboards, admin tools and forms,
> shipped as standard custom elements: the same \`<kt-button>\` runs in React,
> Vue, Angular, Svelte and plain HTML. Two themes, themeable in one line.

## Write it right the first time

${rules()}
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

/** Every component, a line each, under its group. */
function componentIndex(docs) {
  return Object.entries(GROUPS)
    .map(([group, title]) => {
      const lines = docs
        .filter((doc) => doc.group === group)
        .map((doc) => `- \`${doc.tag}\` — ${doc.summary}`);
      return `### ${title}\n\n${lines.join('\n')}`;
    })
    .join('\n\n');
}

/**
 * AGENTS.md: the instructions an AI agent working in a project needs to build
 * with Kanto — ship it in the package, point CLAUDE.md, Cursor's rules or
 * Copilot's instructions at it.
 */
export function agentsMd() {
  return `# Kanto — instructions for AI agents

This project's interface is built with Kanto (\`kanto-ds\`): accessible web
components for dashboards, admin tools and forms. Build from them before
writing a control of your own.

## Before you write any interface

1. Find the component that does the job in the list below. A modal, a select,
   a date picker, a table, a toast: Kanto has it, accessible and themed.
2. Read its page before you use it — \`node_modules/kanto-ds/dist/docs/<tag>.md\`.
   Each page gives the properties, the events, what a screen reader hears and
   when not to use the component.
3. Style with the theme's tokens. Never write a colour, a size or a duration.

## Rules

${rules()}
## Mistakes agents make, and the fix

- **Data set as an attribute.** \`<kt-select options="...">\` does nothing:
  \`options\`, \`data\`, \`columns\` and \`items\` are properties.
- **Listening for \`change\` or \`onChange\`.** Kanto fires \`kt-change\`,
  \`kt-input\` and the like; the value is in \`event.detail\`.
- **Restyling with a wrapper and literal colours.** Use the tokens, the
  appearance attributes on \`<html>\`, or the \`::part()\` a page lists.
- **An icon that draws nothing.** Only the common Lucide icons are registered;
  register any other with \`registerIcons\` before using its name.
- **A hand-built control.** Before writing a dropdown, a dialog or a stepper,
  check the list: \`kt-dropdown\`, \`kt-modal\`, \`kt-steps\`.

## Components

${componentIndex(componentDocs())}

## More

- Every page in one file: ${SITE}/llms-full.txt
- The documentation, live: ${SITE}
`;
}

/** llms-full.txt: the index, then every component page whole, for a chat that cannot browse. */
export function llmsFullTxt() {
  const pages = componentDocs().map((doc) => docForPackage(doc).trim());
  return `${llmsTxt()}\n---\n\n${pages.join('\n\n---\n\n')}\n`;
}

const run = process.argv[1] === fileURLToPath(import.meta.url);
if (run) {
  writeFileSync(join(root, 'demo/public/llms.txt'), llmsTxt());
  writeFileSync(join(root, 'demo/public/agents.md'), agentsMd());
  console.log('wrote demo/public/llms.txt and agents.md');
  if (process.argv.includes('--docs')) {
    mkdirSync(join(root, 'dist/docs'), { recursive: true });
    for (const doc of componentDocs()) writeFileSync(join(root, doc.to), docForPackage(doc));
    writeFileSync(join(root, 'dist/AGENTS.md'), agentsMd());
    // Generated at build, not kept: every page again, in one file for the site.
    writeFileSync(join(root, 'demo/public/llms-full.txt'), llmsFullTxt());
    console.log(`copied ${componentDocs().length} component pages to dist/docs/, and AGENTS.md`);
  }
}
