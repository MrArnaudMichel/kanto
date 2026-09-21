import { html, render, type TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import * as lucide from 'lucide';
import { registerIcons } from 'kanto';
import 'kanto';
import 'kanto/styles.css';
import './shell.css';
import './apps.css';

import { COMPONENTS } from './lib/registry.js';
import { setRenderer } from './lib/render.js';
import { consoleHome } from './apps/console/home.js';
import { consoleInbox } from './apps/console/inbox.js';
import { consoleCustomers } from './apps/console/customers.js';
import { consoleSettings } from './apps/console/settings.js';
import { consoleFiles } from './apps/console/files.js';
import { consoleActivity } from './apps/console/activity.js';
import { consoleIntegrations } from './apps/console/integrations.js';
import { landingPage } from './apps/landing.js';
import { chatPage } from './apps/chat.js';
import { portfolioPage } from './apps/portfolio.js';
import { shellState } from './apps/shell.js';
import { componentPage, markdownPage, type DocPage } from './pages/component.js';
import { appPage } from './pages/app.js';
import { INTRODUCTION, INSTALLATION } from './pages/guide.js';
import { foundationsPage } from './pages/foundations.js';

import tokensDoc from '../src/tokens/README.md?raw';
import frameworksDoc from '../docs/frameworks.md?raw';

// The docs draw on far more icons than the seventeen the library ships. This
// is the "prototyping" registration the icon page warns against in production.
registerIcons(lucide);

/* ------------------------------------------------------------------ routes */

type Section = 'guide' | 'components' | 'apps';

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
    description: 'A seven-screen admin product sharing one shell.',
    notes: `## What it is

An operations console: a dashboard, a mailbox, a customer table and four
settings screens, all hanging off one shell.

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

const ROUTES: Route[] = [...GUIDE, ...COMPONENT_ROUTES, ...APP_ROUTES];

const SECTIONS: { id: Section; label: string; icon: string }[] = [
  { id: 'guide', label: 'Guide', icon: 'book-open' },
  { id: 'components', label: 'Components', icon: 'component' },
  { id: 'apps', label: 'Apps', icon: 'app-window' },
];

/**
 * The full-bleed applications.
 *
 * They take the whole viewport rather than sitting inside the documentation
 * chrome: an application shell wrapped in another application shell reads as
 * neither, and the point of these pages is what a whole product looks like.
 */
const APPS: Record<string, () => TemplateResult> = {
  'console/home': consoleHome,
  'console/inbox': consoleInbox,
  'console/customers': consoleCustomers,
  'console/files': consoleFiles,
  'console/activity': consoleActivity,
  'console/integrations': consoleIntegrations,
  'console/settings/general': () => consoleSettings('general'),
  'console/settings/members/people': () => consoleSettings('people'),
  'console/settings/members/roles': () => consoleSettings('roles'),
  'console/settings/notifications': () => consoleSettings('notifications'),
  'console/settings/security': () => consoleSettings('security'),
  landing: landingPage,
  chat: chatPage,
  portfolio: portfolioPage,
};

/** `#/app/<path>` — anything under it renders without the docs chrome. */
function currentApp(): (() => TemplateResult) | null {
  const match = /^#\/app\/(.+)$/.exec(location.hash);
  if (!match) return null;
  return APPS[match[1]!] ?? null;
}

function currentRoute(): Route {
  const [section, slug] = location.hash.replace(/^#\/?/, '').split('/');
  return (
    ROUTES.find((route) => route.section === section && route.slug === slug) ??
    ROUTES.find((route) => route.section === section) ??
    GUIDE[0]!
  );
}

const href = (route: Route) => `#/${route.section}/${route.slug}`;

/* ------------------------------------------------------------------- state */

const THEME_KEY = 'kanto-docs-theme';
type Theme = 'dark' | 'light';

let filter = '';
let activeHeading = '';

function readTheme(): Theme {
  try {
    return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark'; // private window, or storage blocked; dark is the default anyway
  }
}

function applyTheme(theme: Theme): void {
  document.documentElement.dataset['theme'] = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* the page still renders in the chosen theme */
  }
}

/* ------------------------------------------------------------------ layout */

function sidebar(route: Route): TemplateResult {
  const inSection = ROUTES.filter((candidate) => candidate.section === route.section);
  const needle = filter.trim().toLowerCase();
  const matches = needle
    ? inSection.filter((candidate) => candidate.label.toLowerCase().includes(needle))
    : inSection;

  const groups = [...new Set(matches.map((candidate) => candidate.group))];

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
        matches.length === 0
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
                              >${candidate.label}</a
                            >
                          </li>`,
                      )}
                  </ul>
                </div>`,
            )
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
                  class=${classMap({ active: heading.id === activeHeading })}
                  href=${`${location.hash.split('#').slice(0, 2).join('#')}#${heading.id}`}
                  @click=${(event: Event) => {
                    event.preventDefault();
                    document.getElementById(heading.id)?.scrollIntoView({ behavior: 'smooth' });
                    activeHeading = heading.id;
                    update();
                  }}
                  >${heading.text}</a
                >
              </li>`,
          )}
        </ul>
      </nav>

      <div class="toc-links">
        <a
          href=${`https://github.com/MrArnaudMichel/kanto/blob/main/${page.source}`}
          target="_blank"
          rel="noreferrer"
        >
          <kt-icon name="pencil" size="14"></kt-icon> Edit this page
        </a>
      </div>
    </div>
  </aside>`;
}

function docLayout(route: Route, page: DocPage): TemplateResult {
  return html`${sidebar(route)}
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
                @click=${() => window.open('https://github.com/MrArnaudMichel/kanto', '_blank')}
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
  const theme = readTheme();

  return html`
    <kt-header sticky label="Kanto documentation">
      <a slot="brand" class="wordmark" href="#/guide/introduction">KANTO <span>DS</span></a>
      <kt-chip variant="code" style="margin-left:8px">v1.0.0</kt-chip>

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
        <kt-segmented-control
          size="small"
          label="Theme"
          .value=${theme}
          .options=${[
            { value: 'dark', icon: 'moon', label: '' },
            { value: 'light', icon: 'sun', label: '' },
          ]}
          @kt-change=${(event: CustomEvent<{ value: Theme }>) => {
            applyTheme(event.detail.value);
            update();
          }}
        ></kt-segmented-control>
        <kt-button
          size="small"
          variant="secondary-no-bg"
          icon="git-branch"
          label="GitHub"
          @click=${() => window.open('https://github.com/MrArnaudMichel/kanto', '_blank')}
        ></kt-button>
      </div>

      <nav slot="menu" class="menu-nav">
        ${SECTIONS.map((section) => html`<a href=${`#/${section.id}`}>${section.label}</a>`)}
      </nav>
    </kt-header>

    <div class="layout">
      ${
        isDoc
          ? docLayout(route, result)
          : html`${sidebar(route)}
              <main><article class="doc">${result}</article></main>
              <aside class="toc"></aside>`
      }
    </div>
  `;
}

