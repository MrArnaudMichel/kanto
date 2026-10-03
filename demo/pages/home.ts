/**
 * The front door. A product first — one live screen, re-coloured from a row
 * of swatches — then three reasons, each shown working; the wall of screens;
 * whole pages to start from; and the way in. No code until someone asks.
 */
import { html, type TemplateResult } from 'lit';
import { ref } from 'lit/directives/ref.js';
import { toaster } from 'kanto-ds';
import { COMPONENTS } from '../lib/registry.js';
import { SCREEN_COUNT, showcase } from '../lib/showcase.js';
import { stage } from '../lib/stage.js';
import { REASONS } from '../lib/reasons.js';
import { AGENT_SETUPS } from '../lib/agents.js';
import { TEMPLATES } from '../templates/index.js';
import { code } from '../lib/highlight.js';
import type { DocsAppearance } from '../lib/appearance.js';
import { NPM_URL, REPO_URL, VERSION, VERSION_TAG } from '../lib/project.js';
import { openInStackBlitz, stackblitzProject } from '../lib/stackblitz.js';

const INSTALL = 'npm install kanto-ds';
const IMPORTS = "import 'kanto-ds';\nimport 'kanto-ds/styles.css';";
const USE = '<kt-button>Save</kt-button>';

const FRAMEWORKS = {
  react: `import 'kanto-ds';
import 'kanto-ds/styles.css';

export function Save() {
  return <kt-button variant="primary" onClick={save}>Save changes</kt-button>;
}`,
  vue: `<script setup>
import 'kanto-ds/vue';
import 'kanto-ds/styles.css';
</script>

<template>
  <kt-button variant="primary" @click="save">Save changes</kt-button>
</template>`,
  angular: `import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import 'kanto-ds';

@Component({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: \`<kt-button variant="primary" (click)="save()">Save changes</kt-button>\`,
})
export class SaveComponent {}`,
  html: `<script type="module">
  import 'kanto-ds';
  import 'kanto-ds/styles.css';
</script>

<kt-button variant="primary">Save changes</kt-button>`,
};

const APPS = [
  {
    path: 'console/home',
    name: 'Console',
    note: 'An admin tool: inbox, customers, files, settings.',
  },
  { path: 'chat', name: 'Chat', note: 'A messaging app, threads and composer.' },
  { path: 'landing', name: 'Landing', note: 'A marketing page with pricing and sign-up.' },
  {
    path: 'portfolio',
    name: 'Portfolio',
    note: 'A personal site with a timeline and a contact form.',
  },
];

let framework: keyof typeof FRAMEWORKS = 'react';

/** The footer: every way out of the home page, agents' files among them. */
const FOOTER: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: 'Documentation',
    links: [
      { label: 'Introduction', href: '#/guide/introduction' },
      { label: 'Installation', href: '#/guide/installation' },
      { label: 'Components', href: '#/components/kt-button' },
      { label: 'Templates', href: '#/templates' },
      { label: 'Appearance', href: '#/guide/appearance' },
    ],
  },
  {
    heading: 'For AI agents',
    links: [
      { label: 'Set up your agent', href: '#/guide/ai-agents' },
      { label: 'llms.txt', href: 'llms.txt' },
      { label: 'llms-full.txt', href: 'llms-full.txt' },
      { label: 'agents.md', href: 'agents.md' },
    ],
  },
  {
    heading: 'Project',
    links: [
      { label: 'GitHub', href: REPO_URL },
      { label: 'npm', href: NPM_URL },
      { label: 'Releases', href: '#/release/releases' },
      { label: 'Editors', href: '#/guide/tools' },
    ],
  },
];
let agent = AGENT_SETUPS[0]!.id;

/** The library's families, in the order the sidebar lists them. */
const FAMILIES = ['Core', 'Forms', 'Navigation', 'Feedback', 'Overlays', 'Data'];

