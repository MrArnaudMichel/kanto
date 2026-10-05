# Templates, phase 1 — SaaS × 3 stacks, `create-kanto`, checks — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the SaaS template as three forkable projects (React, Vue, vanilla TypeScript), the `create-kanto` scaffolder that copies them, and the checks that build and open every template against the package npm would ship.

**Architecture:** Each template is a standalone Vite project in `templates/saas-<stack>/`. Everything that does not depend on the stack — data, fake auth, routing rules, view helpers, brand, icons, styles — is one set of files, identical in the three folders, which a unit test holds identical and unit-tests once. Each stack then only renders. `scripts/check-templates.js` packs `kanto-ds`, installs each template against the tarball, type-checks, builds, serves the build and walks it in Chromium with one smoke script per template kind. `packages/create-kanto` is a zero-dependency CLI that bundles `templates/` at pack time.

**Tech Stack:** Vite 7, TypeScript 5.9, React 19 + react-router 7, Vue 3.5 + vue-router 4, Lit-based `kanto-ds` 1.9, Playwright (already a dev dependency), Vitest (unit project), Node ≥ 20.

**Spec:** `docs/superpowers/specs/2026-10-05-templates-design.md`

## Global Constraints

- One folder per template and stack: `templates/<template>-<stack>/`; this phase: `saas-react`, `saas-vue`, `saas-vanilla`.
- Each template is a standalone Vite + TypeScript project: own `package.json` depending on `kanto-ds@^1.9.0`, with `dev`, `build`, `preview` and `typecheck` scripts; a README; `.gitignore`; **no lockfile committed**.
- The brand set in one place, `src/brand.ts`, with `setAppearance` (and `setAccent`).
- Not npm workspaces: the root `package.json` and `package-lock.json` do not list the templates or `create-kanto`.
- SaaS routes, identical in the three stacks: `/sign-in`, `/sign-up`, `/welcome`, `/`, `/customers`, `/settings`, and anything else → `kt-error-page`. Hash routing (`#/customers`) in all three, so the build runs on any static host.
- Data from `src/data/` with an async API that resolves fixtures after a short delay; fake sign-in in `src/auth.ts`.
- Routing: `react-router` (React), `vue-router` (Vue), a small hash router in `src/router.ts` (vanilla).
- `create-kanto`: zero dependencies; interactive or flags (`--template`, `--stack`, `--yes`); sets `name` in `package.json`; `_gitignore` → `.gitignore`; refuses a non-empty target; templates bundled at pack time; same version as `kanto-ds`.
- `npm run verify` is unchanged in what it runs; `npm run check:templates` runs on its own and in CI.
- Every commit only after `npm run verify` passes; commits in Arnaud Michel's name, no co-author trailer.
- Copy is sentence case, plain verbs, no exclamation marks; the product in the template is "Northwind", an invoicing app.

## Review Focus

1. **Typing fast in the customers search** — results for an earlier query must never replace those of a later one, and the table goes back to page 1 when the results change. (Task 3, 4, 5: the request ticket / effect cleanup; the smoke test types a query and checks every row matches it.)
2. **A signed-in person opening `#/sign-in`, or a signed-out one opening `#/settings`** — sent to the dashboard and to sign-in respectively, the same in every stack. (Task 1: `redirectFor` unit tests.)
3. **Private browsing or blocked storage** — `localStorage` throwing must not crash sign-in; the session simply lasts the page. (Task 1: auth test with a throwing `localStorage`.)
4. **A project folder name with spaces or capitals** (`My App`) — `create-kanto` writes a valid npm name. (Task 6: `packageName` tests.)
5. **The three stacks drifting apart** — a fix made to one stack's data or rules and not the others. (Task 1: the shared-files identity test.)

---

## File Structure

```
templates/
  saas-vanilla/        index.html, package.json, tsconfig.json, README.md, .gitignore
    src/
      data/fixtures.ts   (shared)  made-up customers, invoices, months
      data/api.ts        (shared)  async API over the fixtures — the file a fork replaces
      auth.ts            (shared)  fake sign-in, session in localStorage
      guard.ts           (shared)  redirectFor(path, known): where a visit should go instead
      content.ts         (shared)  app name, navigation, user menu, first steps, table columns
      format.ts          (shared)  money, dates, status labels
      view.ts            (shared)  rows for the tables, stat tiles, chart series, customer details
      brand.ts           (shared)  setAppearance — the one place to re-brand
      icons.ts           (shared)  the Lucide icons the app adds to Kanto's own
      styles.css         (shared)  the app's own layout
      main.ts, router.ts, routes.ts, layout.ts, pages/*.ts      (vanilla only)
  saas-react/          index.html, package.json, tsconfig.json, vite.config.ts, README.md, .gitignore
    src/ (shared files as above) + main.tsx, router.tsx, guards.tsx, AppLayout.tsx, pages/*.tsx
  saas-vue/            index.html, package.json, tsconfig.json, vite.config.ts, README.md, .gitignore
    src/ (shared files as above) + main.ts, env.d.ts, router.ts, App.vue, AppLayout.vue, pages/*.vue
packages/create-kanto/
  package.json, index.js, README.md
  lib/choices.js, lib/args.js, lib/scaffold.js, lib/bundle.js
  scripts/bundle.js, scripts/clean.js
  create-kanto.test.ts
scripts/
  check-templates.js       build, serve and walk every template
  template-smoke.js        what each template kind must do in a browser
  bump-templates.js        on release: create-kanto's version, the templates' kanto-ds range
  templates.test.ts        shared files identical, project shape, shared logic
  bump-templates.test.ts
```

Root files touched: `package.json` (script), `tsconfig.json` (include `packages`), `eslint.config.js` (ignore templates, node globals for packages), `vitest.config.ts` (unit include), `.gitignore`, `.prettierignore`, `scripts/release.js`, `.github/workflows/ci.yml`, `.github/workflows/publish.yml`, `CHANGELOG.md`.

---

### Task 1: The shared SaaS core, held identical and tested once

**Files:**

- Create: `templates/saas-vanilla/src/{data/fixtures.ts,data/api.ts,auth.ts,guard.ts,content.ts,format.ts,view.ts,brand.ts,icons.ts,styles.css}`
- Create: the same ten files, byte for byte, in `templates/saas-react/src/` and `templates/saas-vue/src/`
- Create: `scripts/templates.test.ts`
- Modify: `eslint.config.js:8`, `.gitignore`

**Interfaces:**

- Produces (used by Tasks 3–5, all from `src/`):
  - `data/api.ts`: `getSummary(): Promise<Summary>`, `listInvoices(limit?: number): Promise<Invoice[]>`, `listCustomers(query?: string): Promise<Customer[]>`, `getCustomer(id: string): Promise<Customer | undefined>`, `saveProfile(p: Profile): Promise<Profile>`; types `Summary`, `Customer`, `Invoice`, `Profile`.
  - `auth.ts`: `Session { name; email; welcomed }`, `currentSession(): Session | null`, `signIn(values: { email?: string; password?: string }): Promise<Session>`, `signUp(values: { name?: string; email?: string; password?: string }): Promise<Session>`, `updateSession(p: { name: string; email: string }): void`, `markWelcomed(): void`, `signOut(): void`.
  - `guard.ts`: `PUBLIC_PATHS`, `redirectFor(path: string, known: boolean): string | null`.
  - `content.ts`: `APP_NAME`, `NAV: KtNavSection[]`, `USER_MENU: KtUserMenuItem[]`, `FIRST_STEPS: KtFirstStep[]`, `INVOICE_COLUMNS`, `CUSTOMER_COLUMNS: KtTableColumn[]`.
  - `format.ts`: `formatMoney(n)`, `formatDate(iso)`, `STATUS_LABEL`.
  - `view.ts`: `invoiceRows(i: Invoice[]): KtTableRow[]`, `customerRows(c: Customer[]): KtTableRow[]`, `summaryStats(s: Summary): StatView[]`, `revenueSeries(s: Summary): KtSeries[]`, `customerDetails(c: Customer): KtDescriptionItem[]`; type `StatView`.
  - `brand.ts`: `applyBrand(): void`. `icons.ts`: side effect only.

- [ ] **Step 1: Write the failing test**

`scripts/templates.test.ts`:

```ts
/**
 * The templates: each a project of its own, and what the stacks of one
 * template share — data, rules, view helpers — kept identical and tested once.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const root = process.cwd();
const dirs = readdirSync(join(root, 'templates'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version as string;
const [major, minor] = version.split('.');

/** Files every stack of a template carries unchanged. */
const SHARED = [
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
];

const projects = dirs.filter((dir) => existsSync(join(root, 'templates', dir, 'package.json')));

describe('each template', () => {
  // Turned on by Task 5, once the three stacks are projects.
  it.todo('is a project for every stack of the SaaS template');

  // A loop, not it.each: until Task 3 there is no project, and that is fine.
  for (const dir of projects)
    it(`${dir} is a project of its own, asking for this minor of kanto-ds`, () => {
      const at = (file: string) => join(root, 'templates', dir, file);
      const pkg = JSON.parse(readFileSync(at('package.json'), 'utf8'));
      expect(pkg.private).toBe(true);
      expect(pkg.dependencies['kanto-ds']).toBe(`^${major}.${minor}.0`);
      expect(Object.keys(pkg.scripts)).toEqual(
        expect.arrayContaining(['dev', 'build', 'preview', 'typecheck']),
      );
      for (const file of ['README.md', '.gitignore', 'index.html', 'tsconfig.json']) {
        expect(existsSync(at(file)), `${dir}/${file}`).toBe(true);
      }
      expect(existsSync(at('package-lock.json')), `${dir} commits no lockfile`).toBe(false);
    });

  it.each(SHARED)('shares %s, unchanged, across the SaaS stacks', (file) => {
    const copies = ['saas-react', 'saas-vue', 'saas-vanilla'].map((dir) =>
      readFileSync(join(root, 'templates', dir, file), 'utf8'),
    );
    expect(copies[1], `saas-vue/${file}`).toBe(copies[0]);
    expect(copies[2], `saas-vanilla/${file}`).toBe(copies[0]);
  });
});

describe('the SaaS data', () => {
  it('finds customers by name, email or company, ignoring case', async () => {
    vi.useFakeTimers();
    const { listCustomers } = await import('../templates/saas-vanilla/src/data/api');
    const pending = listCustomers('KILN');
    await vi.runAllTimersAsync();
    const found = await pending;
    expect(found.length).toBeGreaterThan(0);
    expect(found.every((customer) => customer.company === 'Kiln')).toBe(true);
    vi.useRealTimers();
  });

  it('turns the summary into four tiles, the overdue one inverted', async () => {
    vi.useFakeTimers();
    const { getSummary } = await import('../templates/saas-vanilla/src/data/api');
    const { summaryStats, revenueSeries } = await import('../templates/saas-vanilla/src/view');
    const pending = getSummary();
    await vi.runAllTimersAsync();
    const summary = await pending;
    const tiles = summaryStats(summary);
    expect(tiles.map((tile) => tile.key)).toEqual(['billed', 'paid', 'overdue', 'customers']);
    expect(tiles[0]!.delta).toMatch(/^[+-]\d+\.\d%$/);
    expect(tiles[2]!.inverted).toBe(true);
    expect(revenueSeries(summary).map((series) => series.values?.length)).toEqual([12, 12]);
    vi.useRealTimers();
  });
});

describe('signing in, and where a visit goes', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('sends a visitor to sign in, and a signed-in person past it', async () => {
    const { redirectFor } = await import('../templates/saas-vanilla/src/guard');
    const { signIn, signOut } = await import('../templates/saas-vanilla/src/auth');
    expect(redirectFor('/settings', true)).toBe('/sign-in');
    expect(redirectFor('/sign-in', true)).toBeNull();
    expect(redirectFor('/nowhere', false)).toBeNull();
    await signIn({ email: 'ada@northwind.com', password: 'correct-horse' });
    expect(redirectFor('/sign-in', true)).toBe('/');
    expect(redirectFor('/settings', true)).toBeNull();
    signOut();
    expect(redirectFor('/', true)).toBe('/sign-in');
  });

  it('welcomes a new account before its dashboard, once', async () => {
    const { redirectFor } = await import('../templates/saas-vanilla/src/guard');
    const { markWelcomed, signUp } = await import('../templates/saas-vanilla/src/auth');
    await signUp({ name: 'Ada Park', email: 'ada@northwind.com', password: 'correct-horse' });
    expect(redirectFor('/', true)).toBe('/welcome');
    markWelcomed();
    expect(redirectFor('/', true)).toBeNull();
  });

  it('says what is missing, and still signs in when storage is blocked', async () => {
    const { currentSession, signIn } = await import('../templates/saas-vanilla/src/auth');
    await expect(signIn({ email: '', password: '' })).rejects.toThrow(/email and password/);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    await expect(signIn({ email: 'ada@northwind.com', password: 'x' })).resolves.toMatchObject({
      name: 'Ada',
    });
    expect(currentSession()).toMatchObject({ email: 'ada@northwind.com' });
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run --project unit scripts/templates.test.ts`
Expected: FAIL — `ENOENT … templates` (the folder does not exist yet).

