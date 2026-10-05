# Templates, phase 2 — the site — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the docs site a Templates section — a gallery and a page per template, each with a live demo, screenshots and the command that makes it — turn Apps into a showcase of products built with Kanto, take the Blocks page out, and fix the SaaS sidebar.

**Architecture:** One catalog, `demo/lib/templates.ts`, describes each template (what it is, its screens, its routes and files, its components); the gallery, the template pages, the home page and the screenshot script all read it, and a test holds it to `create-kanto`'s list and to the folders in `templates/`. `build:demo` builds each template's vanilla stack into `dist-demo/templates/<id>/` straight from the library's sources — no install, no network — so the live demo ships with the site. Screenshots are made by a script from that build and committed, like the share image.

**Tech Stack:** Lit (`html`) for the docs pages, Vite's JS API for the demo builds, Playwright for screenshots, Vitest (unit, happy-dom; browser).

**Spec:** `docs/superpowers/specs/2026-10-05-templates-design.md`

## Global Constraints

- Live demos are built from each template's **vanilla** stack.
- Templates section: `#/templates` (gallery), `#/templates/<id>` (a template's page); commands `npm create kanto@latest my-app -- --template <id> --stack <stack>` and `npx degit MrArnaudMichel/kanto/templates/<id>-<stack> my-app`; stacks React, Vue, vanilla.
- Apps: a showcase of real products, one card each (screenshot, name, one line, a link); first the Kanto site, and a "Built something with Kanto? Show it" card leading to a GitHub issue form; cards are data in one file.
- The current demos stay reachable at `#/app/…` and their doc pages at `#/apps/<slug>` until their template replaces them (phase 3).
- The `#/blocks` page and its top-bar entry go; `#/blocks` lands on the first block's Components page; old `#/templates/<slug>` links land on the gallery.
- The home page's "Build a page from blocks" becomes "Start from a template", leading to the gallery.
- Every commit only after `npm run verify` passes; commits in Arnaud Michel's name, no co-author trailer. Branch: `feat/templates`.
- The site deploys from releases only (`pages.yml`), so the Templates section goes live with the release that first publishes `create-kanto` — the commands it shows work from that day.
- Copy: sentence case, plain verbs, no exclamation marks.

## Review Focus

1. **The live demo link from a template page** — `./templates/<id>/` is relative to the site's base (`./`); it must open the demo from `#/templates/saas`, whose hash makes the path look deeper. (Task 4: the test reads the link's resolved `href`.)
2. **A template added to `create-kanto` but not to the catalog, or the other way round** — the site would show a template the tool cannot make. (Task 2: catalog ↔ choices test.)
3. **A screenshot missing for a catalog screen** — a broken image on the gallery. (Task 3: every screen's file exists.)
4. **The build of a live demo failing silently** — the site deploys without it, and Live demo 404s. (Task 2: `check:demo` fails without `dist-demo/templates/<id>/index.html` and its script.)
5. **Old links** — `#/blocks`, `#/blocks#marketing`, `#/templates/dashboard` (an old template slug) — must land on a page, not on the guide's first page. (Task 5 and Task 4 shell tests.)

---

## File Structure

```
demo/lib/templates.ts          the catalog: TEMPLATE_CATALOG, STACKS, createCommand, degitCommand, demoHref
demo/lib/templates.test.ts     catalog ↔ create-kanto ↔ templates/ ; every screenshot exists
demo/lib/built-with.ts         the Apps showcase: BUILT_WITH, SHOW_YOURS
demo/pages/templates.ts        templatesPage() — the gallery; templatePage(entry, rerender) — one template
demo/pages/apps.ts             appsPage() — the showcase
demo/public/templates/*.png    screenshots of each template (committed)
demo/public/apps/*.png         screenshots of each showcased product (committed)
scripts/build-template-demos.js   builds templates/<id>-vanilla into dist-demo/templates/<id>/
scripts/screenshot-templates.js   makes the PNGs above from dist-demo
.github/ISSUE_TEMPLATE/showcase.yml
```

Modified: `demo/main.ts` (sections, routes, redirects), `demo/pages/home.ts` + `home.css` (the templates section, the footer), `demo/shell.css` (gallery, template page, showcase), `demo/shell.test.ts`, `demo/pages/home.test.ts`, `package.json` (`build:demo`), `scripts/check-demo.js`, `templates/saas-*/src/*` (sidebar), `scripts/template-smoke.js`, `CHANGELOG.md`, the spec (the search icon is not a defect).

Deleted: `demo/pages/blocks.ts`.

---

### Task 1: The SaaS sidebar owns its background

The screenshots show the navigation drawn as a card inside the sidebar: the templates leave out `flush`, which the Console demo sets (`demo/apps/shell.ts:147`). The search icon reported with it is not a defect — it sits at the end of the field and was under the open side panel in the screenshot.

**Files:**

- Modify: `scripts/template-smoke.js`, `templates/saas-*/src/styles.css` (shared), `templates/saas-vanilla/src/layout.ts`, `templates/saas-react/src/AppLayout.tsx`, `templates/saas-vue/src/AppLayout.vue`, `docs/superpowers/specs/2026-10-05-templates-design.md`

**Interfaces:** Produces: every SaaS stack renders `<kt-sub-menu-navigation flush class="app-nav">`.

- [ ] **Step 1: The walk asks for it.** In `scripts/template-smoke.js`, after the dashboard's stats wait (`kt-stat` length 4), add:

```js
// The sidebar owns its background: the navigation is flush, not a card in it.
await until(() => document.querySelector('kt-sub-menu-navigation')?.hasAttribute('flush') === true);
```

- [ ] **Step 2: Watch it fail.** Run: `npm run build && npm run check:templates saas-vanilla`. Expected: FAIL — `saas-vanilla: page.waitForFunction: Timeout 10000ms exceeded.`

- [ ] **Step 3: Fix the three stacks.**
  - `layout.ts`: `<kt-sub-menu-navigation slot="sidebar" label="Workspace"></kt-sub-menu-navigation>` → `<kt-sub-menu-navigation slot="sidebar" class="app-nav" flush label="Workspace"></kt-sub-menu-navigation>`.
  - `AppLayout.tsx`: add `className="app-nav"` and `flush` to `<kt-sub-menu-navigation …>`.
  - `AppLayout.vue`: add `class="app-nav"` and `flush` to `<kt-sub-menu-navigation …>`.
  - Shared `src/styles.css` (all three copies, identical), after `.app-brand { … }`:

```css
/* The sidebar's navigation, flush: the room the card's padding gave it. */
.app-nav {
  display: block;
  padding: 16px 12px;
}
```

- [ ] **Step 4: Watch it pass.** Run: `npm run check:templates`. Expected: three `ok` lines. Run: `npx vitest run --project unit scripts/templates.test.ts` — PASS (shared files still identical).

- [ ] **Step 5: The spec.** In the spec's phase 2 list, replace "The two SaaS defects seen in its screenshots: the sidebar's background stops under its links, and the search field shows no icon." with "The SaaS sidebar's background stopping under its links (the navigation was not `flush`)."

- [ ] **Step 6: Commit.**

```bash
npm run format && npm run verify
git add scripts/template-smoke.js templates docs/superpowers/specs/2026-10-05-templates-design.md
git commit -m "fix(templates): the SaaS sidebar owns its background"
```

---

### Task 2: The catalog, and the live demos in the site's build

**Files:**

- Create: `demo/lib/templates.ts`, `demo/lib/templates.test.ts`, `scripts/build-template-demos.js`
- Modify: `package.json` (`build:demo`), `scripts/check-demo.js`

**Interfaces:**

- Produces:
  - `TemplateEntry { id; name; summary; description; routes: {path; what}[]; files: {path; what}[]; components: string[]; screens: {file; hash; caption}[]; seed?: Record<string, string> }`
  - `TEMPLATE_CATALOG: readonly TemplateEntry[]`
  - `STACKS: readonly { id: 'react' | 'vue' | 'vanilla'; label: string }[]`
  - `createCommand(id: string, stack: string): string`, `degitCommand(id: string, stack: string): string`, `demoHref(id: string): string`
  - `dist-demo/templates/<id>/index.html` after `npm run build:demo`.

- [ ] **Step 1: Write the failing test.** `demo/lib/templates.test.ts`:

```ts
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  STACKS as TOOL_STACKS,
  TEMPLATES as TOOL_TEMPLATES,
} from '../../packages/create-kanto/lib/choices.js';
import { createCommand, degitCommand, demoHref, STACKS, TEMPLATE_CATALOG } from './templates.js';

const root = process.cwd();

describe('the templates catalog', () => {
  it('lists exactly the templates create-kanto makes, in its order, with its stacks', () => {
    expect(TEMPLATE_CATALOG.map((entry) => entry.id)).toEqual(
      TOOL_TEMPLATES.map((t: { id: string }) => t.id),
    );
    expect(STACKS.map((stack) => stack.id)).toEqual(TOOL_STACKS.map((s: { id: string }) => s.id));
  });

  it('has a project for each template in each stack', () => {
    for (const entry of TEMPLATE_CATALOG) {
      for (const stack of STACKS) {
        expect(
          existsSync(join(root, 'templates', `${entry.id}-${stack.id}`, 'package.json')),
          `${entry.id}-${stack.id}`,
        ).toBe(true);
      }
    }
  });

  it('links each component it names to a page that exists', () => {
    for (const entry of TEMPLATE_CATALOG) {
      for (const tag of entry.components) {
        const found = [
          'core',
          'forms',
          'navigation',
          'feedback',
          'overlays',
          'data',
          'blocks',
        ].some((group) => existsSync(join(root, 'src/components', group, tag, `${tag}.md`)));
        expect(found, tag).toBe(true);
      }
    }
  });

  it('writes the commands a person copies', () => {
    expect(createCommand('saas', 'vue')).toBe(
      'npm create kanto@latest my-app -- --template saas --stack vue',
    );
    expect(degitCommand('saas', 'react')).toBe(
      'npx degit MrArnaudMichel/kanto/templates/saas-react my-app',
    );
    expect(demoHref('saas')).toBe('./templates/saas/');
  });
});
```

- [ ] **Step 2: Watch it fail.** Run: `npx vitest run --project unit demo/lib/templates.test.ts`. Expected: FAIL — `Failed to resolve import "./templates.js"`.

- [ ] **Step 3: Write the catalog.** `demo/lib/templates.ts`:

```ts
/**
 * The templates the site shows — the same list `create-kanto` makes (a test
 * holds the two together). The gallery, each template's page, the home page
 * and the screenshot script all read this.
 */
export interface TemplateEntry {
  /** As in `create-kanto --template` and `templates/<id>-<stack>/`. */
  readonly id: string;
  readonly name: string;
  /** One line, on the gallery's card. */
  readonly summary: string;
  /** Markdown, on the template's page: what it is and how it is made. */
  readonly description: string;
  readonly routes: readonly { readonly path: string; readonly what: string }[];
  /** The files a fork changes first. */
  readonly files: readonly { readonly path: string; readonly what: string }[];
  readonly components: readonly string[];
  /** Screens shot from the live demo; the first is the card's. */
  readonly screens: readonly {
    readonly file: string;
    readonly hash: string;
    readonly caption: string;
  }[];
  /** localStorage set before the screenshots: the demo seen signed in. */
  readonly seed?: Readonly<Record<string, string>>;
}

export const STACKS = [
  { id: 'react', label: 'React' },
  { id: 'vue', label: 'Vue' },
  { id: 'vanilla', label: 'TypeScript' },
] as const;

export type StackId = (typeof STACKS)[number]['id'];

export const TEMPLATE_CATALOG: readonly TemplateEntry[] = [
  {
    id: 'saas',
    name: 'SaaS',
    summary: 'An invoicing product: sign in, first steps, a dashboard, customers and settings.',
    description: `Northwind sends invoices and chases them. Signing in is faked — any
email and password get in — and the data comes from one module with an async
API over made-up customers and invoices: replace those two files and the
pages do not change.

A new account lands on its first steps before its dashboard; a signed-out
visit to any page goes to sign in.`,
    routes: [
      {
        path: '#/sign-in, #/sign-up',
        what: 'The way in: sign in, create an account, reset a password.',
      },
      { path: '#/welcome', what: 'First steps for a new account.' },
      { path: '#/', what: 'What is billed, paid and late: stats, a chart, the latest invoices.' },
      {
        path: '#/customers',
        what: 'Everyone you bill: search, pages, and a customer in a side panel.',
      },
      { path: '#/settings', what: 'Profile, notifications, and a danger zone that asks first.' },
    ],
    files: [
      { path: 'src/brand.ts', what: 'The brand, in one call.' },
      { path: 'src/data/api.ts', what: 'The data. Call your backend here.' },
      { path: 'src/auth.ts', what: 'Signing in. Call your auth provider here.' },
      {
        path: 'src/content.ts',
        what: 'The navigation, the account menu, the first steps, the tables.',
      },
    ],
    components: [
      'kt-app-shell',
      'kt-sub-menu-navigation',
      'kt-user-menu',
      'kt-auth-form',
      'kt-empty-page',
      'kt-page-header',
      'kt-stat',
      'kt-chart',
      'kt-table',
      'kt-side-panel',
      'kt-description-list',
      'kt-settings-section',
      'kt-confirm-dialog',
      'kt-error-page',
    ],
    screens: [
      { file: 'saas-overview.png', hash: '#/', caption: 'The overview' },
      { file: 'saas-customers.png', hash: '#/customers', caption: 'Customers' },
      { file: 'saas-settings.png', hash: '#/settings', caption: 'Settings' },
      { file: 'saas-sign-in.png', hash: '#/sign-in', caption: 'Signing in' },
    ],
    seed: {
      'kanto-saas-session': JSON.stringify({
        name: 'Ada Park',
        email: 'ada@northwind.com',
        welcomed: true,
      }),
    },
  },
];

export const createCommand = (id: string, stack: string): string =>
  `npm create kanto@latest my-app -- --template ${id} --stack ${stack}`;

export const degitCommand = (id: string, stack: string): string =>
  `npx degit MrArnaudMichel/kanto/templates/${id}-${stack} my-app`;

/** The live demo, built beside the site from the template's vanilla stack. */
export const demoHref = (id: string): string => `./templates/${id}/`;
```

Note: the `saas-sign-in` screen is shot signed in; `redirectFor` sends a signed-in visit to `/`. The screenshot script (Task 3) clears the seed for a screen whose hash is a public path — it reads `PUBLIC_SCREENS` there.

- [ ] **Step 4: Watch it pass.** Run: `npx vitest run --project unit demo/lib/templates.test.ts`. Expected: PASS (4).

- [ ] **Step 5: The live demos, failing first.** In `scripts/check-demo.js`, before its final success line, add:

```js
// Each template's live demo, built beside the site from its vanilla stack.
const demos = readdirSync(join(root, 'templates'))
  .filter((name) => name.endsWith('-vanilla'))
  .map((name) => name.replace(/-vanilla$/, ''));
const missingDemos = demos.filter((id) => {
  const page = join(root, 'dist-demo/templates', id, 'index.html');
  return (
    !existsSync(page) ||
    !/<script type="module"[^>]+src="\.\/assets\//.test(readFileSync(page, 'utf8'))
  );
});
if (missingDemos.length) {
  console.error(`\n✗ The site has no live demo for: ${missingDemos.join(', ')}\n`);
  process.exit(1);
}
console.log(`ok   the docs site serves a live demo of ${demos.join(', ')}`);
```

(add `readdirSync` to its `node:fs` import if absent). Run: `npm run build:demo && npm run check:demo`. Expected: FAIL — `✗ The site has no live demo for: saas`.

- [ ] **Step 6: Build them.** `scripts/build-template-demos.js`:

```js
#!/usr/bin/env node
/**
 * Builds each template's vanilla stack into dist-demo/templates/<id>/, beside
 * the docs site, as its live demo. Like the site, it takes Kanto from src/ —
 * no install, no network — so the demo is the library at this commit.
 * Runs after the site's own build, which empties dist-demo.
 */
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = (path) => join(root, 'src', path);

// The docs site's aliases (demo/vite.config.ts): exact matches before the prefix.
const alias = [
  { find: /^kanto-ds$/, replacement: src('index.ts') },
  { find: /^kanto-ds\/styles\.css$/, replacement: src('styles.css') },
  { find: /^kanto-ds\//, replacement: `${src('')}/` },
];

const ids = readdirSync(join(root, 'templates'))
  .filter((name) => name.endsWith('-vanilla'))
  .map((name) => name.replace(/-vanilla$/, ''));

for (const id of ids) {
  await build({
    root: join(root, 'templates', `${id}-vanilla`),
    base: './',
    configFile: false,
    logLevel: 'warn',
    resolve: { alias },
    build: { outDir: join(root, 'dist-demo/templates', id), emptyOutDir: true },
  });
  console.log(`built the ${id} live demo`);
}
```

`package.json`: `"build:demo": "vite build --config demo/vite.config.ts && node scripts/build-template-demos.js",`

- [ ] **Step 7: Watch it pass.** Run: `npm run build:demo && npm run check:demo`. Expected: `built the saas live demo`, then `ok   the docs site serves a live demo of saas`. Then serve and open it: `npx vite preview --config demo/vite.config.ts --port 5198 --strictPort &` and load `http://localhost:5198/templates/saas/#/sign-in` in Playwright (or a browser): the sign-in form shows; kill the server (`fuser -k 5198/tcp`).

- [ ] **Step 8: Commit.**

```bash
npm run format && npm run verify
git add demo/lib/templates.ts demo/lib/templates.test.ts scripts/build-template-demos.js scripts/check-demo.js package.json
git commit -m "feat(docs): the templates catalog, and each template's live demo in the site's build"
```

---

### Task 3: Screenshots of each template

**Files:**

- Create: `scripts/screenshot-templates.js`, `demo/public/templates/saas-{overview,customers,settings,sign-in}.png`
- Modify: `demo/lib/templates.test.ts`

**Interfaces:**

- Consumes: `TEMPLATE_CATALOG` (Task 2) — read from the TS source by the script through Vite's `ssrLoadModule`; `dist-demo/templates/<id>/`.
- Produces: `node scripts/screenshot-templates.js` (after `npm run build:demo`) writes every catalog screen to `demo/public/templates/<file>`.

- [ ] **Step 1: The failing test.** Append to `demo/lib/templates.test.ts`, inside the describe:

```ts
it('has a screenshot for every screen it shows', () => {
  for (const entry of TEMPLATE_CATALOG) {
    expect(entry.screens.length, entry.id).toBeGreaterThan(0);
    for (const screen of entry.screens) {
      expect(existsSync(join(root, 'demo/public/templates', screen.file)), screen.file).toBe(true);
    }
  }
});
```

Run: `npx vitest run --project unit demo/lib/templates.test.ts`. Expected: FAIL — `saas-overview.png: expected false to be true`.

- [ ] **Step 2: The script.** `scripts/screenshot-templates.js`:

```js
#!/usr/bin/env node
/**
 * Shoots every template screen the catalog lists, from the live demos in
 * dist-demo, into demo/public/templates/. Run after `npm run build:demo`, and
 * commit the PNGs — like the share image, they change when a template does.
 *
 *   npm run build:demo && node scripts/screenshot-templates.js
 */
import { mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 5197;
/** Screens of the way in are shot signed out. */
const PUBLIC_SCREENS = new Set(['#/sign-in', '#/sign-up']);

// The catalog is TypeScript: let Vite load it.
const loader = await createServer({
  configFile: false,
  server: { middlewareMode: true },
  logLevel: 'silent',
});
const { TEMPLATE_CATALOG } = await loader.ssrLoadModule(join(root, 'demo/lib/templates.ts'));
await loader.close();

const server = spawn(
  'npx',
  ['vite', 'preview', '--config', 'demo/vite.config.ts', '--port', String(PORT), '--strictPort'],
  {
    cwd: root,
    stdio: 'ignore',
  },
);
const base = `http://localhost:${PORT}`;
for (let tries = 0; tries < 100; tries += 1) {
  try {
    if ((await fetch(base)).ok) break;
  } catch {
    // Not up yet.
  }
  await new Promise((resolve) => setTimeout(resolve, 200));
}

const out = join(root, 'demo/public/templates');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
try {
  for (const entry of TEMPLATE_CATALOG) {
    for (const screen of entry.screens) {
      const page = await browser.newPage({
        viewport: { width: 1400, height: 860 },
        colorScheme: 'dark',
      });
      const seed = PUBLIC_SCREENS.has(screen.hash) ? {} : (entry.seed ?? {});
      await page.addInitScript((pairs) => {
        for (const [key, value] of Object.entries(pairs)) localStorage.setItem(key, value);
      }, seed);
      await page.goto(`${base}/templates/${entry.id}/${screen.hash}`);
      await page.waitForLoadState('networkidle');
      // The fixtures answer after ~300ms; let them land and the motion settle.
      await page.waitForTimeout(1500);
      await page.screenshot({ path: join(out, screen.file) });
      await page.close();
      console.log(`shot ${screen.file}`);
    }
  }
} finally {
  await browser.close();
  server.kill();
}
```

- [ ] **Step 3: Shoot, and look.** Run: `npm run build:demo && node scripts/screenshot-templates.js`. Expected: four `shot …` lines. Open each PNG and check it shows the screen its caption names, signed in (except sign-in), with data loaded.

- [ ] **Step 4: Watch the test pass.** Run: `npx vitest run --project unit demo/lib/templates.test.ts`. Expected: PASS (5).

- [ ] **Step 5: Commit.**

```bash
npm run format && npm run verify
git add scripts/screenshot-templates.js demo/public/templates demo/lib/templates.test.ts
git commit -m "feat(docs): screenshots of each template, shot from its live demo"
```

---

### Task 4: The Templates section — gallery and template pages

**Files:**

- Create: `demo/pages/templates.ts`
- Modify: `demo/main.ts`, `demo/shell.css`, `demo/shell.test.ts`

**Interfaces:**

- Consumes: Task 2's catalog and helpers.
- Produces: `templatesPage(): DocPage`, `templatePage(entry: TemplateEntry, rerender: () => void): DocPage`; routes `#/templates` (slug `all`, label `Templates`, group `Templates`) and `#/templates/<id>` (label `entry.name`, group `Templates`); section id `templates` in the top bar, between Components and Apps.

- [ ] **Step 1: The failing tests.** In `demo/shell.test.ts`:
  - change the top-bar expectation to `['Guide', 'Components', 'Blocks', 'Templates', 'Apps', 'Release']` (Blocks goes in Task 5);
  - replace the test "sends an old link to the templates to the blocks" with:

```ts
it('shows the templates in a gallery, each with its live demo and its page', async () => {
  const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
  location.hash = '#/templates';
  await tick();
  expect(document.title).toBe('Templates — Kanto');
  const card = app.querySelector('.templates-gallery .template-card')!;
  expect(card.querySelector('a[href="#/templates/saas"]')).not.toBeNull();
  const demo = card.querySelector<HTMLAnchorElement>('a.template-demo')!;
  expect(new URL(demo.href).pathname.endsWith('/templates/saas/')).toBe(true);
  expect(card.querySelector('img')!.getAttribute('src')).toBe('./templates/saas-overview.png');
});

it('gives each template a page: screens, the command for each stack, what is inside', async () => {
  const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
  location.hash = '#/templates/saas';
  await tick();
  expect(document.title).toBe('SaaS — Kanto');
  expect(app.querySelectorAll('.template-screens img')).toHaveLength(4);
  // From the template's page too, the demo resolves beside the site, not under the hash.
  const demo = app.querySelector<HTMLAnchorElement>('a.template-demo')!;
  expect(new URL(demo.href).pathname.endsWith('/templates/saas/')).toBe(true);
  expect(app.querySelector('.template-start kt-code')!.textContent).toContain(
    'npm create kanto@latest my-app -- --template saas --stack react',
  );
  const tabs = app.querySelector('.template-start kt-tabs')!;
  tabs.dispatchEvent(new CustomEvent('kt-change', { detail: { value: 'vue' } }));
  await tick();
  expect(app.querySelector('.template-start kt-code')!.textContent).toContain('--stack vue');
  expect(app.querySelector('a[href="#/components/kt-auth-form"]')).not.toBeNull();
});

it('sends an old template link to the gallery', async () => {
  location.hash = '#/templates/dashboard';
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(document.title).toBe('Templates — Kanto');
});
```

- [ ] **Step 2: Watch them fail.** Run: `npx vitest run --project unit demo/shell.test.ts`. Expected: FAIL — the top bar has no Templates, `#/templates` lands on the blocks.

- [ ] **Step 3: The pages.** `demo/pages/templates.ts`:

```ts
/**
 * The Templates section: the gallery, and a page per template — its screens,
 * the command for each stack, what is inside, the components it uses. The
 * catalog in demo/lib/templates.ts is the content.
 */
import { html, type TemplateResult } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { code } from '../lib/highlight.js';
import { renderDoc, type Heading } from '../lib/markdown.js';
import {
  createCommand,
  degitCommand,
  demoHref,
  STACKS,
  TEMPLATE_CATALOG,
  type StackId,
  type TemplateEntry,
} from '../lib/templates.js';
import type { DocPage } from './component.js';

/** The stack each template's page shows, kept across re-renders. */
const chosen = new Map<string, StackId>();

const screenSrc = (file: string) => `./templates/${file}`;

function demoLink(entry: TemplateEntry): TemplateResult {
  return html`<a class="template-demo" href=${demoHref(entry.id)} target="_blank" rel="noopener"
    >Live demo<kt-icon name="arrow-up-right" size="14" aria-hidden="true"></kt-icon
  ></a>`;
}

export function templatesPage(): DocPage {
  return {
    title: 'Templates',
    summary:
      'Whole projects to start from — routed, typed and building — in React, Vue or TypeScript without a framework. One command makes one; each runs live here first.',
    eyebrow: 'Templates',
    headings: [],
    source: 'demo/lib/templates.ts',
    body: html`<ul class="templates-gallery">
      ${TEMPLATE_CATALOG.map(
        (entry) =>
          html`<li class="template-card">
            <a class="template-card-shot" href=${`#/templates/${entry.id}`}>
              <img
                src=${screenSrc(entry.screens[0]!.file)}
                alt=""
                loading="lazy"
                width="1400"
                height="860"
              />
            </a>
            <div class="template-card-body">
              <h2><a href=${`#/templates/${entry.id}`}>${entry.name}</a></h2>
              <p>${entry.summary}</p>
              <p class="template-stacks">${STACKS.map((stack) => stack.label).join(', ')}</p>
              <div class="template-card-actions">
                ${demoLink(entry)}
                <a href=${`#/templates/${entry.id}`}>How to start</a>
              </div>
            </div>
          </li>`,
      )}
    </ul>`,
  };
}

export function templatePage(entry: TemplateEntry, rerender: () => void): DocPage {
  const stack = chosen.get(entry.id) ?? 'react';
  const doc = renderDoc(entry.description);
  const headings: Heading[] = [
    { id: 'screens', text: 'Screens', level: 2 },
    { id: 'start', text: 'Start a project', level: 2 },
    { id: 'inside', text: 'What is inside', level: 2 },
    { id: 'components', text: 'Components', level: 2 },
  ];

  return {
    title: entry.name,
    summary: entry.summary,
    eyebrow: 'Templates',
    headings,
    source: 'demo/lib/templates.ts',
    body: html`
      <section class="preview-section">
        <div class="app-preview-head">
          <h2 id="screens">Screens</h2>
          ${demoLink(entry)}
        </div>
        <div class="template-screens">
          ${entry.screens.map(
            (screen) =>
              html`<figure>
                <img
                  src=${screenSrc(screen.file)}
                  alt=${screen.caption}
                  loading="lazy"
                  width="1400"
                  height="860"
                />
                <figcaption>${screen.caption}</figcaption>
              </figure>`,
          )}
        </div>
      </section>
      <div class="prose">
        <section class="template-start">
          <h2 id="start">Start a project</h2>
          <kt-tabs
            label="Stack"
            .tabs=${STACKS.map((option) => ({ value: option.id, label: option.label }))}
            .value=${stack}
            @kt-change=${(event: CustomEvent<{ value: StackId }>) => {
              chosen.set(entry.id, event.detail.value);
              rerender();
            }}
          ></kt-tabs>
          ${code(createCommand(entry.id, stack), 'bash')}
          <p>Or fork it as it is, without the tool:</p>
          ${code(degitCommand(entry.id, stack), 'bash')}
        </section>
        <h2 id="inside">What is inside</h2>
        ${unsafeHTML(doc.html)}
        <table>
          <thead>
            <tr>
              <th>Route</th>
              <th>What it shows</th>
            </tr>
          </thead>
          <tbody>
            ${entry.routes.map(
              (route) =>
                html`<tr>
                  <td><code>${route.path}</code></td>
                  <td>${route.what}</td>
                </tr>`,
            )}
          </tbody>
        </table>
        <table>
          <thead>
            <tr>
              <th>To change first</th>
              <th>What it holds</th>
            </tr>
          </thead>
          <tbody>
            ${entry.files.map(
              (file) =>
                html`<tr>
                  <td><code>${file.path}</code></td>
                  <td>${file.what}</td>
                </tr>`,
            )}
          </tbody>
        </table>
        <h2 id="components">Components</h2>
        <ul class="template-components">
          ${entry.components.map(
            (tag) =>
              html`<li>
                <a href=${`#/components/${tag}`}><code>${tag}</code></a>
              </li>`,
          )}
        </ul>
      </div>
    `,
  };
}
```

The catalog's `what` strings are plain text — no Markdown — so the tables render them as they are.

- [ ] **Step 4: The routes.** In `demo/main.ts`:
  - `import { templatePage, templatesPage } from './pages/templates.js';` and `import { TEMPLATE_CATALOG } from './lib/templates.js';`
  - `type Section` gains `'templates'`.
  - After `COMPONENT_ROUTES`:

```ts
const TEMPLATE_ROUTES: Route[] = [
  {
    section: 'templates',
    slug: 'all',
    label: 'Templates',
    group: 'Templates',
    page: templatesPage,
  },
  ...TEMPLATE_CATALOG.map((entry) => ({
    section: 'templates' as const,
    slug: entry.id,
    label: entry.name,
    group: 'Templates',
    page: () => templatePage(entry, update),
  })),
];
```

- `ROUTES`: insert `...TEMPLATE_ROUTES` after `BLOCKS`.
- `SECTIONS`: after the Blocks entry, `{ id: 'templates', label: 'Templates', icon: 'layout-template' },` — Blocks shares that icon until Task 5 removes it.
- `currentRoute()`: delete the line `if (section === 'templates') return BLOCKS;` — an unknown template slug falls to the section's first route, the gallery.

- [ ] **Step 5: The styles.** Append to `demo/shell.css`:

```css
/* === Templates: the gallery, and a template's page === */

.templates-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.template-card {
  display: grid;
  overflow: hidden;
  border: var(--border-width) solid var(--border-subtle);
  border-radius: var(--border-radius-card);
}
.template-card-shot img,
.template-screens img {
  display: block;
  width: 100%;
  height: auto;
  border-bottom: var(--border-width) solid var(--border-subtle);
}
.template-card-body {
  display: grid;
  gap: 8px;
  padding: 20px;
}
.template-card-body h2 {
  margin: 0;
  font: var(--font-title-h6);
}
.template-card-body h2 a {
  color: var(--text-body);
  text-decoration: none;
}
.template-card-body p {
  margin: 0;
  color: var(--text-muted);
}
.template-stacks {
  font: var(--font-normal-small);
}
.template-card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  margin-top: 6px;
}
.template-demo {
  display: inline-flex;
  gap: 4px;
  align-items: center;
}
.template-screens {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}
@media (max-width: 760px) {
  .template-screens {
    grid-template-columns: minmax(0, 1fr);
  }
}
.template-screens figure {
  display: grid;
  gap: 8px;
  margin: 0;
}
.template-screens img {
  border: var(--border-width) solid var(--border-subtle);
  border-radius: var(--border-radius-card);
}
.template-screens figcaption {
  color: var(--text-muted);
  font: var(--font-normal-small);
}
.template-start kt-tabs {
  display: block;
  margin-bottom: 12px;
}
.template-components {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  padding: 0;
  list-style: none;
}
```

- [ ] **Step 6: Watch them pass, and look.** Run: `npx vitest run --project unit demo/shell.test.ts`. Expected: PASS. Run `npm run build:demo`, serve it (`npx vite preview --config demo/vite.config.ts --port 5198 --strictPort &`), screenshot `#/templates` and `#/templates/saas` at 1400px, dark and light, read them: cards, screens and tables laid out, no raw backticks, the Live demo link opens the demo. `fuser -k 5198/tcp`.

