import { html, nothing, type TemplateResult } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { renderDoc, renderUntrustedMarkdown } from '../lib/markdown.js';
import { rerender } from '../lib/render.js';
import {
  REPO_URL,
  clearReleaseCache,
  fetchReleases,
  formatReleaseDate,
  type Release,
  type ReleaseFailure,
} from '../lib/github.js';
import type { DocPage } from './component.js';

export const REPO = REPO_URL;

/**
 * The release page.
 *
 * The list comes from the repository's own releases rather than from a copy
 * kept here: a hand-written list is a promise to keep it in step with the tags,
 * and that promise is always broken eventually.
 *
 * The changelog underneath is this repository's own file, and it is also what
 * the page falls back to when GitHub cannot be reached. Somebody arriving to
 * find out what changed should be told what changed, not shown an error where
 * the content was supposed to be.
 */

type Status = 'idle' | 'loading' | 'ready' | 'failed';

const state = {
  status: 'idle' as Status,
  releases: [] as readonly Release[],
  reason: 'unavailable' as ReleaseFailure,
};

const EXPLANATION: Record<ReleaseFailure, string> = {
  offline: 'GitHub could not be reached from this browser.',
  'rate-limited':
    'GitHub is rate-limiting anonymous requests from this network. It clears within the hour.',
  'not-published': 'This repository is not public yet, so it has no releases to read.',
  'none-yet': 'The repository is public but has not been tagged yet.',
  unavailable: 'GitHub answered, but not with a list of releases.',
};

/**
 * Starts the one fetch this page makes.
 *
 * Guarded on `idle` alone, not on "not finished": the page renders on every
 * update, and a guard that let a failed state through would start another
 * fetch, resolve from cache, re-render, and start another — a render loop that
 * spins the tab at full speed. Retrying is the button's job, not the render's.
 */
/** Forgets what was fetched. For the tests, which run several pages' worth. */
export function resetReleaseState(): void {
  state.status = 'idle';
  state.releases = [];
  state.reason = 'unavailable';
}

function load(): void {
  if (state.status !== 'idle') return;

  state.status = 'loading';
  void fetchReleases().then((result) => {
    if (result.ok) {
      state.status = 'ready';
      state.releases = result.releases;
    } else {
      state.status = 'failed';
      state.reason = result.reason;
    }
    rerender();
  });
}

function retry(): void {
  clearReleaseCache();
  state.status = 'idle';
  state.releases = [];
  load();
  rerender();
}

function skeletons(): TemplateResult {
  return html`<div class="release-grid">
    ${[0, 1, 2].map(
      () => html`
        <kt-card>
          <div slot="header" class="row" style="justify-content:space-between">
            <kt-skeleton variant="text" width="80px"></kt-skeleton>
            <kt-skeleton variant="text" width="56px"></kt-skeleton>
          </div>
          <kt-skeleton variant="text"></kt-skeleton>
          <kt-skeleton variant="text" width="70%"></kt-skeleton>
        </kt-card>
      `,
    )}
  </div>`;
}

function releaseCard(release: Release, index: number): TemplateResult {
  const date = formatReleaseDate(release.publishedAt);

  return html`
    <kt-card>
      <div slot="header" class="row" style="justify-content:space-between">
        <span class="release-version">${release.tag}</span>
        ${
          release.prerelease
            ? html`<kt-badge tone="warning" size="small">Pre-release</kt-badge>`
            : index === 0
              ? html`<kt-badge tone="success" size="small">Latest</kt-badge>`
              : html`<kt-badge size="small">Archived</kt-badge>`
        }
      </div>

      ${
        release.name !== release.tag
          ? html`<span class="release-name">${release.name}</span>`
          : nothing
      }
      ${
        release.body.trim() === ''
          ? html`<p class="muted" style="margin:0">No notes were written for this tag.</p>`
          : html`<div class="prose release-notes">
              ${unsafeHTML(renderUntrustedMarkdown(release.body))}
            </div>`
      }

      <div slot="footer" class="row" style="justify-content:space-between;width:100%">
        <span class="muted" style="font:var(--font-normal-small)">${date}</span>
        <a href=${release.url} target="_blank" rel="noreferrer">Release notes</a>
      </div>
    </kt-card>
  `;
}

function versions(): TemplateResult {
  if (state.status === 'loading' || state.status === 'idle') return skeletons();

  if (state.status === 'failed') {
    return html`
      <kt-alert
        variant="neutral"
        icon="git-branch"
        heading="No releases to show yet"
        description=${`${EXPLANATION[state.reason]} The changelog below is this repository's own file and is always current.`}
      >
        <kt-button slot="actions" size="small" variant="dark" icon="refresh-cw" @click=${retry}
          >Try again</kt-button
        >
        <kt-button
          slot="actions"
          size="small"
          icon="arrow-up-right"
          icon-position="right"
          @click=${() => window.open(`${REPO_URL}/releases`, '_blank', 'noreferrer')}
          >Open on GitHub</kt-button
        >
      </kt-alert>
    `;
  }

  return html`<div class="release-grid">
    ${state.releases.map((release, index) => releaseCard(release, index))}
  </div>`;
}

export function releasePage(changelog: string): DocPage {
  load();

  const doc = renderDoc(changelog);
  const latest = state.status === 'ready' ? state.releases[0] : undefined;

  return {
    title: 'Releases',
    summary: latest
      ? `Kanto is published on npm and tagged in the repository. The current release is ${latest.tag}.`
      : 'Kanto is published on npm and tagged in the repository. This page reads the tags directly.',
    eyebrow: 'Release',
    headings: [{ id: 'versions', text: 'Versions', level: 2 }, ...doc.headings],
    source: 'CHANGELOG.md',
    body: html`
      <section class="preview-section">
        <div class="app-preview-head">
          <h2 id="versions">Versions</h2>
          <span class="muted" style="font:var(--font-normal-small)">
            ${
              state.status === 'ready'
                ? `Read from GitHub · ${state.releases.length} ${
                    state.releases.length === 1 ? 'release' : 'releases'
                  }`
                : 'Read from GitHub'
            }
          </span>
        </div>

        ${versions()}

        <div class="release-links">
          <a class="release-link" href=${REPO_URL} target="_blank" rel="noreferrer">
            <kt-icon name="git-branch" size="18"></kt-icon>
            <span class="release-link-copy">
              <span class="release-link-title">MrArnaudMichel/kanto</span>
              <span class="muted">Source, issues and pull requests</span>
            </span>
            <kt-icon name="arrow-up-right" size="16"></kt-icon>
          </a>
          <a class="release-link" href=${`${REPO_URL}/releases`} target="_blank" rel="noreferrer">
            <kt-icon name="tag" size="18"></kt-icon>
            <span class="release-link-copy">
              <span class="release-link-title">Releases</span>
              <span class="muted">Every tag, with its notes</span>
            </span>
            <kt-icon name="arrow-up-right" size="16"></kt-icon>
          </a>
          <a
            class="release-link"
            href="https://www.npmjs.com/package/kanto-ds"
            target="_blank"
            rel="noreferrer"
          >
            <kt-icon name="package" size="18"></kt-icon>
            <span class="release-link-copy">
              <span class="release-link-title">kanto-ds on npm</span>
              <span class="muted">npm install kanto-ds</span>
            </span>
            <kt-icon name="arrow-up-right" size="16"></kt-icon>
          </a>
        </div>
      </section>

      <div class="prose">${unsafeHTML(doc.html)}</div>
    `,
  };
}
