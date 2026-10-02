import { html, nothing, type TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { toaster } from 'kanto-ds';
import { rerender } from '../lib/render.js';

/**
 * A personal site.
 *
 * The third kind of screen, after the console and the marketing page, and the
 * one that pushes hardest on typography rather than density: long measure,
 * few controls, one thing said at a time. It is also where `<kt-timeline>`
 * earns its keep twice over — a career on the page, and a project's phases in
 * the case-study panel.
 */

interface Project {
  readonly slug: string;
  readonly name: string;
  readonly tagline: string;
  readonly year: string;
  readonly role: string;
  readonly tags: readonly string[];
  readonly accent: string;
  readonly summary: string;
  readonly outcomes: readonly { label: string; value: string; delta?: string }[];
  readonly phases: readonly {
    heading: string;
    time: string;
    icon: string;
    variant: 'neutral' | 'primary' | 'success' | 'info';
    body: string;
  }[];
}

const TAGS = ['Design systems', 'Product', 'Front end', 'Open source'] as const;

const PROJECTS: readonly Project[] = [
  {
    slug: 'kanto',
    name: 'Kanto',
    tagline: 'A dark-first design system for tools people live in',
    year: '2026',
    role: 'Design and engineering',
    tags: ['Design systems', 'Open source'],
    accent: 'var(--color-primary-base)',
    summary:
      'Forty custom elements on one token layer, framework-agnostic by construction. The brief was a component library; the useful part turned out to be the constraint that every decision resolves to a custom property, which is what made a light theme cost no component CSS at all.',
    outcomes: [
      { label: 'Elements', value: '40' },
      { label: 'Themes for free', value: '2' },
      { label: 'Bundle, gzipped', value: '31 kB', delta: '-42%' },
    ],
    phases: [
      {
        heading: 'Audited the existing screens',
        time: 'Jan 2026',
        icon: 'search',
        variant: 'neutral',
        body: 'Eleven shades of grey across four products, and three separate button implementations.',
      },
      {
        heading: 'Wrote the token layer first',
        time: 'Feb 2026',
        icon: 'palette',
        variant: 'primary',
        body: 'No component was allowed a literal colour. That single rule is why the light theme took a day.',
      },
      {
        heading: 'Ported the products',
        time: 'Apr 2026',
        icon: 'git-branch',
        variant: 'info',
        body: 'One product at a time, behind a flag, with the old CSS deleted as each screen landed.',
      },
      {
        heading: 'Published 1.0',
        time: 'Jun 2026',
        icon: 'rocket',
        variant: 'success',
        body: 'Documentation, tests and a live playground shipped in the same release.',
      },
    ],
  },
  {
    slug: 'atlas',
    name: 'Atlas',
    tagline: 'Fleet telemetry for people who are not engineers',
    year: '2025',
    role: 'Lead front end',
    tags: ['Product', 'Front end'],
    accent: 'var(--chart-series-3)',
    summary:
      'A control room rebuilt around one question — what needs me right now. The old dashboard showed everything at once and was read by nobody; the replacement shows four things and is read every morning.',
    outcomes: [
      { label: 'Time to first action', value: '9s', delta: '-71%' },
      { label: 'Daily active operators', value: '1,240', delta: '+38%' },
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
        body: 'Everything else moved behind a search. The argument took longer than the build.',
      },
      {
        heading: 'Shipped to the whole fleet',
        time: 'Sep 2025',
        icon: 'rocket',
        variant: 'success',
        body: 'Rolled out region by region with the old view one click away for a month. Nobody went back.',
      },
    ],
  },
  {
    slug: 'ledger',
    name: 'Ledger',
    tagline: 'Reconciliation that explains itself',
    year: '2024',
    role: 'Product engineering',
    tags: ['Product', 'Front end'],
    accent: 'var(--chart-series-4)',
    summary:
      'Finance software fails at the moment two numbers disagree and the screen will not say why. This one shows the arithmetic — every figure expands into the rows that produced it, all the way down.',
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
        body: 'Every unexplained figure ended in a spreadsheet nobody else could open.',
      },
      {
        heading: 'Made every number expandable',
        time: 'Jun 2024',
        icon: 'list-tree',
        variant: 'primary',
        body: 'One interaction, applied without exception, replaced most of the documentation.',
      },
      {
        heading: 'Closed a month on it',
        time: 'Nov 2024',
        icon: 'check',
        variant: 'success',
        body: 'The first close ran in parallel with the old process. It finished two days earlier.',
      },
    ],
  },
  {
    slug: 'marginalia',
    name: 'Marginalia',
    tagline: 'A reading tool that keeps your notes with the text',
    year: '2023',
    role: 'Everything',
    tags: ['Open source', 'Front end'],
    accent: 'var(--chart-series-7)',
    summary:
      'A weekend project that got out. Annotations live in a local file beside the document rather than in someone else’s cloud, which turned out to be the only feature anyone wrote in about.',
    outcomes: [
      { label: 'GitHub stars', value: '3.1k' },
      { label: 'Contributors', value: '48' },
      { label: 'Dependencies', value: '0' },
    ],
    phases: [
      {
        heading: 'Built it for myself',
        time: 'Aug 2023',
        icon: 'pencil',
        variant: 'neutral',
        body: 'Two hundred lines, no build step, one HTML file.',
      },
      {
        heading: 'Someone else found it',
        time: 'Oct 2023',
        icon: 'star',
        variant: 'info',
        body: 'A thousand stars in a week, and the first bug report about a file format I had invented.',
      },
      {
        heading: 'Handed over maintenance',
        time: 'May 2024',
        icon: 'users',
        variant: 'success',
        body: 'Three maintainers, a governance file, and a release cadence I do not run.',
      },
    ],
  },
];

