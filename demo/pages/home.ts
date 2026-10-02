/**
 * The front door: what Kanto is in two sentences, then the proof — a
 * playground first, because the quickest way to want a design system is to
 * see it wearing your colours.
 */
import { html, type TemplateResult } from 'lit';
import { ref } from 'lit/directives/ref.js';
import { KT_ACCENTS, toaster } from 'kanto-ds';
import { COMPONENTS } from '../lib/registry.js';
import { playground } from '../lib/playground.js';
import { SCREEN_COUNT, showcase } from '../lib/showcase.js';
import { TEMPLATES } from '../templates/index.js';
import { code } from '../lib/highlight.js';
import type { DocsAppearance } from '../lib/appearance.js';
import { REPO_URL, VERSION } from '../lib/project.js';
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

/** Three components beside the one line each takes, live under it. */
const SPECIMENS: { source: string; live: () => TemplateResult }[] = [
  {
    source: '<kt-date-picker range label="Report period"></kt-date-picker>',
    live: () =>
      html`<kt-date-picker
        range
        label="Report period"
        value="2026-09-01/2026-09-30"
      ></kt-date-picker>`,
  },
  {
    source: '<kt-time-input label="Starts at" step="15"></kt-time-input>',
    live: () => html`<kt-time-input label="Starts at" step="15" value="09:30"></kt-time-input>`,
  },
  {
    source: '<kt-button variant="primary" icon="send">Send</kt-button>',
    live: () =>
      html`<kt-button variant="primary" icon="send" @click=${() => toaster.success('Invoice sent')}
        >Send</kt-button
      >`,
  },
];

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
      <code>setAppearance</code>, which keeps every text readable. The playground above writes the
      line for you.`,
  },
  {
    heading: 'What is the licence, and what does it cost?',
    answer: html`MIT, and nothing. Use it in commercial products, change it, ship it.`,
  },
];

/**
 * Each miniature is the whole docs site booted in a frame, so it starts only
 * as it nears the screen. loading="lazy" alone is not enough: Chromium loads
 * frames a few thousand pixels ahead, which on this page is all four at once.
 */
function bootWhenNear(src: string): (frame?: Element) => void {
  return (frame) => {
    if (!(frame instanceof HTMLIFrameElement) || frame.getAttribute('src')) return;
    if (typeof IntersectionObserver === 'undefined') {
      frame.src = src;
      return;
    }
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
  onUse,
  rerender,
}: {
  appearance: DocsAppearance;
  onUse: (appearance: DocsAppearance) => void;
  rerender: () => void;
}): TemplateResult {
  return html`<div class="home">
    <section class="home-hero" aria-labelledby="home-title">
      <div class="home-hero-text">
        <h1 id="home-title">Components that take your brand in a minute.</h1>
        <p class="home-lead">
          Kanto is ${COMPONENTS.length} web components for dashboards, admin tools and forms. They
          run in any framework, pass accessibility checks in both themes, and take your colour, font
          and density from one line. Free and open source.
        </p>
        <div class="home-actions">
          <kt-button variant="primary" @click=${() => (location.hash = '#/guide/installation')}
            >Get started</kt-button
          >
          <button
            type="button"
            class="home-install"
            @click=${() => {
              void navigator.clipboard?.writeText(INSTALL);
              toaster.success('Copied');
            }}
          >
            <code>${INSTALL}</code><kt-icon name="copy" size="16"></kt-icon>
            <span class="visually-hidden">Copy the install command</span>
          </button>
          <kt-button
            variant="secondary"
            icon="external-link"
            @click=${() => openInStackBlitz(stackblitzProject(appearance, VERSION))}
            >Try it in StackBlitz</kt-button
          >
          <a class="home-link" href=${REPO_URL} target="_blank" rel="noopener">GitHub</a>
        </div>
        <dl class="home-facts">
          <div>
            <dt>${COMPONENTS.length} components</dt>
            <dd>forms, data, dates, overlays</dd>
          </div>
          <div>
            <dt>2 themes</dt>
            <dd>audited by axe in both</dd>
          </div>
          <div>
            <dt>${KT_ACCENTS.length} accents</dt>
            <dd>or any colour you pick</dd>
          </div>
          <div>
            <dt>Any framework</dt>
            <dd>one implementation</dd>
          </div>
        </dl>
      </div>
      <div class="home-specimens" aria-label="Three components and the code for each">
        ${SPECIMENS.map(
          (specimen) =>
            html`<figure class="home-specimen">
              ${code(specimen.source, 'html', { copy: false })}
              <div class="home-specimen-live">${specimen.live()}</div>
            </figure>`,
        )}
      </div>
    </section>

    <section class="home-band home-showcase" aria-labelledby="home-gallery">
      <h2 id="home-gallery">Everything a product screen needs</h2>
      <p>
        ${SCREEN_COUNT} everyday screens, built from Kanto alone and all live. Type in them, open
        the menus, pick a day — then change their look from the row above.
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

    <section class="home-band" aria-labelledby="home-templates">
      <h2 id="home-templates">Or start from a whole screen</h2>
      <p>Pages ready to copy into a product — the markup, its styles and a few lines of script.</p>
      <ul class="home-templates">
        ${TEMPLATES.map(
          (template) =>
            html`<li>
              <a href=${`#/templates/${template.slug}`}>
                <span class="home-template-name">${template.name}</span>
                <span class="home-template-note">${template.description}</span>
              </a>
            </li>`,
        )}
      </ul>
    </section>

    <section class="home-band" aria-labelledby="home-try">
      <h2 id="home-try">Make it yours before you install it</h2>
      <p>Every setting below is one attribute in your project. Pick, look, copy.</p>
      ${playground({ start: appearance, onUse, rerender })}
    </section>

    <section class="home-band" aria-labelledby="home-frameworks">
      <h2 id="home-frameworks">One component, every framework</h2>
      <p>Kanto is made of standard custom elements, so the same button works wherever HTML does.</p>
      <kt-tabs
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
      ${code(FRAMEWORKS[framework], framework === 'react' ? 'tsx' : framework === 'html' ? 'html' : framework === 'vue' ? 'vue' : 'ts')}
    </section>

    <section class="home-band" aria-labelledby="home-apps">
      <h2 id="home-apps">Already in real apps</h2>
      <p>Four applications built from Kanto alone. Open one and use it.</p>
      <ul class="home-apps">
        ${APPS.map(
          (app) =>
            html`<li>
              <a class="home-app" href=${`#/app/${app.path}`}>
                <span class="home-app-view">
                  <iframe
                    ${ref(bootWhenNear(`${location.pathname}#/app/${app.path}`))}
                    title=${`${app.name}, a preview`}
                    loading="lazy"
                    inert
                    tabindex="-1"
                    aria-hidden="true"
                  ></iframe>
                </span>
                <span class="home-app-name">${app.name}</span>
                <span class="home-app-note">${app.note}</span>
              </a>
            </li>`,
        )}
      </ul>
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

    <section class="home-band home-cta" aria-labelledby="home-start">
      <h2 id="home-start">Start in three steps</h2>
      <ol class="home-steps">
        <li>
          <p>Install it.</p>
          ${code(INSTALL, 'bash')}
        </li>
        <li>
          <p>Import it once.</p>
          ${code(IMPORTS, 'js')}
        </li>
        <li>
          <p>Use it.</p>
          ${code(USE, 'html')}
        </li>
      </ol>
      <p class="home-alt">
        No bundler?
        <a href="#/guide/installation#no-build-step">One stylesheet and one script tag</a>
        do it.
      </p>
      <div class="home-actions">
        <kt-button variant="primary" @click=${() => (location.hash = '#/guide/installation')}
          >Read the guide</kt-button
        >
        <kt-button
          variant="secondary"
          icon="external-link"
          @click=${() => openInStackBlitz(stackblitzProject(appearance, VERSION))}
          >Try it in StackBlitz</kt-button
        >
      </div>
    </section>
  </div>`;
}