- [ ] **Step 7: Commit.**

```bash
npm run format && npm run verify
git add demo/pages/templates.ts demo/main.ts demo/shell.css demo/shell.test.ts
git commit -m "feat(docs): the Templates section — a gallery, and a page per template"
```

---

### Task 5: The Blocks page out; the home page leads to the templates

**Files:**

- Delete: `demo/pages/blocks.ts`
- Modify: `demo/main.ts`, `demo/pages/home.ts`, `demo/home.css`, `demo/shell.css`, `demo/shell.test.ts`, `demo/pages/home.test.ts`, `CHANGELOG.md`

**Interfaces:** Consumes `TEMPLATE_CATALOG`, `demoHref`. Produces a home section `.home-templates` with a card per template.

- [ ] **Step 1: The failing tests.**

`demo/shell.test.ts`:

- top bar: `['Guide', 'Components', 'Templates', 'Apps', 'Release']`;
- delete the two blocks tests ("shows every block live on one page…", "groups the blocks by what they are for…");
- add:

```ts
it('sends the old blocks page to the first block, and keeps the blocks in Components', async () => {
  const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
  for (const hash of ['#/blocks', '#/blocks#marketing']) {
    location.hash = hash;
    await tick();
    expect(document.title, hash).toBe('hero — Kanto');
  }
  location.hash = '#/components/kt-hero';
  await tick();
  const groups = [...app.querySelectorAll('.sidebar-group .overline')].map((g) =>
    g.textContent!.trim(),
  );
  expect(groups).toContain('Blocks');
});
```

