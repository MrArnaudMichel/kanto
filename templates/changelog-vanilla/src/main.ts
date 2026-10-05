import 'kanto-ds';
import 'kanto-ds/styles.css';
import './styles.css';
import './icons';
import type { KtHeader, KtNewsletter, KtPostGrid, KtSubscribeDetail } from 'kanto-ds';
import { subscribe } from './actions';
import { applyBrand } from './brand';
import { FOOTER, INTRO, NEWSLETTER, POSTS, RELEASES, SITE } from './content';
import {
  filterReleases,
  formatDate,
  KIND_LABEL,
  KIND_TONE,
  KINDS,
  neighbours,
  releaseByVersion,
  type Kind,
  type Release,
} from './releases';

applyBrand();

/** An element, its attributes, and its children — text goes in as text, never as markup. */
function el<T extends HTMLElement = HTMLElement>(
  tag: string,
  attributes: Record<string, string | boolean> = {},
  children: (Node | string)[] = [],
): T {
  const node = document.createElement(tag) as T;
  for (const [name, value] of Object.entries(attributes)) {
    if (value === true) node.setAttribute(name, '');
    else if (value !== false) node.setAttribute(name, value);
  }
  node.append(...children);
  return node;
}

const releaseHref = (release: Release) => `#/releases/${release.version}`;

function changeList(release: Release): HTMLElement {
  return el(
    'ul',
    { class: 'changes' },
    release.changes.map((change) =>
      el('li', { class: 'change' }, [
        el('span', {}, [
          el('kt-badge', { tone: KIND_TONE[change.kind], size: 'small' }, [
            KIND_LABEL[change.kind],
          ]),
        ]),
        el('span', {}, [change.text]),
      ]),
    ),
  );
}

// === The frame, built once ===

const header = el<KtHeader>('kt-header', { sticky: true });
const links = (onChoose?: () => void) =>
  [el('a', { href: '#/' }, ['Releases']), el('a', { href: 'rss.xml' }, ['RSS'])].map((link) => {
    if (onChoose) link.addEventListener('click', onChoose);
    return link;
  });
const subscribeButton = el('kt-button', { slot: 'actions', size: 'small', icon: 'rss' }, [
  'Subscribe',
]);
subscribeButton.addEventListener('click', () => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  newsletter.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
});
header.append(
  el('a', { slot: 'brand', class: 'brand', href: '#/' }, [`${SITE.name} changelog`]),
  el('nav', { class: 'nav', 'aria-label': 'Changelog' }, links()),
  el(
    'nav',
    { slot: 'menu', class: 'menu', 'aria-label': 'Menu' },
    links(() => header.closeMenu()),
  ),
  subscribeButton,
);

const content = el('div', { class: 'content' });

const newsletter = el<KtNewsletter>('kt-newsletter', {
  id: 'subscribe',
  variant: 'panel',
  layout: 'inline',
  align: 'start',
});
newsletter.heading = NEWSLETTER.heading;
newsletter.lead = NEWSLETTER.lead;
newsletter.addEventListener('kt-subscribe', (event) => {
  const { email, wait } = (event as CustomEvent<KtSubscribeDetail>).detail;
  wait(subscribe(email));
});

const posts = el<KtPostGrid>('kt-post-grid', { align: 'start', 'heading-level': '2' });
posts.heading = 'From the blog';
posts.posts = POSTS;

const footer = el('kt-footer', { variant: 'simple' }, [
  el('a', { slot: 'brand', class: 'brand', href: '#/' }, [SITE.name]),
  FOOTER.tagline,
  el('span', { slot: 'legal' }, [FOOTER.legal]),
]);

document
  .querySelector('#app')!
  .replaceChildren(header, el('main', { class: 'page' }, [content, newsletter, posts]), footer);

// === Every release ===

let kind: Kind | 'all' = 'all';

const filter = el<HTMLElement & { value: string | null }>('kt-toggle-button-group', {
  class: 'kind-filter',
  label: 'Show',
});
filter.append(
  ...KINDS.map((option) => el('kt-toggle-button', { value: option.value }, [option.label])),
);
filter.value = kind;
const shown = el('span', { class: 'shown' });
const list = el('div', { class: 'releases' });

filter.addEventListener('kt-change', (event) => {
  const value = (event as CustomEvent<{ value: string | null }>).detail.value;
  // The chosen filter pressed again would leave none: everything, then.
  kind = (value as Kind | null) ?? 'all';
  filter.value = kind;
  drawList();
});

function drawList(): void {
  const releases = filterReleases(RELEASES, kind);
  const count = releases.reduce((sum, release) => sum + release.changes.length, 0);
  shown.textContent = `${count} ${count === 1 ? 'change' : 'changes'}`;
  if (releases.length === 0) {
    const all = el('kt-button', { slot: 'actions', variant: 'secondary' }, ['Show everything']);
    all.addEventListener('click', () => {
      kind = 'all';
      filter.value = kind;
      drawList();
    });
    list.replaceChildren(
      el('kt-empty-state', { icon: 'sparkles', heading: 'Nothing of that kind yet' }, [all]),
    );
    return;
  }
  list.replaceChildren(
    el(
      'kt-timeline',
      {},
      releases.map((release) =>
        el(
          'kt-timeline-item',
          {
            heading: release.title,
            time: formatDate(release.date),
            icon: 'sparkles',
            variant: 'primary',
          },
          [
            el('div', { class: 'release-heading' }, [
              el('a', { class: 'release-link', href: releaseHref(release) }, [release.version]),
            ]),
            el('p', { class: 'release-summary' }, [release.summary]),
            changeList(release),
          ],
        ),
      ),
    ),
  );
}

const releasesView = el('section', { class: 'releases-view', 'aria-labelledby': 'title' }, [
  el('div', { class: 'intro' }, [
    el('h1', { id: 'title' }, [INTRO.heading]),
    el('p', {}, [INTRO.lead]),
  ]),
  el('div', { class: 'filter-bar' }, [filter, shown]),
  list,
]);

// === One release ===

function releaseView(release: Release): HTMLElement {
  const { newer, older } = neighbours(RELEASES, release.version);
  return el('article', { class: 'release-page' }, [
    el('a', { class: 'back', href: '#/' }, ['All releases']),
    el('div', { class: 'release-meta' }, [`${release.version} · ${formatDate(release.date)}`]),
    el('h1', {}, [release.title]),
    el('p', { class: 'release-summary' }, [release.summary]),
    changeList(release),
    el('nav', { class: 'neighbours', 'aria-label': 'Other releases' }, [
      older
        ? el('a', { class: 'older', href: releaseHref(older) }, [
            `Older: ${older.version} — ${older.title}`,
          ])
        : el('span'),
      newer
        ? el('a', { class: 'newer', href: releaseHref(newer) }, [
            `Newer: ${newer.version} — ${newer.title}`,
          ])
        : el('span'),
    ]),
  ]);
}

// === Where the reader is ===

function route(): void {
  const version = /^#\/releases\/(.+)$/.exec(location.hash)?.[1];
  if (!version) {
    document.title = `${SITE.name} changelog`;
    content.replaceChildren(releasesView);
    drawList();
    return;
  }
  const release = releaseByVersion(RELEASES, decodeURIComponent(version));
  document.title = release
    ? `${release.version} — ${SITE.name} changelog`
    : `${SITE.name} changelog`;
  content.replaceChildren(
    release ? releaseView(release) : el('kt-error-page', { 'home-href': '#/' }),
  );
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);
route();
