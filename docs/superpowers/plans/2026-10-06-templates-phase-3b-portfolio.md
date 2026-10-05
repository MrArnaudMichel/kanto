# Templates, phase 3b — Portfolio × 3 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Portfolio template — a person's site: work to filter, case studies, a career, writing and a contact form — in React, Vue and TypeScript, make it with `create-kanto`, run it on its template page, and retire the portfolio demo.

**Architecture:** As Landing: `templates/portfolio-<stack>/`, with what does not depend on the stack shared and tested once — the words and data (`content.ts`), the logic (`work.ts`: filter by tag, find a project, validate the message), the actions (`actions.ts`: scroll, send, download the CV), brand, icons and styles. Each stack renders one page. The catalog entry flips to `project: true`; `demo/apps/portfolio.ts` goes.

**Tech Stack:** as phase 3a; components `kt-header`, `kt-avatar`, `kt-badge`, `kt-button`, `kt-stat`, `kt-toggle-button-group`, `kt-card`, `kt-empty-state`, `kt-side-panel`, `kt-timeline`, `kt-post-grid`, `kt-label-input`, `kt-input`, `kt-textarea`, `kt-alert`, `kt-footer`; `lucide` for the icons beyond Kanto's defaults.

**Spec:** `docs/superpowers/specs/2026-10-05-templates-design.md`

## Global Constraints

- `templates/portfolio-{react,vue,vanilla}`: standalone Vite + TS, `kanto-ds@^1.9.0`, scripts `dev`/`build`/`preview`/`typecheck`, README, `.gitignore`, no lockfile, brand in `src/brand.ts`.
- Words and data in `src/content.ts`; the back end faked in `src/actions.ts` (the one file to point at a real one).
- One page, no router: sections by anchor (`#work`, `#career`, `#writing`, `#contact`).
- The person is Rowan Ellis; no project claims to be Kanto.
- The header's links are also in its `menu` slot (the lesson of phase 3a), and a chosen link closes the menu.
- Every string reaches the vanilla DOM through `textContent`, attributes or properties — never `innerHTML` with data.
- The demo goes when the template lands: `#/app/portfolio` and `#/apps/portfolio` lead to `#/templates/portfolio`; the docs no longer import `demo/apps/portfolio.ts`.
- Commits only after `npm run verify`; Arnaud Michel's name, no trailer; branch `feat/templates`.

## Review Focus

1. **Filtering to a tag no project has** — the grid gives way to an empty state with a way back to everything. (Task 1: `projectsTagged`; Task 2 walk filters to a tag.)
2. **Sending the form empty, or with a malformed email** — each field says what is wrong, nothing is sent. (Task 1: `validateMessage` tests; Task 2 walk.)
3. **Opening one case study, then another** — the panel shows the second, not a mix. (Task 2 walk opens two.)
4. **A phone** — the header's links in its menu; the work grid one column. (Task 2 walk, narrow step.)
5. **Old links** — `#/app/portfolio`, `#/apps/portfolio` land on the template's page; the docs' home and Release pages no longer link the demo. (Task 5.)

---

### Task 1: Portfolio's shared core

**Files:**

- Create in `templates/portfolio-vanilla/src/`, then copied identically to `templates/portfolio-react/src/` and `templates/portfolio-vue/src/`: `content.ts`, `work.ts`, `actions.ts`, `brand.ts`, `icons.ts`, `styles.css`
- Modify: `scripts/templates.test.ts`

**Interfaces — Produces:**

- `content.ts`: `PERSON { name; role; initials; available; heading; lead }`, `NAV: {label; href}[]`, `NUMBERS: {label; value; icon}[]`, `TAGS: readonly string[]` (first is `'All'`), `PROJECTS: Project[]`, `CAREER: CareerStep[]`, `POSTS: KtPost[]`, `CONTACT { heading; lead; sent }`, `FOOTER { tagline; legal }`; types `Project { slug; name; tagline; year; role; tags; summary; outcomes: {label; value; delta?}[]; phases: CareerStep[]; url }`, `CareerStep { heading; time; icon; variant: 'neutral' | 'primary' | 'success' | 'info'; body }`.
- `work.ts`: `projectsTagged(tag: string): Project[]`, `projectBySlug(slug: string): Project | undefined`, `validateMessage(values: Message): MessageErrors`, types `Message { name; email; message }`, `MessageErrors = Partial<Record<keyof Message, string>>`.
- `actions.ts`: `scrollToSection(id: string): void`, `sendMessage(values: Message): Promise<void>`, `downloadCv(): void`.
- `brand.ts`: `applyBrand()`; `icons.ts`: side effect.

