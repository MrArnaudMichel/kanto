/** Short guide pages, written here rather than pulled from a repo README. */
import { agentSetupsMarkdown } from '../lib/agents.js';

export const INTRODUCTION = `# Introduction

Kanto is a design system for data-dense product interfaces — dashboards, admin tools, forms.

The components are standard custom elements, so they run in React, Vue, Angular, Svelte or plain HTML without a per-framework rewrite. One implementation, one place a fix has to land.

## Why custom elements

The alternative — a React port, a Vue port, an Angular library — is three codebases drifting apart.

The trade is real and worth naming: custom elements need JavaScript to upgrade, so during server rendering they hold their place, hidden, until the bundle lands. In return, a component is written once and every consumer gets the same fix at the same time.

## Two rules that hold everywhere

**Data goes in as properties, not attributes.** \`options\`, \`data\`, \`columns\`, \`items\` — anything that is not a string or a boolean. An attribute can only ever hold a string.

**Events are \`kt-\`-prefixed CustomEvents**, with the payload in \`detail\`. They bubble and cross shadow boundaries, so you can listen on a container rather than on every element.

\`\`\`js
select.options = [{ id: 'ne', label: 'North East' }];
select.addEventListener('kt-change', (e) => console.log(e.detail.value));
\`\`\`

## What is in the box

Eighty elements across six groups, a token layer that drives all of them, and a light theme that costs no component-specific CSS.

This site is built with those elements and no framework. If a component breaks, its own documentation breaks with it.
`;

export const INSTALLATION = `# Installation

\`\`\`bash
npm install kanto-ds
\`\`\`

## Import the system

\`\`\`js
import 'kanto-ds';
import 'kanto-ds/styles.css';
\`\`\`

That registers every element and loads the token layer. Then use them as markup:

\`\`\`html
<kt-button variant="primary" icon="plus">New entity</kt-button>
\`\`\`

## No build step

One stylesheet and one script, from a CDN — a prototype, a static page, a CMS
template:

\`\`\`html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/kanto-ds@1/dist/styles.css" />
<script type="module" src="https://cdn.jsdelivr.net/npm/kanto-ds@1"></script>

<kt-button variant="primary" icon="plus">New entity</kt-button>
\`\`\`

The script is every element in one minified file, Lit included — about 85 kB
gzipped. \`@1\` follows the latest 1.x release; pin an exact version in
production. The library's functions are its exports:

\`\`\`html
<script type="module">
  import { setAppearance, toaster } from 'https://cdn.jsdelivr.net/npm/kanto-ds@1';
  setAppearance({ accent: 'teal' });
</script>
\`\`\`

## Import one element

Applications that use a handful should import those instead, so the bundler can drop the rest:

\`\`\`js
import 'kanto-ds/components/core/kt-button';
import 'kanto-ds/styles.css';
\`\`\`

## Narrower styles

\`styles.css\` is the webfonts, the tokens and a small set of page-level element styles. To keep Kanto out of your global CSS, take the tokens alone:

\`\`\`js
import 'kanto-ds/tokens/index.css';
\`\`\`

## Icons

\`<kt-icon>\` resolves [Lucide](https://lucide.dev) icons by name at render time, which means the set cannot be tree-shaken. Kanto ships the icons its own elements draw, and the few a first screen reaches for — \`plus\`, \`pencil\`, \`settings\`, \`download\`, \`upload\`, \`external-link\`, \`filter\`, \`ellipsis\`, \`refresh-cw\`. Register whatever else you use, once:

\`\`\`js
import { Rocket, Wallet } from 'lucide';
import { registerIcons } from 'kanto-ds/icons';

registerIcons({ Rocket, Wallet });
\`\`\`

## Theme

Dark is the default and needs no setup. Light is one attribute away:

\`\`\`html
<html data-theme="light">
<html data-theme="auto">
\`\`\`
`;