const CAREER = [
  {
    heading: 'Principal engineer · Northwind',
    time: '2024 — now',
    icon: 'component',
    variant: 'primary' as const,
    body: 'Design systems and the tooling around them. Four product teams, one vocabulary.',
  },
  {
    heading: 'Lead front end · Atlas',
    time: '2021 — 2024',
    icon: 'layout-dashboard',
    variant: 'neutral' as const,
    body: 'Grew the interface team from two to nine and rebuilt the control room around one question.',
  },
  {
    heading: 'Product engineer · Ledger',
    time: '2019 — 2021',
    icon: 'wallet',
    variant: 'neutral' as const,
    body: 'Reconciliation, reporting, and a long education in how finance teams actually work.',
  },
  {
    heading: 'Front end · agency work',
    time: '2016 — 2019',
    icon: 'briefcase',
    variant: 'neutral' as const,
    body: 'Thirty-odd sites in three years. Where I learned to finish things.',
  },
];

const WRITING = [
  {
    title: 'A light theme should cost nothing',
    when: 'Jul 2026',
    minutes: 8,
    blurb: 'If a component knows a colour, you have already bought a second stylesheet.',
  },
  {
    title: 'Stop shipping the empty state last',
    when: 'Apr 2026',
    minutes: 5,
    blurb: 'The blank screen is the first one a new user sees and the last one anybody designs.',
  },
  {
    title: 'Four tiles, and the argument about the other nineteen',
    when: 'Dec 2025',
    minutes: 11,
    blurb: 'What it took to delete most of a dashboard, and what came back.',
  },
];

interface PortfolioState {
  tag: string;
  open: string | null;
  sent: boolean;
}

const state: PortfolioState = { tag: 'All', open: null, sent: false };

const openProject = () => PROJECTS.find((project) => project.slug === state.open) ?? null;

function caseStudy(): TemplateResult {
  const project = openProject();

  return html`<kt-side-panel
    ?open=${state.open !== null}
    eyebrow=${project ? `${project.year} · ${project.role}` : 'Case study'}
    heading=${project?.name ?? ''}
    @kt-close=${() => {
      state.open = null;
      rerender();
    }}
  >
    ${
      project
        ? html`
            <div class="case">
              <p class="case-tagline">${project.tagline}</p>
              <p class="muted">${project.summary}</p>

              <!-- Not <kt-stat>: a stat tile is built for a dashboard column and
                   needs the width to breathe. Three of them in a 320px panel
                   stack into a tower. Same information, panel-sized. -->
              <div class="case-outcomes">
                ${project.outcomes.map(
                  (outcome) =>
                    html`<div class="case-outcome">
                      <span class="case-outcome-value">${outcome.value}</span>
                      <span class="case-outcome-label">${outcome.label}</span>
                      ${
                        outcome.delta
                          ? html`<kt-badge variant="count" tone="success"
                              >${outcome.delta}</kt-badge
                            >`
                          : nothing
                      }
                    </div>`,
                )}
              </div>

              <h6 class="case-heading">How it went</h6>
              <kt-timeline>
                ${project.phases.map(
                  (phase) =>
                    html`<kt-timeline-item
                      heading=${phase.heading}
                      time=${phase.time}
                      icon=${phase.icon}
                      variant=${phase.variant}
                      >${phase.body}</kt-timeline-item
                    >`,
                )}
              </kt-timeline>

              <div class="row" style="flex-wrap:wrap;gap:6px;margin-top:20px">
                ${project.tags.map((tag) => html`<kt-badge label=${tag}></kt-badge>`)}
              </div>
            </div>
          `
        : nothing
    }

    <div slot="footer" class="row" style="justify-content:flex-end">
      <kt-button
        variant="dark"
        @click=${() => {
          state.open = null;
          rerender();
        }}
        >Close</kt-button
      >
      <kt-button
        icon="arrow-up-right"
        icon-position="right"
        @click=${() => toaster.info('This portfolio is a demonstration — there is nowhere to go.')}
        >Visit the site</kt-button
      >
    </div>
  </kt-side-panel>`;
}