- [ ] **Step 1: The failing tests.** In `scripts/templates.test.ts`, add to `SHARED`:

```ts
  portfolio: [
    'src/content.ts',
    'src/work.ts',
    'src/actions.ts',
    'src/brand.ts',
    'src/icons.ts',
    'src/styles.css',
  ],
```

and append:

```ts
describe('the portfolio', () => {
  it('filters the work by tag, everything for All, nothing for a tag no project has', async () => {
    const { projectsTagged } = await import('../templates/portfolio-vanilla/src/work');
    const { PROJECTS } = await import('../templates/portfolio-vanilla/src/content');
    expect(projectsTagged('All')).toEqual(PROJECTS);
    const open = projectsTagged('Open source');
    expect(open.length).toBeGreaterThan(0);
    expect(open.every((project) => project.tags.includes('Open source'))).toBe(true);
    expect(projectsTagged('Pottery')).toEqual([]);
  });

  it('finds a project by its slug', async () => {
    const { projectBySlug } = await import('../templates/portfolio-vanilla/src/work');
    expect(projectBySlug('atlas')!.name).toBe('Atlas');
    expect(projectBySlug('nowhere')).toBeUndefined();
  });

  it('says what is missing or wrong in a message, field by field', async () => {
    const { validateMessage } = await import('../templates/portfolio-vanilla/src/work');
    expect(validateMessage({ name: '', email: '', message: '' })).toEqual({
      name: 'Enter your name.',
      email: 'Enter an email address, like name@example.com.',
      message: 'Say a word about what you are building.',
    });
    expect(validateMessage({ name: 'Ada', email: 'ada@', message: 'A dashboard.' })).toEqual({
      email: 'Enter an email address, like name@example.com.',
    });
    expect(validateMessage({ name: ' Ada ', email: 'ada@northwind.com', message: 'Hi.' })).toEqual(
      {},
    );
  });

  it('names no project Kanto', async () => {
    const { PROJECTS } = await import('../templates/portfolio-vanilla/src/content');
    expect(PROJECTS.some((project) => /kanto/i.test(project.name))).toBe(false);
  });
});
```

Run: `npx vitest run --project unit scripts/templates.test.ts`. Expected: FAIL — `Failed to resolve import "../templates/portfolio-vanilla/src/work"`.

- [ ] **Step 2: The shared files.**

`src/content.ts`:

