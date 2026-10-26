/**
 * What a page tells a search engine and a shared link: its title, what it
 * holds, its one address. Set on every page change, and read by the
 * prerender (scripts/prerender.js) into the HTML it writes.
 */

/** Where the site is served: the address every canonical link starts with. */
export const SITE = 'https://kanto.arnaudmichel.fr';

export interface PageMeta {
  readonly title: string;
  readonly description: string;
  /** Its canonical path: `/components/kt-button/`. */
  readonly path: string;
  /** False keeps it out of search engines: the buyer's thank-you page. */
  readonly indexed: boolean;
}

function tag(doc: Document, selector: string, create: () => HTMLElement): HTMLElement {
  return doc.head.querySelector<HTMLElement>(selector) ?? doc.head.appendChild(create());
}

function named(doc: Document, attribute: 'name' | 'property', value: string): HTMLElement {
  return tag(doc, `meta[${attribute}="${value}"]`, () => {
    const meta = doc.createElement('meta');
    meta.setAttribute(attribute, value);
    return meta;
  });
}

export function applyMeta(meta: PageMeta, doc: Document = document): void {
  const url = `${SITE}${meta.path}`;
  doc.title = meta.title;
  named(doc, 'name', 'description').setAttribute('content', meta.description);
  named(doc, 'property', 'og:title').setAttribute('content', meta.title);
  named(doc, 'property', 'og:description').setAttribute('content', meta.description);
  named(doc, 'property', 'og:url').setAttribute('content', url);
  tag(doc, 'link[rel="canonical"]', () => {
    const link = doc.createElement('link');
    link.rel = 'canonical';
    return link;
  }).setAttribute('href', url);
  if (meta.indexed) doc.head.querySelector('meta[name="robots"]')?.remove();
  else named(doc, 'name', 'robots').setAttribute('content', 'noindex');
}
