import { html } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { renderDoc } from '../lib/markdown.js';
import type { DocPage } from './component.js';

export const REPO = 'https://github.com/MrArnaudMichel/kanto';

export interface ReleaseEntry {
  readonly version: string;
  readonly date: string;
  readonly summary: string;
  readonly current?: boolean;
}

/** Newest first. Each one has a tag of the same name in the repository. */
export const RELEASES: readonly ReleaseEntry[] = [
  {
    version: '1.0.0',
    date: '9 September 2026',
    summary:
      'The first release as a framework-agnostic design system: forty-two elements on one token layer, with typed entry points for React and Vue.',
    current: true,
  },
];

/**
 * The release page.
 *
 * The changelog is the source — the same file the repository ships — with the
 * links out to GitHub around it, so the page cannot claim a version the
 * changelog does not.
 */
export function releasePage(changelog: string): DocPage {
  const doc = renderDoc(changelog);
  const latest = RELEASES[0]!;

  return {
    title: 'Releases',
    summary: `Kanto is published on npm and tagged in the repository. The current release is ${latest.version}.`,
    eyebrow: 'Release',
    headings: [{ id: 'versions', text: 'Versions', level: 2 }, ...doc.headings],
    source: 'CHANGELOG.md',
    body: html`
      <section class="preview-section">
        <h2 id="versions">Versions</h2>

        <div class="release-grid">
          ${RELEASES.map(
            (release) => html`
              <kt-card>
                <div slot="header" class="row" style="justify-content:space-between">
                  <span class="release-version">v${release.version}</span>
                  ${
                    release.current
                      ? html`<kt-badge tone="success">Current</kt-badge>`
                      : html`<kt-badge>Archived</kt-badge>`
                  }
                </div>
                <p class="muted" style="margin:0">${release.summary}</p>
                <div slot="footer" class="row" style="justify-content:space-between;width:100%">
                  <span class="muted" style="font:var(--font-normal-small)">${release.date}</span>
                  <a
                    href=${`${REPO}/releases/tag/v${release.version}`}
                    target="_blank"
                    rel="noreferrer"
                    >Release notes</a
                  >
                </div>
              </kt-card>
            `,
          )}
        </div>

        <div class="release-links">
          <a class="release-link" href=${REPO} target="_blank" rel="noreferrer">
            <kt-icon name="git-branch" size="18"></kt-icon>
            <span class="release-link-copy">
              <span class="release-link-title">MrArnaudMichel/kanto</span>
              <span class="muted">Source, issues and pull requests</span>
            </span>
            <kt-icon name="arrow-up-right" size="16"></kt-icon>
          </a>
          <a class="release-link" href=${`${REPO}/releases`} target="_blank" rel="noreferrer">
            <kt-icon name="tag" size="18"></kt-icon>
            <span class="release-link-copy">
              <span class="release-link-title">Releases</span>
              <span class="muted">Every tag, with its notes</span>
            </span>
            <kt-icon name="arrow-up-right" size="16"></kt-icon>
          </a>
          <a
            class="release-link"
            href="https://www.npmjs.com/package/kanto"
            target="_blank"
            rel="noreferrer"
          >
            <kt-icon name="package" size="18"></kt-icon>
            <span class="release-link-copy">
              <span class="release-link-title">kanto on npm</span>
              <span class="muted">npm install kanto</span>
            </span>
            <kt-icon name="arrow-up-right" size="16"></kt-icon>
          </a>
        </div>
      </section>

      <div class="prose">${unsafeHTML(doc.html)}</div>
    `,
  };
}
