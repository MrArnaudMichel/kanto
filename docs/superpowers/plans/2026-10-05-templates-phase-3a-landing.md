# Templates, phase 3a — Landing × 3 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Landing template — Northwind's marketing page, every section a Kanto block — in React, Vue and TypeScript, make it with `create-kanto`, run it on its template page, and retire the old landing demo.

**Architecture:** As SaaS: one folder per stack in `templates/landing-<stack>/`; the words and data in a shared `src/content.ts`, the two actions (scroll to a section, subscribe) in a shared `src/actions.ts`, brand and styles shared — identical across the three stacks and tested once. Each stack only renders the page. The catalog entry flips to `project: true`, its demo becomes the template's live build, and `#/app/landing` (the old demo) goes.

**Tech Stack:** as phase 1 — Vite 7, TypeScript, React 19, Vue 3.5, `kanto-ds` 1.9 blocks (`kt-hero`, `kt-logo-cloud`, `kt-feature-grid`, `kt-testimonials`, `kt-pricing-table`, `kt-faq`, `kt-cta`, `kt-newsletter`, `kt-footer`) and `kt-header`.

**Spec:** `docs/superpowers/specs/2026-10-05-templates-design.md`

## Global Constraints

- `templates/landing-react`, `templates/landing-vue`, `templates/landing-vanilla`: standalone Vite + TS projects, `kanto-ds@^1.9.0`, scripts `dev`/`build`/`preview`/`typecheck`, README, `.gitignore`, no lockfile, brand in `src/brand.ts`.
- The words and data in one `src/content.ts`, so a fork rewrites one file; no dependency beyond Kanto (and React or Vue).
- The product is Northwind, the invoicing app of the SaaS template; copy in sentence case, no exclamation marks.
- One page, no router: sections reached by anchors (`#features`, `#pricing`, `#questions`, `#start`).
- The demo leaves the docs once the template lands: `#/app/landing` and `demo/apps/landing.ts` go; `#/apps/landing` and `#/app/landing` lead to `#/templates/landing`.
- Commits only after `npm run verify`; Arnaud Michel's name, no trailer; branch `feat/templates`.

## Review Focus

1. **The newsletter answering late after the reader left the field** — the thanks still shows, the field never shows a stale error. (`kt-newsletter` owns this; the smoke checks the happy path.)
2. **A narrow screen** — every block stacks, the header's links move into its menu. (Task 2: check at 390px in the browser step.)
3. **Plans' "Start" buttons** — they lead to `#start`, the closing call to action, not to a 404. (Task 1: content test.)
4. **The three stacks drifting** — the shared-files test covers Landing as it covers SaaS. (Task 1.)
5. **Old links to the landing demo** — `#/app/landing`, `#/apps/landing` land on the template's page. (Task 5.)

---

### Task 1: Landing's shared core

**Files:**

- Create: `templates/landing-vanilla/src/{content.ts,actions.ts,brand.ts,styles.css}` and identical copies in `templates/landing-react/src/`, `templates/landing-vue/src/`
- Modify: `scripts/templates.test.ts`

**Interfaces — Produces** (`src/`):

- `content.ts`: `PRODUCT`, `NAV: {label; href}[]`, `HERO`, `LOGOS`, `FEATURES`, `TESTIMONIALS`, `PRICING`, `QUESTIONS`, `CTA`, `NEWSLETTER`, `FOOTER`, `logoSrc(name: string): string` — shapes below.
- `actions.ts`: `scrollToSection(id: string): void`, `subscribe(email: string): Promise<void>`.
- `brand.ts`: `applyBrand(): void`.

- [ ] **Step 1: The failing tests.** In `scripts/templates.test.ts`, replace the single `SHARED` list and its test with a list per template:

```ts
/** Files every stack of a template carries unchanged. */
const SHARED: Record<string, readonly string[]> = {
  saas: [
    'src/data/fixtures.ts',
    'src/data/api.ts',
    'src/auth.ts',
    'src/guard.ts',
    'src/content.ts',
    'src/format.ts',
    'src/view.ts',
    'src/brand.ts',
    'src/icons.ts',
    'src/styles.css',
    'src/latest.ts',
  ],
  landing: ['src/content.ts', 'src/actions.ts', 'src/brand.ts', 'src/styles.css'],
};
```

and, replacing `it.each(SHARED)('shares %s, unchanged, across the SaaS stacks', …)`:

```ts
for (const [template, files] of Object.entries(SHARED)) {
  it.each(files)(`shares %s, unchanged, across the ${template} stacks`, (file) => {
    const copies = ['react', 'vue', 'vanilla'].map((stack) =>
      readFileSync(join(root, 'templates', `${template}-${stack}`, file), 'utf8'),
    );
    expect(copies[1], `${template}-vue/${file}`).toBe(copies[0]);
    expect(copies[2], `${template}-vanilla/${file}`).toBe(copies[0]);
  });
}
```