- [ ] **Step 3: Write the shared files in `templates/saas-vanilla/src/`**

`src/data/fixtures.ts`:

```ts
/**
 * The workspace's made-up data: two dozen customers, a dozen invoices, a year
 * of revenue. It goes when src/data/api.ts talks to your backend.
 */
export type CustomerStatus = 'active' | 'overdue' | 'archived';

export interface Customer {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly company: string;
  readonly status: CustomerStatus;
  readonly balance: number;
  readonly since: string;
}

export type InvoiceStatus = 'paid' | 'sent' | 'overdue';

export interface Invoice {
  readonly id: string;
  readonly customer: string;
  readonly amount: number;
  readonly status: InvoiceStatus;
  readonly due: string;
}

const PEOPLE = [
  'Ada Park',
  'Sam Ortiz',
  'Lena Brandt',
  'Tom Achterberg',
  'Mira Sato',
  'Jonas Weber',
  'Priya Nair',
  'Hugo Laurent',
  'Ines Costa',
  'Kofi Mensah',
  'Elena Rossi',
  'Noah Kim',
];
const COMPANIES = ['Northwind', 'Kiln', 'Halcyon', 'Fieldnote', 'Orbital', 'Sato Ceramics'];
const STATUSES: readonly CustomerStatus[] = [
  'active',
  'active',
  'active',
  'overdue',
  'active',
  'archived',
];
const INVOICE_STATUSES: readonly InvoiceStatus[] = ['paid', 'sent', 'paid', 'overdue'];

const pad = (n: number) => String(n).padStart(2, '0');

export const CUSTOMERS: readonly Customer[] = Array.from({ length: 24 }, (_, i) => {
  const person = PEOPLE[i % PEOPLE.length]!;
  const company = COMPANIES[i % COMPANIES.length]!;
  const first = person.split(' ')[0]!;
  const second = i >= PEOPLE.length;
  return {
    id: `cus_${String(i + 1).padStart(3, '0')}`,
    name: second ? `${first} ${String.fromCharCode(65 + i - PEOPLE.length)}.` : person,
    email: `${first.toLowerCase()}${second ? i : ''}@${company.toLowerCase().replace(/\W+/g, '')}.com`,
    company,
    status: STATUSES[i % STATUSES.length]!,
    balance: ((i * 7919) % 9000) + 120,
    since: `202${4 + (i % 3)}-${pad((i % 12) + 1)}-${pad((i % 27) + 1)}`,
  };
});

export const INVOICES: readonly Invoice[] = Array.from({ length: 12 }, (_, i) => ({
  id: `INV-${2041 - i}`,
  customer: CUSTOMERS[i]!.company,
  amount: ((i * 3571) % 4800) + 240,
  status: INVOICE_STATUSES[i % INVOICE_STATUSES.length]!,
  due: `2026-10-${pad(28 - i * 2)}`,
}));

export const MONTHS: readonly string[] = [
  'Nov',
  'Dec',
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
];
export const BILLED: readonly number[] = [18, 21, 19, 24, 26, 25, 29, 31, 30, 34, 37, 41].map(
  (k) => k * 1000,
);
export const PAID: readonly number[] = [16, 20, 18, 21, 25, 24, 26, 30, 29, 31, 35, 36].map(
  (k) => k * 1000,
);
```

`src/data/api.ts`:

```ts
/**
 * The app's one door to its data. Every page asks here, and nothing else
 * touches the fixtures: replace these functions with calls to your backend and
 * the pages do not change.
 */
import { BILLED, CUSTOMERS, INVOICES, MONTHS, PAID } from './fixtures';
import type { Customer, Invoice } from './fixtures';

export type { Customer, Invoice } from './fixtures';

export interface Summary {
  readonly billed: number;
  readonly paid: number;
  readonly overdue: number;
  readonly customers: number;
  readonly months: readonly string[];
  readonly billedByMonth: readonly number[];
  readonly paidByMonth: readonly number[];
}

export interface Profile {
  readonly name: string;
  readonly email: string;
}

/** A network's worth of waiting, so the loading states show. */
const latency = (ms = 300) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function getSummary(): Promise<Summary> {
  await latency();
  return {
    billed: BILLED.at(-1)!,
    paid: PAID.at(-1)!,
    overdue: INVOICES.filter((invoice) => invoice.status === 'overdue').reduce(
      (sum, invoice) => sum + invoice.amount,
      0,
    ),
    customers: CUSTOMERS.filter((customer) => customer.status !== 'archived').length,
    months: MONTHS,
    billedByMonth: BILLED,
    paidByMonth: PAID,
  };
}

export async function listInvoices(limit = INVOICES.length): Promise<Invoice[]> {
  await latency();
  return INVOICES.slice(0, limit);
}

/** Customers whose name, email or company holds `query`, ignoring case. */
export async function listCustomers(query = ''): Promise<Customer[]> {
  await latency();
  const needle = query.trim().toLowerCase();
  return CUSTOMERS.filter(
    (customer) =>
      !needle ||
      [customer.name, customer.email, customer.company].some((field) =>
        field.toLowerCase().includes(needle),
      ),
  );
}

export async function getCustomer(id: string): Promise<Customer | undefined> {
  await latency(150);
  return CUSTOMERS.find((customer) => customer.id === id);
}

export async function saveProfile(profile: Profile): Promise<Profile> {
  await latency(600);
  if (!profile.name.trim()) throw new Error('Enter a name.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
    throw new Error('Enter an email address, like name@example.com.');
  }
  return profile;
}
```

`src/auth.ts`:

```ts
/**
 * Signing in, faked: any email and password get in, and the session lives in
 * localStorage. Replace these functions with your auth provider's; the pages
 * only call them.
 */
export interface Session {
  readonly name: string;
  readonly email: string;
  /** False until a new account has seen its first steps. */
  readonly welcomed: boolean;
}

const KEY = 'kanto-saas-session';

/** The session for this page when storage is blocked — private browsing. */
let fallback: Session | null = null;

export function currentSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : fallback;
  } catch {
    return fallback;
  }
}

function save(session: Session | null): void {
  fallback = session;
  try {
    if (session) localStorage.setItem(KEY, JSON.stringify(session));
    else localStorage.removeItem(KEY);
  } catch {
    // Storage blocked: the session lasts as long as the page.
  }
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** "ada.park@…" → "Ada.park": a name until the person gives theirs. */
function nameFrom(email: string): string {
  const local = email.split('@')[0] ?? email;
  return local.charAt(0).toUpperCase() + local.slice(1);
}

export async function signIn(values: { email?: string; password?: string }): Promise<Session> {
  await wait(500);
  const email = values.email?.trim() ?? '';
  if (!email || !values.password) throw new Error('Enter your email and password.');
  const session: Session = { name: nameFrom(email), email, welcomed: true };
  save(session);
  return session;
}

export async function signUp(values: {
  name?: string;
  email?: string;
  password?: string;
}): Promise<Session> {
  await wait(600);
  const email = values.email?.trim() ?? '';
  if (!email || !values.password) throw new Error('Enter your email and a password.');
  const session: Session = { name: values.name?.trim() || nameFrom(email), email, welcomed: false };
  save(session);
  return session;
}

export function updateSession(profile: { name: string; email: string }): void {
  const session = currentSession();
  if (session) save({ ...session, name: profile.name, email: profile.email });
}

export function markWelcomed(): void {
  const session = currentSession();
  if (session) save({ ...session, welcomed: true });
}

export function signOut(): void {
  save(null);
}
```

Note: `fallback` makes `currentSession()` fall back to the in-page session when `localStorage.getItem` returns null because `setItem` threw — the "storage blocked" test relies on it.

`src/guard.ts`:

```ts
/**
 * Where a visit should go instead — the same rules for every stack, so the
 * router of each only asks.
 */
import { currentSession } from './auth';

export const PUBLIC_PATHS: readonly string[] = ['/sign-in', '/sign-up'];

/**
 * `path` is the route asked for; `known` says whether the app has it. An
 * unknown path is the 404 page, for everyone. Returns the path to go to, or
 * null to stay.
 */
export function redirectFor(path: string, known: boolean): string | null {
  if (!known) return null;
  const session = currentSession();
  if (PUBLIC_PATHS.includes(path)) return session ? '/' : null;
  if (!session) return '/sign-in';
  if (!session.welcomed && path === '/') return '/welcome';
  return null;
}
```

`src/content.ts`:

```ts
/** The app's words and structure: its name, its navigation, its first steps, its tables. */
import type { KtFirstStep, KtNavSection, KtTableColumn, KtUserMenuItem } from 'kanto-ds';

export const APP_NAME = 'Northwind';

export const NAV: KtNavSection[] = [
  {
    title: 'Workspace',
    items: [
      { label: 'Overview', href: '#/', icon: 'house' },
      { label: 'Customers', href: '#/customers', icon: 'users' },
      { label: 'Settings', href: '#/settings', icon: 'settings' },
    ],
  },
];

export const USER_MENU: KtUserMenuItem[] = [
  { id: 'settings', label: 'Settings', icon: 'settings' },
  { id: 'sign-out', label: 'Sign out', icon: 'log-out', separator: true },
];

export const FIRST_STEPS: KtFirstStep[] = [
  {
    id: 'workspace',
    title: 'Create your workspace',
    description: 'Done when you signed up.',
    done: true,
  },
  {
    id: 'customers',
    title: 'Meet your customers',
    description: 'Who you bill, and what they owe.',
    action: 'Open customers',
    href: '#/customers',
  },
  {
    id: 'profile',
    title: 'Check your profile',
    description: 'The name and email on every invoice you send.',
    action: 'Open settings',
    href: '#/settings',
  },
  {
    id: 'overview',
    title: 'See the overview',
    description: 'What is billed, paid and late, this month.',
    action: 'Go to the overview',
  },
];

export const INVOICE_COLUMNS: KtTableColumn[] = [
  { key: 'id', label: 'Invoice' },
  { key: 'customer', label: 'Customer' },
  { key: 'amount', label: 'Amount', align: 'right' },
  { key: 'status', label: 'Status' },
  { key: 'due', label: 'Due' },
];

export const CUSTOMER_COLUMNS: KtTableColumn[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'company', label: 'Company', sortable: true },
  { key: 'status', label: 'Status' },
  { key: 'balance', label: 'Balance', align: 'right' },
];
```

`src/format.ts`:

```ts
/** Money, dates and statuses, written for people. */
const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const day = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });

export const formatMoney = (amount: number): string => money.format(amount);

/** `2026-10-28` → "Oct 28, 2026", the day where the reader is. */
export function formatDate(iso: string): string {
  const [year, month, date] = iso.split('-').map(Number);
  return day.format(new Date(year!, month! - 1, date!));
}

export const STATUS_LABEL: Readonly<Record<string, string>> = {
  active: 'Active',
  overdue: 'Overdue',
  archived: 'Archived',
  paid: 'Paid',
  sent: 'Sent',
};
```

`src/view.ts`:

```ts
/** What the pages show, worked out once for every stack: rows, tiles, series, details. */
import type { KtDescriptionItem, KtSeries, KtTableRow } from 'kanto-ds';
import type { Customer, Invoice, Summary } from './data/api';
import { formatDate, formatMoney, STATUS_LABEL } from './format';

export interface StatView {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly delta: string;
  readonly trend: 'up' | 'down' | 'flat';
  readonly inverted: boolean;
}

export function invoiceRows(invoices: readonly Invoice[]): KtTableRow[] {
  return invoices.map((invoice) => ({
    id: invoice.id,
    customer: invoice.customer,
    amount: formatMoney(invoice.amount),
    status: STATUS_LABEL[invoice.status] ?? invoice.status,
    due: formatDate(invoice.due),
  }));
}

export function customerRows(customers: readonly Customer[]): KtTableRow[] {
  return customers.map((customer) => ({
    id: customer.id,
    name: customer.name,
    company: customer.company,
    status: STATUS_LABEL[customer.status] ?? customer.status,
    balance: formatMoney(customer.balance),
  }));
}

/** This month against the last: "+10.8%", and which way it went. */
function change(values: readonly number[]): Pick<StatView, 'delta' | 'trend'> {
  const now = values.at(-1) ?? 0;
  const before = values.at(-2) ?? now;
  const percent = before ? ((now - before) / before) * 100 : 0;
  return {
    delta: `${percent >= 0 ? '+' : '-'}${Math.abs(percent).toFixed(1)}%`,
    trend: percent > 0 ? 'up' : percent < 0 ? 'down' : 'flat',
  };
}

export function summaryStats(summary: Summary): StatView[] {
  return [
    {
      key: 'billed',
      label: 'Billed this month',
      value: formatMoney(summary.billed),
      inverted: false,
      ...change(summary.billedByMonth),
    },
    {
      key: 'paid',
      label: 'Paid this month',
      value: formatMoney(summary.paid),
      inverted: false,
      ...change(summary.paidByMonth),
    },
    {
      key: 'overdue',
      label: 'Overdue',
      value: formatMoney(summary.overdue),
      delta: '',
      trend: 'flat',
      inverted: true,
    },
    {
      key: 'customers',
      label: 'Active customers',
      value: String(summary.customers),
      delta: '',
      trend: 'flat',
      inverted: false,
    },
  ];
}

export function revenueSeries(summary: Summary): KtSeries[] {
  return [
    { name: 'Billed', values: [...summary.billedByMonth] },
    { name: 'Paid', values: [...summary.paidByMonth] },
  ];
}

export function customerDetails(customer: Customer): KtDescriptionItem[] {
  return [
    { term: 'Company', detail: customer.company },
    { term: 'Email', detail: customer.email },
    { term: 'Status', detail: STATUS_LABEL[customer.status] ?? customer.status },
    { term: 'Balance', detail: formatMoney(customer.balance) },
    { term: 'Customer since', detail: formatDate(customer.since) },
  ];
}
```