/** What people ask before they adopt a design system, answered straight. */
const QUESTIONS: { heading: string; answer: TemplateResult }[] = [
  {
    heading: 'Does it work with server rendering — Next.js, Nuxt, Astro?',
    answer: html`Yes, with one thing to know: custom elements upgrade in the browser. The server
    sends the tags; they hold their place, hidden, until the script runs, then draw. Nothing breaks
    and nothing jumps, but the elements are not in the first paint.`,
  },
  {
    heading: 'Can I use one component without the rest?',
    answer: html`Import it on its own —
      <code>import 'kanto-ds/components/forms/kt-date-picker'</code> — and your bundler leaves the
      others out. Each element has a size budget the release checks.`,
  },
  {
    heading: 'What size is it?',
    answer: html`All ${COMPONENTS.length} elements, Lit included, are about 85 kB gzipped as one
    file from the CDN; a single button is a few kB. Kanto depends on Lit and the icons it draws,
    nothing else.`,
  },
  {
    heading: 'Is it accessible?',
    answer: html`Every element is audited by axe in both themes, at every appearance setting, in a
    real browser, on every release, and its keyboard behaviour has tests of its own. Each component
    page says what a screen reader hears.`,
  },
  {
    heading: 'How do I make it look like my brand?',
    answer: html`One attribute per setting — <code>data-accent</code>, <code>data-font</code>,
      <code>data-radius</code>, <code>data-density</code> — or any colour through
      <code>setAppearance</code>, which keeps every text readable. The example above writes the line
      for you.`,
  },
  {
    heading: 'What is the licence, and what does it cost?',
    answer: html`MIT, and nothing. Use it in commercial products, change it, ship it.`,
  },
];

/**
 * Each miniature is the whole docs site booted in a frame, so it starts only
 * as it nears the screen. loading="lazy" alone is not enough: Chromium loads
 * frames a few thousand pixels ahead, which on this page is all of them at once.
 */
function bootWhenNear(src: string): (frame?: Element) => void {
  return (frame) => {
    if (!(frame instanceof HTMLIFrameElement) || frame.getAttribute('src')) return;
    // Every browser has the observer; without one — a test runner — the
    // miniature stays empty rather than booting the site nine times over.
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        frame.src = src;
        observer.disconnect();
      },
      { rootMargin: '200px' },
    );
    observer.observe(frame);
  };
}