and a describe for Landing's content and actions:

```ts
describe('the landing content', () => {
  it('leads every plan, and every call to start, to the closing call to action', async () => {
    const { PRICING, HERO } = await import('../templates/landing-vanilla/src/content');
    expect(PRICING.plans.length).toBe(3);
    for (const plan of PRICING.plans) expect(plan.href, plan.id).toBe('#start');
    expect(HERO.primaryHref).toBe('#start');
  });

  it('draws each logo as an image named after its company', async () => {
    const { logoSrc } = await import('../templates/landing-vanilla/src/content');
    const src = logoSrc('Sato Ceramics');
    expect(src.startsWith('data:image/svg+xml,')).toBe(true);
    expect(decodeURIComponent(src)).toContain('Sato Ceramics');
  });

  it('subscribes a new address, and says so for one already on the list', async () => {
    vi.useFakeTimers();
    const { subscribe } = await import('../templates/landing-vanilla/src/actions');
    const ok = subscribe('ada@northwind.com');
    const taken = subscribe('already@example.com');
    const caught = taken.catch((error: Error) => error.message);
    await vi.runAllTimersAsync();
    await expect(ok).resolves.toBeUndefined();
    await expect(caught).resolves.toMatch(/on the list/);
    vi.useRealTimers();
  });
});
```

Run: `npx vitest run --project unit scripts/templates.test.ts`. Expected: FAIL — `Failed to resolve import "../templates/landing-vanilla/src/content"`.

- [ ] **Step 2: The shared files** in `templates/landing-vanilla/src/`.

`src/content.ts`:

```ts
/**
 * Every word and every number on the page, in one place: rewrite this file and
 * the page is yours. The sections read it in order, top to bottom.
 */
import type { KtFaqItem, KtFeature, KtFooterColumn, KtPlan, KtTestimonial } from 'kanto-ds';

export const PRODUCT = 'Northwind';

export const NAV = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Questions', href: '#questions' },
];

export const HERO = {
  announcement: 'New: recurring invoices',
  heading: 'Invoices that pay themselves',
  lead: 'Send, chase and reconcile in one place — and get paid on the day you said.',
  primary: 'Start free',
  primaryHref: '#start',
  secondary: 'See pricing',
  secondaryHref: '#pricing',
  note: 'Free for three months. No card needed.',
};

export const LOGOS = {
  heading: 'Trusted by finance teams at',
  names: ['Kiln', 'Halcyon', 'Fieldnote', 'Orbital', 'Sato Ceramics', 'Juniper'],
};

export const FEATURES: { heading: string; lead: string; items: KtFeature[] } = {
  heading: 'Why teams switch',
  lead: 'Less chasing, more paid — and the books close themselves.',
  items: [
    {
      icon: 'send',
      title: 'Sent in a second',
      description: 'From the quote to the inbox in one click, with the PDF attached.',
    },
    {
      icon: 'refresh-cw',
      title: 'Chased for you',
      description: 'Polite reminders go out on the schedule you set, and stop when it is paid.',
    },
    {
      icon: 'circle-check',
      title: 'Reconciled',
      description: 'Payments are matched to their invoices as they land in the bank.',
    },
    {
      icon: 'file',
      title: 'Every format',
      description: 'PDF, UBL and the e-invoicing formats your customers ask for.',
    },
    {
      icon: 'user',
      title: 'Your accountant, invited',
      description: 'A guest seat that sees the books and the exports, and sends nothing.',
    },
    {
      icon: 'settings',
      title: 'Your rules',
      description: 'Terms, late fees, numbering and taxes, set once for every invoice.',
    },
  ],
};

export const TESTIMONIALS: { heading: string; lead: string; items: KtTestimonial[] } = {
  heading: 'What teams say',
  lead: 'From one-person studios to finance teams.',
  items: [
    {
      quote: 'We closed September in a day. It used to take the whole first week of October.',
      name: 'Ada Park',
      role: 'CFO, Kiln',
    },
    {
      quote: 'Reminders I never have to write, and clients who pay on time.',
      name: 'Sam Ortiz',
      role: 'Founder, Ortiz Studio',
    },
    {
      quote: 'The bank feed matches itself. I check it on Fridays out of habit.',
      name: 'Lena Brandt',
      role: 'Bookkeeper, Halcyon',
    },
  ],
};

export const PRICING: { heading: string; lead: string; yearlyNote: string; plans: KtPlan[] } = {
  heading: 'Pricing',
  lead: 'Start free. Pay when it pays for itself.',
  yearlyNote: 'Two months free',
  plans: [
    {
      id: 'starter',
      name: 'Starter',
      description: 'For one person getting paid.',
      price: { monthly: 0, yearly: 0 },
      features: ['10 invoices a month', 'Email reminders', 'Card payments'],
      href: '#start',
    },
    {
      id: 'team',
      name: 'Team',
      description: 'For a team that bills every week.',
      price: { monthly: 29, yearly: 290 },
      features: [
        'Unlimited invoices',
        'Reminders on your schedule',
        'Bank reconciliation',
        'Five seats',
      ],
      featured: true,
      action: 'Start a trial',
      href: '#start',
    },
    {
      id: 'scale',
      name: 'Scale',
      description: 'For finance teams with rules.',
      price: 'Custom',
      features: ['Everything in Team', 'Approvals', 'SSO and audit log'],
      action: 'Talk to sales',
      href: '#start',
    },
  ],
};

export const QUESTIONS: {
  heading: string;
  lead: string;
  items: KtFaqItem[];
  note: string;
  contact: string;
} = {
  heading: 'Questions',
  lead: 'What teams ask before they switch.',
  items: [
    {
      question: 'Can I cancel any time?',
      answer:
        'Yes, from Settings, in two clicks. You keep every invoice you sent, and can export them all.',
    },
    {
      question: 'Do you take card payments?',
      answer:
        'Cards, bank transfers and direct debits, in 34 currencies. The money lands in two days.',
    },
    {
      question: 'Can my accountant get in?',
      answer:
        'Invite them as a guest: they see the books and the exports, and cannot send anything.',
    },
    {
      question: 'Is there a contract?',
      answer:
        'No. Monthly plans run month to month; yearly plans are paid up front and refunded pro rata.',
    },
  ],
  note: 'Something else?',
  contact: 'mailto:hello@northwind.example',
};

export const CTA = {
  heading: 'Start sending invoices',
  lead: 'Your first invoice goes out in two minutes — the rest chase themselves.',
  primary: 'Start free',
  secondary: 'Talk to sales',
  secondaryHref: 'mailto:sales@northwind.example',
  note: 'Free for three months. No card needed.',
};

export const NEWSLETTER = {
  heading: 'Notes, monthly',
  lead: 'What we shipped, and what we learned.',
  note: 'One email a month. Unsubscribe in one click.',
};

export const FOOTER: { tagline: string; columns: KtFooterColumn[]; legal: string } = {
  tagline: 'Invoices that pay themselves.',
  columns: [
    {
      heading: 'Product',
      links: [
        { label: 'Features', href: '#features' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'Questions', href: '#questions' },
      ],
    },
    {
      heading: 'Company',
      links: [
        { label: 'About', href: '#start' },
        { label: 'Contact', href: 'mailto:hello@northwind.example' },
      ],
    },
  ],
  legal: '© 2026 Northwind. Made with Kanto.',
};

/** A company's wordmark, drawn: replace with your customers' real logos. */
export function logoSrc(name: string): string {
  const width = name.length * 11 + 40;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 28" width="${width}" height="28"><circle cx="12" cy="14" r="10" fill="#888"/><text x="30" y="20" font-family="system-ui, sans-serif" font-size="17" font-weight="700" fill="#888">${name}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
```

