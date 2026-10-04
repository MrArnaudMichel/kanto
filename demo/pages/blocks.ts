/**
 * The blocks, all on one page: the sections a product's pages are made of,
 * each live, grouped by the kind of page it belongs to, and each leading to
 * its own documentation.
 */
import { html } from 'lit';
import { renderDoc, type Heading } from '../lib/markdown.js';
import { COMPONENTS } from '../lib/registry.js';
import type { DocPage } from './component.js';

/** What each block is for — the order a page is read in, top to bottom. */
export const BLOCK_CATEGORIES = [
  {
    id: 'marketing',
    label: 'Marketing',
    lead: 'The front of a product: what it is, what it does, what it costs, and who says so.',
    slugs: [
      'kt-hero',
      'kt-logo-cloud',
      'kt-feature-grid',
      'kt-testimonials',
      'kt-pricing-table',
      'kt-faq',
      'kt-cta',
    ],
  },
  {
    id: 'blog',
    label: 'Blog',
    lead: 'Posts to list, a post to read, and a way to hear about the next one.',
    slugs: ['kt-post-grid', 'kt-blog-post', 'kt-newsletter'],
  },
  {
    id: 'application',
    label: 'Application',
    lead: 'The pages inside a product: the way in, the first steps, the settings, and the page for when something is wrong.',
    slugs: ['kt-auth-form', 'kt-empty-page', 'kt-settings-section', 'kt-error-page'],
  },
] as const;

export function blocksPage(): DocPage {
  const categories = BLOCK_CATEGORIES.map((category) => ({
    ...category,
    blocks: category.slugs.flatMap((slug) => {
      const entry = COMPONENTS.find((candidate) => candidate.slug === slug);
      return entry ? [{ entry, summary: renderDoc(entry.doc).summary }] : [];
    }),
  }));
  const sections: Heading[] = categories.map((category) => ({
    id: category.id,
    text: category.label,
    level: 2,
  }));
  const headings: Heading[] = categories.flatMap((category) => [
    { id: category.id, text: category.label, level: 2 },
    ...category.blocks.map(({ entry }) => ({
      id: `block-${entry.slug}`,
      text: entry.slug.replace(/^kt-/, ''),
      level: 3,
    })),
  ]);

  return {
    title: 'Blocks',
    summary:
      'Whole sections of a page — a hero, pricing, a blog post, a settings section — built from Kanto and ready to drop in. Each takes its words and data as properties, and its own heading level.',
    eyebrow: 'Blocks',
    headings,
    source: 'demo/pages/blocks.ts',
    sidebar: { group: 'Kinds of page', items: sections },
    body: html`<div class="blocks-gallery">
      ${categories.map(
        (category) =>
          html`<section class="blocks-category" aria-labelledby=${category.id}>
            <h2 id=${category.id}>${category.label}</h2>
            <p class="blocks-lead">${category.lead}</p>
            ${category.blocks.map(
              ({ entry, summary }) =>
                html`<section class="blocks-item" aria-labelledby=${`block-${entry.slug}`}>
                  <div class="blocks-item-head">
                    <h3 id=${`block-${entry.slug}`}>
                      <a href=${`#/components/${entry.slug}`}><code>${entry.slug}</code></a>
                    </h3>
                    <p>${summary}</p>
                  </div>
                  <div class="preview">${entry.example()}</div>
                </section>`,
            )}
          </section>`,
      )}
    </div>`,
  };
}