```ts
/**
 * Everything the site says, in one place: the person, the work, the career,
 * the writing. Rewrite this file and the site is yours.
 */
import type { KtPost } from 'kanto-ds';

export interface CareerStep {
  readonly heading: string;
  readonly time: string;
  readonly icon: string;
  readonly variant: 'neutral' | 'primary' | 'success' | 'info';
  readonly body: string;
}

export interface Project {
  readonly slug: string;
  readonly name: string;
  readonly tagline: string;
  readonly year: string;
  readonly role: string;
  readonly tags: readonly string[];
  readonly summary: string;
  readonly outcomes: readonly {
    readonly label: string;
    readonly value: string;
    readonly delta?: string;
  }[];
  readonly phases: readonly CareerStep[];
  readonly url: string;
}

export const PERSON = {
  name: 'Rowan Ellis',
  initials: 'RE',
  role: 'Design engineer',
  available: 'Available from October',
  heading: 'I build the interfaces other people build on.',
  lead: 'Ten years of product engineering, most of it spent on the unglamorous middle layer — design systems, data-dense tools, and the screens that make the rest possible.',
};

export const NAV = [
  { label: 'Work', href: '#work' },
  { label: 'Career', href: '#career' },
  { label: 'Writing', href: '#writing' },
  { label: 'Contact', href: '#contact' },
];

export const NUMBERS = [
  { label: 'Years shipping', value: '10', icon: 'clock' },
  { label: 'Products in production', value: '7', icon: 'layout-dashboard' },
  { label: 'Components published', value: '40', icon: 'component' },
  { label: 'Teams onboarded', value: '12', icon: 'users' },
];

export const TAGS = ['All', 'Design systems', 'Product', 'Front end', 'Open source'] as const;

export const PROJECTS: readonly Project[] = [
  {
    slug: 'northwind-ds',
    name: 'Northwind Design System',
    tagline: 'One vocabulary for four product teams',
    year: '2026',
    role: 'Design and engineering',
    tags: ['Design systems', 'Front end'],
    summary:
      'Forty components on one token layer. The useful part turned out to be the rule that every decision resolves to a token, which is what made a light theme cost no component CSS at all.',
    outcomes: [
      { label: 'Components', value: '40' },
      { label: 'Themes for free', value: '2' },
      { label: 'CSS shipped', value: '31 kB', delta: '-42%' },
    ],
    phases: [
      {
        heading: 'Audited the existing screens',
        time: 'Jan 2026',
        icon: 'search',
        variant: 'neutral',
        body: 'Eleven shades of grey across four products, and three separate buttons.',
      },
      {
        heading: 'Wrote the tokens first',
        time: 'Feb 2026',
        icon: 'palette',
        variant: 'primary',
        body: 'No component was allowed a literal colour.',
      },
      {
        heading: 'Ported the products',
        time: 'Apr 2026',
        icon: 'git-branch',
        variant: 'info',
        body: 'One product at a time, behind a flag, deleting the old CSS as each screen landed.',
      },
      {
        heading: 'Published 1.0',
        time: 'Jun 2026',
        icon: 'rocket',
        variant: 'success',
        body: 'Documentation, tests and a playground in the same release.',
      },
    ],
    url: 'https://example.com/northwind-ds',
  },
  {
    slug: 'atlas',
    name: 'Atlas',
    tagline: 'Fleet telemetry for people who are not engineers',
    year: '2025',
    role: 'Lead front end',
    tags: ['Product', 'Front end'],
    summary:
      'A control room rebuilt around one question — what needs me right now. The old dashboard showed everything and was read by nobody; the new one shows four things and is read every morning.',
    outcomes: [
      { label: 'Time to first action', value: '9s', delta: '-71%' },
      { label: 'Daily operators', value: '1,240', delta: '+38%' },
      { label: 'Support tickets', value: '62/mo', delta: '-54%' },
    ],
    phases: [
      {
        heading: 'Watched twelve morning shifts',
        time: 'Mar 2025',
        icon: 'eye',
        variant: 'neutral',
        body: 'Everyone opened the same three views and ignored the other nineteen.',
      },
      {
        heading: 'Cut the dashboard to four tiles',
        time: 'May 2025',
        icon: 'layout-dashboard',
        variant: 'primary',
        body: 'Everything else moved behind a search.',
      },
      {
        heading: 'Shipped to the whole fleet',
        time: 'Sep 2025',
        icon: 'rocket',
        variant: 'success',
        body: 'Region by region, the old view one click away for a month. Nobody went back.',
      },
    ],
    url: 'https://example.com/atlas',
  },
  {
    slug: 'ledger',
    name: 'Ledger',
    tagline: 'Reconciliation that explains itself',
    year: '2024',
    role: 'Product engineering',
    tags: ['Product'],
    summary:
      'Finance software fails when two numbers disagree and the screen will not say why. This one shows the arithmetic — every figure opens into the rows that made it.',
    outcomes: [
      { label: 'Month-end close', value: '3 days', delta: '-5 days' },
      { label: 'Manual adjustments', value: '11%', delta: '-29pt' },
      { label: 'Accounts covered', value: '4,800' },
    ],
    phases: [
      {
        heading: 'Sat with the close team',
        time: 'Feb 2024',
        icon: 'users',
        variant: 'neutral',
        body: 'Two weeks of watching spreadsheets argue with the ledger.',
      },
      {
        heading: 'Made every number open up',
        time: 'Jun 2024',
        icon: 'search',
        variant: 'primary',
        body: 'A figure is a link to the rows behind it, all the way down.',
      },
      {
        heading: 'Closed a month in three days',
        time: 'Nov 2024',
        icon: 'rocket',
        variant: 'success',
        body: 'Down from eight, with the auditors reading the same screens.',
      },
    ],
    url: 'https://example.com/ledger',
  },
  {
    slug: 'fieldnote',
    name: 'Fieldnote',
    tagline: 'Notes that stay out of the way',
    year: '2023',
    role: 'Maintainer',
    tags: ['Open source', 'Front end'],
    summary:
      'A plain-text notebook with one feature too many removed every release. Small, fast, and still used by the people who starred it in its first week.',
    outcomes: [
      { label: 'Stars', value: '3,900' },
      { label: 'Contributors', value: '64' },
      { label: 'Bundle', value: '18 kB' },
    ],
    phases: [
      {
        heading: 'Wrote it for myself',
        time: 'Jan 2023',
        icon: 'file',
        variant: 'neutral',
        body: 'A weekend, a text area, and a rule about never adding a toolbar.',
      },
      {
        heading: 'Opened it up',
        time: 'Apr 2023',
        icon: 'git-branch',
        variant: 'primary',
        body: 'A contributing guide written before the first pull request arrived.',
      },
      {
        heading: 'Handed over the keys',
        time: 'Dec 2023',
        icon: 'users',
        variant: 'success',
        body: 'Two maintainers who now ship more often than I did.',
      },
    ],
    url: 'https://example.com/fieldnote',
  },
];

export const CAREER: readonly CareerStep[] = [
  {
    heading: 'Principal engineer · Northwind',
    time: '2024 — now',
    icon: 'component',
    variant: 'primary',
    body: 'Design systems and the tooling around them. Four product teams, one vocabulary.',
  },
  {
    heading: 'Lead front end · Atlas',
    time: '2021 — 2024',
    icon: 'layout-dashboard',
    variant: 'neutral',
    body: 'Grew the interface team from two to nine and rebuilt the control room.',
  },
  {
    heading: 'Product engineer · Ledger',
    time: '2019 — 2021',
    icon: 'wallet',
    variant: 'neutral',
    body: 'Reconciliation, reporting, and how finance teams actually work.',
  },
  {
    heading: 'Front end · agency work',
    time: '2016 — 2019',
    icon: 'briefcase',
    variant: 'neutral',
    body: 'Thirty-odd sites in three years. Where I learned to finish things.',
  },
];

export const POSTS: KtPost[] = [
  {
    title: 'A light theme should cost nothing',
    href: '#writing',
    excerpt: 'If a component knows a colour, you have already bought a second stylesheet.',
    date: '2026-07-14',
  },
  {
    title: 'Stop shipping the empty state last',
    href: '#writing',
    excerpt: 'The blank screen is the first one a new user sees and the last one anybody designs.',
    date: '2026-04-02',
  },
  {
    title: 'Four tiles, and the argument about the other nineteen',
    href: '#writing',
    excerpt: 'What it took to delete most of a dashboard, and what came back.',
    date: '2025-12-09',
  },
];

export const CONTACT = {
  heading: 'Tell me what you are building',
  lead: 'Two sentences is plenty to start with. I answer within two days.',
  sent: 'Thanks — your message is on its way. I will answer within two days.',
};

export const FOOTER = {
  tagline: 'Design engineer. Interfaces other people build on.',
  legal: '© 2026 Rowan Ellis. Made with Kanto.',
};
```