`demo/pages/home.test.ts`: replace `import { BLOCK_CATEGORIES } from './blocks.js';` with `import { TEMPLATE_CATALOG } from '../lib/templates.js';`, and the `describe('blocks', …)` block with:

```ts
describe('templates', () => {
  it('leads to the gallery, and to each template and its live demo', () => {
    const section = mount().querySelector('.home-templates')!;
    expect(section.querySelector('a[href="#/templates"]')).not.toBeNull();
    for (const entry of TEMPLATE_CATALOG) {
      expect(section.querySelector(`a[href="#/templates/${entry.id}"]`), entry.id).not.toBeNull();
      expect(section.querySelector(`a[href="./templates/${entry.id}/"]`), entry.id).not.toBeNull();
    }
  });

  it('no longer leads to the blocks page', () => {
    expect(mount().querySelector('a[href^="#/blocks"]')).toBeNull();
  });
});
```

- [ ] **Step 2: Watch them fail.** Run: `npx vitest run --project unit demo/shell.test.ts demo/pages/home.test.ts`. Expected: FAIL — Blocks still in the top bar; no `.home-templates`.

- [ ] **Step 3: Out with the page.**
  - `git rm demo/pages/blocks.ts`.
  - `demo/main.ts`: remove the `blocksPage` import, the `BLOCKS` route and its place in `ROUTES`, `'blocks'` from `type Section`, the Blocks entry of `SECTIONS`. In `currentRoute()`, after the home line:

```ts
// The blocks page gave way to the templates; its blocks are in Components.
if (section === 'blocks') return COMPONENT_ROUTES.find((route) => route.slug === 'kt-hero')!;
```

- `demo/shell.css`: delete the `/* The blocks page: … */` rules (`.blocks-category` … `.blocks-item-head p`).

- [ ] **Step 4: The home page.** In `demo/pages/home.ts`:
  - imports: drop `BLOCK_CATEGORIES`; add `import { demoHref, TEMPLATE_CATALOG } from '../lib/templates.js';`
  - footer links: `{ label: 'Blocks', href: '#/blocks' }` → `{ label: 'Templates', href: '#/templates' }`;
  - the header comment's "the blocks pages are built from, and whole apps" → "the templates to start from, and whole apps";
  - replace the `<section class="home-band home-blocks" …>…</section>` with:

```ts
    <section class="home-band home-templates" aria-labelledby="home-templates">
      <h2 id="home-templates">Start from a template</h2>
      <p>
        Whole projects — routed, typed and building — in React, Vue or TypeScript without a
        framework. <a href="#/templates">See every template</a>.
      </p>
      <ul class="home-template-cards">
        ${TEMPLATE_CATALOG.map(
          (entry) =>
            html`<li>
              <a class="home-template-name" href=${`#/templates/${entry.id}`}>${entry.name}</a>
              <p>${entry.summary}</p>
              <div class="home-template-actions">
                <a href=${demoHref(entry.id)} target="_blank" rel="noopener">Live demo</a>
                <a href=${`#/templates/${entry.id}`}>How to start</a>
              </div>
            </li>`,
        )}
      </ul>
    </section>
```

