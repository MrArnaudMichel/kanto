import { useEffect, useRef, useState } from 'react';
import type { KtHeader, KtNewsletter } from 'kanto-ds';
import { subscribe } from './actions';
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

const releaseHref = (release: Release) => `#/releases/${release.version}`;

const LINKS = [
  { href: '#/', label: 'Releases' },
  { href: 'rss.xml', label: 'RSS' },
];

/** The version in the address: `#/releases/<version>`, or null for them all. */
function useVersion(): string | null {
  const read = () => {
    const version = /^#\/releases\/(.+)$/.exec(location.hash)?.[1];
    if (!version) return null;
    // An address that cannot be read names no release: it is shown as unknown.
    try {
      return decodeURIComponent(version);
    } catch {
      return version;
    }
  };
  const [version, setVersion] = useState(read);
  useEffect(() => {
    const update = () => setVersion(read());
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  return version;
}

function Changes({ release }: { release: Release }) {
  return (
    <ul className="changes">
      {release.changes.map((change) => (
        <li key={change.text} className="change">
          <span>
            <kt-badge tone={KIND_TONE[change.kind]} size="small">
              {KIND_LABEL[change.kind]}
            </kt-badge>
          </span>
          <span>{change.text}</span>
        </li>
      ))}
    </ul>
  );
}

// Kept while the reader reads a release.
const kept = { kind: 'all' as Kind | 'all' };

function Releases() {
  const [kind, setKindState] = useState(kept.kind);
  const setKind = (next: Kind | 'all') => {
    kept.kind = next;
    setKindState(next);
  };
  const releases = filterReleases(RELEASES, kind);
  const count = releases.reduce((sum, release) => sum + release.changes.length, 0);
  return (
    <section className="releases-view" aria-labelledby="title">
      <div className="intro">
        <h1 id="title">{INTRO.heading}</h1>
        <p>{INTRO.lead}</p>
      </div>
      <div className="filter-bar">
        <kt-toggle-button-group
          className="kind-filter"
          label="Show"
          value={kind}
          // The chosen filter pressed again would leave none: everything, then.
          onkt-change={(event) => {
            const next = (event.detail.value as Kind | null) ?? 'all';
            // The group cleared itself; the state may not change, so say it here.
            (event.currentTarget as HTMLElement & { value: string | null }).value = next;
            setKind(next);
          }}
        >
          {KINDS.map((option) => (
            <kt-toggle-button key={option.value} value={option.value}>
              {option.label}
            </kt-toggle-button>
          ))}
        </kt-toggle-button-group>
        <span className="shown">{`${count} ${count === 1 ? 'change' : 'changes'}`}</span>
      </div>
      <div className="releases">
        {releases.length === 0 ? (
          <kt-empty-state icon="sparkles" heading="Nothing of that kind yet">
            <kt-button slot="actions" variant="secondary" onClick={() => setKind('all')}>
              Show everything
            </kt-button>
          </kt-empty-state>
        ) : (
          <kt-timeline>
            {releases.map((release) => (
              <kt-timeline-item
                key={release.version}
                time={formatDate(release.date)}
                icon="sparkles"
                variant="primary"
              >
                <div className="release-heading">
                  <h2 className="release-title">
                    <a className="release-link" href={releaseHref(release)}>
                      {release.title}
                    </a>
                  </h2>
                  <kt-badge variant="code">{release.version}</kt-badge>
                </div>
                <p className="release-summary">{release.summary}</p>
                <Changes release={release} />
              </kt-timeline-item>
            ))}
          </kt-timeline>
        )}
      </div>
    </section>
  );
}

function ReleasePage({ release }: { release: Release }) {
  const { newer, older } = neighbours(RELEASES, release.version);
  return (
    <article className="release-page">
      <a className="back" href="#/">
        All releases
      </a>
      <div className="release-meta">{`${release.version} · ${formatDate(release.date)}`}</div>
      <h1>{release.title}</h1>
      <p className="release-summary">{release.summary}</p>
      <Changes release={release} />
      <nav className="neighbours" aria-label="Other releases">
        {older ? (
          <a className="older" href={releaseHref(older)}>
            {`Older: ${older.version} — ${older.title}`}
          </a>
        ) : (
          <span />
        )}
        {newer ? (
          <a className="newer" href={releaseHref(newer)}>
            {`Newer: ${newer.version} — ${newer.title}`}
          </a>
        ) : (
          <span />
        )}
      </nav>
    </article>
  );
}

export function App() {
  const version = useVersion();
  const header = useRef<KtHeader>(null);
  const newsletter = useRef<KtNewsletter>(null);
  const release = version === null ? undefined : releaseByVersion(RELEASES, version);

  useEffect(() => {
    document.title = release
      ? `${release.version} — ${SITE.name} changelog`
      : `${SITE.name} changelog`;
    if (version !== null) window.scrollTo(0, 0);
  }, [version, release]);

  return (
    <>
      <kt-header sticky ref={header}>
        <a slot="brand" className="brand" href="#/">
          {`${SITE.name} changelog`}
        </a>
        <nav className="nav" aria-label="Changelog">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <nav slot="menu" className="menu" aria-label="Menu">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} onClick={() => header.current?.closeMenu()}>
              {link.label}
            </a>
          ))}
        </nav>
        <kt-button
          slot="actions"
          size="small"
          icon="rss"
          onClick={() => {
            const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            newsletter.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
          }}
        >
          Subscribe
        </kt-button>
      </kt-header>
      <main className="page">
        <div className="content">
          {version === null ? (
            <Releases />
          ) : release ? (
            <ReleasePage release={release} />
          ) : (
            <kt-error-page homeHref="#/" />
          )}
        </div>
        <kt-newsletter
          ref={newsletter}
          id="subscribe"
          variant="panel"
          layout="inline"
          align="start"
          heading={NEWSLETTER.heading}
          lead={NEWSLETTER.lead}
          onkt-subscribe={(event) => event.detail.wait(subscribe(event.detail.email))}
        />
        <kt-post-grid align="start" headingLevel={2} heading="From the blog" posts={POSTS} />
      </main>
      <kt-footer variant="simple">
        <a slot="brand" className="brand" href="#/">
          {SITE.name}
        </a>
        {FOOTER.tagline}
        <span slot="legal">{FOOTER.legal}</span>
      </kt-footer>
    </>
  );
}
