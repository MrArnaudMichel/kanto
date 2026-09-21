import { html } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { renderDoc, type Heading } from '../lib/markdown.js';
import type { DocPage } from './component.js';

export interface ShowcaseEntry {
  readonly slug: string;
  readonly label: string;
  readonly description: string;
  /** Markdown shown under the preview: what the screen is for, what to try. */
  readonly notes: string;
}

/**
 * One application's page: the running application on top, then its notes.
 *
 * The preview is a same-origin `<iframe>` rather than the components rendered
 * inline, because these screens are built for a whole viewport — a sidebar
 * pinned to 100vh inside a documentation column is not the thing being
 * documented. The frame is laid out at desktop width and scaled down, so what
 * you see is the real layout at the size it was designed for, not a responsive
 * fallback.
 */
export function appPage(entry: ShowcaseEntry): DocPage {
  const doc = renderDoc(entry.notes);
  const headings: Heading[] = [{ id: 'preview', text: 'Preview', level: 2 }, ...doc.headings];
  const href = `#/app/${entry.slug}`;

  return {
    title: entry.label,
    summary: entry.description,
    eyebrow: 'Applications',
    headings,
    source: `demo/apps/${entry.slug.split('/')[0]}`,
    body: html`
      <section class="preview-section">
        <div class="app-preview-head">
          <h2 id="preview">Preview</h2>
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

        <div class="app-preview">
          <div class="app-preview-chrome">
            <span class="app-preview-dots"><i></i><i></i><i></i></span>
            <span class="app-preview-url">kanto${href}</span>
          </div>
          <div class="app-preview-viewport">
            <iframe
              class="app-preview-frame"
              title=${`${entry.label}, running`}
              loading="lazy"
              src=${`./${href}`}
            ></iframe>
          </div>
        </div>
        <p class="app-preview-note">
          The frame above is the application itself, running. Everything in it works.
        </p>
      </section>
      <div class="prose">${unsafeHTML(doc.html)}</div>
    `,
  };
}