export function homePage({
  appearance,
  rerender,
}: {
  appearance: DocsAppearance;
  onUse: (appearance: DocsAppearance) => void;
  rerender: () => void;
}): TemplateResult {
  const copyInstall = () => {
    void navigator.clipboard?.writeText(INSTALL);
    toaster.success('Copied');
  };
  const install = html`<button type="button" class="home-install" @click=${copyInstall}>
    <span class="home-install-prompt" aria-hidden="true">$</span>${INSTALL}<kt-icon
      name="copy"
      size="16"
    ></kt-icon>
    <span class="visually-hidden">Copy the install command</span>
  </button>`;
  const stackblitz = () => openInStackBlitz(stackblitzProject(appearance, VERSION));

  return html`<div class="home">
    <section class="home-hero" aria-labelledby="home-title">
      <div class="home-hero-text">
        <a class="home-flag" href="#/guide/ai-agents">
          <kt-badge tone="primary" icon="sparkles">New</kt-badge>
          <span>Built for AI agents: Claude Code, Cursor and Copilot write it right</span>
        </a>
        <h1 id="home-title">Ship the product, not the design system.</h1>
        <p class="home-lead">
          ${COMPONENTS.length} components for dashboards, admin tools and forms. They work in any
          framework, read well in both themes, and wear your colours from one line. Free and open
          source.
        </p>
        <div class="home-actions">
          <kt-button size="large" @click=${() => (location.hash = '#/guide/installation')}
            >Get started</kt-button
          >
          ${install}
          <kt-button
            size="large"
            variant="secondary-no-bg"
            icon="external-link"
            @click=${stackblitz}
            >Try it live</kt-button
          >
        </div>
        <p class="home-note">
          MIT licensed and free. React, Vue, Angular, Svelte or plain HTML, and ready for your AI
          agent.
        </p>
      </div>
      <div class="home-stage">
        ${stage({ siteAccent: appearance.accent, rerender })}
        <p class="stage-caption">
          Every part of it is Kanto, live — and
          <a href="#/templates/dashboard">a screen like it</a> is ready to copy.
        </p>
      </div>
    </section>

    <section class="home-band home-agents" aria-labelledby="home-agents">
      <div class="home-agents-text">
        <h2 id="home-agents">Your AI agent builds with it, right the first time</h2>
        <p>
          Kanto ships its own instructions for agents: the rules that make code right, the mistakes
          they make and the fix, and every component's page. One line points Claude Code, Cursor,
          Copilot or Codex at them.
        </p>
        <ul class="home-agents-links">
          <li><a href="#/guide/ai-agents">Set up your agent</a></li>
          <li><a href="llms.txt">llms.txt</a></li>
          <li><a href="llms-full.txt">llms-full.txt, every page in one file</a></li>
        </ul>
      </div>
      <kt-card class="home-agents-setup"
        ><div class="home-agents-body">
          <kt-tabs
            label="Agent"
            .tabs=${AGENT_SETUPS.map((setup) => ({ value: setup.id, label: setup.name }))}
            .value=${agent}
            @kt-change=${(event: CustomEvent<{ value: string }>) => {
              agent = event.detail.value;
              rerender();
            }}
          ></kt-tabs>
          ${(() => {
            const setup = AGENT_SETUPS.find((candidate) => candidate.id === agent)!;
            return html`<p class="home-agents-file">
                <kt-icon name="file-text" size="16"></kt-icon>${setup.file}
              </p>
              ${code(setup.snippet, 'markdown')}`;
          })()}
          <figure class="home-agents-prompt">
            <figcaption>Then ask for the screen</figcaption>
            <blockquote>
              Build a settings page with Kanto: a profile form, notification toggles, and a danger
              zone that asks before deleting the account.
            </blockquote>
          </figure>
        </div></kt-card
      >
    </section>

    <section class="home-band home-reasons" aria-labelledby="home-why">
      <h2 id="home-why">What you get on day one</h2>
      ${REASONS.map(
        (reason) =>
          html`<article class="home-reason">
            <div class="home-reason-text">
              <h3>${reason.heading}</h3>
              <p>${reason.body}</p>
              <ul>
                ${reason.points.map(
                  (point) => html`<li><kt-icon name="check" size="16"></kt-icon>${point}</li>`,
                )}
              </ul>
            </div>
            <div class="home-reason-demo">${reason.demo(rerender)}</div>
          </article>`,
      )}
    </section>

    <section class="home-band home-showcase" aria-labelledby="home-gallery">
      <h2 id="home-gallery">Everything a product screen needs</h2>
      <p>
        ${SCREEN_COUNT} everyday screens, all Kanto and all live. Type in them, open the menus —
        then give them another look from the row above.
      </p>
      ${showcase(rerender)}
      <ul class="home-gallery">
        ${FAMILIES.map(
          (family) =>
            html`<li>
              <span class="home-gallery-family">${family}</span>
              ${COMPONENTS.filter((entry) => entry.group === family).map(
                (entry) =>
                  html`<a href=${`#/components/${entry.slug}`}
                    >${entry.slug.replace(/^kt-/, '')}</a
                  >`,
              )}
            </li>`,
        )}
      </ul>
    </section>

    <section class="home-band home-screens" aria-labelledby="home-templates">
      <h2 id="home-templates">Start from a whole screen</h2>
      <p>Pages to copy into a product — the markup, its styles and a few lines of script.</p>
      <ul class="home-previews">
        ${TEMPLATES.map((template) =>
          preview({
            href: `#/templates/${template.slug}`,
            src: `${location.pathname}#/template/${template.slug}`,
            name: template.name,
            note: template.description,
          }),
        )}
      </ul>
      <h3 class="home-subhead">And whole apps</h3>
      <ul class="home-previews home-previews-apps">
        ${APPS.map((app) =>
          preview({
            href: `#/app/${app.path}`,
            src: `${location.pathname}#/app/${app.path}`,
            name: app.name,
            note: app.note,
          }),
        )}
      </ul>
    </section>

    <section class="home-band home-stack" aria-labelledby="home-frameworks">
      <div class="home-stack-text">
        <h2 id="home-frameworks">Works with your stack</h2>
        <p>
          Kanto is standard custom elements: the same button in React, Vue, Angular or plain HTML,
          with typed wrappers where a framework wants them.
        </p>
      </div>
      <div class="home-stack-code">
        <kt-tabs
          label="Framework"
          .tabs=${[
            { value: 'react', label: 'React' },
            { value: 'vue', label: 'Vue' },
            { value: 'angular', label: 'Angular' },
            { value: 'html', label: 'HTML' },
          ]}
          .value=${framework}
          @kt-change=${(event: CustomEvent<{ value: keyof typeof FRAMEWORKS }>) => {
            framework = event.detail.value;
            rerender();
          }}
        ></kt-tabs>
        ${code(
          FRAMEWORKS[framework],
          framework === 'react'
            ? 'tsx'
            : framework === 'html'
              ? 'html'
              : framework === 'vue'
                ? 'vue'
                : 'ts',
        )}
      </div>
    </section>

    <section class="home-band home-faq" aria-labelledby="home-faq">
      <h2 id="home-faq">Before you ask</h2>
      ${QUESTIONS.map(
        (question) =>
          html`<kt-collapsible heading=${question.heading}
            ><p>${question.answer}</p></kt-collapsible
          >`,
      )}
    </section>

    <section class="home-band" aria-labelledby="home-start">
      <kt-card class="home-cta">
        <div slot="header" class="home-cta-head">
          <h2 id="home-start">Your next screen, in Kanto.</h2>
          <p>Install it, import it once, and build — in your colours from the first line.</p>
        </div>
        <ol class="home-steps">
          <li>
            <span>Install</span>
            ${code(INSTALL, 'bash')}
          </li>
          <li>
            <span>Import it once, at the root</span>
            ${code(IMPORTS, 'js')}
          </li>
          <li>
            <span>Use it</span>
            ${code(USE, 'html')}
          </li>
        </ol>
        <div slot="footer" class="home-cta-actions">
          <kt-button size="large" @click=${() => (location.hash = '#/guide/installation')}
            >Get started</kt-button
          >
          <kt-button size="large" variant="secondary" icon="external-link" @click=${stackblitz}
            >Open in StackBlitz</kt-button
          >
          <a class="home-link" href="#/guide/installation#no-build-step"
            >No bundler? One script tag.</a
          >
        </div>
      </kt-card>
    </section>
  </div>`;
}

/**
 * The site's footer, under the home page. Outside \`<main>\`, where a
 * contentinfo landmark belongs: the shell draws it after the page.
 */
export function homeFooter(): TemplateResult {
  return html`<div class="home-footer-wrap">
    <kt-footer class="home-footer" label="Site" .columns=${FOOTER}>
      <a slot="brand" class="wordmark" href="#/">KANTO <span>DS</span></a>
      Accessible web components for dashboards, admin tools and forms.
      <span slot="legal">${VERSION_TAG}, MIT licence.</span>
      <span slot="legal">Made with Kanto, down to this footer.</span>
    </kt-footer>
  </div>`;
}

/** A page shown small and live, loaded only as it nears the screen. */
function preview({
  href,
  src,
  name,
  note,
}: {
  href: string;
  src: string;
  name: string;
  note: string;
}): TemplateResult {
  return html`<li>
    <a class="home-preview" href=${href}>
      <span class="home-preview-view">
        <iframe
          ${ref(bootWhenNear(src))}
          title=${`${name}, a preview`}
          loading="lazy"
          inert
          tabindex="-1"
          aria-hidden="true"
        ></iframe>
      </span>
      <span class="home-preview-name">${name}</span>
      <span class="home-preview-note">${note}</span>
    </a>
  </li>`;
}