`src/actions.ts`:

```ts
/** What the page does: scroll to a section, and sign up for the newsletter. */

/** Scrolls to a section by its id, gently unless the reader asked for less motion. */
export function scrollToSection(id: string): void {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
}

/**
 * Signing up for the newsletter, faked: any address gets in, except one on the
 * list already. Call your email provider here.
 */
export async function subscribe(email: string): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 600));
  if (email.endsWith('@example.com')) throw new Error('That address is on the list already.');
}
```

`src/brand.ts`:

```ts
/**
 * The brand, in one place. Every option:
 * https://kanto.arnaudmichel.fr/#/guide/appearance
 */
import { setAppearance } from 'kanto-ds';

export function applyBrand(): void {
  setAppearance({
    theme: 'auto',
    accent: 'violet',
    font: 'kanto',
    radius: 'default',
    density: 'default',
  });
}
```

`src/styles.css`:

```css
/* The page's own layout. Kanto's styles.css sets its colours and type. */
.page {
  display: grid;
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 24px 48px;
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
.nav a {
  color: var(--text-muted);
  text-decoration: none;
}
.nav a:hover {
  color: var(--text-body);
}

/* Anchored sections clear the sticky header. */
[id] {
  scroll-margin-top: 80px;
}
```

Copy them to the other stacks:

```bash
for stack in react vue; do
  mkdir -p templates/landing-$stack/src
  for f in content.ts actions.ts brand.ts styles.css; do
    cp templates/landing-vanilla/src/$f templates/landing-$stack/src/$f
  done
done
```

- [ ] **Step 3: Watch them pass.** Run: `npx vitest run --project unit scripts/templates.test.ts`. Expected: PASS (landing folders are not projects yet, so the project loop skips them).

- [ ] **Step 4: Commit.** `npm run format && npm run verify`, then `git add templates/landing-* scripts/templates.test.ts && git commit -m "feat(templates): the landing page's shared core: content and actions"`.