export function portfolioPage(): TemplateResult {
  const projects =
    state.tag === 'All' ? PROJECTS : PROJECTS.filter((project) => project.tags.includes(state.tag));

  return html`<div class="portfolio">
    <kt-header sticky class="landing-header">
      <a slot="brand" class="wordmark" href="#/app/portfolio">ROWAN <span>ELLIS</span></a>
      <nav class="landing-nav">
        <a href="#/app/portfolio">Work</a>
        <a href="#/app/portfolio">Writing</a>
        <a href="#/app/landing">Kanto</a>
      </nav>
      <div slot="actions" class="row">
        <kt-button
          size="small"
          variant="secondary-no-bg"
          icon="git-branch"
          @click=${() => toaster.info('Demonstration only — no link attached.')}
          >Source</kt-button
        >
        <kt-button size="small" icon="mail" @click=${() => scrollToContact()}
          >Get in touch</kt-button
        >
      </div>
    </kt-header>

    <section class="portrait">
      <kt-avatar
        name="Rowan Ellis"
        size="large"
        status="online"
        class="portrait-avatar"
      ></kt-avatar>
      <div class="portrait-copy">
        <kt-badge label="Available from October" variant="category"></kt-badge>
        <h1>I build the interfaces other people build on.</h1>
        <p>
          Ten years of product engineering, most of it spent on the unglamorous middle layer —
          design systems, data-dense tools, and the screens teams stare at for eight hours a day.
          Currently making <a href="#/app/landing">Kanto</a> in the open.
        </p>
        <div class="row" style="flex-wrap:wrap">
          <kt-button icon="arrow-down" @click=${() => scrollToWork()}>See the work</kt-button>
          <kt-button
            variant="dark"
            icon="download"
            @click=${() => toaster.info('No file attached — this page is a demonstration.')}
            >Download CV</kt-button
          >
        </div>
      </div>
    </section>

    <section class="band portfolio-numbers">
      <div class="stat-row">
        <kt-stat label="Years shipping" value="10" icon="clock"></kt-stat>
        <kt-stat label="Products in production" value="7" icon="layout-dashboard"></kt-stat>
        <kt-stat label="Components published" value="40" icon="component"></kt-stat>
        <kt-stat label="Teams onboarded" value="12" icon="users"></kt-stat>
      </div>
    </section>

    <section class="band" id="portfolio-work">
      <div class="section-head">
        <h2>Selected work</h2>
        <kt-toggle-button-group
          label="Filter by discipline"
          .value=${state.tag}
          @kt-change=${(e: CustomEvent<{ value: string | null }>) => {
            state.tag = e.detail.value ?? 'All';
            rerender();
          }}
        >
          <kt-toggle-button value="All">All</kt-toggle-button>
          ${TAGS.map((tag) => html`<kt-toggle-button value=${tag}>${tag}</kt-toggle-button>`)}
        </kt-toggle-button-group>
      </div>

      ${
        projects.length === 0
          ? html`<kt-empty-state
              icon="search"
              heading="Nothing under that heading"
              description="Try another discipline, or look at everything."
            >
              <kt-button
                slot="actions"
                variant="dark"
                @click=${() => {
                  state.tag = 'All';
                  rerender();
                }}
                >Show everything</kt-button
              >
            </kt-empty-state>`
          : html`<div class="work-grid">
              ${projects.map(
                (project) =>
                  html`<kt-card
                    class=${classMap({ 'work-card': true, open: state.open === project.slug })}
                    clickable
                    @click=${() => {
                      state.open = project.slug;
                      rerender();
                    }}
                  >
                    <div slot="header" class="row" style="justify-content:space-between">
                      <span class="work-mark" style="background:${project.accent}"></span>
                      <span class="muted" style="font:var(--font-normal-small)"
                        >${project.year}</span
                      >
                    </div>
                    <h5 class="work-name">${project.name}</h5>
                    <p class="muted">${project.tagline}</p>
                    <div class="row" style="flex-wrap:wrap;gap:6px;margin-top:12px">
                      ${project.tags.map((tag) => html`<kt-badge label=${tag}></kt-badge>`)}
                    </div>
                    <span slot="footer" class="work-more">
                      Read the case study
                      <kt-icon name="arrow-right" size="14"></kt-icon>
                    </span>
                  </kt-card>`,
              )}
            </div>`
      }
    </section>

    <section class="band">
      <div class="portfolio-split">
        <div>
          <h2 class="left">Where I have been</h2>
          <kt-timeline>
            ${CAREER.map(
              (role) =>
                html`<kt-timeline-item
                  heading=${role.heading}
                  time=${role.time}
                  icon=${role.icon}
                  variant=${role.variant}
                  >${role.body}</kt-timeline-item
                >`,
            )}
          </kt-timeline>
        </div>

        <div>
          <h2 class="left">Writing</h2>
          <div class="writing">
            ${WRITING.map(
              (post) =>
                html`<a
                  class="writing-row"
                  href="#/app/portfolio"
                  @click=${() => toaster.info('Demonstration only — the post is not written.')}
                >
                  <div class="writing-top">
                    <span class="writing-title">${post.title}</span>
                    <span class="muted" style="font:var(--font-normal-small)"
                      >${post.minutes} min</span
                    >
                  </div>
                  <span class="muted">${post.blurb}</span>
                  <span class="writing-when">${post.when}</span>
                </a>`,
            )}
          </div>
        </div>
      </div>
    </section>

    <section class="band" id="portfolio-contact">
      <kt-card class="contact-card">
        <div slot="header">
          <div class="overline">Contact</div>
          <h2 class="left" style="margin:4px 0 0">Tell me what you are building</h2>
        </div>

        <form
          @submit=${(e: SubmitEvent) => {
            e.preventDefault();
            state.sent = true;
            rerender();
            toaster.success('Thanks — nothing was actually sent.');
          }}
        >
          <kt-form heading="Project enquiry" description="Two sentences is plenty to start with.">
            <div class="contact-grid">
              <kt-label-input label="Your name" required>
                <kt-input name="name" required placeholder="Ada Lovelace"></kt-input>
              </kt-label-input>
              <kt-label-input label="Email" required>
                <kt-input
                  name="email"
                  type="email"
                  required
                  placeholder="ada@example.com"
                ></kt-input>
              </kt-label-input>
            </div>

            <kt-label-input label="What is it?">
              <kt-textarea
                name="brief"
                rows="4"
                placeholder="We have a design system nobody uses and three teams who disagree about why."
              ></kt-textarea>
            </kt-label-input>

            <div slot="footer" class="row" style="justify-content:space-between;width:100%">
              <span class="muted" style="font:var(--font-normal-small)"
                >Usually a reply within two days.</span
              >
              <kt-button type="submit" icon="send" icon-position="right">Send</kt-button>
            </div>
          </kt-form>
        </form>

        ${
          state.sent
            ? html`<kt-alert
                variant="success"
                heading="Message queued"
                description="This form is a demonstration — the message goes nowhere."
                style="margin-top:16px"
              ></kt-alert>`
            : nothing
        }
      </kt-card>
    </section>

    <footer class="landing-footer">
      <span class="muted">Every element on this page ships in Kanto.</span>
      <a href="#/guide/introduction">Documentation</a>
    </footer>

    ${caseStudy()}
  </div>`;
}

function scrollToWork(): void {
  document.getElementById('portfolio-work')?.scrollIntoView({ behavior: 'smooth' });
}

function scrollToContact(): void {
  document.getElementById('portfolio-contact')?.scrollIntoView({ behavior: 'smooth' });
}
