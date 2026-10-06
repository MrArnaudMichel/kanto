/**
 * Moving around the changelog, the same in every stack: the tab's title, the
 * way to the sign-up form, and the list's place kept while a release is read.
 */
import { SITE } from './content';
import type { Release } from './releases';

/** The tab's title: the changelog, a release, or a release that is not there. */
export function pageTitle(version: string | null, release: Release | undefined): string {
  const name = `${SITE.name} changelog`;
  if (version === null) return name;
  return release ? `${release.version} — ${name}` : `Release not found — ${name}`;
}

/** Scrolls to the sign-up form and puts the keyboard in its field. */
export function toNewsletter(newsletter: HTMLElement): void {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  newsletter.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  newsletter.shadowRoot
    ?.querySelector('kt-input')
    ?.shadowRoot?.querySelector('input')
    ?.focus({ preventScroll: true });
}

// The page says where the reader is; the browser's own guess lands elsewhere.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

let listTop = 0;

/** As the list is left for a release: the place to come back to. */
export function leaveList(): void {
  listTop = window.scrollY;
}

/**
 * Once the list is drawn again: back where it was left. Its releases draw
 * themselves a moment after they are added — until then the page is too short
 * to scroll that far.
 */
export function returnToList(): void {
  const items = [...document.querySelectorAll('kt-timeline-item')] as (Element & {
    updateComplete?: Promise<unknown>;
  })[];
  void Promise.all(items.map((item) => item.updateComplete)).then(() =>
    requestAnimationFrame(() => window.scrollTo(0, listTop)),
  );
}

/** Once a release is drawn: its top, and its heading for the keyboard and screen readers. */
export function openRelease(heading: HTMLElement | null | undefined): void {
  window.scrollTo(0, 0);
  heading?.focus({ preventScroll: true });
}
