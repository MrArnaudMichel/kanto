/**
 * A template's two faces: its page in the docs — the running screen, the
 * code, Copy and StackBlitz — and the screen itself, alone at
 * `#/template/<slug>`, which the page's preview frames.
 */
import { html, type TemplateResult } from 'lit';
import { ref } from 'lit/directives/ref.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { toaster } from 'kanto-ds';
import { code } from '../lib/highlight.js';
import { VERSION } from '../lib/project.js';
import { openInStackBlitz, templateProject } from '../lib/stackblitz.js';
import { runTemplate, type Template } from '../templates/index.js';
import type { DocPage } from './component.js';

/** Which code tab each template page shows, kept across re-renders. */
const tabs = new Map<string, 'html' | 'js'>();

/**
 * Which template each screen container last ran: a script runs once per
 * screen. Lit keeps the same container from one template to the next, so the
 * slug, not the element alone, says whether this one has run.
 */
const started = new WeakMap<Element, string>();

export function templateScreen(template: Template): TemplateResult {
  return html`<div
    class="template-screen"
    ${ref((element) => {
      if (!element || started.get(element) === template.slug) return;
      started.set(element, template.slug);
      // After this render has put the markup in the page.
      queueMicrotask(() => runTemplate(template));
    })}
  >
    ${unsafeHTML(template.html)}
  </div>`;
}

async function copy(text: string, what: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    toaster.success(`${what} copied`);
  } catch {
    toaster.error('Could not copy', { description: 'The browser kept the clipboard closed.' });
  }
}

export function templatePage(template: Template, rerender: () => void): DocPage {
  const href = `#/template/${template.slug}`;
  const tab = tabs.get(template.slug) ?? 'html';

  return {
    title: template.name,
    summary: template.description,
    eyebrow: 'Templates',
    headings: [
      { id: 'preview', text: 'Preview', level: 2 },
      { id: 'code', text: 'Code', level: 2 },
    ],
    source: `demo/templates/${template.slug}.ts`,
    body: html`
      <section class="preview-section">
        <div class="app-preview-head">
          <h2 id="preview">Preview</h2>
          <div class="template-actions">
            <kt-button
              size="small"
              variant="secondary"
              icon="external-link"
              @click=${() => openInStackBlitz(templateProject(template, VERSION))}
              >Open in StackBlitz</kt-button
            >
            <kt-button
              size="small"
              icon="arrow-up-right"
              icon-position="right"
              @click=${() => {
                location.hash = href;
              }}
              >Open full screen</kt-button
            >
          </div>
        </div>
        <div class="app-preview">
          <div class="app-preview-chrome">
            <span class="app-preview-dots"><i></i><i></i><i></i></span>
            <span class="app-preview-url">kanto${href}</span>
          </div>
          <div class="app-preview-viewport">
            <iframe
              class="app-preview-frame"
              title=${`${template.name}, running`}
              loading="lazy"
              src=${`./${href}`}
            ></iframe>
          </div>
        </div>
      </section>

      <section class="template-code">
        <div class="app-preview-head">
          <h2 id="code">Code</h2>
          <kt-button
            size="small"
            variant="secondary"
            icon="copy"
            @click=${() =>
              void copy(
                tab === 'html'
                  ? template.html
                  : `import 'kanto-ds';\nimport 'kanto-ds/styles.css';\n${template.script}`,
                tab === 'html' ? 'HTML' : 'Script',
              )}
            >Copy ${tab === 'html' ? 'HTML' : 'script'}</kt-button
          >
        </div>
        <p class="muted">
          The page above is this code, running. Paste the markup in your page and the script after
          Kanto's import.
        </p>
        <kt-tabs
          .tabs=${[
            { value: 'html', label: 'HTML' },
            { value: 'js', label: 'Script' },
          ]}
          .value=${tab}
          @kt-change=${(event: CustomEvent<{ value: 'html' | 'js' }>) => {
            tabs.set(template.slug, event.detail.value);
            rerender();
          }}
        ></kt-tabs>
        ${
          tab === 'html'
            ? code(template.html, 'html', { copy: false })
            : code(`import 'kanto-ds';\nimport 'kanto-ds/styles.css';\n${template.script}`, 'js', {
                copy: false,
              })
        }
      </section>
    `,
  };
}
