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
      </div>
      <div class="home-stage">${stage({ siteAccent: appearance.accent, rerender })}</div>
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

    <section class="home-cta" aria-labelledby="home-start">
      <h2 id="home-start">Your next screen, in Kanto.</h2>
      <p>Install it, import it once, use it.</p>
      <ol class="home-steps">
        <li>${code(INSTALL, 'bash')}</li>
        <li>${code(IMPORTS, 'js')}</li>
        <li>${code(USE, 'html')}</li>
      </ol>
      <div class="home-actions">
        <kt-button size="large" @click=${() => (location.hash = '#/guide/installation')}
          >Read the guide</kt-button
        >
        <kt-button size="large" variant="secondary" icon="external-link" @click=${stackblitz}
          >Open in StackBlitz</kt-button
        >
        <a class="home-link" href=${REPO_URL} target="_blank" rel="noopener">Star it on GitHub</a>
      </div>
      <p class="home-alt">
        No bundler?
        <a href="#/guide/installation#no-build-step">One stylesheet and one script tag</a>
        do it.
      </p>
    </section>
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