- `demo/home.css`: rename the block-kinds rules to the new classes — `.home-block-kinds` → `.home-template-cards`, `.home-block-kind` → `.home-template-name`, `.home-block-names` → `.home-template-actions` (and their `a`, `:hover` and media-query variants); the section heading comment becomes `/* === Templates: a card each, the way into the gallery === */`.

- [ ] **Step 5: The changelog.** In `CHANGELOG.md`, `## [1.10.0]`, under `### Added`, after the `create-kanto` entry:

```md
- The docs site's Templates section: a gallery, and a page per template with
  its screens, the command for each stack and a live demo. The Blocks page it
  replaces sent people to the same blocks as Components does; old links land
  on the first block.
```

- [ ] **Step 6: Watch them pass, and look.** Run: `npx vitest run --project unit demo` and `npx vitest run --project browser demo`. Expected: PASS. Screenshot the home page's templates band at 1400px and 390px, and read it.

- [ ] **Step 7: Commit.**

```bash
npm run format && npm run verify
git add -A demo CHANGELOG.md
git commit -m "docs: the Blocks page gives way to the templates; the home page starts from one"
```

---

### Task 6: Apps — a showcase of products built with Kanto

**Files:**

- Create: `demo/lib/built-with.ts`, `demo/pages/apps.ts`, `demo/public/apps/kanto.png`, `.github/ISSUE_TEMPLATE/showcase.yml`
- Modify: `demo/main.ts`, `demo/shell.css`, `demo/shell.test.ts`, `scripts/screenshot-templates.js`, `CHANGELOG.md`

