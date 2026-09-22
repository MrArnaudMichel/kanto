import { html, type TemplateResult } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { renderDoc, type Heading } from '../lib/markdown.js';
import type { ComponentEntry } from '../lib/registry.js';

export interface DocPage {
  readonly title: string;
  readonly summary: string;
  readonly eyebrow: string;
  readonly headings: readonly Heading[];
  readonly body: TemplateResult;
  /** Path of the file this page renders, for the "Edit this page" link. */
  readonly source: string;
  /**
   * Headings of this page worth a place in the sidebar as well as in the
   * contents — the versions on the release page. Listed under `group`, below
   * the section's own pages.
   */
  readonly sidebar?: { readonly group: string; readonly items: readonly Heading[] };
}

/**
 * One component's page: a live preview on top, then the component's own
 * markdown.
 *
 * `unsafeHTML` is safe here in the strict sense that matters — the input is
 * this repository's own documentation, bundled at build time, not anything a
 * visitor can reach.
 */
export function componentPage(entry: ComponentEntry): DocPage {
  const doc = renderDoc(entry.doc);
  const headings: Heading[] = [{ id: 'preview', text: 'Preview', level: 2 }, ...doc.headings];

  return {
    title: doc.title || entry.name,
    summary: doc.summary,
    eyebrow: entry.group,
    headings,
    source: `src/components/${entry.group.toLowerCase()}/${entry.slug}/${entry.slug}.md`,
    body: html`
      <section class="preview-section">
        <h2 id="preview">Preview</h2>
        <div class="preview">${entry.example()}</div>
      </section>
      <div class="prose">${unsafeHTML(doc.html)}</div>
    `,
  };
}

/** A guide page: markdown only, no live preview. */
export function markdownPage(source: string, path: string, eyebrow = 'Guide'): DocPage {
  const doc = renderDoc(source);
  return {
    title: doc.title,
    summary: doc.summary,
    eyebrow,
    headings: doc.headings,
    source: path,
    body: html`<div class="prose">${unsafeHTML(doc.html)}</div>`,
  };
}