`src/brand.ts`:

```ts
/**
 * The brand, in one place. Change the accent, the font, the corners or the
 * density here and every screen follows. Every option:
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
  // A colour of your own rather than a named accent:
  // import { setAccent } from 'kanto-ds'; setAccent('#e11d48');
}
```

`src/icons.ts`:

```ts
/**
 * The icons this app draws beyond Kanto's own. Any Lucide icon works: import
 * it, add it here, then name it in kebab case — `icon="receipt-text"`.
 */
import { registerIcons } from 'kanto-ds/icons';
import { House, LogOut, ReceiptText, Users } from 'lucide';

registerIcons({ House, LogOut, ReceiptText, Users });
```

`src/styles.css`:

```css
/* The app's own layout. Kanto's styles.css already sets the page's colours and type. */
html,
body,
#app {
  height: 100%;
}

.app {
  height: 100dvh;
}

.app-header {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.app-brand {
  color: var(--text-body);
  font: 600 18px / 1 var(--font-family-display);
  text-decoration: none;
}

.page {
  display: grid;
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px 64px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  min-height: 96px;
}

.panel {
  padding: 24px;
  border: var(--border-width) solid var(--border-subtle);
  border-radius: var(--border-radius-card);
}

.settings {
  display: grid;
  gap: 40px;
}

.auth {
  display: grid;
  min-height: 100%;
  padding: 32px 16px;
  place-items: center;
}

.auth-note {
  margin: 0;
  color: var(--text-muted);
  font: var(--font-normal-small);
}
```

- [ ] **Step 4: Copy the shared files to the other two stacks**

```bash
for stack in react vue; do
  mkdir -p templates/saas-$stack/src/data
  for f in data/fixtures.ts data/api.ts auth.ts guard.ts content.ts format.ts view.ts brand.ts icons.ts styles.css; do
    cp templates/saas-vanilla/src/$f templates/saas-$stack/src/$f
  done
done
```

- [ ] **Step 5: Keep the templates out of the library's lint, and their builds out of git**

`eslint.config.js:8` becomes:

```js
  { ignores: ['dist/**', 'dist-demo/**', 'coverage/**', 'templates/**', 'packages/create-kanto/templates/**'] },
```

Append to `.gitignore`:

```
# Templates: each installs and builds on its own.
templates/*/node_modules/
templates/*/dist/
# create-kanto bundles templates/ here at pack time.
packages/create-kanto/templates/
```

Append to `.prettierignore`:

```
packages/create-kanto/templates/
```

- [ ] **Step 6: Run the test**

Run: `npx vitest run --project unit scripts/templates.test.ts`
Expected: PASS — the shared files are identical, the data and auth tests pass, and no folder is a project yet, so the project loop adds no test until Task 3.

- [ ] **Step 7: Commit**

```bash
npm run format && npm run verify
git add templates scripts/templates.test.ts eslint.config.js .gitignore .prettierignore
git commit -m "feat(templates): the SaaS template's shared core: data, sign-in, rules, view"
```

---

### Task 2: `check:templates` — build, serve and walk every template

**Files:**

- Create: `scripts/template-smoke.js`, `scripts/check-templates.js`
- Modify: `package.json` (scripts)

**Interfaces:**

- Consumes: the template folders under `templates/` (none yet: the script must say so and fail).
- Produces: `npm run check:templates [name…]` — exits 0 when every named (or every) template installs against the packed `kanto-ds`, type-checks, builds and passes its smoke test; `SMOKES: Record<string, (page, base) => Promise<void>>` from `scripts/template-smoke.js`, keyed by template kind (`saas`).

- [ ] **Step 1: Write the smoke script for the SaaS kind**

`scripts/template-smoke.js`:

```js
/**
 * What each kind of template must do once built — the same walk for every
 * stack, so React, Vue and plain TypeScript are held to one behaviour. Each
 * takes a Playwright page and the served build's address.
 *
 * Selectors go through shadow roots (Playwright's CSS does), and reach the
 * elements by what every stack renders the same way: tags, `name`s, classes.
 */
const TIMEOUT = 10_000;

/** @type {Record<string, (page: import('playwright').Page, base: string) => Promise<void>>} */
export const SMOKES = {
  async saas(page, base) {
    const at = (hash) => page.goto(`${base}#${hash}`);
    // waitForFunction sends the function to the page as text: it reads only its argument.
    const until = (check, arg) => page.waitForFunction(check, arg, { timeout: TIMEOUT });

    // Signed out, the app opens on sign-in.
    await at('/');
    await until(() => location.hash === '#/sign-in');

    // Any email and password get in, onto the dashboard.
    await page.locator('kt-auth-form kt-input[name="email"] input').fill('ada@northwind.com');
    await page.locator('kt-auth-form kt-input[name="password"] input').fill('correct-horse');
    await page.locator('kt-auth-form kt-button.submit').click();
    await until(() => location.hash === '#/');
    await until(() => document.querySelectorAll('kt-stat').length === 4);
    await until(() => (document.querySelector('kt-table')?.data ?? []).length > 0);

    // Customers: all of them, then only the ones a search finds, then one opened.
    await at('/customers');
    await until(() => (document.querySelector('kt-table')?.data ?? []).length === 24);
    await page.locator('kt-input.search input').fill('kiln');
    await until(() => {
      const data = document.querySelector('kt-table')?.data ?? [];
      return data.length > 0 && data.every((row) => row.company === 'Kiln');
    });
    await page.locator('kt-table tbody tr').first().click();
    await until(() => document.querySelector('kt-side-panel')?.open === true);

    // Settings, first steps, and a page that is not there.
    await at('/settings');
    await until(() => document.querySelectorAll('kt-settings-section').length === 3);
    await at('/welcome');
    await until(() => document.querySelector('kt-empty-page')?.steps?.length === 4);
    await at('/no-such-page');
    await until(() => document.querySelector('kt-error-page') !== null);
  },
};
```

- [ ] **Step 2: Write the check script**

`scripts/check-templates.js`:

```js
#!/usr/bin/env node
/**
 * Builds and opens every project in templates/, the way someone who forked it
 * would: against the kanto-ds package npm would ship, with the template's own
 * dependencies installed from the registry. Then it walks the build in
 * Chromium with the template kind's smoke test (scripts/template-smoke.js).
 *
 *   npm run build && npm run check:templates            every template
 *   npm run check:templates saas-react saas-vue          some of them
 *
 * Needs the network for the templates' dependencies, so it is not part of
 * `npm run verify`; CI runs it in a job of its own, and before every publish.
 */
