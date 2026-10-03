import { html, nothing, render, type TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { toaster } from 'kanto-ds';
import 'kanto-ds';
import 'kanto-ds/styles.css';
import './shell.css';
import './apps.css';
import './home.css';

import { COMPONENTS } from './lib/registry.js';
import { INSTALL_COMMAND, REPO_URL, VERSION_TAG } from './lib/project.js';
import { commandTarget, siteCommands } from './lib/site-search.js';
import { visibleSections, visibleSpan } from './lib/progress.js';
import { newComponents, parseChangelog } from './lib/releases.js';
import { lazyLoader } from './lib/lazy.js';
import { setRenderer } from './lib/render.js';
import { componentPage, markdownPage, type DocPage } from './pages/component.js';
import { appPage } from './pages/app.js';
import { releasePage } from './pages/release.js';
import { AI_AGENTS, APPEARANCE, INTRODUCTION, INSTALLATION, TOOLS } from './pages/guide.js';
import { foundationsPage } from './pages/foundations.js';
import { homePage } from './pages/home.js';
import { templatePage, templateScreen } from './pages/template.js';
import type { SettingsSection } from './apps/console/settings.js';
import { TEMPLATES } from './templates/index.js';
import { registerDocsIcons } from './lib/icons.js';
import { resetStage } from './lib/stage.js';
import { resetReasons } from './lib/reasons.js';
import {
  applyDocsAppearance,
  customiseMenu,
  readDocsAppearance,
  type DocsAppearance,
} from './lib/appearance.js';
import { markInviteSeen, readInviteSeen, shouldInvite } from './lib/invite.js';

import tokensDoc from '../src/tokens/README.md?raw';
import frameworksDoc from '../docs/frameworks.md?raw';
import changelogDoc from '../CHANGELOG.md?raw';

// The docs draw on more icons than the library ships; this registers those, only.
registerDocsIcons();

/* ------------------------------------------------------------------ routes */

type Section = 'home' | 'guide' | 'components' | 'templates' | 'apps' | 'release';

interface Route {
  readonly section: Section;
  readonly slug: string;
  readonly label: string;
  readonly group: string;
  readonly page: () => DocPage | TemplateResult;
}

const SHOWCASE = [
  {
    slug: 'console/home',
    label: 'Console',
    description: 'An eleven-screen operations product sharing one shell.',
    notes: `## What it is

An operations console: a dashboard, a mailbox, a customer table, a file
browser, an audit log, integrations and five settings screens, all hanging off
one shell.

## What to try

- The sidebar nests three levels deep under **Administration**, and it is
  \`<kt-sub-menu-navigation>\` doing it rather than markup written for this
  screen. Navigate to a nested page and watch the branch open itself.
- **⌘K** anywhere opens the command palette.
- Collapse the sidebar from the top bar: labels are hidden, not clipped.
- On **Customers**, tick some rows to raise the bulk bar, then delete — it asks
  first.
`,
  },
  {
    slug: 'landing',
    label: 'Landing page',
    description: 'Marketing, from the same elements.',
    notes: `## What it is

A marketing page, to check that a system built for data-dense tools can still
say hello: long measure, generous rhythm, one message per band.

## What to try

- The pricing control really swaps the plans.
- The FAQ is \`<kt-collapsible>\`, a disclosure rather than an accordion —
  opening one answer does not close the one you were comparing it to.
`,
  },
  {
    slug: 'chat',
    label: 'Assistant',
    description: 'A conversational workspace.',
    notes: `## What it is

An assistant with the parts a real one has: a thread list, sources beside the
answer, tool calls that show their work, and a composer with attachments and a
model picker.

## What to try

- Ask anything — replies stream a token at a time, and the transcript stays
  pinned to the bottom while they do.
- Open a **tool call** to see the arguments and the result.
- The sources rail on the right follows the turn you are reading.
`,
  },
  {
    slug: 'portfolio',
    label: 'Portfolio',
    description: 'A personal site — long measure, few controls.',
    notes: `## What it is

The third kind of screen, after the console and the marketing page: typography
rather than density, one thing said at a time.

## What to try

- Filter the work, then open a case study — the panel carries a
  \`<kt-timeline>\`, the same element as the career list on the page.
- The contact form validates before it pretends to send.
`,
  },
];

const GUIDE: Route[] = [
  {
    section: 'guide',
    slug: 'introduction',
    label: 'Introduction',
    group: 'Get started',
    page: () => markdownPage(INTRODUCTION, 'demo/pages/guide.ts'),
  },
  {
    section: 'guide',
    slug: 'installation',
    label: 'Installation',
    group: 'Get started',
    page: () => markdownPage(INSTALLATION, 'demo/pages/guide.ts'),
  },
  {
    section: 'guide',
    slug: 'frameworks',
    label: 'Frameworks',
    group: 'Get started',
    page: () => markdownPage(frameworksDoc, 'docs/frameworks.md'),
  },
  {
    section: 'guide',
    slug: 'ai-agents',
    label: 'AI agents',
    group: 'Get started',
    page: () => markdownPage(AI_AGENTS, 'demo/pages/guide.ts'),
  },
  {
    section: 'guide',
    slug: 'tools',
    label: 'Editors',
    group: 'Get started',
    page: () => markdownPage(TOOLS, 'demo/pages/guide.ts'),
  },
  {
    section: 'guide',
    slug: 'foundations',
    label: 'Foundations',
    group: 'Design',
    page: foundationsPage,
  },
  {
    section: 'guide',
    slug: 'tokens',
    label: 'Token layer',
    group: 'Design',
    page: () => markdownPage(tokensDoc, 'src/tokens/README.md', 'Design'),
  },
  {
    section: 'guide',
    slug: 'appearance',
    label: 'Appearance',
    group: 'Design',
    page: () => markdownPage(APPEARANCE, 'demo/pages/guide.ts'),
  },
];

const RELEASE: Route[] = [
  {
    section: 'release',
    slug: 'releases',
    label: 'Releases',
    group: 'Release',
    page: () => releasePage(changelogDoc),
  },
];

const COMPONENT_ROUTES: Route[] = COMPONENTS.map((entry) => ({
  section: 'components' as const,
  slug: entry.slug,
  label: entry.slug.replace(/^kt-/, ''),
  group: entry.group,
  page: () => componentPage(entry),
}));

const APP_ROUTES: Route[] = SHOWCASE.map((entry) => ({
  section: 'apps' as const,
  slug: entry.slug.replace(/\//g, '-'),
  label: entry.label,
  group: 'Applications',
  page: () => appPage(entry),
}));

/** The front door: rendered full width, without the sidebar or contents. */
const HOME: Route = {
  section: 'home',
  slug: '',
  label: 'Home',
  group: '',
  page: () => html``,
};

const TEMPLATE_ROUTES: Route[] = TEMPLATES.map((template) => ({
  section: 'templates' as const,
  slug: template.slug,
  label: template.name,
  group: 'Templates',
  page: () => templatePage(template, update),
}));

const ROUTES: Route[] = [
  HOME,
  ...GUIDE,
  ...COMPONENT_ROUTES,
  ...TEMPLATE_ROUTES,
  ...APP_ROUTES,
  ...RELEASE,
];

/**
 * Components flagged "New" in the navigation: introduced under Added in a
 * release of the last two months. Read from the changelog, so writing a new
 * element's entry is what flags it, and time is what clears it.
 */
const NEW_COMPONENTS = newComponents(parseChangelog(changelogDoc), new Date());

const SECTIONS: { id: Section; label: string; icon: string }[] = [
  { id: 'guide', label: 'Guide', icon: 'book-open' },
  { id: 'components', label: 'Components', icon: 'component' },
  { id: 'templates', label: 'Templates', icon: 'layout-template' },
  { id: 'apps', label: 'Apps', icon: 'app-window' },
  { id: 'release', label: 'Release', icon: 'tag' },
];

/**
 * The full-bleed applications.
 *
 * They take the whole viewport rather than sitting inside the documentation
 * chrome: an application shell wrapped in another application shell reads as
 * neither, and the point of these pages is what a whole product looks like.
 */
type Screen = () => TemplateResult;

/**
 * The demo apps, each loaded the first time it is opened: a visitor reading
 * the docs does not download a console, a chat and a portfolio as well.
 */
const settings = (section: SettingsSection) => () =>
  import('./apps/console/settings.js').then(
    (m): Screen =>
      () =>
        m.consoleSettings(section),
  );
const APPS: Record<string, () => Promise<Screen>> = {
  'console/home': () => import('./apps/console/home.js').then((m) => m.consoleHome),
  'console/inbox': () => import('./apps/console/inbox.js').then((m) => m.consoleInbox),
  'console/customers': () => import('./apps/console/customers.js').then((m) => m.consoleCustomers),
  'console/files': () => import('./apps/console/files.js').then((m) => m.consoleFiles),
  'console/activity': () => import('./apps/console/activity.js').then((m) => m.consoleActivity),
  'console/integrations': () =>
    import('./apps/console/integrations.js').then((m) => m.consoleIntegrations),
  'console/settings/general': settings('general'),
  'console/settings/members/people': settings('people'),
  'console/settings/members/roles': settings('roles'),
  'console/settings/notifications': settings('notifications'),
  'console/settings/security': settings('security'),
  landing: () => import('./apps/landing.js').then((m) => m.landingPage),
  chat: () => import('./apps/chat.js').then((m) => m.chatPage),
  portfolio: () => import('./apps/portfolio.js').then((m) => m.portfolioPage),
};

/** The apps, each loaded the first time it is opened. */
const apps = lazyLoader(APPS, () => update());

/** `#/app/<path>` — anything under it renders without the docs chrome. */
function currentApp(): (() => TemplateResult) | null {
  // `#/template/<slug>`: a template alone, as it would be in a product.
  const screen = /^#\/template\/([a-z-]+)$/.exec(location.hash);
  const template = screen && TEMPLATES.find((candidate) => candidate.slug === screen[1]);
  if (template) return () => templateScreen(template);

  const path = /^#\/app\/(.+)$/.exec(location.hash)?.[1];
  const app = path ? apps(path) : null;
  if (!path || !app) return null;
  if (app.state === 'ready') return app.value;
  if (app.state === 'failed')
    return () =>
      html`<div class="app-loading">
        <kt-empty-state
          icon="triangle-alert"
          heading="This app did not load"
          description="The connection may have dropped. Try again, or go back to the documentation."
        >
          <kt-button slot="actions" variant="primary" @click=${() => apps.retry(path)}
            >Try again</kt-button
          >
          <kt-button
            slot="actions"
            variant="secondary"
            @click=${() => {
              location.hash = '#/';
            }}
            >Back to the docs</kt-button
          >
        </kt-empty-state>
      </div>`;
  // A blank page for the moment the app takes to arrive.
  return () => html`<div class="app-loading" aria-busy="true"></div>`;
}

function currentRoute(): Route {
  // `#/guide/installation#no-build-step`: the route, then a heading on it.
  const [section, slug] = location.hash.replace(/^#\/?/, '').split('#')[0]!.split('/');
  if (!section || section === 'home') return HOME;
  return (
    ROUTES.find((route) => route.section === section && route.slug === slug) ??
    ROUTES.find((route) => route.section === section) ??
    GUIDE[0]!
  );
}

const href = (route: Route) => `#/${route.section}/${route.slug}`;

/* ------------------------------------------------------------------- state */

/** The appearance on screen; storage may be blocked, so it is kept here too. */
let appearance: DocsAppearance = readDocsAppearance();
/** Whether the first-visit invitation beside Customise is showing. */
let inviting = false;

/** Every page and site action, for Cmd+K: built once, the routes are fixed. */
const SEARCH_COMMANDS = siteCommands(ROUTES.filter((route) => route.section !== 'home'));

function openSearch(): void {
  const palette = document.querySelector('kt-command-palette');
  if (palette) palette.open = true;
}

/** Runs what the docs search picked. */
function runSearch(id: string): void {
  const target = commandTarget(id);
  if (!target) return;
  switch (target.kind) {
    case 'page':
      location.hash = target.hash;
      break;
    case 'theme':
    case 'accent': {
      const patch = target.kind === 'theme' ? { theme: target.theme } : { accent: target.accent };
      appearance = { ...appearance, ...patch };
      applyDocsAppearance(appearance);
      update();
      break;
    }
    case 'copy-install':
      void navigator.clipboard?.writeText(INSTALL_COMMAND);
      toaster.success('Install command copied');
      break;
    case 'github':
      window.open(REPO_URL, '_blank', 'noopener');
      break;
  }
}

/** "Use on this site": the playground's appearance becomes the site's, as Customise would set it. */
function useAppearance(next: DocsAppearance): void {
  appearance = next;
  applyDocsAppearance(next);
  dismissInvite();
  update();
  toaster.success('Applied to the site');
}

function dismissInvite(): void {
  if (!inviting) {
    markInviteSeen();
    return;
  }
  inviting = false;
  markInviteSeen();
  update();
}
let filter = '';
let activeHeading = '';
/** The headings whose sections are on screen, lit on the contents rail. */
let visibleHeadings: readonly string[] = [];

/* ------------------------------------------------------------------ layout */

/**
 * Scrolls to a heading of the current page. The site routes on the hash, so an
 * in-page link cannot simply be `#id` — that would navigate away.
 */
function jumpToHeading(event: Event, id: string): void {
  event.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  activeHeading = id;
  update();
}

const headingHref = (id: string) => `${location.hash.split('#').slice(0, 2).join('#')}#${id}`;

function sidebar(route: Route, page?: DocPage): TemplateResult {
  const inSection = ROUTES.filter((candidate) => candidate.section === route.section);
  const needle = filter.trim().toLowerCase();
  const matches = needle
    ? inSection.filter((candidate) => candidate.label.toLowerCase().includes(needle))
    : inSection;

  const groups = [...new Set(matches.map((candidate) => candidate.group))];

  const extra = page?.sidebar;
  const extraItems = (extra?.items ?? []).filter((item) =>
    item.text.toLowerCase().includes(needle),
  );

  return html`<aside class="sidebar">
    <div class="sidebar-filter">
      <kt-input
        id="docs-filter"
        placeholder="Filter..."
        .value=${filter}
        size="small"
        label="Filter the navigation"
        @kt-input=${(event: CustomEvent<{ value: string }>) => {
          filter = event.detail.value;
          update();
        }}
      ></kt-input>
      <kbd class="slash">/</kbd>
    </div>

    <nav class="sidebar-nav" aria-label="${route.section} navigation">
      ${
        matches.length === 0 && extraItems.length === 0
          ? html`<p class="muted sidebar-empty">Nothing matches “${filter}”.</p>`
          : groups.map(
              (group) =>
                html`<div class="sidebar-group">
                  <div class="overline">${group}</div>
                  <ul>
                    ${matches
                      .filter((candidate) => candidate.group === group)
                      .map(
                        (candidate) =>
                          html`<li>
                            <a
                              class=${classMap({ active: candidate.slug === route.slug })}
                              href=${href(candidate)}
                              aria-current=${candidate.slug === route.slug ? 'page' : undefined}
                              >${candidate.label}${
                                candidate.section === 'components' &&
                                NEW_COMPONENTS.has(candidate.slug)
                                  ? html`<kt-badge class="new" tone="primary" size="small"
                                      >New</kt-badge
                                    >`
                                  : ''
                              }</a
                            >
                          </li>`,
                      )}
                  </ul>
                </div>`,
            )
      }
      ${
        extra && extraItems.length > 0
          ? html`<div class="sidebar-group">
              <div class="overline">${extra.group}</div>
              <ul>
                ${extraItems.map(
                  (item) =>
                    html`<li>
                      <a
                        class=${classMap({ active: item.id === activeHeading })}
                        href=${headingHref(item.id)}
                        @click=${(event: Event) => jumpToHeading(event, item.id)}
                        >${item.text}</a
                      >
                    </li>`,
                )}
              </ul>
            </div>`
          : ''
      }
    </nav>
  </aside>`;
}

function tableOfContents(page: DocPage): TemplateResult {
  if (page.headings.length === 0) return html`<aside class="toc"></aside>`;

  return html`<aside class="toc">
    <div class="toc-inner">
      <div class="overline">On this page</div>
      <nav aria-label="On this page">
        <ul>
          ${page.headings.map(
            (heading) =>
              html`<li class=${`level-${heading.level}`}>
                <a
                  class=${classMap({ active: visibleHeadings.includes(heading.id) })}
                  href=${headingHref(heading.id)}
                  @click=${(event: Event) => jumpToHeading(event, heading.id)}
                  >${heading.text}</a
                >
              </li>`,
          )}
        </ul>
      </nav>

      <div class="toc-links">
        <a href=${`${REPO_URL}/blob/main/${page.source}`} target="_blank" rel="noreferrer">
          <kt-icon name="pencil" size="14"></kt-icon> Edit this page
        </a>
      </div>
    </div>
  </aside>`;
}

function docLayout(route: Route, page: DocPage): TemplateResult {
  return html`${sidebar(route, page)}
    <main>
      <article class="doc">
        <div class="doc-head">
          <div class="overline">${page.eyebrow}</div>
          <div class="doc-title-row">
            <h1>${page.title}</h1>
            <div class="doc-actions">
              <kt-button
                size="small"
                variant="dark"
                icon="git-branch"
                @click=${() => window.open(REPO_URL, '_blank')}
                >GitHub</kt-button
              >
              <kt-button
                size="small"
                variant="dark"
                icon="copy"
                @click=${() => void navigator.clipboard?.writeText(location.href)}
                >Copy link</kt-button
              >
            </div>
          </div>
          ${page.summary ? html`<p class="doc-summary">${page.summary}</p>` : ''}
        </div>
        ${page.body}
      </article>
    </main>
    ${tableOfContents(page)}`;
}

function shell(): TemplateResult {
  const app = currentApp();
  if (app) return app();

  const route = currentRoute();
  const result = route.page();
  const isDoc = typeof result === 'object' && 'headings' in result;

  return html`
    <kt-header sticky label="Kanto documentation">
      <a slot="brand" class="wordmark" href="#/">KANTO <span>DS</span></a>
      <!-- In the brand slot, not the default one: the header centres the
           default slot as a group, and a version chip belongs beside the
           wordmark rather than beside the sections. -->
      <kt-badge slot="brand" class="version-chip" variant="code">${VERSION_TAG}</kt-badge>

      <nav class="top-nav">
        ${SECTIONS.map(
          (section) =>
            html`<a
              class=${classMap({ active: section.id === route.section })}
              href=${`#/${section.id}`}
              ><kt-icon name=${section.icon} size="16"></kt-icon> ${section.label}</a
            >`,
        )}
      </nav>

      <div slot="actions" class="header-actions">
        <button
          type="button"
          class="site-search"
          aria-label="Search the docs"
          aria-keyshortcuts="Control+K Meta+K"
          @click=${openSearch}
        >
          <kt-icon name="search" size="16"></kt-icon>
          <span class="site-search-text">Search</span>
          <kt-kbd keys="mod k"></kt-kbd>
        </button>
        ${customiseMenu(
          appearance,
          (next) => {
            appearance = next;
            applyDocsAppearance(next);
            update();
          },
          dismissInvite,
        )}
        ${
          inviting
            ? html`<div class="customise-invite" role="status">
                Try Kanto in your colours
                <kt-button
                  size="small"
                  variant="secondary-no-bg"
                  icon="x"
                  label="Dismiss"
                  @click=${dismissInvite}
                ></kt-button>
              </div>`
            : nothing
        }
        <kt-button
          size="small"
          variant="secondary-no-bg"
          icon="git-branch"
          label="GitHub"
          @click=${() => window.open(REPO_URL, '_blank')}
        ></kt-button>
      </div>

      <nav slot="menu" class="menu-nav">
        ${SECTIONS.map((section) => html`<a href=${`#/${section.id}`}>${section.label}</a>`)}
      </nav>
    </kt-header>

    <kt-command-palette
      placeholder="Search the docs, or run a command…"
      .commands=${SEARCH_COMMANDS}
      @kt-select=${(event: CustomEvent<{ id: string }>) => runSearch(event.detail.id)}
    ></kt-command-palette>

    ${
      route.section === 'home'
        ? html`<main class="home-main">
            ${homePage({ appearance, onUse: useAppearance, rerender: update })}
          </main>`
        : html`<div class="layout">
            ${
              isDoc
                ? docLayout(route, result)
                : html`${sidebar(route)}
                    <main><article class="doc">${result}</article></main>
                    <aside class="toc"></aside>`
            }
          </div>`
    }
  `;
}

/* ------------------------------------------------------------- bookkeeping */

/** The tab title: the page, then the system; the home page says what Kanto is. */
function pageTitle(): string {
  if (currentApp()) return document.title;
  const route = currentRoute();
  return route.section === 'home'
    ? 'Kanto — web components in your colours, in any framework'
    : `${route.label} — Kanto`;
}

function update(): void {
  document.title = pageTitle();
  render(shell(), document.querySelector<HTMLElement>('#app')!);
  // The rail's entries only exist once rendered, and a page that does not
  // scroll would otherwise never place its fill.
  trackReading();
}

/**
 * Follows the reader down the page: the rail's marker covers the entries whose
 * sections are on screen, and those entries light up.
 *
 * The screen starts under the sticky header, which hides what scrolls beneath
 * it. The marker goes straight to custom properties rather than through a
 * re-render: this runs on every scroll frame, and re-rendering the page at
 * that rate to move a 2px bar is not a trade worth making. Only a change in
 * which sections are visible re-renders.
 */
function trackReading(): void {
  const nav = document.querySelector<HTMLElement>('.toc nav');
  if (!nav) return;

  const navTop = nav.getBoundingClientRect().top;
  const entries = [...nav.querySelectorAll<HTMLAnchorElement>('a')].flatMap((link) => {
    const id = link.getAttribute('href')?.split('#').pop() ?? '';
    const heading = document.getElementById(id);
    if (!heading) return [];

    const box = link.getBoundingClientRect();
    return [
      {
        id,
        section: heading.getBoundingClientRect().top + window.scrollY,
        rail: { top: box.top - navTop, height: box.height },
      },
    ];
  });
  if (entries.length === 0) return;

  const header = document.querySelector('kt-header')?.getBoundingClientRect().bottom ?? 0;
  const from = window.scrollY + Math.max(header, 0);
  const to = window.scrollY + window.innerHeight;
  const sections = entries.map((entry) => entry.section);
  const end = document.documentElement.scrollHeight;

  const { top, size } = visibleSpan(
    from,
    to,
    sections,
    end,
    entries.map((entry) => entry.rail),
  );
  nav.style.setProperty('--toc-marker-top', `${top}px`);
  nav.style.setProperty('--toc-marker-size', `${size}px`);

  const visible = visibleSections(from, to, sections, end).map((index) => entries[index]!.id);
  // Above the first section, the first entry is still the one to show.
  const current = visible[0] ?? entries[0]!.id;
  if (current !== activeHeading || visible.join() !== visibleHeadings.join()) {
    activeHeading = current;
    visibleHeadings = visible;
    update();
  }
}

setRenderer(update);
applyDocsAppearance(appearance);

window.addEventListener('hashchange', () => {
  // Inside an app the invitation would cover what the visitor came to see.
  if (location.hash.startsWith('#/app/')) inviting = false;
  // Each visit to the home page starts its examples from the site as it is.
  if (currentRoute().section !== 'home') {
    resetStage();
    resetReasons();
  }
  filter = '';
  activeHeading = '';
  visibleHeadings = [];
  window.scrollTo({ top: 0 });
  update();
  // A link to a heading lands on it, once the page that holds it has drawn.
  const anchor = location.hash.split('#')[2];
  if (anchor) document.getElementById(anchor)?.scrollIntoView();
  document.querySelector('kt-header')?.closeMenu();
});

// `/` jumps to the filter, the way every docs site people already use does.
window.addEventListener('keydown', (event) => {
  if (event.key !== '/' || event.metaKey || event.ctrlKey) return;
  // The node typed in, even inside a shadow root: the palette's own field.
  const target = event.composedPath()[0] as HTMLElement | null;
  if (target && /^(input|textarea|kt-input|kt-textarea|kt-input-menu)$/i.test(target.tagName))
    return;

  event.preventDefault();
  document.querySelector<HTMLElement & { focus(): void }>('#docs-filter')?.focus();
});

let ticking = false;
window.addEventListener(
  'scroll',
  () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      trackReading();
      ticking = false;
    });
  },
  { passive: true },
);

update();

// The invitation waits for the page to settle, then shows once.
setTimeout(() => {
  inviting = shouldInvite({
    hash: location.hash,
    width: window.innerWidth,
    seen: readInviteSeen(),
  });
  if (inviting) update();
}, 1000);