---

### Task 2: `landing-vanilla`, and its walk

**Files:**

- Create: `templates/landing-vanilla/{index.html,package.json,tsconfig.json,README.md,.gitignore}`, `templates/landing-vanilla/src/main.ts`
- Modify: `scripts/template-smoke.js`

**Interfaces:** Consumes Task 1. Produces a project that passes `npm run check:templates landing-vanilla`.

- [ ] **Step 1: The walk.** Add to `SMOKES` in `scripts/template-smoke.js`:

```js
  async landing(page, base) {
    const until = (check) => page.waitForFunction(check, undefined, { timeout: TIMEOUT });
    await page.goto(base);
    await until(() => (document.querySelector('kt-hero')?.heading ?? '').length > 0);
    await until(() => document.querySelectorAll('kt-logo-cloud img').length >= 5);
    await until(() => (document.querySelector('kt-feature-grid')?.features ?? []).length === 6);
    await until(() => (document.querySelector('kt-pricing-table')?.plans ?? []).length === 3);
    await until(() => (document.querySelector('kt-faq')?.items ?? []).length >= 4);
    await until(() => (document.querySelector('kt-footer')?.columns ?? []).length >= 2);

    // The billing switch swaps the prices.
    await page.locator('kt-pricing-table kt-segmented-control [role="radio"]').nth(1).click();
    await until(() => document.querySelector('kt-pricing-table')?.billing === 'yearly');

    // The newsletter takes an address and thanks the reader.
    await page.locator('kt-newsletter kt-input input').fill('ada@northwind.com');
    await page.locator('kt-newsletter kt-button').click();
    await until(() => document.querySelector('kt-newsletter')?.subscribed === true);
  },
```

Run: `npm run build && npm run check:templates landing-vanilla`. Expected: FAIL — `landing-vanilla: reading package.json failed`.