import { execFileSync, spawn } from 'node:child_process';
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { SMOKES } from './template-smoke.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const only = process.argv.slice(2);
const all = readdirSync(join(root, 'templates'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
const templates = only.length ? all.filter((name) => only.includes(name)) : all;

if (templates.length === 0) {
  console.error(`\n✗ No templates to check${only.length ? ` among ${only.join(', ')}` : ''}.\n`);
  process.exit(1);
}

const work = mkdtempSync(join(tmpdir(), 'kanto-templates-'));
const failures = [];

/** Runs a command quietly; on failure, the error carries its output. */
function run(command, args, cwd) {
  execFileSync(command, args, { cwd, stdio: 'pipe', encoding: 'utf8' });
}

/** Serves a build with `vite preview` and resolves once it answers. */
async function serve(cwd, port) {
  const server = spawn(
    'npx',
    ['vite', 'preview', '--port', String(port), '--strictPort', '--host', '127.0.0.1'],
    {
      cwd,
      stdio: 'ignore',
    },
  );
  const url = `http://127.0.0.1:${port}/`;
  for (let tries = 0; tries < 100; tries += 1) {
    try {
      if ((await fetch(url)).ok) return { server, url };
    } catch {
      // Not up yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  server.kill();
  throw new Error(`vite preview did not answer on ${url}`);
}

try {
  execFileSync('npm', ['pack', '--pack-destination', work, '--silent'], { cwd: root });
  const tarball = join(
    work,
    readdirSync(work).find((file) => file.endsWith('.tgz')),
  );
  const browser = await chromium.launch();
  let port = 4310;

  for (const name of templates) {
    const kind = name.split('-')[0];
    const smoke = SMOKES[kind];
    if (!smoke) {
      failures.push(`${name}: scripts/template-smoke.js has no "${kind}" walk`);
      continue;
    }

    const app = join(work, name);
    const source = join(root, 'templates', name);
    cpSync(source, app, {
      recursive: true,
      filter: (path) => !/(^|[\\/])(node_modules|dist)([\\/]|$)/.test(relative(source, path)),
    });
    const pkg = JSON.parse(readFileSync(join(app, 'package.json'), 'utf8'));
    pkg.dependencies['kanto-ds'] = `file:${tarball}`;
    writeFileSync(join(app, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`);

    let step = 'npm install';
    try {
      run('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error'], app);
      step = 'npm run typecheck';
      run('npm', ['run', 'typecheck'], app);
      step = 'npm run build';
      run('npm', ['run', 'build'], app);
    } catch (error) {
      failures.push(`${name}: ${step} failed\n${error.stdout ?? ''}${error.stderr ?? ''}`);
      continue;
    }

    port += 1;
    let served;
    const page = await browser.newPage();
    const errors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    try {
      served = await serve(app, port);
      await smoke(page, served.url);
      if (errors.length) throw new Error(`errors in the console:\n    ${errors.join('\n    ')}`);
      console.log(`ok   ${name}`);
    } catch (error) {
      failures.push(`${name}: ${error.message}`);
    } finally {
      await page.close();
      served?.server.kill();
    }
  }
  await browser.close();
} finally {
  rmSync(work, { recursive: true, force: true });
}

if (failures.length) {
  console.error(
    `\n✗ Templates that would not work for someone who forked them:\n  ${failures.join('\n  ')}\n`,
  );
  process.exit(1);
}
console.log(`\nEvery template installs, builds and runs against the packed package.`);
```

Add to `package.json` scripts, after `check:consumer`:

```json
    "check:templates": "node scripts/check-templates.js",
```

- [ ] **Step 3: Run it to see it fail**

Run: `npm run build && npm run check:templates saas-vanilla`
Expected: FAIL — `saas-vanilla: npm install failed` (the folder holds Task 1's `src/` and no `package.json` yet).

- [ ] **Step 4: Commit with Task 3** — the script is proven by the first template that passes it; a script that has never passed is not committed.

---

### Task 3: `saas-vanilla` — the template without a framework

**Files:**

- Create: `templates/saas-vanilla/{index.html,package.json,tsconfig.json,README.md,.gitignore}`
- Create: `templates/saas-vanilla/src/{main.ts,router.ts,routes.ts,layout.ts}`
- Create: `templates/saas-vanilla/src/pages/{auth.ts,welcome.ts,dashboard.ts,customers.ts,settings.ts,not-found.ts}`

**Interfaces:**

- Consumes: everything Task 1 produces.
- Produces: a project that passes `npm run check:templates saas-vanilla`.

- [ ] **Step 1: The project files**

`templates/saas-vanilla/package.json`:

```json
{
  "name": "kanto-saas-vanilla",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "kanto-ds": "^1.9.0",
    "lucide": "^1.43.0"
  },
  "devDependencies": {
    "typescript": "^5.9.3",
    "vite": "^7.3.6"
  }
}
```

`templates/saas-vanilla/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["vite/client"]
  },
  "include": ["src"]
}
```

`templates/saas-vanilla/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Northwind</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

`templates/saas-vanilla/.gitignore`:

```
node_modules
dist
*.local
.DS_Store
```

`templates/saas-vanilla/README.md`:

````md
# Northwind — a SaaS app on Kanto, in TypeScript without a framework

An invoicing app to start from: sign in, a first-run checklist, a dashboard,
customers and settings, built from [Kanto](https://kanto.arnaudmichel.fr)'s
components and blocks.

```bash
npm install
npm run dev
```

Any email and password sign in: the auth is fake, in `src/auth.ts`.

## Where things are

| To change            | Edit                                          |
| -------------------- | --------------------------------------------- |
| The brand            | `src/brand.ts` — one `setAppearance` call     |
| The data             | `src/data/api.ts` — call your backend here    |
| Signing in           | `src/auth.ts` — call your auth provider here  |
| The navigation, menu | `src/content.ts`                              |
| A page               | `src/pages/`                                  |
| The routes           | `src/routes.ts` (the router: `src/router.ts`) |

Routes are hashes — `#/customers` — so the build runs on any static host.

## Components used

`kt-app-shell`, `kt-sub-menu-navigation`, `kt-user-menu`, `kt-auth-form`,
`kt-empty-page`, `kt-page-header`, `kt-stat`, `kt-chart`, `kt-table`,
`kt-input`, `kt-side-panel`, `kt-description-list`, `kt-settings-section`,
`kt-toggle`, `kt-button`, `kt-confirm-dialog`, `kt-error-page`. Each is
documented at https://kanto.arnaudmichel.fr/#/components.
````

- [ ] **Step 2: The router, the routes and the frame**

`src/router.ts`:

```ts
/**
 * A hash router in a page of code: `#/customers` renders the customers page.
 * Swap it for a router package when the app outgrows it.
 */
export interface Route {
  readonly path: string;
  /** Draws the page into `outlet`; may return what to undo when leaving it. */
  readonly render: (outlet: HTMLElement) => void | (() => void);
}

export interface RouteTable {
  readonly routes: readonly Route[];
  readonly notFound: Route;
  /** Where a visit should go instead, or null to stay. */
  readonly redirect: (path: string, known: boolean) => string | null;
}

export function currentPath(): string {
  return location.hash.replace(/^#/, '') || '/';
}

export function navigate(path: string): void {
  location.hash = path;
}

export function startRouter(outlet: HTMLElement, table: RouteTable): void {
  let leave: void | (() => void);
  const render = (): void => {
    const path = currentPath();
    const route = table.routes.find((candidate) => candidate.path === path);
    const redirect = table.redirect(path, Boolean(route));
    if (redirect && redirect !== path) {
      navigate(redirect);
      return;
    }
    if (typeof leave === 'function') leave();
    outlet.replaceChildren();
    leave = (route ?? table.notFound).render(outlet);
  };
  window.addEventListener('hashchange', render);
  render();
}
```

`src/layout.ts`:

```ts
/** The app's frame — header, navigation, account menu — around a page. */
import type { KtSubMenuNavigation, KtUserMenu } from 'kanto-ds';
import { currentSession, signOut } from './auth';
import { APP_NAME, NAV, USER_MENU } from './content';
import { navigate } from './router';

type Page = (page: HTMLElement) => void | (() => void);

export function inShell(path: string, render: Page) {
  return (outlet: HTMLElement): void | (() => void) => {
    outlet.innerHTML = `<kt-app-shell class="app">
      <div slot="header" class="app-header">
        <a class="app-brand" href="#/"></a>
        <kt-user-menu></kt-user-menu>
      </div>
      <kt-sub-menu-navigation slot="sidebar" label="Workspace"></kt-sub-menu-navigation>
      <div class="page"></div>
    </kt-app-shell>`;
    outlet.querySelector('.app-brand')!.textContent = APP_NAME;
    outlet.querySelector('kt-app-shell')!.setAttribute('label', APP_NAME);

    const nav = outlet.querySelector<KtSubMenuNavigation>('kt-sub-menu-navigation')!;
    nav.sections = NAV;
    nav.activeHref = `#${path}`;

    const session = currentSession();
    const menu = outlet.querySelector<KtUserMenu>('kt-user-menu')!;
    menu.name = session?.name ?? '';
    menu.email = session?.email ?? '';
    menu.items = USER_MENU;
    menu.addEventListener('kt-select', (event) => {
      const { id } = (event as CustomEvent<{ id: string }>).detail;
      if (id === 'sign-out') {
        signOut();
        navigate('/sign-in');
      } else navigate('/settings');
    });

    return render(outlet.querySelector<HTMLElement>('.page')!);
  };
}
```

`src/routes.ts`:

```ts
import { redirectFor } from './guard';
import { inShell } from './layout';
import { authPage } from './pages/auth';
import { customersPage } from './pages/customers';
import { dashboardPage } from './pages/dashboard';
import { notFoundPage } from './pages/not-found';
import { settingsPage } from './pages/settings';
import { welcomePage } from './pages/welcome';
import type { RouteTable } from './router';

export const ROUTES: RouteTable = {
  routes: [
    { path: '/sign-in', render: (outlet) => authPage(outlet, 'sign-in') },
    { path: '/sign-up', render: (outlet) => authPage(outlet, 'sign-up') },
    { path: '/welcome', render: inShell('/welcome', welcomePage) },
    { path: '/', render: inShell('/', dashboardPage) },
    { path: '/customers', render: inShell('/customers', customersPage) },
    { path: '/settings', render: inShell('/settings', settingsPage) },
  ],
  notFound: { path: '*', render: notFoundPage },
  redirect: redirectFor,
};
```

`src/main.ts`:

```ts
import 'kanto-ds';
import 'kanto-ds/styles.css';
import './styles.css';
import './icons';
import { applyBrand } from './brand';
import { startRouter } from './router';
import { ROUTES } from './routes';

applyBrand();
startRouter(document.querySelector<HTMLElement>('#app')!, ROUTES);
```

- [ ] **Step 3: The pages**

`src/pages/auth.ts`:

```ts
import type { KtAuthForm, KtAuthSubmitDetail } from 'kanto-ds';
import { signIn, signUp } from '../auth';
import { APP_NAME } from '../content';
import { navigate } from '../router';

export function authPage(outlet: HTMLElement, mode: 'sign-in' | 'sign-up'): void {
  outlet.innerHTML = `<main class="auth">
    <kt-auth-form>
      <a slot="logo" class="app-brand" href="#/"></a>
      <p slot="footer" class="auth-note">A demo: any email and password sign in.</p>
    </kt-auth-form>
  </main>`;
  outlet.querySelector('.app-brand')!.textContent = APP_NAME;
  const form = outlet.querySelector<KtAuthForm>('kt-auth-form')!;
  form.mode = mode;

  form.addEventListener('kt-submit', (event) => {
    const { mode: sent, values, wait } = (event as CustomEvent<KtAuthSubmitDetail>).detail;
    if (sent === 'sign-in') wait(signIn(values).then(() => navigate('/')));
    else if (sent === 'sign-up') wait(signUp(values).then(() => navigate('/welcome')));
    else wait(new Promise((resolve) => setTimeout(resolve, 500)));
  });
  form.addEventListener('kt-mode', (event) => {
    const { mode: next } = (event as CustomEvent<{ mode: string }>).detail;
    if (next === 'sign-in' || next === 'sign-up') navigate(`/${next}`);
  });
}
```

`src/pages/dashboard.ts`:

```ts
import type { KtChart, KtStat, KtTable } from 'kanto-ds';
import { APP_NAME, INVOICE_COLUMNS } from '../content';
import { getSummary, listInvoices } from '../data/api';
import { formatMoney } from '../format';
import { invoiceRows, revenueSeries, summaryStats } from '../view';

export function dashboardPage(page: HTMLElement): () => void {
  page.innerHTML = `
    <kt-page-header heading="Overview" description="What is billed, paid and late this month."></kt-page-header>
    <div class="stats" aria-busy="true"></div>
    <section class="panel"><kt-chart type="area" height="240" label="Billed and paid, by month"></kt-chart></section>
    <kt-table label="Latest invoices" compact loading></kt-table>`;
  page.querySelector('kt-page-header')!.setAttribute('eyebrow', APP_NAME);
  const stats = page.querySelector<HTMLElement>('.stats')!;
  const chart = page.querySelector<KtChart>('kt-chart')!;
  const table = page.querySelector<KtTable>('kt-table')!;
  table.columns = INVOICE_COLUMNS;
  chart.format = formatMoney;

  let live = true;
  void getSummary().then((summary) => {
    if (!live) return;
    stats.replaceChildren(
      ...summaryStats(summary).map((view) => {
        const stat = document.createElement('kt-stat') as KtStat;
        Object.assign(stat, {
          label: view.label,
          value: view.value,
          delta: view.delta,
          trend: view.trend,
          inverted: view.inverted,
        });
        return stat;
      }),
    );
    stats.removeAttribute('aria-busy');
    chart.labels = [...summary.months];
    chart.series = revenueSeries(summary);
  });
  void listInvoices(6).then((invoices) => {
    if (!live) return;
    table.data = invoiceRows(invoices);
    table.loading = false;
  });
  return () => {
    live = false;
  };
}
```

`src/pages/customers.ts`:

```ts
import type { KtDescriptionList, KtInput, KtSidePanel, KtTable, KtTableRow } from 'kanto-ds';
import { CUSTOMER_COLUMNS } from '../content';
import { getCustomer, listCustomers } from '../data/api';
import { customerDetails, customerRows } from '../view';

export function customersPage(page: HTMLElement): () => void {
  page.innerHTML = `
    <kt-page-header heading="Customers" description="Everyone you bill, and what they owe."></kt-page-header>
    <kt-input class="search" type="search" icon="search" label="Search customers" placeholder="Search by name, email or company"></kt-input>
    <kt-table label="Customers" page-size="10" loading></kt-table>
    <kt-side-panel eyebrow="Customer"><kt-description-list></kt-description-list></kt-side-panel>`;
  const search = page.querySelector<KtInput>('kt-input.search')!;
  const table = page.querySelector<KtTable>('kt-table')!;
  const panel = page.querySelector<KtSidePanel>('kt-side-panel')!;
  const details = page.querySelector<KtDescriptionList>('kt-description-list')!;
  table.columns = CUSTOMER_COLUMNS;

  // Each search is a ticket: an answer that comes back after a later search was
  // sent is dropped, so fast typing never shows the results of an old query.
  let ticket = 0;
  const load = (query: string): void => {
    const mine = ++ticket;
    table.loading = true;
    void listCustomers(query).then((customers) => {
      if (mine !== ticket) return;
      table.data = customerRows(customers);
      table.page = 1;
      table.loading = false;
    });
  };

  search.addEventListener('kt-input', (event) => {
    load((event as CustomEvent<{ value: string }>).detail.value);
  });
  table.addEventListener('kt-row-click', (event) => {
    const { row } = (event as CustomEvent<{ row: KtTableRow }>).detail;
    void getCustomer(String(row.id)).then((customer) => {
      if (!customer) return;
      panel.heading = customer.name;
      details.items = customerDetails(customer);
      panel.open = true;
    });
  });

  load('');
  return () => {
    ticket += 1;
  };
}
```

`src/pages/settings.ts`:

```ts
import type { KtButton, KtConfirmDialog, KtInput } from 'kanto-ds';
import { currentSession, signOut, updateSession } from '../auth';
import { saveProfile } from '../data/api';
import { navigate } from '../router';

export function settingsPage(page: HTMLElement): void {
  page.innerHTML = `
    <kt-page-header heading="Settings" description="Your profile, what we email you about, and your workspace."></kt-page-header>
    <div class="settings">
      <kt-settings-section heading="Profile" description="The name and email on every invoice you send.">
        <kt-label-input label="Name"><kt-input name="name" autocomplete="name"></kt-input></kt-label-input>
        <kt-label-input label="Email"><kt-input name="email" type="email" autocomplete="email"></kt-input></kt-label-input>
        <kt-button slot="actions" class="save-profile" done-label="Saved">Save</kt-button>
      </kt-settings-section>
      <kt-settings-section heading="Notifications" description="What we email you about, and when.">
        <kt-toggle checked>Email me when an invoice is paid</kt-toggle>
        <kt-toggle>Email me a weekly summary</kt-toggle>
        <kt-button slot="actions" class="save-notifications" done-label="Saved">Save</kt-button>
      </kt-settings-section>
      <kt-settings-section danger heading="Delete workspace" description="Every invoice, customer and file in it goes, for good.">
        <kt-button slot="actions" class="delete" variant="delete">Delete workspace</kt-button>
      </kt-settings-section>
    </div>
    <kt-confirm-dialog heading="Delete this workspace?" message="Everything in it goes, for good. This cannot be undone." confirm-label="Delete workspace"></kt-confirm-dialog>`;

  const session = currentSession();
  const name = page.querySelector<KtInput>('kt-input[name="name"]')!;
  const email = page.querySelector<KtInput>('kt-input[name="email"]')!;
  name.value = session?.name ?? '';
  email.value = session?.email ?? '';

  const saveButton = page.querySelector<KtButton>('.save-profile')!;
  saveButton.addEventListener('click', () => {
    void saveButton.run(() =>
      saveProfile({ name: name.value, email: email.value }).then(updateSession),
    );
  });
  const notifyButton = page.querySelector<KtButton>('.save-notifications')!;
  notifyButton.addEventListener('click', () => {
    void notifyButton.run(() => new Promise((resolve) => setTimeout(resolve, 400)));
  });

  const dialog = page.querySelector<KtConfirmDialog>('kt-confirm-dialog')!;
  page.querySelector('.delete')!.addEventListener('click', () => (dialog.open = true));
  dialog.addEventListener('kt-cancel', () => (dialog.open = false));
  dialog.addEventListener('kt-confirm', () => {
    signOut();
    navigate('/sign-in');
  });
}
```

`src/pages/welcome.ts`:

```ts
import type { KtEmptyPage } from 'kanto-ds';
import { currentSession, markWelcomed } from '../auth';
import { APP_NAME, FIRST_STEPS } from '../content';
import { navigate } from '../router';

export function welcomePage(page: HTMLElement): void {
  page.innerHTML = `<kt-empty-page><a slot="actions" class="skip" href="#/">Skip for now</a></kt-empty-page>`;
  const welcome = page.querySelector<KtEmptyPage>('kt-empty-page')!;
  welcome.heading = `Welcome, ${currentSession()?.name ?? 'there'}`;
  welcome.lead = `A few steps and ${APP_NAME} is ready to send invoices.`;
  welcome.steps = FIRST_STEPS;
  welcome.addEventListener('kt-step', (event) => {
    if ((event as CustomEvent<{ id: string }>).detail.id === 'overview') {
      markWelcomed();
      navigate('/');
    }
  });
  page.querySelector('.skip')!.addEventListener('click', () => markWelcomed());
}
```

`src/pages/not-found.ts`:

```ts
export function notFoundPage(outlet: HTMLElement): void {
  outlet.innerHTML = '<kt-error-page fill home-href="#/"></kt-error-page>';
}
```

- [ ] **Step 4: Run the checks**

Run: `npx vitest run --project unit scripts/templates.test.ts`
Expected: PASS — `saas-vanilla` is now checked as a project.

Run: `npm run build && npm run check:templates saas-vanilla`
Expected: `ok   saas-vanilla` and exit 0. On a failure, fix the template (or the library, if the library is wrong — then add the library fix with its own test first).

- [ ] **Step 5: Commit**

```bash
npm run format && npm run verify
git add templates/saas-vanilla scripts/template-smoke.js scripts/check-templates.js package.json
git commit -m "feat(templates): add the SaaS template without a framework, and check:templates"
```

---

### Task 4: `saas-react`

**Files:**

- Create: `templates/saas-react/{index.html,package.json,tsconfig.json,vite.config.ts,README.md,.gitignore}`
- Create: `templates/saas-react/src/{main.tsx,router.tsx,guards.tsx,AppLayout.tsx}`
- Create: `templates/saas-react/src/pages/{AuthPage.tsx,Welcome.tsx,Dashboard.tsx,Customers.tsx,Settings.tsx,NotFound.tsx}`

**Interfaces:**

- Consumes: Task 1's shared files (already in `templates/saas-react/src/`).
- Produces: a project that passes `npm run check:templates saas-react`.

- [ ] **Step 1: Run the check to see it fail**

Run: `npm run check:templates saas-react`
Expected: FAIL — `saas-react: npm install failed … package.json`.

- [ ] **Step 2: The project files**

`package.json`:

```json
{
  "name": "kanto-saas-react",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "kanto-ds": "^1.9.0",
    "lucide": "^1.43.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-router": "^7.9.0"
  },
  "devDependencies": {
    "@types/react": "^19.2.0",
    "@types/react-dom": "^19.2.0",
    "@vitejs/plugin-react": "^5.0.0",
    "typescript": "^5.9.3",
    "vite": "^7.3.6"
  }
}
```

`tsconfig.json`: the vanilla one, plus `"jsx": "react-jsx"` in `compilerOptions`.

`vite.config.ts`:

```ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({ plugins: [react()] });
```

`index.html`: the vanilla one with `src="/src/main.tsx"`. `.gitignore`: the vanilla one. `README.md`: the vanilla one with the title "… in React", the table's last rows `A page | src/pages/` and `The routes | src/router.tsx (react-router)`, and a line under the install block: "React 19 renders Kanto's elements natively; `kanto-ds/react/jsx` types them (see `src/main.tsx`)."

- [ ] **Step 3: Entry, router, guards and frame**

`src/main.tsx`:

```tsx
import 'kanto-ds';
import 'kanto-ds/styles.css';
import type {} from 'kanto-ds/react/jsx';
import './styles.css';
import './icons';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { applyBrand } from './brand';
import { router } from './router';

applyBrand();
createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
```

`src/guards.tsx`:

```tsx
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { redirectFor } from './guard';

/** Renders its page, or goes where the app's rules say instead. */
export function Guarded({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const to = redirectFor(pathname, true);
  return to ? <Navigate to={to} replace /> : children;
}
```

`src/router.tsx`:

```tsx
import { createHashRouter } from 'react-router';
import { AppLayout } from './AppLayout';
import { Guarded } from './guards';
import { AuthPage } from './pages/AuthPage';
import { Customers } from './pages/Customers';
import { Dashboard } from './pages/Dashboard';
import { NotFound } from './pages/NotFound';
import { Settings } from './pages/Settings';
import { Welcome } from './pages/Welcome';

export const router = createHashRouter([
  {
    path: '/sign-in',
    element: (
      <Guarded>
        <AuthPage mode="sign-in" />
      </Guarded>
    ),
  },
  {
    path: '/sign-up',
    element: (
      <Guarded>
        <AuthPage mode="sign-up" />
      </Guarded>
    ),
  },
  {
    element: (
      <Guarded>
        <AppLayout />
      </Guarded>
    ),
    children: [
      { path: '/', element: <Dashboard /> },
      { path: '/welcome', element: <Welcome /> },
      { path: '/customers', element: <Customers /> },
      { path: '/settings', element: <Settings /> },
    ],
  },
  { path: '*', element: <NotFound /> },
]);
```

`src/AppLayout.tsx`:

```tsx
import { Outlet, useLocation, useNavigate } from 'react-router';
import { currentSession, signOut } from './auth';
import { APP_NAME, NAV, USER_MENU } from './content';

export function AppLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const session = currentSession();
  return (
    <kt-app-shell className="app" label={APP_NAME}>
      <div slot="header" className="app-header">
        <a className="app-brand" href="#/">
          {APP_NAME}
        </a>
        <kt-user-menu
          name={session?.name ?? ''}
          email={session?.email ?? ''}
          items={USER_MENU}
          onkt-select={(event) => {
            if (event.detail.id === 'sign-out') {
              signOut();
              navigate('/sign-in');
            } else navigate('/settings');
          }}
        />
      </div>
      <kt-sub-menu-navigation
        slot="sidebar"
        label="Workspace"
        sections={NAV}
        activeHref={`#${pathname}`}
      />
      <div className="page">
        <Outlet />
      </div>
    </kt-app-shell>
  );
}
```

- [ ] **Step 4: The pages**

`src/pages/AuthPage.tsx`:

```tsx
import { useNavigate } from 'react-router';
import { signIn, signUp } from '../auth';
import { APP_NAME } from '../content';

export function AuthPage({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const navigate = useNavigate();
  return (
    <main className="auth">
      <kt-auth-form
        mode={mode}
        onkt-submit={(event) => {
          const { mode: sent, values, wait } = event.detail;
          if (sent === 'sign-in') wait(signIn(values).then(() => navigate('/')));
          else if (sent === 'sign-up') wait(signUp(values).then(() => navigate('/welcome')));
          else wait(new Promise((resolve) => setTimeout(resolve, 500)));
        }}
        onkt-mode={(event) => {
          const next = event.detail.mode;
          if (next === 'sign-in' || next === 'sign-up') navigate(`/${next}`);
        }}
      >
        <a slot="logo" className="app-brand" href="#/">
          {APP_NAME}
        </a>
        <p slot="footer" className="auth-note">
          A demo: any email and password sign in.
        </p>
      </kt-auth-form>
    </main>
  );
}
```

`src/pages/Dashboard.tsx`:

```tsx
import { useEffect, useState } from 'react';
import type { KtTableRow } from 'kanto-ds';
import { APP_NAME, INVOICE_COLUMNS } from '../content';
import { getSummary, listInvoices, type Summary } from '../data/api';
import { formatMoney } from '../format';
import { invoiceRows, revenueSeries, summaryStats } from '../view';

export function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [invoices, setInvoices] = useState<KtTableRow[] | null>(null);

  useEffect(() => {
    let live = true;
    void getSummary().then((next) => {
      if (live) setSummary(next);
    });
    void listInvoices(6).then((next) => {
      if (live) setInvoices(invoiceRows(next));
    });
    return () => {
      live = false;
    };
  }, []);

  return (
    <>
      <kt-page-header
        eyebrow={APP_NAME}
        heading="Overview"
        description="What is billed, paid and late this month."
      />
      <div className="stats" aria-busy={summary === null}>
        {summary &&
          summaryStats(summary).map((stat) => (
            <kt-stat
              key={stat.key}
              label={stat.label}
              value={stat.value}
              delta={stat.delta}
              trend={stat.trend}
              inverted={stat.inverted}
            />
          ))}
      </div>
      <section className="panel">
        <kt-chart
          type="area"
          height={240}
          label="Billed and paid, by month"
          labels={summary ? [...summary.months] : []}
          series={summary ? revenueSeries(summary) : []}
          format={formatMoney}
        />
      </section>
      <kt-table
        label="Latest invoices"
        compact
        columns={INVOICE_COLUMNS}
        data={invoices ?? []}
        loading={invoices === null}
      />
    </>
  );
}
```

`src/pages/Customers.tsx`:

```tsx
import { useEffect, useState } from 'react';
import type { KtTableRow } from 'kanto-ds';
import { CUSTOMER_COLUMNS } from '../content';
import { getCustomer, listCustomers, type Customer } from '../data/api';
import { customerDetails, customerRows } from '../view';

export function Customers() {
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<KtTableRow[] | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);

  // The cleanup drops an answer that comes back after a later search was sent.
  useEffect(() => {
    let live = true;
    setRows(null);
    void listCustomers(query).then((customers) => {
      if (live) setRows(customerRows(customers));
    });
    return () => {
      live = false;
    };
  }, [query]);

  return (
    <>
      <kt-page-header heading="Customers" description="Everyone you bill, and what they owe." />
      <kt-input
        className="search"
        type="search"
        icon="search"
        label="Search customers"
        placeholder="Search by name, email or company"
        onkt-input={(event) => setQuery(event.detail.value)}
      />
      {/* Keyed on the query: new results start on page 1. */}
      <kt-table
        key={query}
        label="Customers"
        pageSize={10}
        columns={CUSTOMER_COLUMNS}
        data={rows ?? []}
        loading={rows === null}
        onkt-row-click={(event) => {
          void getCustomer(String(event.detail.row.id)).then((found) => setCustomer(found ?? null));
        }}
      />
      <kt-side-panel
        eyebrow="Customer"
        heading={customer?.name ?? ''}
        open={customer !== null}
        onkt-close={() => setCustomer(null)}
      >
        <kt-description-list items={customer ? customerDetails(customer) : []} />
      </kt-side-panel>
    </>
  );
}
```

`src/pages/Settings.tsx`:

```tsx
import { useRef, useState } from 'react';
import type { KtButton } from 'kanto-ds';
import { useNavigate } from 'react-router';
import { currentSession, signOut, updateSession } from '../auth';
import { saveProfile } from '../data/api';

export function Settings() {
  const navigate = useNavigate();
  const session = currentSession();
  const [name, setName] = useState(session?.name ?? '');
  const [email, setEmail] = useState(session?.email ?? '');
  const [confirming, setConfirming] = useState(false);
  const saveButton = useRef<KtButton>(null);
  const notifyButton = useRef<KtButton>(null);

  return (
    <>
      <kt-page-header
        heading="Settings"
        description="Your profile, what we email you about, and your workspace."
      />
      <div className="settings">
        <kt-settings-section
          heading="Profile"
          description="The name and email on every invoice you send."
        >
          <kt-label-input label="Name">
            <kt-input
              name="name"
              autocomplete="name"
              value={name}
              onkt-input={(event) => setName(event.detail.value)}
            />
          </kt-label-input>
          <kt-label-input label="Email">
            <kt-input
              name="email"
              type="email"
              autocomplete="email"
              value={email}
              onkt-input={(event) => setEmail(event.detail.value)}
            />
          </kt-label-input>
          <kt-button
            slot="actions"
            ref={saveButton}
            doneLabel="Saved"
            onClick={() =>
              void saveButton.current?.run(() => saveProfile({ name, email }).then(updateSession))
            }
          >
            Save
          </kt-button>
        </kt-settings-section>
        <kt-settings-section
          heading="Notifications"
          description="What we email you about, and when."
        >
          <kt-toggle checked>Email me when an invoice is paid</kt-toggle>
          <kt-toggle>Email me a weekly summary</kt-toggle>
          <kt-button
            slot="actions"
            ref={notifyButton}
            doneLabel="Saved"
            onClick={() =>
              void notifyButton.current?.run(
                () => new Promise((resolve) => setTimeout(resolve, 400)),
              )
            }
          >
            Save
          </kt-button>
        </kt-settings-section>
        <kt-settings-section
          danger
          heading="Delete workspace"
          description="Every invoice, customer and file in it goes, for good."
        >
          <kt-button slot="actions" variant="delete" onClick={() => setConfirming(true)}>
            Delete workspace
          </kt-button>
        </kt-settings-section>
      </div>
      <kt-confirm-dialog
        open={confirming}
        heading="Delete this workspace?"
        message="Everything in it goes, for good. This cannot be undone."
        confirmLabel="Delete workspace"
        onkt-cancel={() => setConfirming(false)}
        onkt-confirm={() => {
          signOut();
          navigate('/sign-in');
        }}
      />
    </>
  );
}
```

`src/pages/Welcome.tsx`:

```tsx
import { useNavigate } from 'react-router';
import { currentSession, markWelcomed } from '../auth';
import { APP_NAME, FIRST_STEPS } from '../content';

export function Welcome() {
  const navigate = useNavigate();
  return (
    <kt-empty-page
      heading={`Welcome, ${currentSession()?.name ?? 'there'}`}
      lead={`A few steps and ${APP_NAME} is ready to send invoices.`}
      steps={FIRST_STEPS}
      onkt-step={(event) => {
        if (event.detail.id === 'overview') {
          markWelcomed();
          navigate('/');
        }
      }}
    >
      <a slot="actions" href="#/" onClick={() => markWelcomed()}>
        Skip for now
      </a>
    </kt-empty-page>
  );
}
```

`src/pages/NotFound.tsx`:

```tsx
export function NotFound() {
  return <kt-error-page fill homeHref="#/" />;
}
```

- [ ] **Step 5: Run the checks**

Run: `npm run check:templates saas-react`
Expected: `ok   saas-react`. A type error naming a `kt-*` prop (`homeHref`, `pageSize`, `doneLabel`, `confirmLabel`, an `onkt-*` detail) is a gap in `kanto-ds/react/jsx`: fix it in `src/react/jsx.ts` with a test, in its own commit, before going on.

Run: `npx vitest run --project unit scripts/templates.test.ts`
Expected: PASS for every folder present.

- [ ] **Step 6: Commit**

```bash
npm run format && npm run verify
git add templates/saas-react
git commit -m "feat(templates): add the SaaS template in React"
```

---

### Task 5: `saas-vue`

**Files:**

- Create: `templates/saas-vue/{index.html,package.json,tsconfig.json,vite.config.ts,README.md,.gitignore}`
- Create: `templates/saas-vue/src/{main.ts,env.d.ts,router.ts,App.vue,AppLayout.vue}`
- Create: `templates/saas-vue/src/pages/{AuthPage.vue,WelcomePage.vue,DashboardPage.vue,CustomersPage.vue,SettingsPage.vue,NotFoundPage.vue}`
- Modify: `scripts/templates.test.ts` (turn "exists for every stack" back on)

**Interfaces:**

- Consumes: Task 1's shared files (already in `templates/saas-vue/src/`).
- Produces: a project that passes `npm run check:templates saas-vue`.

- [ ] **Step 1: Run the check to see it fail**

Run: `npm run check:templates saas-vue`
Expected: FAIL — `saas-vue: npm install failed`.

- [ ] **Step 2: The project files**

`package.json`:

```json
{
  "name": "kanto-saas-vue",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "typecheck": "vue-tsc --noEmit"
  },
  "dependencies": {
    "kanto-ds": "^1.9.0",
    "lucide": "^1.43.0",
    "vue": "^3.5.0",
    "vue-router": "^4.5.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^6.0.0",
    "typescript": "^5.9.3",
    "vite": "^7.3.6",
    "vue-tsc": "^3.0.0"
  }
}
```

`tsconfig.json`: the vanilla one, with `"include": ["src/**/*.ts", "src/**/*.vue"]`.

`vite.config.ts`:

```ts
import vue from '@vitejs/plugin-vue';
import { isKantoElement } from 'kanto-ds/vue';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [vue({ template: { compilerOptions: { isCustomElement: isKantoElement } } })],
});
```

`src/env.d.ts`:

```ts
/// <reference types="vite/client" />
```

`index.html`, `.gitignore`: the vanilla ones (`src="/src/main.ts"`). `README.md`: the vanilla one titled "… in Vue", the last rows `A page | src/pages/` and `The routes | src/router.ts (vue-router)`, and under the install block: "Vue renders Kanto's elements natively; `vite.config.ts` tells its compiler which tags they are."

- [ ] **Step 3: Entry, router and frame**

`src/main.ts`:

```ts
import 'kanto-ds/vue';
import 'kanto-ds/styles.css';
import './styles.css';
import './icons';
import { createApp } from 'vue';
import App from './App.vue';
import { applyBrand } from './brand';
import { router } from './router';

applyBrand();
createApp(App).use(router).mount('#app');
```

`src/App.vue`:

```vue
<template>
  <RouterView />
</template>
```

`src/router.ts`:

```ts
import { createRouter, createWebHashHistory } from 'vue-router';
import AppLayout from './AppLayout.vue';
import { redirectFor } from './guard';
import AuthPage from './pages/AuthPage.vue';
import CustomersPage from './pages/CustomersPage.vue';
import DashboardPage from './pages/DashboardPage.vue';
import NotFoundPage from './pages/NotFoundPage.vue';
import SettingsPage from './pages/SettingsPage.vue';
import WelcomePage from './pages/WelcomePage.vue';

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/sign-in', component: AuthPage, props: { mode: 'sign-in' } },
    { path: '/sign-up', component: AuthPage, props: { mode: 'sign-up' } },
    {
      path: '/',
      component: AppLayout,
      children: [
        { path: '', component: DashboardPage },
        { path: 'welcome', component: WelcomePage },
        { path: 'customers', component: CustomersPage },
        { path: 'settings', component: SettingsPage },
      ],
    },
    { path: '/:rest(.*)*', component: NotFoundPage, meta: { notFound: true } },
  ],
});

router.beforeEach((to) => redirectFor(to.path, !to.meta.notFound) ?? true);
```

`src/AppLayout.vue`:

```vue
<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { currentSession, signOut } from './auth';
import { APP_NAME, NAV, USER_MENU } from './content';

const route = useRoute();
const router = useRouter();
const session = currentSession();
const activeHref = computed(() => `#${route.path}`);

function onSelect(event: CustomEvent<{ id: string }>): void {
  if (event.detail.id === 'sign-out') {
    signOut();
    void router.push('/sign-in');
  } else void router.push('/settings');
}
</script>

<template>
  <kt-app-shell class="app" :label="APP_NAME">
    <div slot="header" class="app-header">
      <a class="app-brand" href="#/">{{ APP_NAME }}</a>
      <kt-user-menu
        :name="session?.name ?? ''"
        :email="session?.email ?? ''"
        :items="USER_MENU"
        @kt-select="onSelect"
      />
    </div>
    <kt-sub-menu-navigation
      slot="sidebar"
      label="Workspace"
      :sections="NAV"
      :active-href="activeHref"
    />
    <div class="page"><RouterView /></div>
  </kt-app-shell>
</template>
```

- [ ] **Step 4: The pages**

`src/pages/AuthPage.vue`:

```vue
<script setup lang="ts">
import type { KtAuthSubmitDetail } from 'kanto-ds';
import { useRouter } from 'vue-router';
import { signIn, signUp } from '../auth';
import { APP_NAME } from '../content';

defineProps<{ mode: 'sign-in' | 'sign-up' }>();
const router = useRouter();

function onSubmit(event: CustomEvent<KtAuthSubmitDetail>): void {
  const { mode: sent, values, wait } = event.detail;
  if (sent === 'sign-in') wait(signIn(values).then(() => router.push('/')));
  else if (sent === 'sign-up') wait(signUp(values).then(() => router.push('/welcome')));
  else wait(new Promise((resolve) => setTimeout(resolve, 500)));
}

function onMode(event: CustomEvent<{ mode: string }>): void {
  const next = event.detail.mode;
  if (next === 'sign-in' || next === 'sign-up') void router.push(`/${next}`);
}
</script>

<template>
  <main class="auth">
    <kt-auth-form :mode="mode" @kt-submit="onSubmit" @kt-mode="onMode">
      <a slot="logo" class="app-brand" href="#/">{{ APP_NAME }}</a>
      <p slot="footer" class="auth-note">A demo: any email and password sign in.</p>
    </kt-auth-form>
  </main>
</template>
```

`src/pages/DashboardPage.vue`:

```vue
<script setup lang="ts">
import type { KtTableRow } from 'kanto-ds';
import { onMounted, onUnmounted, ref } from 'vue';
import { APP_NAME, INVOICE_COLUMNS } from '../content';
import { getSummary, listInvoices, type Summary } from '../data/api';
import { formatMoney } from '../format';
import { invoiceRows, revenueSeries, summaryStats } from '../view';

const summary = ref<Summary | null>(null);
const invoices = ref<KtTableRow[] | null>(null);
let live = true;

onMounted(() => {
  void getSummary().then((next) => {
    if (live) summary.value = next;
  });
  void listInvoices(6).then((next) => {
    if (live) invoices.value = invoiceRows(next);
  });
});
onUnmounted(() => {
  live = false;
});
</script>

<template>
  <kt-page-header
    :eyebrow="APP_NAME"
    heading="Overview"
    description="What is billed, paid and late this month."
  />
  <div class="stats" :aria-busy="summary === null">
    <template v-if="summary">
      <kt-stat
        v-for="stat in summaryStats(summary)"
        :key="stat.key"
        :label="stat.label"
        :value="stat.value"
        :delta="stat.delta"
        :trend="stat.trend"
        :inverted="stat.inverted"
      />
    </template>
  </div>
  <section class="panel">
    <kt-chart
      type="area"
      :height="240"
      label="Billed and paid, by month"
      :labels="summary ? [...summary.months] : []"
      :series="summary ? revenueSeries(summary) : []"
      :format="formatMoney"
    />
  </section>
  <kt-table
    label="Latest invoices"
    compact
    :columns="INVOICE_COLUMNS"
    :data="invoices ?? []"
    :loading="invoices === null"
  />
</template>
```

`src/pages/CustomersPage.vue`:

```vue
<script setup lang="ts">
import type { KtTableRow } from 'kanto-ds';
import { ref, watch } from 'vue';
import { CUSTOMER_COLUMNS } from '../content';
import { getCustomer, listCustomers, type Customer } from '../data/api';
import { customerDetails, customerRows } from '../view';

const query = ref('');
const rows = ref<KtTableRow[] | null>(null);
const customer = ref<Customer | null>(null);

// onCleanup drops an answer that comes back after a later search was sent.
watch(
  query,
  (current, _previous, onCleanup) => {
    let live = true;
    onCleanup(() => {
      live = false;
    });
    rows.value = null;
    void listCustomers(current).then((customers) => {
      if (live) rows.value = customerRows(customers);
    });
  },
  { immediate: true },
);

function onInput(event: CustomEvent<{ value: string }>): void {
  query.value = event.detail.value;
}

function onRowClick(event: CustomEvent<{ row: KtTableRow }>): void {
  void getCustomer(String(event.detail.row.id)).then((found) => {
    customer.value = found ?? null;
  });
}
</script>

<template>
  <kt-page-header heading="Customers" description="Everyone you bill, and what they owe." />
  <kt-input
    class="search"
    type="search"
    icon="search"
    label="Search customers"
    placeholder="Search by name, email or company"
    @kt-input="onInput"
  />
  <!-- Keyed on the query: new results start on page 1. -->
  <kt-table
    :key="query"
    label="Customers"
    :page-size="10"
    :columns="CUSTOMER_COLUMNS"
    :data="rows ?? []"
    :loading="rows === null"
    @kt-row-click="onRowClick"
  />
  <kt-side-panel
    eyebrow="Customer"
    :heading="customer?.name ?? ''"
    :open="customer !== null"
    @kt-close="customer = null"
  >
    <kt-description-list :items="customer ? customerDetails(customer) : []" />
  </kt-side-panel>
</template>
```

`src/pages/SettingsPage.vue`:

```vue
<script setup lang="ts">
import type { KtButton } from 'kanto-ds';
import { ref, useTemplateRef } from 'vue';
import { useRouter } from 'vue-router';
import { currentSession, signOut, updateSession } from '../auth';
import { saveProfile } from '../data/api';

const router = useRouter();
const session = currentSession();
const name = ref(session?.name ?? '');
const email = ref(session?.email ?? '');
const confirming = ref(false);
const saveButton = useTemplateRef<KtButton>('saveButton');
const notifyButton = useTemplateRef<KtButton>('notifyButton');

function saveTheProfile(): void {
  void saveButton.value?.run(() =>
    saveProfile({ name: name.value, email: email.value }).then(updateSession),
  );
}

function saveNotifications(): void {
  void notifyButton.value?.run(() => new Promise((resolve) => setTimeout(resolve, 400)));
}

function deleteWorkspace(): void {
  signOut();
  void router.push('/sign-in');
}
</script>

<template>
  <kt-page-header
    heading="Settings"
    description="Your profile, what we email you about, and your workspace."
  />
  <div class="settings">
    <kt-settings-section
      heading="Profile"
      description="The name and email on every invoice you send."
    >
      <kt-label-input label="Name">
        <kt-input
          name="name"
          autocomplete="name"
          :value="name"
          @kt-input="name = $event.detail.value"
        />
      </kt-label-input>
      <kt-label-input label="Email">
        <kt-input
          name="email"
          type="email"
          autocomplete="email"
          :value="email"
          @kt-input="email = $event.detail.value"
        />
      </kt-label-input>
      <kt-button ref="saveButton" slot="actions" done-label="Saved" @click="saveTheProfile"
        >Save</kt-button
      >
    </kt-settings-section>
    <kt-settings-section heading="Notifications" description="What we email you about, and when.">
      <kt-toggle checked>Email me when an invoice is paid</kt-toggle>
      <kt-toggle>Email me a weekly summary</kt-toggle>
      <kt-button ref="notifyButton" slot="actions" done-label="Saved" @click="saveNotifications"
        >Save</kt-button
      >
    </kt-settings-section>
    <kt-settings-section
      danger
      heading="Delete workspace"
      description="Every invoice, customer and file in it goes, for good."
    >
      <kt-button slot="actions" variant="delete" @click="confirming = true"
        >Delete workspace</kt-button
      >
    </kt-settings-section>
  </div>
  <kt-confirm-dialog
    :open="confirming"
    heading="Delete this workspace?"
    message="Everything in it goes, for good. This cannot be undone."
    confirm-label="Delete workspace"
    @kt-cancel="confirming = false"
    @kt-confirm="deleteWorkspace"
  />
</template>
```

`src/pages/WelcomePage.vue`:

```vue
<script setup lang="ts">
import { useRouter } from 'vue-router';
import { currentSession, markWelcomed } from '../auth';
import { APP_NAME, FIRST_STEPS } from '../content';

const router = useRouter();
const heading = `Welcome, ${currentSession()?.name ?? 'there'}`;
const lead = `A few steps and ${APP_NAME} is ready to send invoices.`;

function onStep(event: CustomEvent<{ id: string }>): void {
  if (event.detail.id === 'overview') {
    markWelcomed();
    void router.push('/');
  }
}
</script>

<template>
  <kt-empty-page :heading="heading" :lead="lead" :steps="FIRST_STEPS" @kt-step="onStep">
    <a slot="actions" href="#/" @click="markWelcomed()">Skip for now</a>
  </kt-empty-page>
</template>
```

`src/pages/NotFoundPage.vue`:

```vue
<template>
  <kt-error-page fill home-href="#/" />
</template>
```

- [ ] **Step 5: Turn the "every stack" test back on, and run the checks**

In `scripts/templates.test.ts`, replace the `it.todo` with:

```ts
it('is a project for every stack of the SaaS template', () => {
  expect(projects).toEqual(expect.arrayContaining(['saas-react', 'saas-vue', 'saas-vanilla']));
});
```

Run: `npm run check:templates`
Expected: `ok   saas-react`, `ok   saas-vanilla`, `ok   saas-vue`, exit 0. A type error on a `kt-*` binding (`$event.detail` typed `any` is fine; a missing tag is not) is a gap in `kanto-ds/vue`: fix it in the library with a test first.

Run: `npx vitest run --project unit scripts/templates.test.ts`
Expected: PASS, every test.

- [ ] **Step 6: Commit**

```bash
npm run format && npm run verify
git add templates/saas-vue scripts/templates.test.ts
git commit -m "feat(templates): add the SaaS template in Vue"
```

---

### Task 6: `create-kanto`

**Files:**

- Create: `packages/create-kanto/{package.json,index.js,README.md}`
- Create: `packages/create-kanto/lib/{choices.js,args.js,scaffold.js,bundle.js}`
- Create: `packages/create-kanto/scripts/{bundle.js,clean.js}`
- Test: `packages/create-kanto/create-kanto.test.ts`
- Modify: `tsconfig.json` (include), `vitest.config.ts` (unit include), `eslint.config.js` (node globals for `packages/**`)

**Interfaces:**

- Consumes: `templates/<template>-<stack>/`.
- Produces: `scaffold({ template, stack, target, name?, from? }): string`, `packageName(name: string): string`, `readArgs(argv: string[]): { dir?: string; template?: string; stack?: string; yes: boolean; help: boolean }`, `bundle(from: string, to: string): string[]` (the template folders copied), `TEMPLATES`, `STACKS`; the `create-kanto` bin.

- [ ] **Step 1: Let the repository see the package**

`tsconfig.json` `include`: `["src", "demo", "scripts", "packages", "*.ts", "*.js"]`.
`vitest.config.ts` unit `include`: add `'packages/**/*.test.ts'`.
`eslint.config.js:44`: `files: ['scripts/**', 'packages/**', 'eslint.config.js'],`.

- [ ] **Step 2: Write the failing tests**

`packages/create-kanto/create-kanto.test.ts`:

```ts
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { readArgs } from './lib/args.js';
import { bundle } from './lib/bundle.js';
import { packageName, scaffold } from './lib/scaffold.js';

const repoTemplates = join(process.cwd(), 'templates');
const made: string[] = [];
const scratch = () => {
  const dir = mkdtempSync(join(tmpdir(), 'create-kanto-'));
  made.push(dir);
  return dir;
};
afterEach(() => {
  for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('scaffold', () => {
  it('copies the template, names the project, and gives it its .gitignore', () => {
    const from = scratch();
    bundle(repoTemplates, from);
    const target = join(scratch(), 'my-app');
    scaffold({ template: 'saas', stack: 'react', target, from });
    const pkg = JSON.parse(readFileSync(join(target, 'package.json'), 'utf8'));
    expect(pkg.name).toBe('my-app');
    expect(existsSync(join(target, 'src/main.tsx'))).toBe(true);
    expect(existsSync(join(target, '.gitignore'))).toBe(true);
    expect(existsSync(join(target, '_gitignore'))).toBe(false);
    expect(existsSync(join(target, 'node_modules'))).toBe(false);
  });

  it('makes a valid npm name of any folder name', () => {
    expect(packageName('My App')).toBe('my-app');
    expect(packageName('  Northwind_2026! ')).toBe('northwind_2026');
    expect(packageName('...')).toBe('kanto-app');
  });

  it('refuses a folder that is not empty', () => {
    const target = scratch();
    writeFileSync(join(target, 'notes.txt'), 'mine');
    expect(() => scaffold({ template: 'saas', stack: 'vue', target, from: repoTemplates })).toThrow(
      /not empty/,
    );
    expect(readdirSync(target)).toEqual(['notes.txt']);
  });

  it('names the choices when given one it does not have', () => {
    const target = join(scratch(), 'x');
    expect(() =>
      scaffold({ template: 'shop', stack: 'react', target, from: repoTemplates }),
    ).toThrow(/Unknown template "shop".*saas/);
    expect(() =>
      scaffold({ template: 'saas', stack: 'svelte', target, from: repoTemplates }),
    ).toThrow(/Unknown stack "svelte".*react, vue, vanilla/);
  });
});

describe('bundle', () => {
  it('copies every template, leaving builds behind and hiding .gitignore from npm', () => {
    const from = scratch();
    mkdirSync(join(from, 'saas-react', 'node_modules', 'x'), { recursive: true });
    mkdirSync(join(from, 'saas-react', 'dist'), { recursive: true });
    writeFileSync(join(from, 'saas-react', '.gitignore'), 'node_modules\n');
    writeFileSync(join(from, 'saas-react', 'package.json'), '{"name":"t"}');
    writeFileSync(join(from, 'saas-react', 'package-lock.json'), '{}');
    const to = scratch();
    expect(bundle(from, to)).toEqual(['saas-react']);
    expect(readdirSync(join(to, 'saas-react')).sort()).toEqual(['_gitignore', 'package.json']);
  });
});

describe('readArgs', () => {
  it('reads a folder and every flag', () => {
    expect(readArgs(['my-app', '--template', 'saas', '--stack', 'vue', '--yes'])).toEqual({
      dir: 'my-app',
      template: 'saas',
      stack: 'vue',
      yes: true,
      help: false,
    });
    expect(readArgs(['-h'])).toMatchObject({ help: true, yes: false });
  });
});
```

- [ ] **Step 3: Run them to see them fail**

Run: `npx vitest run --project unit packages/create-kanto`
Expected: FAIL — `Cannot find module './lib/args.js'`.

- [ ] **Step 4: Write the package**

`packages/create-kanto/package.json`:

```json
{
  "name": "create-kanto",
  "version": "1.9.0",
  "description": "Start a project on Kanto: a SaaS app in React, Vue or plain TypeScript, ready to run.",
  "type": "module",
  "bin": {
    "create-kanto": "index.js"
  },
  "files": ["index.js", "lib", "templates"],
  "engines": {
    "node": ">=20"
  },
  "scripts": {
    "prepack": "node scripts/bundle.js",
    "postpack": "node scripts/clean.js"
  },
  "keywords": ["kanto", "kanto-ds", "create", "template", "starter", "web-components"],
  "homepage": "https://kanto.arnaudmichel.fr/",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/MrArnaudMichel/kanto.git",
    "directory": "packages/create-kanto"
  },
  "license": "MIT"
}
```

`lib/choices.js`:

```js
/** What create-kanto offers. A template here needs a `templates/<id>-<stack>/` for each stack. */
export const TEMPLATES = [
  { id: 'saas', label: 'SaaS app', hint: 'sign-in, dashboard, customers, settings' },
];

export const STACKS = [
  { id: 'react', label: 'React' },
  { id: 'vue', label: 'Vue' },
  { id: 'vanilla', label: 'TypeScript, no framework' },
];
```

`lib/args.js`:

```js
import { parseArgs } from 'node:util';

/** `create-kanto [folder] [--template saas] [--stack react] [--yes]`. */
export function readArgs(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      template: { type: 'string', short: 't' },
      stack: { type: 'string', short: 's' },
      yes: { type: 'boolean', short: 'y' },
      help: { type: 'boolean', short: 'h' },
    },
  });
  return {
    dir: positionals[0],
    template: values.template,
    stack: values.stack,
    yes: values.yes ?? false,
    help: values.help ?? false,
  };
}
```

`lib/bundle.js`:

```js
import { cpSync, existsSync, readdirSync, renameSync, rmSync } from 'node:fs';
import { join, relative } from 'node:path';

const SKIPPED = /(^|[\\/])(node_modules|dist|package-lock\.json)([\\/]|$)/;

/**
 * Copies every template folder from `from` into `to`, leaving installs,
 * builds and lockfiles behind. npm drops `.gitignore` from a published
 * package, so it travels as `_gitignore`; scaffold() names it back.
 */
export function bundle(from, to) {
  rmSync(to, { recursive: true, force: true });
  const names = readdirSync(from, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  for (const name of names) {
    const source = join(from, name);
    const target = join(to, name);
    cpSync(source, target, {
      recursive: true,
      filter: (path) => !SKIPPED.test(relative(source, path)),
    });
    if (existsSync(join(target, '.gitignore'))) {
      renameSync(join(target, '.gitignore'), join(target, '_gitignore'));
    }
  }
  return names;
}
```

`lib/scaffold.js`:

```js
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STACKS, TEMPLATES } from './choices.js';

/** The templates bundled in the package, or the repository's own while developing it. */
export function templatesDir() {
  const bundled = fileURLToPath(new URL('../templates', import.meta.url));
  return existsSync(bundled)
    ? bundled
    : fileURLToPath(new URL('../../../templates', import.meta.url));
}

/** npm's rules for a name: lowercase, nothing but letters, digits and `-._~`. */
export function packageName(name) {
  const cleaned = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._~-]+/g, '-')
    .replace(/^[-._~]+|[-._~]+$/g, '');
  return cleaned || 'kanto-app';
}

/** Copies `<template>-<stack>` into `target` and makes it a project of its own. Returns `target`. */
export function scaffold({
  template,
  stack,
  target,
  name = basename(resolve(target)),
  from = templatesDir(),
}) {
  if (!TEMPLATES.some((choice) => choice.id === template)) {
    throw new Error(
      `Unknown template "${template}". Choose ${TEMPLATES.map((c) => c.id).join(', ')}.`,
    );
  }
  if (!STACKS.some((choice) => choice.id === stack)) {
    throw new Error(`Unknown stack "${stack}". Choose ${STACKS.map((c) => c.id).join(', ')}.`);
  }
  const source = join(from, `${template}-${stack}`);
  if (!existsSync(source)) throw new Error(`There is no ${template} template for ${stack} yet.`);
  if (existsSync(target) && readdirSync(target).length > 0) {
    throw new Error(`${target} is not empty. Choose a new folder, or empty this one.`);
  }

  mkdirSync(target, { recursive: true });
  cpSync(source, target, {
    recursive: true,
    filter: (path) =>
      !/(^|[\\/])(node_modules|dist|package-lock\.json)([\\/]|$)/.test(relative(source, path)),
  });
  if (existsSync(join(target, '_gitignore'))) {
    renameSync(join(target, '_gitignore'), join(target, '.gitignore'));
  }
  const manifest = join(target, 'package.json');
  const pkg = JSON.parse(readFileSync(manifest, 'utf8'));
  pkg.name = packageName(name);
  writeFileSync(manifest, `${JSON.stringify(pkg, null, 2)}\n`);
  return target;
}
```

`index.js`:

```js
#!/usr/bin/env node
/**
 * npm create kanto@latest [folder] [-- --template saas --stack react --yes]
 *
 * Asks for what it was not told, copies the template, and says what to run.
 */
import { relative, resolve } from 'node:path';
import { stdin, stdout } from 'node:process';
import { createInterface } from 'node:readline/promises';
import { readArgs } from './lib/args.js';
import { STACKS, TEMPLATES } from './lib/choices.js';
import { scaffold } from './lib/scaffold.js';

const HELP = `Start a project on Kanto.

  npm create kanto@latest [folder] -- [options]

  -t, --template   ${TEMPLATES.map((choice) => choice.id).join(' | ')}
  -s, --stack      ${STACKS.map((choice) => choice.id).join(' | ')}
  -y, --yes        take the first choice for anything not given
  -h, --help       this
`;

/** A numbered list; Enter takes the first. Accepts the number or the id. */
async function choose(rl, question, choices) {
  console.log(`\n${question}`);
  choices.forEach((choice, i) =>
    console.log(`  ${i + 1}. ${choice.label}${choice.hint ? ` — ${choice.hint}` : ''}`),
  );
  for (;;) {
    const answer = (await rl.question(`Choose 1–${choices.length} (1): `)).trim();
    if (!answer) return choices[0].id;
    const picked = choices[Number(answer) - 1] ?? choices.find((choice) => choice.id === answer);
    if (picked) return picked.id;
    console.log(`  "${answer}" is not one of them.`);
  }
}

async function main() {
  const args = readArgs(process.argv.slice(2));
  if (args.help) {
    console.log(HELP);
    return;
  }
  const rl = args.yes ? null : createInterface({ input: stdin, output: stdout });
  try {
    const asked = rl && !args.dir ? (await rl.question('Project folder (kanto-app): ')).trim() : '';
    const dir = args.dir ?? (asked || 'kanto-app');
    const template =
      args.template ?? (rl ? await choose(rl, 'Template', TEMPLATES) : TEMPLATES[0].id);
    const stack = args.stack ?? (rl ? await choose(rl, 'Stack', STACKS) : STACKS[0].id);
    const target = scaffold({ template, stack, target: resolve(dir) });
    const where = relative(process.cwd(), target) || '.';
    console.log(`\nDone. Next:\n\n  cd ${where}\n  npm install\n  npm run dev\n`);
  } finally {
    rl?.close();
  }
}

main().catch((error) => {
  console.error(`\n✗ ${error.message}\n`);
  process.exit(1);
});
```

`scripts/bundle.js`:

```js
import { fileURLToPath } from 'node:url';
import { bundle } from '../lib/bundle.js';

const from = fileURLToPath(new URL('../../../templates', import.meta.url));
const to = fileURLToPath(new URL('../templates', import.meta.url));
console.log(`create-kanto: bundled ${bundle(from, to).join(', ')}`);
```

`scripts/clean.js`:

```js
import { rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

rmSync(fileURLToPath(new URL('../templates', import.meta.url)), { recursive: true, force: true });
```

`README.md`:

````md
# create-kanto

Start a project on [Kanto](https://kanto.arnaudmichel.fr): a SaaS app — sign
in, a first-run checklist, a dashboard, customers, settings — in React, Vue or
TypeScript without a framework.

```bash
npm create kanto@latest
```

Or say it all at once:

```bash
npm create kanto@latest my-app -- --template saas --stack react
```

| Option           | Values                        |
| ---------------- | ----------------------------- |
| `-t, --template` | `saas`                        |
| `-s, --stack`    | `react`, `vue`, `vanilla`     |
| `-y, --yes`      | the first choice for the rest |

Each template is also in the repository, to fork as it is:
`npx degit MrArnaudMichel/kanto/templates/saas-react my-app`.
````

- [ ] **Step 5: Run the tests**

Run: `npx vitest run --project unit packages/create-kanto`
Expected: PASS.

- [ ] **Step 6: Try it the way someone would**

```bash
cd packages/create-kanto && npm pack --dry-run 2>&1 | grep -E "templates/saas-(react|vue|vanilla)/package.json|_gitignore" ; cd ../..
node packages/create-kanto/index.js /tmp/kanto-try --template saas --stack vanilla --yes && ls -a /tmp/kanto-try && rm -rf /tmp/kanto-try
```

Expected: the dry run lists the three templates' `package.json` and their `_gitignore`, and nothing under `node_modules`; the scaffold prints "Done. Next:" and the folder holds `.gitignore`, `package.json`, `src`.

- [ ] **Step 7: Commit**

```bash
npm run format && npm run verify
git add packages/create-kanto tsconfig.json vitest.config.ts eslint.config.js
git commit -m "feat(create-kanto): start a project from a template in one command"
```

---

### Task 7: Releases carry `create-kanto`, and CI runs the templates

**Files:**

- Create: `scripts/bump-templates.js`, `scripts/bump-templates.test.ts`
- Modify: `scripts/release.js` (the `npm version` block), `.github/workflows/ci.yml`, `.github/workflows/publish.yml`, `CHANGELOG.md`

**Interfaces:**

- Consumes: `templates/*/package.json`, `packages/create-kanto/package.json`.
- Produces: `bumpTemplates(root: string, version: string): string[]` — the paths it changed, relative to `root`.

- [ ] **Step 1: Write the failing test**

`scripts/bump-templates.test.ts`:

```ts
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { bumpTemplates } from './bump-templates.js';

let root = '';
afterEach(() => rmSync(root, { recursive: true, force: true }));

const write = (path: string, value: unknown) => {
  mkdirSync(join(root, path, '..'), { recursive: true });
  writeFileSync(join(root, path), `${JSON.stringify(value, null, 2)}\n`);
};
const read = (path: string) => JSON.parse(readFileSync(join(root, path), 'utf8'));

describe('bumpTemplates', () => {
  it('gives create-kanto the version, and every template its minor', () => {
    root = mkdtempSync(join(tmpdir(), 'bump-'));
    write('packages/create-kanto/package.json', { name: 'create-kanto', version: '1.9.0' });
    write('templates/saas-react/package.json', {
      dependencies: { 'kanto-ds': '^1.9.0', react: '^19.2.0' },
    });
    write('templates/saas-vue/package.json', { dependencies: { 'kanto-ds': '^1.10.0' } });

    expect(bumpTemplates(root, '1.10.0').sort()).toEqual([
      'packages/create-kanto/package.json',
      'templates/saas-react/package.json',
    ]);
    expect(read('packages/create-kanto/package.json').version).toBe('1.10.0');
    expect(read('templates/saas-react/package.json').dependencies).toEqual({
      'kanto-ds': '^1.10.0',
      react: '^19.2.0',
    });
  });

  it('keeps a prerelease range on the prerelease itself', () => {
    root = mkdtempSync(join(tmpdir(), 'bump-'));
    write('packages/create-kanto/package.json', { version: '1.9.0' });
    write('templates/saas-react/package.json', { dependencies: { 'kanto-ds': '^1.9.0' } });
    bumpTemplates(root, '2.0.0-beta.1');
    expect(read('templates/saas-react/package.json').dependencies['kanto-ds']).toBe(
      '^2.0.0-beta.1',
    );
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run --project unit scripts/bump-templates.test.ts`
Expected: FAIL — `Cannot find module './bump-templates.js'`.

- [ ] **Step 3: Write it**

`scripts/bump-templates.js`:

```js
/**
 * On a release, create-kanto takes the library's version, and every template
 * asks for that minor of kanto-ds — so a project made today installs the
 * release it was tested against, and the fixes after it.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/** @returns {string[]} The files changed, relative to `root`. */
export function bumpTemplates(root, version) {
  const [major, minor] = version.split('.');
  const range = version.includes('-') ? `^${version}` : `^${major}.${minor}.0`;
  const changed = [];
  const update = (path, edit) => {
    const file = join(root, path);
    const before = readFileSync(file, 'utf8');
    const pkg = JSON.parse(before);
    edit(pkg);
    const after = `${JSON.stringify(pkg, null, 2)}\n`;
    if (after !== before) {
      writeFileSync(file, after);
      changed.push(path);
    }
  };

  update('packages/create-kanto/package.json', (pkg) => {
    pkg.version = version;
  });
  const templates = join(root, 'templates');
  for (const name of existsSync(templates) ? readdirSync(templates) : []) {
    const path = `templates/${name}/package.json`;
    if (!existsSync(join(root, path))) continue;
    update(path, (pkg) => {
      if (pkg.dependencies?.['kanto-ds']) pkg.dependencies['kanto-ds'] = range;
    });
  }
  return changed;
}
```

- [ ] **Step 4: Run it**

Run: `npx vitest run --project unit scripts/bump-templates.test.ts`
Expected: PASS.

- [ ] **Step 5: Wire it into the release**

In `scripts/release.js`, import it at the top:

```js
import { bumpTemplates } from './bump-templates.js';
```

and replace the `else` branch of `if (current === version)`:

```js
} else {
  run('npm', ['version', version, '--no-git-tag-version']);
  const bumped = bumpTemplates(root, version);
  run('git', [
    'commit',
    '-m',
    `chore(release): ${version}`,
    '--',
    'package.json',
    'package-lock.json',
    ...bumped,
  ]);
  step(`Committed chore(release): ${version}${bumped.length ? `, with ${bumped.length} template file(s)` : ''}`);
}
```

- [ ] **Step 6: CI runs the templates**

Append a job to `.github/workflows/ci.yml` under `jobs:`:

```yaml
templates:
  name: Templates
  runs-on: ubuntu-latest

  steps:
    - uses: actions/checkout@v7

    - uses: actions/setup-node@v7
      with:
        node-version: 22
        cache: npm

    - run: npm ci

    - name: Install Chromium
      run: npx playwright install --with-deps chromium

    # Each template installs its own dependencies from the registry and the
    # library from the package `npm pack` makes, then builds and is walked
    # in Chromium (scripts/template-smoke.js).
    - name: Build the library
      run: npm run build

    - name: Check every template
      run: npm run check:templates
```

In `.github/workflows/publish.yml`, after "Check the tag matches package.json" and before "Publish":

```yaml
# A template that does not build would reach people through create-kanto.
- name: Check the templates
  run: npm run build && npm run check:templates
```

and after the "Publish" step:

```yaml
# create-kanto follows the library, at the same version. Its first
# publish is made by hand (trusted publishing needs the package to exist);
# until then this step only says so.
- name: Publish create-kanto
  working-directory: packages/create-kanto
  env:
    PRERELEASE: ${{ github.event.release.prerelease }}
  run: |
    if ! npm view create-kanto version > /dev/null 2>&1; then
      echo "::notice::create-kanto is not on npm yet: publish it once by hand, then link it to this workflow."
      exit 0
    fi
    if [ "$PRERELEASE" = "true" ]; then npm publish --tag next; else npm publish; fi
```

- [ ] **Step 7: The changelog**

At the top of `CHANGELOG.md`, above `## [1.9.0]`:

```md
## [Unreleased]

### Added

**`create-kanto`** — start a project on Kanto in one command:
`npm create kanto@latest`.

- The SaaS template — sign in, first steps, a dashboard, customers and
  settings — in React, Vue and TypeScript without a framework, each a
  project of its own in `templates/`, to scaffold or to fork.
- Every template is installed against the published package, built and
  walked in a browser in CI and before every release.
```

- [ ] **Step 8: Run everything, then commit**

Run: `npm run format && npm run verify`
Expected: PASS (the docs site's release page skips `[Unreleased]`; `release:dry` would refuse it, which is right until phase 3 dates it).

Run: `npm run check:templates`
Expected: three `ok` lines.

```bash
git add scripts/bump-templates.js scripts/bump-templates.test.ts scripts/release.js .github/workflows/ci.yml .github/workflows/publish.yml CHANGELOG.md
git commit -m "build(templates): releases carry create-kanto, and CI walks every template"
```

---

## Phase 1 is done when

- `npm run verify` passes; `npm run check:templates` prints `ok` for `saas-react`, `saas-vue`, `saas-vanilla`.
- `node packages/create-kanto/index.js <dir> --template saas --stack <each> --yes` makes a project whose `npm install && npm run build` succeeds.
- The branch `feat/templates` holds Tasks 1–7 as the commits above; nothing is pushed or published.
