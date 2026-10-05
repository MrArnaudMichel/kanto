/**
 * The Templates section: the gallery, and a page per template — its screens,
 * the command for each stack, what is inside, the components it uses. The
 * catalog in demo/lib/templates.ts is the content.
 */
import { html, type TemplateResult } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { code } from '../lib/highlight.js';
import { renderDoc, type Heading } from '../lib/markdown.js';
import {
  createCommand,
  degitCommand,
  demoHref,
  STACKS,
  TEMPLATE_CATALOG,
  type StackId,
  type TemplateEntry,
} from '../lib/templates.js';
import type { DocPage } from './component.js';

/** The stack each template's page shows, kept across re-renders. */
const chosen = new Map<string, StackId>();

const screenSrc = (file: string) => `./templates/${file}`;

function demoLink(entry: TemplateEntry): TemplateResult {
  return html`<a class="template-demo" href=${demoHref(entry.id)} target="_blank" rel="noopener"
    >Live demo<kt-icon name="arrow-up-right" size="14" aria-hidden="true"></kt-icon
  ></a>`;
}

export function templatesPage(): DocPage {
  return {
    title: 'Templates',
    summary:
      'Whole projects to start from — routed, typed and building — in React, Vue or TypeScript without a framework. One command makes one; each runs live here first.',
    eyebrow: 'Templates',
    headings: [],
    source: 'demo/lib/templates.ts',
    body: html`<ul class="templates-gallery">
      ${TEMPLATE_CATALOG.map(
        (entry) =>
          html`<li class="template-card">
            <a
              class="template-card-shot"
              href=${`#/templates/${entry.id}`}
              tabindex="-1"
              aria-hidden="true"
            >
              <img
                src=${screenSrc(entry.screens[0]!.file)}
                alt=""
                loading="lazy"
                width="1400"
                height="860"
              />
            </a>
            <div class="template-card-body">
              <h2><a href=${`#/templates/${entry.id}`}>${entry.name}</a></h2>
              <p>${entry.summary}</p>
              <p class="template-stacks">${STACKS.map((stack) => stack.label).join(', ')}</p>
              <div class="template-card-actions">
                ${demoLink(entry)}
                <a href=${`#/templates/${entry.id}`}>How to start</a>
              </div>
            </div>
          </li>`,
      )}
    </ul>`,
  };
}

export function templatePage(entry: TemplateEntry, rerender: () => void): DocPage {
  const stack = chosen.get(entry.id) ?? 'react';
  const doc = renderDoc(entry.description);
  const headings: Heading[] = [
    { id: 'screens', text: 'Screens', level: 2 },
    { id: 'start', text: 'Start a project', level: 2 },
    { id: 'inside', text: 'What is inside', level: 2 },
    { id: 'components', text: 'Components', level: 2 },
  ];

  return {
    title: entry.name,
    summary: entry.summary,
    eyebrow: 'Templates',
    headings,
    source: 'demo/lib/templates.ts',
    body: html`
      <section class="preview-section">
        <div class="app-preview-head">
          <h2 id="screens">Screens</h2>
          ${demoLink(entry)}
        </div>
        <div class="template-screens">
          ${entry.screens.map(
            (screen) =>
              html`<figure>
                <img
                  src=${screenSrc(screen.file)}
                  alt=${screen.caption}
                  loading="lazy"
                  width="1400"
                  height="860"
                />
                <figcaption>${screen.caption}</figcaption>
              </figure>`,
          )}
        </div>
      </section>
      <div class="prose">
        <section class="template-start">
          <h2 id="start">Start a project</h2>
          <kt-tabs
            label="Stack"
            .tabs=${STACKS.map((option) => ({ value: option.id, label: option.label }))}
            .value=${stack}
            @kt-change=${(event: CustomEvent<{ value: StackId }>) => {
              chosen.set(entry.id, event.detail.value);
              rerender();
            }}
          ></kt-tabs>
          ${code(createCommand(entry.id, stack), 'bash')}
          <p>Or fork it as it is, without the tool:</p>
          ${code(degitCommand(entry.id, stack), 'bash')}
        </section>
        <h2 id="inside">What is inside</h2>
        ${unsafeHTML(doc.html)}
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Route</th>
                <th>What it shows</th>
              </tr>
            </thead>
            <tbody>
              ${entry.routes.map(
                (route) =>
                  html`<tr>
                    <td><code>${route.path}</code></td>
                    <td>${route.what}</td>
                  </tr>`,
              )}
            </tbody>
          </table>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>To change first</th>
                <th>What it holds</th>
              </tr>
            </thead>
            <tbody>
              ${entry.files.map(
                (file) =>
                  html`<tr>
                    <td><code>${file.path}</code></td>
                    <td>${file.what}</td>
                  </tr>`,
              )}
            </tbody>
          </table>
        </div>
        <h2 id="components">Components</h2>
        <ul class="template-components">
          ${entry.components.map(
            (tag) =>
              html`<li>
                <a href=${`#/components/${tag}`}><code>${tag}</code></a>
              </li>`,
          )}
        </ul>
      </div>
    `,
  };
}