**Interfaces:**

- Produces: `BuiltWith { name; url; description; image; by }`, `BUILT_WITH: readonly BuiltWith[]`, `SHOW_YOURS: string`; `appsPage(): DocPage`; route `#/apps` → slug `showcase`, label `Showcase`, group `Apps`, first in the section; the demo pages stay at `#/apps/<slug>`, group `Demos`.

- [ ] **Step 1: The failing test.** In `demo/shell.test.ts`, add:

```ts
it('shows products built with Kanto in Apps, and how to add one', async () => {
  const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
  location.hash = '#/apps';
  await tick();
  expect(document.title).toBe('Showcase — Kanto');
  const cards = [...app.querySelectorAll('.showcase .showcase-card')];
  expect(cards.length).toBeGreaterThanOrEqual(2);
  expect(cards[0]!.querySelector('a[href="https://kanto.arnaudmichel.fr"]')).not.toBeNull();
  expect(
    app.querySelector(
      '.showcase a[href^="https://github.com/MrArnaudMichel/kanto/issues/new?template=showcase.yml"]',
    ),
  ).not.toBeNull();
  // The demos keep their pages until their templates replace them.
  const groups = [...app.querySelectorAll('.sidebar-group .overline')].map((g) =>
    g.textContent!.trim(),
  );
  expect(groups).toEqual(expect.arrayContaining(['Apps', 'Demos']));
  location.hash = '#/apps/console-home';
  await tick();
  expect(document.title).toBe('Console — Kanto');
});
```

