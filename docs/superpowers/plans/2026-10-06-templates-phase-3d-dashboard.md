# Templates, phase 3d — Dashboard × 3 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Dashboard template — the Console demo's eleven screens as a forkable admin console — in React, Vue and TypeScript, make it with `create-kanto`, run it on its template page, and retire the console demo.

**Architecture:** As the other templates: `templates/dashboard-<stack>/`. Everything that does not depend on the stack is shared and tested once — the data (`src/data/`: the demo's generators and each screen's fixtures), the navigation (`src/nav.ts`: the three-level sidebar, the ⌘K commands, the routes), and the formatting. Each stack renders the shell and the eleven screens, ported from `demo/apps/console/*.ts` and `demo/apps/shell.ts` — the demo is the reference for what each screen shows and does. Hash routes; `react-router`, `vue-router`, and a hash router in vanilla, as SaaS.

**Tech Stack:** as phase 3c; the console's components, as the demo uses them (its sidebar is its own `<aside>`, not `kt-app-shell`): `kt-sub-menu-navigation`, `kt-command-palette`, `kt-kbd`, `kt-dropdown`, `kt-page-header`, `kt-stat`, `kt-chart`, `kt-table`, `kt-pagination`, `kt-select`, `kt-multi-select`, `kt-side-panel`, `kt-confirm-dialog`, `kt-modal`, `kt-tabs`, `kt-timeline`, `kt-toggle-button-group`, `kt-segmented-control`, `kt-drag-drop`, `kt-form`, `kt-label-input`, `kt-input`, `kt-textarea`, `kt-toggle`, `kt-alert`, `kt-card`, `kt-badge`, `kt-avatar`, `kt-icon`, `kt-empty-state`, `kt-skeleton`, `kt-meter`, `kt-progress-bar`, `kt-tooltip`.

**Spec:** `docs/superpowers/specs/2026-10-05-templates-design.md`

## Global Constraints