export const APPEARANCE = `# Appearance

Try it from Customise, in the top bar.

## Accent colour

Kanto ships violet. Seven presets are a data attribute away, on the page or on
any container:

\`\`\`html
<html data-accent="blue"></html>
\`\`\`

\`violet\` · \`blue\` · \`teal\` · \`green\` · \`orange\` · \`pink\` · \`slate\`

Any other colour goes through \`setAccent\`, which solves the variants for it:

\`\`\`js
import { setAccent } from 'kanto-ds';

setAccent('#e11d48'); // the page
setAccent('#e11d48', panel); // one container
setAccent(null); // back to the preset or the default
\`\`\`

Whatever the colour, white text reads on a primary fill at 4.5:1 or more, and
the accent as text reads at 4.5:1 or more on the surfaces, on its own tint and on the hover wash of a secondary button,
in both themes. A bright colour — a yellow, a light orange — is darkened for
it, as Kanto's own violet is. The neutral surfaces take a trace of the accent's
hue; a grey accent gives plain greys.

\`accentPalette(color)\` returns the values without applying them — to write
them into a stylesheet at build time, for instance. The inputs it sets are
\`--accent-base\`, \`--accent-hover\`, \`--accent-text-dark\`, \`--accent-text-light\`,
\`--accent-wash\`, \`--neutral-hue\` and \`--neutral-chroma\`; components never read
them, only the tokens do.

A red or a green accent sits close to the danger and success colours; Kanto
does not stop you, but a primary button and a destructive one will look
alike.

## Font, corners, density and text size

Besides the accent, four settings change how Kanto looks. Each is a data
attribute, on the page or on any container:

\`\`\`html
<html data-font="inter" data-radius="round" data-density="compact" data-text-size="large"></html>
\`\`\`

| Attribute        | Values                                          |
| ---------------- | ----------------------------------------------- |
| \`data-font\`      | \`kanto\` · \`system\` · \`inter\` · \`plex\` · \`geist\` |
| \`data-radius\`    | \`sharp\` · \`default\` · \`round\`                   |
| \`data-density\`   | \`compact\` · \`default\` · \`comfortable\`           |
| \`data-text-size\` | \`small\` · \`default\` · \`large\`                   |
| \`data-theme\`     | \`dark\` · \`light\` · \`auto\`                       |

Or all at once, with the accent:

\`\`\`js
import { setAppearance, readAppearance } from 'kanto-ds';

setAppearance({ theme: 'auto', accent: 'teal', font: 'inter', density: 'compact' });
readAppearance(); // { theme: 'auto', accent: 'teal', font: 'inter', radius: 'default', … }
\`\`\`

\`setAppearance\` changes only the settings it is given, and checks them all
first: an unknown value throws and changes nothing.

Density scales the heights of controls and fields — a button is 34px in
\`compact\`, 46px in \`comfortable\`, on even pixels — the padding and gap
tokens, and table cells. Text size scales every type token and table text.
Both compose with the mobile and ultra-wide scales. A few inner sizes —
calendar cells, the small segmented control — keep their own.

The rounding of heights uses CSS \`round()\` where the browser has it (Chrome
125, Firefox 118, Safari 15.4); before that, heights keep their exact
fraction and nothing else changes.

Kanto ships its own faces only. With \`inter\`, \`plex\` or \`geist\`, load the font
yourself (Google Fonts has all three); without it, the system face shows.

The inputs behind the attributes are \`--radius-scale\`, \`--density-scale\`,
\`--text-scale\`, \`--font-body\` and \`--font-display\`. Set in CSS, they need one
of the attributes on the same element for the tokens to re-read them there;
\`--font-body\` and \`--font-display\` take a full font stack, the scales a plain
number.

An element carrying one of these attributes re-declares Kanto's spacing and
type tokens from these inputs, so an app that overrides a token itself —
\`:root { --button-height: 36px }\` — repeats the override for that element, or
overrides the input instead. The same goes for colour tokens under
\`data-accent\`.
`;

export const AI_AGENTS = `# AI agents

Kanto is written down for the agents that write code with you — Claude Code, Cursor, GitHub Copilot, Codex — so the first screen they build is made of Kanto, used the right way.

## Give your agent the instructions

The package ships \`AGENTS.md\`: what Kanto is, the rules that make code right the first time, the mistakes agents make and their fix, and every component in a line. Point your agent at it once.

${agentSetupsMarkdown()}

## Every component page, where the agent looks

Each component's documentation is in the package, at \`node_modules/kanto-ds/dist/docs/<tag>.md\` — the properties, the events, what a screen reader hears and when not to use it. \`AGENTS.md\` tells the agent to read a component's page before using it, as you would.

## For a chat that cannot read your project

Give it one of these, by link or pasted:

- [\`llms.txt\`](https://kanto.arnaudmichel.fr/llms.txt) — what Kanto is, the rules, and a link to every page.
- [\`llms-full.txt\`](https://kanto.arnaudmichel.fr/llms-full.txt) — the same, then every component page in full, in one file.
- [\`agents.md\`](https://kanto.arnaudmichel.fr/agents.md) — the instructions above, without a project.

## Prompts that work

Ask for the screen and name the system; the agent finds the components.

\`\`\`text
Build a settings page with Kanto: a profile form, notification toggles,
and a danger zone that asks for confirmation before deleting the account.
\`\`\`

\`\`\`text
Turn this table into a kt-table with sortable columns, a status badge
per row and a search above it. Keep the data as it is.
\`\`\`

\`\`\`text
Give the whole app a teal accent, rounder corners and a compact density,
without touching any component's CSS.
\`\`\`

## Working in this repository

The \`SKILL.md\` at the repository's root is a Claude Code skill: the design guidelines, the tokens and the components, read before building in Kanto itself.
`;

export const TOOLS = `# Editors

Kanto describes itself to your editor, so plain HTML and templates get completion and hover docs for every \`kt-*\` tag, attribute and event. For AI assistants, see [AI agents](#/guide/ai-agents).

## Completion and hover docs

The package ships a [Custom Elements Manifest](https://custom-elements-manifest.open-wc.org/) and editor data generated from it.

- **WebStorm and other JetBrains IDEs** read \`web-types.json\` from the package on their own.
- **VS Code** needs pointing at it once, in \`.vscode/settings.json\`:

\`\`\`json
{
  "html.customData": ["./node_modules/kanto-ds/dist/vscode.html-custom-data.json"],
  "css.customData": ["./node_modules/kanto-ds/dist/vscode.css-custom-data.json"]
}
\`\`\`

- **Storybook** and API-docs generators take \`kanto-ds/custom-elements.json\`.
`;