Run: `npx vitest run --project unit demo/shell.test.ts`. Expected: FAIL — `#/apps` opens the Console demo page.

- [ ] **Step 2: The data.** `demo/lib/built-with.ts`:

```ts
/**
 * Products built with Kanto, for the Apps showcase: a card each. To add one,
 * open an issue with the showcase form — SHOW_YOURS — or a pull request here,
 * with a 1400×860 screenshot in demo/public/apps/.
 */
export interface BuiltWith {
  readonly name: string;
  readonly url: string;
  readonly description: string;
  /** Under demo/public/. */
  readonly image: string;
  readonly by: string;
}

export const BUILT_WITH: readonly BuiltWith[] = [
  {
    name: 'Kanto',
    url: 'https://kanto.arnaudmichel.fr',
    description:
      'This site: the docs, the playground and the live demos, built from Kanto’s own components.',
    image: 'apps/kanto.png',
    by: 'Arnaud Michel',
  },
];

export const SHOW_YOURS =
  'https://github.com/MrArnaudMichel/kanto/issues/new?template=showcase.yml';
```

- [ ] **Step 3: The page.** `demo/pages/apps.ts`:

```ts
/** Apps: products built with Kanto, a card each, and the way to add yours. */
import { html } from 'lit';
import { BUILT_WITH, SHOW_YOURS } from '../lib/built-with.js';
import type { DocPage } from './component.js';

export function appsPage(): DocPage {
  return {
    title: 'Showcase',
    summary: 'Products built with Kanto. To start one of your own, take a template.',
    eyebrow: 'Apps',
    headings: [],
    source: 'demo/lib/built-with.ts',
    body: html`<ul class="showcase">
      ${BUILT_WITH.map(
        (product) =>
          html`<li class="showcase-card">
            <a class="showcase-shot" href=${product.url} target="_blank" rel="noopener">
              <img src=${`./${product.image}`} alt="" loading="lazy" width="1400" height="860" />
            </a>
            <div class="showcase-body">
              <h2><a href=${product.url} target="_blank" rel="noopener">${product.name}</a></h2>
              <p>${product.description}</p>
              <p class="showcase-by">By ${product.by}</p>
            </div>
          </li>`,
      )}
      <li class="showcase-card showcase-yours">
        <div class="showcase-body">
          <h2>Built something with Kanto?</h2>
          <p>Show it here: a name, a link and a line, and it gets a card.</p>
          <a href=${SHOW_YOURS} target="_blank" rel="noopener">Show it</a>
        </div>
      </li>
    </ul>`,
  };
}
```