`src/work.ts`:

```ts
/** What the page works out: the work under a tag, a project by its slug, a message's mistakes. */
import { PROJECTS, type Project } from './content';

export interface Message {
  readonly name: string;
  readonly email: string;
  readonly message: string;
}

export type MessageErrors = Partial<Record<keyof Message, string>>;

export function projectsTagged(tag: string): Project[] {
  return tag === 'All' ? [...PROJECTS] : PROJECTS.filter((project) => project.tags.includes(tag));
}

export function projectBySlug(slug: string): Project | undefined {
  return PROJECTS.find((project) => project.slug === slug);
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Each field's mistake, said as what to do; an empty object when it can be sent. */
export function validateMessage(values: Message): MessageErrors {
  const errors: MessageErrors = {};
  if (!values.name.trim()) errors.name = 'Enter your name.';
  if (!EMAIL.test(values.email.trim()))
    errors.email = 'Enter an email address, like name@example.com.';
  if (!values.message.trim()) errors.message = 'Say a word about what you are building.';
  return errors;
}
```

`src/actions.ts`:

```ts
/** What the page does: scroll to a section, send a message, hand out the CV. */
import { toaster } from 'kanto-ds';
import type { Message } from './work';

/** Scrolls to a section by its id, gently unless the reader asked for less motion. */
export function scrollToSection(id: string): void {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
}

/** Sending a message, faked. Call your form service or your own endpoint here. */
export async function sendMessage(values: Message): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 700));
  void values;
}

/** The CV: point this at your PDF. */
export function downloadCv(): void {
  toaster.info('Your CV goes here', {
    description: 'Point downloadCv() in src/actions.ts at your PDF.',
  });
}
```