/* ------------------------------------------------------------- bookkeeping */

function update(): void {
  render(shell(), document.querySelector<HTMLElement>('#app')!);
}

/** Highlights the heading currently under the top of the viewport. */
function trackHeadings(): void {
  const headings = [...document.querySelectorAll<HTMLElement>('main h2[id], main h3[id]')];
  if (headings.length === 0) return;

  const top = window.scrollY + 120;
  const current = headings.filter((heading) => heading.offsetTop <= top).pop() ?? headings[0]!;

  if (current.id !== activeHeading) {
    activeHeading = current.id;
    update();
  }
}

setRenderer(update);
applyTheme(readTheme());

window.addEventListener('hashchange', () => {
  filter = '';
  activeHeading = '';
  window.scrollTo({ top: 0 });
  update();
  document.querySelector('kt-header')?.closeMenu();
});

// ⌘K / Ctrl-K opens the console's command palette wherever you are in it.
window.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() !== 'k' || !(event.metaKey || event.ctrlKey)) return;
  if (!location.hash.startsWith('#/app/console')) return;

  event.preventDefault();
  shellState.paletteOpen = !shellState.paletteOpen;
  update();
});

// `/` jumps to the filter, the way every docs site people already use does.
window.addEventListener('keydown', (event) => {
  if (event.key !== '/' || event.metaKey || event.ctrlKey) return;
  const target = event.target as HTMLElement | null;
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
      trackHeadings();
      ticking = false;
    });
  },
  { passive: true },
);

update();