- [ ] **Step 2: The project files.** `package.json` as `templates/saas-vanilla/package.json` with `"name": "kanto-landing-vanilla"` and no `lucide` dependency (the icons it uses are Kanto's defaults or registered below); `tsconfig.json`, `.gitignore`: copies of `templates/saas-vanilla`'s; `index.html` as SaaS's with `<title>Northwind — invoices that pay themselves</title>`.

`README.md`:

````md
# Northwind — a landing page on Kanto, in TypeScript without a framework

A product's marketing page: a hero, the companies that use it, features,
what people say, pricing, questions, a newsletter and the way in — every
section one of [Kanto](https://kanto.arnaudmichel.fr)'s blocks.

```bash
npm install
npm run dev
```

## Where things are

| To change            | Edit                                             |
| -------------------- | ------------------------------------------------ |
| Every word and price | `src/content.ts`                                 |
| The brand            | `src/brand.ts` — one `setAppearance` call        |
| The newsletter       | `src/actions.ts` — call your email provider here |
| The page             | `src/main.ts`                                    |

## Components used

`kt-header`, `kt-hero`, `kt-logo-cloud`, `kt-feature-grid`,
`kt-testimonials`, `kt-pricing-table`, `kt-faq`, `kt-cta`, `kt-newsletter`,
`kt-footer`, `kt-button`. Each is documented at
https://kanto.arnaudmichel.fr/#/components.
````

Icons: `send`, `refresh-cw`, `circle-check`, `file`, `user`, `settings` are all Kanto defaults — no `icons.ts`, no `lucide`.

- [ ] **Step 3: The page.** `src/main.ts`:

```ts
import 'kanto-ds';
import 'kanto-ds/styles.css';
import './styles.css';
import type {
  KtFaq,
  KtFeatureGrid,
  KtFooter,
  KtHero,
  KtNewsletter,
  KtPricingTable,
  KtSubscribeDetail,
  KtTestimonials,
} from 'kanto-ds';
import { scrollToSection, subscribe } from './actions';
import { applyBrand } from './brand';
import {
  CTA,
  FEATURES,
  FOOTER,
  HERO,
  LOGOS,
  NAV,
  NEWSLETTER,
  PRICING,
  PRODUCT,
  QUESTIONS,
  TESTIMONIALS,
  logoSrc,
} from './content';

applyBrand();

const app = document.querySelector<HTMLElement>('#app')!;
app.innerHTML = `
  <kt-header sticky>
    <a slot="brand" class="brand" href="#top"></a>
    <nav class="nav"></nav>
    <kt-button slot="actions" class="start"></kt-button>
  </kt-header>
  <main class="page" id="top">
    <kt-hero>
      <a slot="announcement" class="announcement" href="#features"></a>
      <kt-button slot="actions" size="large" class="hero-primary"></kt-button>
      <kt-button slot="actions" size="large" variant="secondary" class="hero-secondary"></kt-button>
      <span slot="note" class="hero-note"></span>
    </kt-hero>
    <kt-logo-cloud></kt-logo-cloud>
    <kt-feature-grid id="features"></kt-feature-grid>
    <kt-testimonials></kt-testimonials>
    <kt-pricing-table id="pricing"></kt-pricing-table>
    <kt-faq id="questions" layout="split">
      <span slot="note"><span class="faq-note"></span> <a class="faq-contact">Ask us</a>.</span>
    </kt-faq>
    <kt-cta id="start">
      <kt-button slot="actions" size="large" class="cta-primary"></kt-button>
      <kt-button slot="actions" size="large" variant="secondary" class="cta-secondary"></kt-button>
      <span slot="note" class="cta-note"></span>
    </kt-cta>
    <kt-newsletter variant="plain" layout="inline" align="start">
      <span slot="note" class="newsletter-note"></span>
    </kt-newsletter>
  </main>
  <kt-footer>
    <a slot="brand" class="brand" href="#top"></a>
    <span class="footer-tagline"></span>
    <span slot="legal" class="footer-legal"></span>
  </kt-footer>`;

const $ = <T extends Element>(selector: string) => app.querySelector<T>(selector)!;
const text = (selector: string, value: string) => {
  for (const node of app.querySelectorAll(selector)) node.textContent = value;
};

// Header
text('.brand', PRODUCT);
$('.nav').replaceChildren(
  ...NAV.map((link) =>
    Object.assign(document.createElement('a'), { href: link.href, textContent: link.label }),
  ),
);
text('.start', HERO.primary);
$('.start').addEventListener('click', () => scrollToSection('start'));

// Hero
Object.assign($<KtHero>('kt-hero'), { heading: HERO.heading, lead: HERO.lead });
text('.announcement', HERO.announcement);
text('.hero-primary', HERO.primary);
text('.hero-secondary', HERO.secondary);
text('.hero-note', HERO.note);
$('.hero-primary').addEventListener('click', () => scrollToSection(HERO.primaryHref.slice(1)));
$('.hero-secondary').addEventListener('click', () => scrollToSection(HERO.secondaryHref.slice(1)));

// Logos
const logos = $('kt-logo-cloud');
logos.setAttribute('heading', LOGOS.heading);
logos.replaceChildren(
  ...LOGOS.names.map((name) =>
    Object.assign(document.createElement('img'), { src: logoSrc(name), alt: name }),
  ),
);

// Features, testimonials, pricing, questions
Object.assign($<KtFeatureGrid>('kt-feature-grid'), {
  heading: FEATURES.heading,
  lead: FEATURES.lead,
  features: FEATURES.items,
});
Object.assign($<KtTestimonials>('kt-testimonials'), {
  heading: TESTIMONIALS.heading,
  lead: TESTIMONIALS.lead,
  testimonials: TESTIMONIALS.items,
});
Object.assign($<KtPricingTable>('kt-pricing-table'), {
  heading: PRICING.heading,
  lead: PRICING.lead,
  yearlyNote: PRICING.yearlyNote,
  plans: PRICING.plans,
});
Object.assign($<KtFaq>('kt-faq'), {
  heading: QUESTIONS.heading,
  lead: QUESTIONS.lead,
  items: QUESTIONS.items,
});
text('.faq-note', QUESTIONS.note);
$<HTMLAnchorElement>('.faq-contact').href = QUESTIONS.contact;

// The closing call to action
const cta = $('kt-cta');
cta.setAttribute('heading', CTA.heading);
cta.setAttribute('lead', CTA.lead);
text('.cta-primary', CTA.primary);
text('.cta-secondary', CTA.secondary);
text('.cta-note', CTA.note);
$('.cta-secondary').addEventListener('click', () => location.assign(CTA.secondaryHref));

// Newsletter
const newsletter = $<KtNewsletter>('kt-newsletter');
Object.assign(newsletter, { heading: NEWSLETTER.heading, lead: NEWSLETTER.lead });
text('.newsletter-note', NEWSLETTER.note);
newsletter.addEventListener('kt-subscribe', (event) => {
  const { email, wait } = (event as CustomEvent<KtSubscribeDetail>).detail;
  wait(subscribe(email));
});

// Footer
Object.assign($<KtFooter>('kt-footer'), { columns: FOOTER.columns });
text('.footer-tagline', FOOTER.tagline);
text('.footer-legal', FOOTER.legal);
```

Every string goes in through `textContent`, properties or `setAttribute`, never into `innerHTML`.

- [ ] **Step 4: Watch it pass, and look.** Run: `npm run check:templates landing-vanilla`. Expected: `ok   landing-vanilla`. Then `npm run build:demo` (it builds `dist-demo/templates/landing/` from this stack), preview `dist-demo` (`npx vite preview --config demo/vite.config.ts --port 5198 --strictPort &`), screenshot `http://localhost:5198/templates/landing/` at 1400px and 390px, and read both: every block laid out, the header's links in its menu on the phone. `fuser -k 5198/tcp`.

- [ ] **Step 5: Commit.** `npm run format && npm run verify`; `git add templates/landing-vanilla scripts/template-smoke.js && git commit -m "feat(templates): add the landing page without a framework"`.

---

### Task 3: `landing-react`

**Files:** `templates/landing-react/{index.html,package.json,tsconfig.json,vite.config.ts,README.md,.gitignore}`, `src/main.tsx`, `src/App.tsx`.

- [ ] **Step 1: See it fail.** `npm run check:templates landing-react` → `reading package.json failed`.

- [ ] **Step 2: The project files** — copies of `templates/saas-react`'s with name `kanto-landing-react`, no `react-router`, no `lucide`; README as Task 2's titled "in React", the last table row `The page | src/App.tsx`, and the line about React 19 rendering the elements natively.

- [ ] **Step 3: The page.** `src/main.tsx`:

```tsx
import 'kanto-ds';
import 'kanto-ds/styles.css';
import type {} from 'kanto-ds/react/jsx';
import './styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { applyBrand } from './brand';

applyBrand();
createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

`src/App.tsx`:

```tsx
import { scrollToSection, subscribe } from './actions';
import {
  CTA,
  FEATURES,
  FOOTER,
  HERO,
  LOGOS,
  NAV,
  NEWSLETTER,
  PRICING,
  PRODUCT,
  QUESTIONS,
  TESTIMONIALS,
  logoSrc,
} from './content';

export function App() {
  return (
    <>
      <kt-header sticky>
        <a slot="brand" className="brand" href="#top">
          {PRODUCT}
        </a>
        <nav className="nav">
          {NAV.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <kt-button slot="actions" onClick={() => scrollToSection('start')}>
          {HERO.primary}
        </kt-button>
      </kt-header>
      <main className="page" id="top">
        <kt-hero heading={HERO.heading} lead={HERO.lead}>
          <a slot="announcement" href="#features">
            {HERO.announcement}
          </a>
          <kt-button
            slot="actions"
            size="large"
            onClick={() => scrollToSection(HERO.primaryHref.slice(1))}
          >
            {HERO.primary}
          </kt-button>
          <kt-button
            slot="actions"
            size="large"
            variant="secondary"
            onClick={() => scrollToSection(HERO.secondaryHref.slice(1))}
          >
            {HERO.secondary}
          </kt-button>
          <span slot="note">{HERO.note}</span>
        </kt-hero>
        <kt-logo-cloud heading={LOGOS.heading}>
          {LOGOS.names.map((name) => (
            <img key={name} src={logoSrc(name)} alt={name} />
          ))}
        </kt-logo-cloud>
        <kt-feature-grid
          id="features"
          heading={FEATURES.heading}
          lead={FEATURES.lead}
          features={FEATURES.items}
        />
        <kt-testimonials
          heading={TESTIMONIALS.heading}
          lead={TESTIMONIALS.lead}
          testimonials={TESTIMONIALS.items}
        />
        <kt-pricing-table
          id="pricing"
          heading={PRICING.heading}
          lead={PRICING.lead}
          yearlyNote={PRICING.yearlyNote}
          plans={PRICING.plans}
        />
        <kt-faq
          id="questions"
          layout="split"
          heading={QUESTIONS.heading}
          lead={QUESTIONS.lead}
          items={QUESTIONS.items}
        >
          <span slot="note">
            {QUESTIONS.note} <a href={QUESTIONS.contact}>Ask us</a>.
          </span>
        </kt-faq>
        <kt-cta id="start" heading={CTA.heading} lead={CTA.lead}>
          <kt-button slot="actions" size="large">
            {CTA.primary}
          </kt-button>
          <kt-button
            slot="actions"
            size="large"
            variant="secondary"
            onClick={() => location.assign(CTA.secondaryHref)}
          >
            {CTA.secondary}
          </kt-button>
          <span slot="note">{CTA.note}</span>
        </kt-cta>
        <kt-newsletter
          variant="plain"
          layout="inline"
          align="start"
          heading={NEWSLETTER.heading}
          lead={NEWSLETTER.lead}
          onkt-subscribe={(event) => event.detail.wait(subscribe(event.detail.email))}
        >
          <span slot="note">{NEWSLETTER.note}</span>
        </kt-newsletter>
      </main>
      <kt-footer columns={FOOTER.columns}>
        <a slot="brand" className="brand" href="#top">
          {PRODUCT}
        </a>
        <span>{FOOTER.tagline}</span>
        <span slot="legal">{FOOTER.legal}</span>
      </kt-footer>
    </>
  );
}
```

- [ ] **Step 4: Watch it pass.** `npm run check:templates landing-react` → `ok`. A type error on a `kt-*` prop is a library gap: fix it in `src/react/jsx.ts` with a test, own commit, first.

- [ ] **Step 5: Commit.** `npm run format && npm run verify`; `git add templates/landing-react && git commit -m "feat(templates): add the landing page in React"`.

---

### Task 4: `landing-vue`

**Files:** `templates/landing-vue/{index.html,package.json,tsconfig.json,vite.config.ts,README.md,.gitignore}`, `src/main.ts`, `src/env.d.ts`, `src/App.vue`.

- [ ] **Step 1: See it fail.** `npm run check:templates landing-vue` → `reading package.json failed`.

- [ ] **Step 2: The project files** — copies of `templates/saas-vue`'s with name `kanto-landing-vue`, no `vue-router`, no `lucide`; README as Task 2's titled "in Vue", last row `The page | src/App.vue`, and the line about `vite.config.ts` telling Vue's compiler which tags are Kanto's.

- [ ] **Step 3: The page.** `src/main.ts`:

```ts
import 'kanto-ds/vue';
import 'kanto-ds/styles.css';
import './styles.css';
import { createApp } from 'vue';
import App from './App.vue';
import { applyBrand } from './brand';

applyBrand();
createApp(App).mount('#app');
```

`src/App.vue`:

```vue
<script setup lang="ts">
import type { KtSubscribeDetail } from 'kanto-ds';
import { scrollToSection, subscribe } from './actions';
import {
  CTA,
  FEATURES,
  FOOTER,
  HERO,
  LOGOS,
  NAV,
  NEWSLETTER,
  PRICING,
  PRODUCT,
  QUESTIONS,
  TESTIMONIALS,
  logoSrc,
} from './content';

function onSubscribe(event: CustomEvent<KtSubscribeDetail>): void {
  event.detail.wait(subscribe(event.detail.email));
}

function talkToSales(): void {
  location.assign(CTA.secondaryHref);
}
</script>

<template>
  <kt-header sticky>
    <a slot="brand" class="brand" href="#top">{{ PRODUCT }}</a>
    <nav class="nav">
      <a v-for="link in NAV" :key="link.href" :href="link.href">{{ link.label }}</a>
    </nav>
    <kt-button slot="actions" @click="scrollToSection('start')">{{ HERO.primary }}</kt-button>
  </kt-header>
  <main id="top" class="page">
    <kt-hero :heading="HERO.heading" :lead="HERO.lead">
      <a slot="announcement" href="#features">{{ HERO.announcement }}</a>
      <kt-button slot="actions" size="large" @click="scrollToSection(HERO.primaryHref.slice(1))">
        {{ HERO.primary }}
      </kt-button>
      <kt-button
        slot="actions"
        size="large"
        variant="secondary"
        @click="scrollToSection(HERO.secondaryHref.slice(1))"
      >
        {{ HERO.secondary }}
      </kt-button>
      <span slot="note">{{ HERO.note }}</span>
    </kt-hero>
    <kt-logo-cloud :heading="LOGOS.heading">
      <img v-for="name in LOGOS.names" :key="name" :src="logoSrc(name)" :alt="name" />
    </kt-logo-cloud>
    <kt-feature-grid
      id="features"
      :heading="FEATURES.heading"
      :lead="FEATURES.lead"
      :features="FEATURES.items"
    />
    <kt-testimonials
      :heading="TESTIMONIALS.heading"
      :lead="TESTIMONIALS.lead"
      :testimonials="TESTIMONIALS.items"
    />
    <kt-pricing-table
      id="pricing"
      :heading="PRICING.heading"
      :lead="PRICING.lead"
      :yearly-note="PRICING.yearlyNote"
      :plans="PRICING.plans"
    />
    <kt-faq
      id="questions"
      layout="split"
      :heading="QUESTIONS.heading"
      :lead="QUESTIONS.lead"
      :items="QUESTIONS.items"
    >
      <span slot="note">{{ QUESTIONS.note }} <a :href="QUESTIONS.contact">Ask us</a>.</span>
    </kt-faq>
    <kt-cta id="start" :heading="CTA.heading" :lead="CTA.lead">
      <kt-button slot="actions" size="large">{{ CTA.primary }}</kt-button>
      <kt-button slot="actions" size="large" variant="secondary" @click="talkToSales">{{
        CTA.secondary
      }}</kt-button>
      <span slot="note">{{ CTA.note }}</span>
    </kt-cta>
    <kt-newsletter
      variant="plain"
      layout="inline"
      align="start"
      :heading="NEWSLETTER.heading"
      :lead="NEWSLETTER.lead"
      @kt-subscribe="onSubscribe"
    >
      <span slot="note">{{ NEWSLETTER.note }}</span>
    </kt-newsletter>
  </main>
  <kt-footer :columns="FOOTER.columns">
    <a slot="brand" class="brand" href="#top">{{ PRODUCT }}</a>
    <span>{{ FOOTER.tagline }}</span>
    <span slot="legal">{{ FOOTER.legal }}</span>
  </kt-footer>
</template>
```

- [ ] **Step 4: Watch it pass.** `npm run check:templates landing-vue` → `ok`; then `npm run check:templates` → six `ok` lines: `landing-react`, `landing-vanilla`, `landing-vue`, `saas-react`, `saas-vanilla`, `saas-vue`.

- [ ] **Step 5: Commit.** `npm run format && npm run verify`; `git add templates/landing-vue && git commit -m "feat(templates): add the landing page in Vue"`.

---

### Task 5: Landing in the tool and on the site; the old demo goes

**Files:**

- Modify: `packages/create-kanto/lib/choices.js`, `packages/create-kanto/README.md`, `demo/lib/templates.ts`, `demo/lib/templates.test.ts`, `demo/main.ts`, `demo/apps.test.ts`, `demo/shell.test.ts`, `CHANGELOG.md`
- Delete: `demo/apps/landing.ts`, `demo/public/templates/landing-home.png`
- Create: `demo/public/templates/landing-{top,pricing}.png` (shot)

- [ ] **Step 1: The failing tests.**
  - `demo/lib/templates.test.ts`, the demo regex: `expect(entry.demo, entry.id).toMatch(/^\.\/(templates\/[a-z-]+\/(#\/[a-z-]*)?|#\/app\/[a-z/-]+)$/);` and add `expect(TEMPLATE_CATALOG.find((entry) => entry.id === 'landing')!.demo).toBe('./templates/landing/');`.
  - `demo/shell.test.ts`, in "sends the old demo pages to their templates", add `['#/app/landing', 'Landing']` to the list.
  - `demo/apps.test.ts`: drop the `#/app/landing` entry from the routes list; in the two "documentation chrome" tests use `#/app/chat` instead of `#/app/landing`; in "previews the running application on its documentation page", keep `console-home`, `chat`, `portfolio` (Landing's frame is its template's build now).

Run: `npx vitest run --project unit demo`. Expected: FAIL — Landing's demo is still `./#/app/landing`; `#/app/landing` still opens the old demo.

- [ ] **Step 2: The tool.** `packages/create-kanto/lib/choices.js`: add `{ id: 'landing', label: 'Landing page', hint: 'a product's marketing page, every section a block' }` after `saas`. README: the template row `saas`, `landing`; the intro "a SaaS app … or a landing page".

- [ ] **Step 3: The catalog.** In `demo/lib/templates.ts`, the `landing` entry: `project: true`, `demo: './templates/landing/'`, `description` (Northwind's page, every section a block, the words in `src/content.ts`), `tryIt` (switch the billing period; subscribe to the newsletter; narrow the window — every block stacks), `routes: [{ path: '#features, #pricing, #questions, #start', what: 'The sections, reached from the header.' }]`, `files: [{ path: 'src/content.ts', what: 'Every word and every price.' }, { path: 'src/brand.ts', what: 'The brand, in one call.' }, { path: 'src/actions.ts', what: 'The newsletter. Call your email provider here.' }]`, `components` the ten blocks and `kt-header`, `screens: [{ file: 'landing-top.png', path: 'templates/landing/', caption: 'The top of the page' }, { file: 'landing-pricing.png', path: 'templates/landing/#pricing', caption: 'Pricing' }]`.

- [ ] **Step 4: The old demo goes.** `git rm demo/apps/landing.ts demo/public/templates/landing-home.png`; in `demo/main.ts` remove `landing` from the `APPS` map, and in `currentApp()` before it looks the path up:

```ts
// Demos that became templates' live builds: their old URL opens the template's page.
const retired = /^#\/app\/(landing)$/.exec(location.hash)?.[1];
if (retired) {
  location.replace(`#/templates/${retired}`);
  return null;
}
```

- [ ] **Step 5: Shoot, and run.** `npm run build:demo && node scripts/screenshot-templates.js` → the landing shots; read them. `npx vitest run --project unit demo packages scripts` → PASS.

- [ ] **Step 6: The changelog.** In `[1.10.0]`, the `create-kanto` entry's first bullet becomes: "The SaaS and Landing templates — … — in React, Vue and TypeScript without a framework, each a project of its own in `templates/`, to scaffold or to fork."

- [ ] **Step 7: Commit.** `npm run format && npm run verify && npm run check:templates`; `git add -A packages demo CHANGELOG.md && git commit -m "feat(templates): Landing in create-kanto and on the site; its old demo goes"`.

---

## Phase 3a is done when

- `npm run check:templates` prints six `ok` lines; `npm run verify` passes.
- `#/templates/landing` runs the template's build in its frame, with the command for each stack; `#/app/landing` and `#/apps/landing` lead there.
- `node packages/create-kanto/index.js /tmp/x --template landing --stack vue --yes` makes a project.