`src/brand.ts`: as Landing's (`setAppearance({ theme: 'auto', accent: 'violet', font: 'kanto', radius: 'default', density: 'default' })`, with the same comment).

`src/icons.ts`:

```ts
/** The icons this site draws beyond Kanto's own. Any Lucide icon works: import it, add it here. */
import { registerIcons } from 'kanto-ds/icons';
import {
  Briefcase,
  Clock,
  Component,
  GitBranch,
  LayoutDashboard,
  Mail,
  Palette,
  Rocket,
  Users,
  Wallet,
} from 'lucide';

registerIcons({
  Briefcase,
  Clock,
  Component,
  GitBranch,
  LayoutDashboard,
  Mail,
  Palette,
  Rocket,
  Users,
  Wallet,
});
```

`src/styles.css`:

```css
/* The site's own layout. Kanto's styles.css sets its colours and type. */
.page {
  display: grid;
  gap: 96px;
  max-width: 1080px;
  margin: 0 auto;
  padding: 64px 24px 96px;
}

.brand {
  color: var(--text-body);
  font: 600 18px / 1 var(--font-family-display);
  text-decoration: none;
}
.nav {
  display: flex;
  gap: 24px;
}
.nav a,
.menu a {
  color: var(--text-muted);
  text-decoration: none;
}
.menu {
  display: grid;
  gap: 4px;
  padding: 8px 0;
}
.menu a {
  padding: 10px 4px;
  color: var(--text-body);
}

.intro {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 32px;
  align-items: start;
}
.intro h1 {
  margin: 12px 0;
  font: 600 clamp(34px, 5vw, 56px) / 1.05 var(--font-family-display);
  letter-spacing: -0.03em;
}
.intro p {
  max-width: 60ch;
  margin: 0 0 24px;
  color: var(--text-muted);
  font-size: 18px;
  line-height: 1.6;
}
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.numbers {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.section-head {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}
.section-head h2 {
  margin: 0;
  font: var(--font-title-h4);
}

.work-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.work-card h3 {
  margin: 0 0 6px;
  font: var(--font-title-h6);
}
.work-card p {
  margin: 0 0 12px;
  color: var(--text-muted);
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.outcomes {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 20px 0;
}
.outcome strong {
  display: block;
  font: 600 22px / 1.2 var(--font-family-display);
}
.outcome span {
  color: var(--text-muted);
  font: var(--font-normal-small);
}

.contact {
  display: grid;
  gap: 16px;
  max-width: 640px;
}

@media (max-width: 640px) {
  .intro {
    grid-template-columns: minmax(0, 1fr);
  }
  .page {
    gap: 64px;
  }
}

/* Anchored sections clear the sticky header. */
[id] {
  scroll-margin-top: 80px;
}
```

Copy the six files to `portfolio-react/src/` and `portfolio-vue/src/`.

- [ ] **Step 3: Watch them pass.** `npx vitest run --project unit scripts/templates.test.ts` → PASS.

- [ ] **Step 4: No commit yet** — `build:demo` builds every `*-vanilla` folder (phase 3a ruling): this task commits with Task 2's project.

---

### Task 2: `portfolio-vanilla`, and its walk

**Files:** `templates/portfolio-vanilla/{index.html,package.json,tsconfig.json,README.md,.gitignore}`, `src/main.ts`; `scripts/template-smoke.js`.

- [ ] **Step 1: The walk.** Add to `SMOKES`:

```js
  async portfolio(page, base) {
    const until = (check) => page.waitForFunction(check, undefined, { timeout: TIMEOUT });
    await page.goto(base);
    await until(() => document.querySelector('.intro h1') !== null);
    await until(() => document.querySelectorAll('kt-stat').length === 4);
    await until(() => document.querySelectorAll('kt-card.work-card').length === 4);
    await until(() => document.querySelectorAll('kt-timeline-item').length >= 4);
    await until(() => (document.querySelector('kt-post-grid')?.posts ?? []).length === 3);

    // Filtering: one tag, then back to everything.
    await page.locator('kt-toggle-button-group.work-filter kt-toggle-button[value="Open source"]').click();
    await until(() => document.querySelectorAll('kt-card.work-card').length === 1);
    await page.locator('kt-toggle-button-group.work-filter kt-toggle-button[value="All"]').click();
    await until(() => document.querySelectorAll('kt-card.work-card').length === 4);

    // A case study, then another: the panel follows.
    await page.locator('kt-card.work-card').nth(0).click();
    await until(() => document.querySelector('kt-side-panel')?.open === true);
    const first = await page.evaluate(() => document.querySelector('kt-side-panel')!.heading);
    await page.keyboard.press('Escape');
    await until(() => document.querySelector('kt-side-panel')?.open === false);
    await page.locator('kt-card.work-card').nth(1).click();
    await page.waitForFunction(
      (previous) =>
        document.querySelector('kt-side-panel')?.open === true &&
        document.querySelector('kt-side-panel')!.heading !== previous,
      first,
      { timeout: TIMEOUT },
    );
    await page.keyboard.press('Escape');

    // The form says what is missing, then sends.
    await page.locator('form.contact kt-button[type="submit"]').click();
    await until(() => (document.querySelector('kt-input[name="name"]')?.error ?? '') !== '');
    await page.locator('kt-input[name="name"] input').fill('Ada Park');
    await page.locator('kt-input[name="email"] input').fill('ada@northwind.com');
    await page.locator('kt-textarea[name="message"] textarea').fill('A dashboard for a fleet.');
    await page.locator('form.contact kt-button[type="submit"]').click();
    await until(() => document.querySelector('kt-alert.contact-sent') !== null);

    // On a phone the header's links are in its menu.
    await page.setViewportSize({ width: 390, height: 800 });
    await page.locator('kt-header .menu-button').click();
    await page.locator('kt-header [slot="menu"] a', { hasText: 'Contact' }).click();
    await until(() => location.hash === '#contact');
  },
```

Run `npm run build && npm run check:templates portfolio-vanilla` → FAIL (`reading package.json failed`).

- [ ] **Step 2: The project files.** As `templates/saas-vanilla`'s (`lucide` kept), name `kanto-portfolio-vanilla`, `<title>Rowan Ellis — design engineer</title>`. README as Landing's, titled "Rowan Ellis — a portfolio on Kanto, in TypeScript without a framework", describing the sections, with the table rows `Everything it says | src/content.ts`, `The brand | src/brand.ts`, `The form, the CV | src/actions.ts — call your form service here`, `The filter, the checks | src/work.ts`, `The page | src/main.ts`, and the components list from the Tech Stack line.