- `templates/dashboard-{react,vue,vanilla}`: standalone Vite + TS, `kanto-ds@^1.9.0`, scripts `dev`/`build`/`preview`/`typecheck`, README, `.gitignore`, no lockfile, brand in `src/brand.ts`.
- The eleven routes, the same in every stack: `#/` (home), `#/inbox`, `#/customers`, `#/files`, `#/activity`, `#/integrations`, `#/settings/general`, `#/settings/members/people`, `#/settings/members/roles`, `#/settings/notifications`, `#/settings/security`; anything else → `kt-error-page`.
- Each screen's root carries `class="screen screen-<name>"` (`home`, `inbox`, `customers`, `files`, `activity`, `integrations`, `general`, `people`, `roles`, `notifications`, `security`) — the walk's markers.
- Behaviour follows the demo screen it ports; data comes from `src/data/` only (the one place a fork points at its back end, through `src/data/api.ts`).
- The sidebar is `kt-sub-menu-navigation` with the three-level branch under Administration; ⌘K opens `kt-command-palette` with a command per route.
- Every string reaches the vanilla DOM as text or properties, never `innerHTML` with data.
- The walk selects by role, name, class and order (phase 3b's lesson).
- The demo goes when the template lands: `#/app/console/*` and `#/apps/console-home` lead to `#/templates/dashboard`; the docs no longer import `demo/apps/console/` or `demo/apps/shell.ts`.
- Commits only after `npm run verify`; Arnaud Michel's name, no trailer; branch `feat/templates`.

## Review Focus

1. **Every route renders in every stack** — the walk visits all eleven. (Task 2's walk.)
2. **⌘K from any screen** — opens the palette; choosing a command navigates and closes it. (Walk.)
3. **The nested settings branch** — a deep route opens its branch in the sidebar and marks it current. (Walk checks `#/settings/members/roles`.)
4. **Destructive actions ask first** — deleting customers in bulk, removing a member. (Walk: bulk delete opens `kt-confirm-dialog`; cancel keeps the rows.)
5. **A phone** — the sidebar becomes a drawer; no sideways scroll on any screen. (Walk, at 390px, on home and customers.)

---

### Task 1: Dashboard's shared core

**Files:** in `templates/dashboard-vanilla/src/`, copied identically to `dashboard-react/src/` and `dashboard-vue/src/`: `data/generate.ts` (ported from `demo/lib/data.ts`), `data/fixtures.ts` (each screen's constants, moved out of `demo/apps/console/*.ts`: mail, files, events, integrations, members, roles, notification settings, sessions), `data/api.ts` (async functions over them, as SaaS's), `nav.ts`, `format.ts`, `brand.ts`, `icons.ts`, `styles.css` (the console's layout rules from `demo/apps.css` that the screens use, under the `screen-*` and shell class names). Modify `scripts/templates.test.ts`.

**Interfaces — Produces:**

- `nav.ts`: `ROUTES: { path: string; title: string; screen: string }[]` (the eleven), `NAV: KtNavSection[]` (Workspace, System, Administration › Settings › General, Members › People, Roles; Notifications; Security — as `demo/apps/shell.ts`), `COMMANDS: KtCommand[]` (one per route, id = path), `routeFor(path): Route | undefined`, `titleFor(path): string`.
- `data/api.ts`: one async function per screen's data (`getOverview`, `listMail`, `listCustomers(query)`, `listFiles`, `listEvents(filter)`, `listIntegrations`, `listMembers`, `listRoles`, …), each resolving after a short delay.

- [ ] **Step 1: The failing tests.** `SHARED` gains `dashboard` with the shared files; and:

```ts
describe('the dashboard', () => {
  it('has a command and a nav link for every route, and a route for every link', async () => {
    const { COMMANDS, NAV, ROUTES } = await import('../templates/dashboard-vanilla/src/nav');
    const paths = ROUTES.map((route) => route.path);
    expect(paths).toHaveLength(11);
    expect(COMMANDS.map((command) => command.id).sort()).toEqual([...paths].sort());
    const hrefs: string[] = [];
    const walk = (items: readonly { href?: string; children?: readonly unknown[] }[]) => {
      for (const item of items) {
        if (item.href) hrefs.push(item.href.replace(/^#/, ''));
        if (item.children) walk(item.children as never);
      }
    };
    for (const section of NAV) walk(section.items);
    expect(hrefs.sort()).toEqual([...paths].sort());
  });

  it('reaches settings three levels deep', async () => {
    const { NAV } = await import('../templates/dashboard-vanilla/src/nav');
    const admin = NAV.find((section) => section.title === 'Administration')!;
    const settings = admin.items.find((item) => item.label === 'Settings')!;
    const members = settings.children!.find((item) => item.label === 'Members')!;
    expect(members.children!.map((item) => item.href)).toEqual([
      '#/settings/members/people',
      '#/settings/members/roles',
    ]);
  });

  it('generates the same customers every time, and filters them', async () => {
    vi.useFakeTimers();
    const { listCustomers } = await import('../templates/dashboard-vanilla/src/data/api');
    const first = listCustomers('');
    const second = listCustomers('');
    await vi.runAllTimersAsync();
    expect((await first).length).toBeGreaterThan(50);
    expect(await first).toEqual(await second);
    const some = listCustomers('north');
    await vi.runAllTimersAsync();
    expect((await some).every((row) => JSON.stringify(row).toLowerCase().includes('north'))).toBe(
      true,
    );
    vi.useRealTimers();
  });
});
```

Run → FAIL (`dashboard-vanilla/src/nav` does not resolve).

- [ ] **Step 2: The shared files**, ported: `generate.ts` from `demo/lib/data.ts` (generators, types, formatters — the parts the screens use); `fixtures.ts` gathering each console screen's data constants verbatim; `api.ts` wrapping them; `nav.ts` from `demo/apps/shell.ts`'s `NAV` and command list, with hrefs `#/…` (not `#/app/console/…`); `format.ts`; `brand.ts` as the other templates'; `icons.ts` registering every Lucide icon the screens and nav name (find them with `grep -ohE "icon[=:] ?['\"][a-z0-9-]+" demo/apps/console demo/apps/shell.ts | sort -u`, then map kebab-case names to Lucide exports); `styles.css` from the console's rules in `demo/apps.css`.
- [ ] **Step 3: Watch them pass.** `npx vitest run --project unit scripts/templates.test.ts` → PASS.
- [ ] **Step 4: No commit yet** — commits with Task 2 (phase 3a ruling).

---

### Task 2: `dashboard-vanilla`, and its walk

**Files:** project files as `saas-vanilla`'s, name `kanto-dashboard-vanilla`, title "Northwind — operations console"; `src/main.ts`, `src/router.ts` (SaaS's), `src/shell.ts`, `src/screens/{home,inbox,customers,files,activity,integrations,settings}.ts`; `scripts/template-smoke.js`.

- [ ] **Step 1: The walk.** Add to `SMOKES`:

```js
  async dashboard(page, base) {
    const until = (check, arg) => page.waitForFunction(check, arg, { timeout: TIMEOUT });
    const screens = [
      ['/', 'home'],
      ['/inbox', 'inbox'],
      ['/customers', 'customers'],
      ['/files', 'files'],
      ['/activity', 'activity'],
      ['/integrations', 'integrations'],
      ['/settings/general', 'general'],
      ['/settings/members/people', 'people'],
      ['/settings/members/roles', 'roles'],
      ['/settings/notifications', 'notifications'],
      ['/settings/security', 'security'],
    ];
    for (const [path, name] of screens) {
      await page.goto(`${base}#${path}`);
      await until((marker) => document.querySelector(`.screen-${marker}`) !== null, name);
    }

    // A deep route opens its branch and marks its link.
    await until(() => {
      const nav = document.querySelector('kt-sub-menu-navigation');
      return nav?.shadowRoot?.querySelector('[aria-current="page"]')?.textContent?.includes('Security') === true;
    });

    // ⌘K, a command, and the palette closes on the screen it chose.
    await page.keyboard.press('Control+k');
    await until(() => document.querySelector('kt-command-palette')?.open === true);
    await page.keyboard.type('Customers');
    await page.keyboard.press('Enter');
    await until(() => location.hash === '#/customers' && document.querySelector('.screen-customers') !== null);
    await until(() => document.querySelector('kt-command-palette')?.open === false);

    // Bulk delete asks first; cancelling keeps every row.
    await until(() => (document.querySelector('.screen-customers kt-table')?.data ?? []).length > 0);
    const before = await page.evaluate(() => document.querySelector('.screen-customers kt-table').data.length);
    await page.locator('.screen-customers kt-table tbody tr').first().locator('input[type="checkbox"]').check();
    await page.getByRole('button', { name: /delete/i }).first().click();
    await until(() => document.querySelector('kt-confirm-dialog')?.open === true);
    await page.keyboard.press('Escape');
    await until(
      (count) => document.querySelector('kt-confirm-dialog')?.open === false &&
        document.querySelector('.screen-customers kt-table').data.length === count,
      before,
    );

    // A phone: no sideways scroll on the overview or the customers.
    await page.setViewportSize({ width: 390, height: 800 });
    for (const path of ['/', '/customers']) {
      await page.goto(`${base}#${path}`);
      await until(() => document.documentElement.scrollWidth <= window.innerWidth);
    }
  },
```

Run `npm run build && npm run check:templates dashboard-vanilla` → FAIL.

- [ ] **Step 2: The project files** and README ("Northwind — an operations console on Kanto…"; table: data `src/data/api.ts`, navigation and commands `src/nav.ts`, brand, a screen `src/screens/`, the shell `src/shell.ts`).
- [ ] **Step 3: The app.** `shell.ts` ports `demo/apps/shell.ts`: the sidebar (brand, search button opening the palette, `kt-sub-menu-navigation flush` with `NAV` and `active-href`, collapse toggle, the footer — storage meter, region, the account), the top bar, `kt-command-palette` with `COMMANDS` (⌘K anywhere; `kt-select` navigates to the command's id), the cookie bar. The demo's own `<aside>` layout is kept (collapsible rail, footer); on a phone it becomes a drawer behind a menu button. Each `screens/<name>.ts` ports its demo screen (same sections, same interactions — filters, selection, side panels, dialogs, forms that validate, toasts), reading from `data/api.ts`, its root `div.screen.screen-<name>`. Settings is one file exporting five screens.
- [ ] **Step 4: Watch it pass, and look.** `npm run check:templates dashboard-vanilla` → `ok`. Build the demo, preview `templates/dashboard/`, screenshot every route at 1400px and home and customers at 390px; compare each with the demo's screen in the current docs (`#/app/console/…`) and fix what differs.
- [ ] **Step 5: Commit, with Task 1.** `npm run format && npm run verify`; `git add templates/dashboard-* scripts/templates.test.ts scripts/template-smoke.js && git commit -m "feat(templates): add the dashboard without a framework, on a shared core"`.

---

### Task 3: `dashboard-react`

**Files:** project files as `saas-react`'s (with `react-router`), name `kanto-dashboard-react`; `src/main.tsx`, `src/router.tsx`, `src/Shell.tsx`, `src/screens/{Home,Inbox,Customers,Files,Activity,Integrations,Settings}.tsx`.

- [ ] Steps as SaaS React: see it fail; project files and README; the app with the same structure, classes and markers as Task 2 (`createHashRouter`, the shell as the layout route, settings' five screens as child routes); watch `npm run check:templates dashboard-react` pass (library type gaps fixed first, with a test, own commit); commit "feat(templates): add the dashboard in React".

---

### Task 4: `dashboard-vue`

**Files:** project files as `saas-vue`'s (with `vue-router`), name `kanto-dashboard-vue`; `src/main.ts`, `src/env.d.ts`, `src/router.ts`, `src/App.vue`, `src/Shell.vue`, `src/screens/*.vue`.

- [ ] Steps as above; `npm run check:templates` → fifteen `ok`; commit "feat(templates): add the dashboard in Vue".

---

### Task 5: Dashboard in the tool and on the site; the console demo goes

**Files:** `packages/create-kanto/{lib/choices.js,README.md,package.json}` (`dashboard` after `saas`, matching the catalog's order: saas, dashboard, landing, chat, portfolio), `demo/lib/templates.ts` (`project: true`, `demo: './templates/dashboard/#/'`, description, tryIt — ⌘K, the nested settings, bulk delete —, routes, files, components, two screens shot from the build: `dashboard-home.png` path `templates/dashboard/#/`, `dashboard-customers.png` path `templates/dashboard/#/customers`), its test (dashboard's demo is the build), `demo/main.ts` (remove the console from `APPS` and its settings loader; `RETIRED_DEMOS` sends `#/app/console/<anything>` to `#/templates/dashboard`), `demo/shell.test.ts` (the old pages lead there: `#/app/console/home`, `#/app/console/settings/security`, `#/apps/console-home`), `demo/apps.test.ts` (the console's routes go; if nothing remains, delete the file and its fixtures), `demo/pages/home.ts` and `demo/lib/` (anything still linking `#/app/console`), `CHANGELOG.md`; delete `demo/apps/console/`, `demo/apps/shell.ts`, the console's CSS in `demo/apps.css` (and the dead CSS of the landing, chat and portfolio demos — the deferred minors of phases 3a–3c), `demo/public/templates/dashboard-home.png` (re-shot).

- [ ] Steps: failing tests (catalog, redirects); the tool; the catalog; the demo goes (with a check that `check:demo`'s "the demo apps load on their own" still holds or is retired with the apps, and that the home stage still renders); shoot and read the screens; the changelog names Dashboard; `npm run format && npm run verify && npm run check:templates`; commit "feat(templates): Dashboard in create-kanto and on the site; the console demo goes".

## Phase 3d is done when

- `npm run check:templates` prints fifteen `ok` lines; `npm run verify` passes.
- `#/templates/dashboard` runs the template; every old console URL leads there; no demo app remains in `demo/apps/`.
