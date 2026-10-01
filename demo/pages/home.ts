/**
 * The front door: what Kanto is in two sentences, then the proof — a
 * playground first, because the quickest way to want a design system is to
 * see it wearing your colours.
 */
import { html, type TemplateResult } from 'lit';
import { ref } from 'lit/directives/ref.js';
import { toaster } from 'kanto-ds';
import { playground } from '../lib/playground.js';
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
      <h1 id="home-title">Components that take your brand in a minute.</h1>
      <p class="home-lead">
        Kanto is 49 web components for dashboards, admin tools and forms. They run in any framework,
        pass accessibility checks in both themes, and take your colour, font and density from one
        line. Free and open source.
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
      <kt-code language=${framework === 'react' ? 'tsx' : framework === 'html' ? 'html' : framework}
        >${FRAMEWORKS[framework]}</kt-code
      >
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

    <section class="home-band" aria-labelledby="home-start">
      <h2 id="home-start">Start in three steps</h2>
      <ol class="home-steps">
        <li>
          <p>Install it.</p>
          <kt-code language="bash">${INSTALL}</kt-code>
        </li>
        <li>
          <p>Import it once.</p>
          <kt-code language="js">${IMPORTS}</kt-code>
        </li>
        <li>
          <p>Use it.</p>
          <kt-code language="html">${USE}</kt-code>
        </li>
      </ol>
      <p class="home-alt">
        No bundler?
        <a href="#/guide/installation#no-build-step">One stylesheet and one script tag</a>
        do it.
      </p>
      <kt-button variant="secondary" @click=${() => (location.hash = '#/guide/installation')}
        >Read the guide</kt-button
      >
    </section>
  </div>`;
}