- [ ] **Step 4: The routes.** `demo/main.ts`: `import { appsPage } from './pages/apps.js';`; in `APP_ROUTES`' map, `group: 'Applications'` → `group: 'Demos'`; before it:

```ts
const SHOWCASE_ROUTE: Route = {
  section: 'apps',
  slug: 'showcase',
  label: 'Showcase',
  group: 'Apps',
  page: appsPage,
};
```

and in `ROUTES`, `SHOWCASE_ROUTE` right before `...APP_ROUTES`, so `#/apps` opens it.

- [ ] **Step 5: The styles.** Append to `demo/shell.css`:

```css
/* === Apps: the showcase === */

.showcase {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.showcase-card {
  display: grid;
  align-content: start;
  overflow: hidden;
  border: var(--border-width) solid var(--border-subtle);
  border-radius: var(--border-radius-card);
}
.showcase-shot img {
  display: block;
  width: 100%;
  height: auto;
  border-bottom: var(--border-width) solid var(--border-subtle);
}
.showcase-body {
  display: grid;
  gap: 8px;
  padding: 20px;
}
.showcase-body h2 {
  margin: 0;
  font: var(--font-title-h6);
}
.showcase-body h2 a {
  color: var(--text-body);
  text-decoration: none;
}
.showcase-body p {
  margin: 0;
  color: var(--text-muted);
}
.showcase-by {
  font: var(--font-normal-small);
}
.showcase-yours {
  align-content: center;
  border-style: dashed;
}
```

- [ ] **Step 6: The issue form.** `.github/ISSUE_TEMPLATE/showcase.yml`:

```yaml
name: Show what you built
description: A product built with Kanto, for the showcase on the docs site.
title: 'Showcase: '
labels: [showcase]
body:
  - type: input
    id: name
    attributes:
      label: Name
      description: What it is called.
    validations:
      required: true
  - type: input
    id: url
    attributes:
      label: Link
      description: Where people can see it.
      placeholder: https://
    validations:
      required: true
  - type: textarea
    id: description
    attributes:
      label: One line
      description: What it does, for someone who has never seen it.
    validations:
      required: true
  - type: input
    id: by
    attributes:
      label: Made by
      description: A person or a team, as it should read on the card.
    validations:
      required: true
  - type: textarea
    id: screenshot
    attributes:
      label: Screenshot
      description: Drop an image here. 1400×860 reads best; we can take one too.
  - type: checkboxes
    id: kanto
    attributes:
      label: Built with Kanto
      options:
        - label: Its interface uses Kanto's components.
          required: true
```

- [ ] **Step 7: Its screenshot.** In `scripts/screenshot-templates.js`, after the templates loop and inside the `try`, shoot the docs home for the Kanto card:

```js
// The showcase's own card: this site's home page.
mkdirSync(join(root, 'demo/public/apps'), { recursive: true });
const home = await browser.newPage({ viewport: { width: 1400, height: 860 }, colorScheme: 'dark' });
await home.goto(`${base}/#/`);
await home.waitForTimeout(2000);
await home.screenshot({ path: join(root, 'demo/public/apps/kanto.png') });
await home.close();
console.log('shot apps/kanto.png');
```

Run: `npm run build:demo && node scripts/screenshot-templates.js`. Expected: the four template shots and `shot apps/kanto.png`; open it and check.

- [ ] **Step 8: Watch it pass, and look.** Run: `npx vitest run --project unit demo/shell.test.ts`. Expected: PASS. Build, serve, screenshot `#/apps` in both themes, read it.

- [ ] **Step 9: The changelog.** Under `### Added` in `[1.10.0]`, after the Templates line:

```md
- The docs site's Apps section is a showcase of products built with Kanto,
  with a form to add yours. The demo applications keep their pages under
  Demos until their templates replace them.
```

- [ ] **Step 10: Commit.**

```bash
npm run format && npm run verify
git add demo .github/ISSUE_TEMPLATE/showcase.yml scripts/screenshot-templates.js CHANGELOG.md
git commit -m "feat(docs): Apps shows products built with Kanto, with a way to add yours"
```

---

## Phase 2 is done when

- `npm run verify` passes (it builds the live demos and checks them); `npm run check:templates` prints three `ok`.
- `#/templates`, `#/templates/saas`, `#/apps` render as in their screenshots, read in both themes; Live demo opens the SaaS demo from both pages.
- `#/blocks`, `#/blocks#marketing`, `#/templates/dashboard` land on pages, not on the guide.
- Nothing is pushed or published.
