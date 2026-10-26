/**
 * The site's addresses: a page is a path — `/components/kt-button` — and a
 * heading on it the hash, `#no-build-step`. The first site lived behind `#/`;
 * an old link still says where it goes, and the site moves it to its path.
 */

export interface Address {
  readonly section: string;
  readonly slug: string;
  /** A heading on the page. */
  readonly anchor: string;
  /** The page's own query: `?checkout_id=…` on the thank-you page. */
  readonly query: string;
  /** Written the old way, `#/section/slug`: the site moves it to its path. */
  readonly legacy: boolean;
}

export function addressOf(location: { pathname: string; search: string; hash: string }): Address {
  if (location.hash.startsWith('#/')) {
    // `#/guide/installation#no-build-step`, or `#/pro/thanks?checkout_id=…`.
    const [route = '', anchor = ''] = location.hash.slice(2).split('#');
    const [path = '', query = ''] = route.split('?');
    const [section = '', slug = ''] = path.split('/');
    return { section, slug, anchor, query: query ? `?${query}` : location.search, legacy: true };
  }
  const [section = '', slug = ''] = location.pathname.replace(/^\/+/, '').split('/');
  return {
    section,
    slug,
    anchor: decodeURIComponent(location.hash.slice(1)),
    query: location.search,
    legacy: false,
  };
}

export function hrefOf(section: string, slug: string): string {
  if (!section || section === 'home') return '/';
  return slug ? `/${section}/${slug}` : `/${section}`;
}

/** A link the site routes itself: on this origin, a page, not a file or a template's live build. */
export function isSiteLink(url: URL, origin: string): boolean {
  if (url.origin !== origin) return false;
  if (url.pathname.startsWith('/live/')) return false;
  // A file: /llms.txt, /pro/home-dark.webp.
  return !/\.[a-z0-9]+$/i.test(url.pathname);
}

/** Goes to a page of the site without a reload: the router hears it as it hears Back. */
export function go(path: string): void {
  history.pushState(null, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
