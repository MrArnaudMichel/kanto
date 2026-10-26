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
  STACKS,
  TEMPLATE_CATALOG,
  type StackId,
  type TemplateEntry,
} from '../lib/templates.js';
import type { DocPage } from './component.js';
import { PRO } from '../lib/pro.js';

/** The stack each template's page shows, kept across re-renders. */
const chosen = new Map<string, StackId>();

const screenSrc = (file: string) => `/templates/${file}`;

function demoLink(entry: TemplateEntry): TemplateResult {
  return html`<a class="template-demo" href=${entry.demo} target="_blank" rel="noopener"
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
              href=${`/templates/${entry.id}`}
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
              <h2><a href=${`/templates/${entry.id}`}>${entry.name}</a></h2>
              <p>${entry.summary}</p>
              <p class="template-stacks">
                ${entry.project ? STACKS.map((stack) => stack.label).join(', ') : 'Project coming soon'}
              </p>
              <div class="template-card-actions">
                ${demoLink(entry)}
                <a href=${`/templates/${entry.id}`}>How to start</a>
              </div>
            </div>
          </li>`,
      )}
      <li class="template-card template-card-pro">
        <a class="template-card-shot" href="/pro" tabindex="-1" aria-hidden="true">
          <span class="pro-shot">
            <img
              class="pro-shot-dark"
              src="/pro/home-dark.webp"
              alt=""
              loading="lazy"
              width="1440"
              height="900"
            />
            <img
              class="pro-shot-light"
              src="/pro/home-light.webp"
              alt=""
              loading="lazy"
              width="1440"
              height="900"
            />
          </span>
        </a>
        <div class="template-card-body">
          <h2><a href="/pro">${PRO.name}</a></h2>
          <p>
            The whole SaaS, server side included: accounts, billing, an admin panel and your
            database, in Nuxt.
          </p>
          <p class="template-stacks">Nuxt — paid once</p>
          <div class="template-card-actions"><a href="/pro">See what is in it</a></div>
        </div>
      </li>
    </ul>`,
  };
}

/** The template, running, framed at desktop width and scaled down — as the demo pages did. */
function running(entry: TemplateEntry): TemplateResult {
  return html`<div class="app-preview template-run">
      <div class="app-preview-chrome">
        <span class="app-preview-dots"><i></i><i></i><i></i></span>
        <span class="app-preview-url">${entry.name}</span>
      </div>
      <div class="app-preview-viewport">
        <iframe
          class="app-preview-frame"
          title=${`${entry.name}, running`}
          loading="lazy"
          src=${entry.demo}
        ></iframe>
      </div>
    </div>
    <p class="app-preview-note">
      The frame is the template itself, running. Everything in it works.
    </p>`;
}

export function templatePage(entry: TemplateEntry, rerender: () => void): DocPage {
  const stack = chosen.get(entry.id) ?? 'react';
  const inside = entry.routes.length > 0 || entry.files.length > 0;
  const headings: Heading[] = [
    { id: 'demo', text: 'Demo', level: 2 },
    { id: 'try', text: 'What to try', level: 2 },
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
          <h2 id="demo">Demo</h2>
          ${demoLink(entry)}
        </div>
        ${running(entry)}
      </section>
      <div class="prose">
        <h2 id="try">What to try</h2>
        ${unsafeHTML(renderDoc(entry.tryIt).html)}
        ${
          entry.id === 'saas'
            ? html`<p class="template-pro">
                Need the back end too — real accounts, billing, an admin panel, your database?
                <a href="/pro">${PRO.name}</a> is the whole SaaS, paid once.
              </p>`
            : ''
        }
        <section class="template-start">
          <h2 id="start">Start a project</h2>
          ${
            entry.project
              ? html`<kt-tabs
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
                  ${code(degitCommand(entry.id, stack), 'bash')}`
              : html`<p>
                  The project is coming: React, Vue and TypeScript, made with
                  <code>npm create kanto@latest</code> like the others. For now, the demo above is
                  the template running.
                </p>`
          }
        </section>
        <h2 id="inside">What is inside</h2>
        ${unsafeHTML(renderDoc(entry.description).html)}
        ${
          inside
            ? html`<div class="table-wrap">
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
                </div>`
            : ''
        }
        <h2 id="components">Components</h2>
        <ul class="template-components">
          ${entry.components.map(
            (tag) =>
              html`<li>
                <a href=${`/components/${tag}`}><code>${tag}</code></a>
              </li>`,
          )}
        </ul>
      </div>
    `,
  };
}