- [ ] **Step 3: The page.** `src/main.ts` builds the page with a small `el(tag, attributes, children)` helper — text through `textContent` only — in this order and with these hooks (the walk depends on them):
  - `kt-header sticky` with `a.brand` (the name), `nav.nav` (NAV), `nav.menu[slot=menu][aria-label=Menu]` (NAV, each link calling `header.closeMenu()`), and a `kt-button[slot=actions][icon=mail]` "Get in touch" scrolling to `contact`;
  - `main.page` holding, in order: `section.intro` (`kt-avatar` with the initials, size large; `kt-badge variant=category` with `PERSON.available`; `h1` heading; `p` lead; a `.row` with "See the work" (`icon=arrow-down`, scrolls to `work`) and "Download CV" (`variant=secondary`, `icon=download`, `downloadCv`));
  - `section.numbers` with a `kt-stat` per `NUMBERS` entry (label, value, icon);
  - `section#work`: `.section-head` with `h2` "Selected work" and `kt-toggle-button-group.work-filter` (one `kt-toggle-button` per `TAGS`, value = tag, `value` set to `'All'`); on `kt-change`, the grid is redrawn from `projectsTagged(event.detail.value ?? 'All')`; `div.work-grid` with a `kt-card.work-card[clickable]` per project (`h3` name, `p` tagline, `.tags` with a `kt-badge` per tag, `slot=footer` text "Read the case study"); none → `kt-empty-state` (heading "Nothing tagged that yet", a `kt-button` "Show everything" resetting the filter to `All`);
  - `kt-card` `kt-card-click` → open the case study: `kt-side-panel` (`eyebrow` = year · role, `heading` = name) whose body is rebuilt each time from the project: summary `p`, `.outcomes` (each `.outcome` with `strong` value and `span` label, plus a `kt-badge variant=count tone=success` for a delta), a `kt-timeline` of `kt-timeline-item`s from `phases` (heading, time, icon, variant attributes; body text), `.tags`; footer slot: "Visit the site" `kt-button` opening `project.url` in a new tab;
  - `section#career`: `h2` "Where I have been", `kt-timeline` from `CAREER`;
  - `section#writing`: `kt-post-grid` (`heading` "Writing", `layout=list`, `align=start`, `heading-level=2`, `posts` = `POSTS`);
  - `section#contact`: `h2` + `p` from `CONTACT`, `form.contact[novalidate]` with `kt-label-input` + `kt-input[name=name]`, `kt-input[name=email][type=email]`, `kt-textarea[name=message]`, and `kt-button[type=submit][icon=send][icon-position=right]` "Send"; on `submit`: prevent default, read the three values, `validateMessage` → set each control's `error` (empty string clears it); no errors → `button.run(() => sendMessage(values))`, then replace the form with `kt-alert.contact-sent[variant=success]` with `CONTACT.sent` as its description;
  - `kt-footer variant=simple` with `a.brand[slot=brand]`, the tagline, `slot=legal` the legal line.

  Import order: `kanto-ds`, `kanto-ds/styles.css`, `./styles.css`, `./icons`, then `applyBrand()`.

- [ ] **Step 4: Watch it pass, and look.** `npm run check:templates portfolio-vanilla` → `ok`. `npm run build:demo`, preview, screenshot `templates/portfolio/` at 1400px (full page) and 390px; read them.

- [ ] **Step 5: Commit, with Task 1.** `npm run format && npm run verify`; `git add templates/portfolio-* scripts/templates.test.ts scripts/template-smoke.js && git commit -m "feat(templates): add the portfolio without a framework, on a shared core"`.

---

### Task 3: `portfolio-react`

**Files:** `templates/portfolio-react/{index.html,package.json,tsconfig.json,vite.config.ts,README.md,.gitignore}`, `src/main.tsx`, `src/App.tsx`, `src/CaseStudy.tsx`, `src/ContactForm.tsx`.

- [ ] **Step 1: See it fail.** `npm run check:templates portfolio-react` → `reading package.json failed`.
- [ ] **Step 2: Project files** — `saas-react`'s without `react-router`, name `kanto-portfolio-react`; README as Task 2's for React (`src/App.tsx` for the page; the React 19 line).
- [ ] **Step 3: The page.** `main.tsx` as Landing's React one plus `import './icons';`. `App.tsx` renders the same structure, classes and hooks as Task 2 Step 3: `useState` for the tag (`'All'`) and the open slug (`string | null`); the grid from `projectsTagged(tag)`; a header `ref` (`useRef<KtHeader>`) for `closeMenu()` from the menu links. `CaseStudy.tsx`: `({ slug, onClose })` → `kt-side-panel open={slug !== null}` with `onkt-close={onClose}`, its body from `projectBySlug(slug)`. `ContactForm.tsx`: `useState<MessageErrors>` and `sent`; controls read through refs on submit; `kt-input error={errors.name ?? ''}`; a `useRef<KtButton>` for `run(() => sendMessage(values))`; `sent` → `kt-alert className="contact-sent" variant="success" description={CONTACT.sent}`.
- [ ] **Step 4: Watch it pass.** `npm run check:templates portfolio-react` → `ok`. A type error on a `kt-*` prop is a library gap: fix it in `src/react/jsx.ts` with a test, own commit, first.
- [ ] **Step 5: Commit.** `npm run format && npm run verify`; `git add templates/portfolio-react && git commit -m "feat(templates): add the portfolio in React"`.

---

### Task 4: `portfolio-vue`

**Files:** `templates/portfolio-vue/{index.html,package.json,tsconfig.json,vite.config.ts,README.md,.gitignore}`, `src/main.ts`, `src/env.d.ts`, `src/App.vue`, `src/CaseStudy.vue`, `src/ContactForm.vue`.

- [ ] **Step 1: See it fail.** `npm run check:templates portfolio-vue` → `reading package.json failed`.
- [ ] **Step 2: Project files** — `saas-vue`'s without `vue-router`, name `kanto-portfolio-vue`; README for Vue (`src/App.vue`; the compiler line).
- [ ] **Step 3: The page.** `main.ts` as Landing's Vue one plus `import './icons';`. `App.vue`, `CaseStudy.vue`, `ContactForm.vue`: the same structure, classes and hooks as Task 2 Step 3, with `ref`s for the tag and the open slug, `useTemplateRef<KtHeader>('header')` for `closeMenu()`, `useTemplateRef<KtButton>` for `run()`.
- [ ] **Step 4: Watch it pass.** `npm run check:templates portfolio-vue` → `ok`; `npm run check:templates` → nine `ok`.
- [ ] **Step 5: Commit.** `npm run format && npm run verify`; `git add templates/portfolio-vue && git commit -m "feat(templates): add the portfolio in Vue"`.

---

### Task 5: Portfolio in the tool and on the site; the demo goes

**Files:** `packages/create-kanto/{lib/choices.js,README.md,package.json}`, `demo/lib/templates.ts`, `demo/lib/templates.test.ts`, `demo/main.ts`, `demo/apps.test.ts`, `demo/shell.test.ts`, `CHANGELOG.md`; delete `demo/apps/portfolio.ts`, `demo/public/templates/portfolio-home.png`; shoot `demo/public/templates/portfolio-{top,work}.png`.

- [ ] **Step 1: The failing tests.**
  - `demo/lib/templates.test.ts`: `expect(TEMPLATE_CATALOG.find((entry) => entry.id === 'portfolio')!.demo).toBe('./templates/portfolio/');`
  - `demo/shell.test.ts`, "sends the old demo pages to their templates": add `['#/app/portfolio', 'Portfolio']`.
  - `demo/apps.test.ts`: drop the `#/app/portfolio` route entry; in "previews the running application", keep `console-home` and `chat`.
  - `scripts/llms.test.ts`: if it lists `demo/apps/portfolio.ts`, drop it.

  Run `npx vitest run --project unit demo scripts` → FAIL on the catalog and the redirect.

- [ ] **Step 2: The tool.** `choices.js`: `{ id: 'portfolio', label: 'Portfolio', hint: "a person's work, career, writing and a contact form" }` after `landing`; README and `package.json` description name it.
- [ ] **Step 3: The catalog.** The `portfolio` entry: `project: true`, `demo: './templates/portfolio/'`, `description` (Rowan Ellis's site; what the sections are; the words in `src/content.ts`), `tryIt` (filter the work, including to a tag with nothing in it; open a case study, then another; send the form empty first), `routes: [{ path: '#work, #career, #writing, #contact', what: 'The sections, reached from the header.' }]`, `files` (`src/content.ts`, `src/brand.ts`, `src/actions.ts`, `src/work.ts`), `components` (the Tech Stack list), `screens: [{ file: 'portfolio-top.png', path: 'templates/portfolio/', caption: 'The top of the site' }, { file: 'portfolio-work.png', path: 'templates/portfolio/#work', caption: 'Selected work' }]`.
- [ ] **Step 4: The demo goes.** `git rm demo/apps/portfolio.ts demo/public/templates/portfolio-home.png`; `demo/main.ts`: remove `portfolio` from `APPS`; `RETIRED_DEMOS` gains `portfolio: 'portfolio'`. Search the docs for `#/app/portfolio` and point each remaining link at `#/templates/portfolio`.
- [ ] **Step 5: Shoot and run.** `npm run build:demo && node scripts/screenshot-templates.js`; read the two shots. `npx vitest run --project unit demo packages scripts` → PASS.
- [ ] **Step 6: The changelog.** The `create-kanto` entry names Portfolio beside SaaS and Landing.
- [ ] **Step 7: Commit.** `npm run format && npm run verify && npm run check:templates`; `git add -A packages demo scripts CHANGELOG.md && git commit -m "feat(templates): Portfolio in create-kanto and on the site; its demo goes"`.

## Phase 3b is done when

- `npm run check:templates` prints nine `ok` lines; `npm run verify` passes.
- `#/templates/portfolio` runs the template in its frame with a command per stack; `#/app/portfolio`, `#/apps/portfolio` lead there.
