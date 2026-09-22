import { html, nothing, type TemplateResult } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { renderUntrustedMarkdown, type Heading } from '../lib/markdown.js';
import { rerender } from '../lib/render.js';
import {
  clearReleaseCache,
  fetchReleases,
  type Release,
  type ReleaseFailure,
} from '../lib/github.js';
import { INSTALL_COMMAND, NPM_URL, REPO_URL, VERSION_TAG } from '../lib/project.js';
import { mergeReleases, parseChangelog, summarize, type ReleaseEntry } from '../lib/releases.js';
import type { DocPage } from './component.js';

export const REPO = REPO_URL;

/**
 * The release page.
 *
 * One history, read in three passes: the release you would install today, a
 * rail of every version to scan, then each version's notes at a reading
 * measure. The history is the changelog and GitHub folded together (see
 * `lib/releases.ts`), so the page is complete from the first paint — the
 * changelog ships with the site — and GitHub only sharpens it when it answers:
 * the date a tag was actually published, the notes written on the release.
 *
 * It used to render GitHub's notes in cards and then the whole changelog
 * underneath, which is the same text twice, the first time in a type size
 * meant for captions.
 */

type Status = 'idle' | 'loading' | 'ready' | 'failed';

const state = {
  status: 'idle' as Status,
  releases: null as readonly Release[] | null,
  reason: 'unavailable' as ReleaseFailure,
};

const EXPLANATION: Record<ReleaseFailure, string> = {
  offline: 'GitHub could not be reached from this browser.',
  'rate-limited': 'GitHub is rate-limiting this network; it clears within the hour.',
  'not-published': 'the repository is not public yet.',
  'none-yet': 'nothing has been tagged on GitHub yet.',
  unavailable: 'GitHub did not answer with a list of releases.',
};

/** Forgets what was fetched. For the tests, which run several pages' worth. */
export function resetReleaseState(): void {
  state.status = 'idle';
  state.releases = null;
  state.reason = 'unavailable';
}

/**
 * Starts the one fetch this page makes.
 *
 * Guarded on `idle` alone, not on "not finished": the page renders on every
 * update, and a guard that let a failed state through would start another
 * fetch, resolve from cache, re-render, and start another — a render loop that
 * spins the tab at full speed. Retrying is the button's job, not the render's.
 */
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
  resetReleaseState();
  load();
  rerender();
}

/* ------------------------------------------------------------------ pieces */

/** `v1.0.1` → `notes-v1-0-1`. Prefixed so a tag can never collide with a page section. */
const anchorFor = (tag: string) => `notes-${tag.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`;

/**
 * In-page links go through `scrollIntoView`: the site routes on the hash, so a
 * bare `#notes-v1-0-1` would navigate away from the page instead of down it.
 */
function jumpTo(id: string, label: TemplateResult | string): TemplateResult {
  return html`<a
    href=${`${location.hash.split('#').slice(0, 2).join('#')}#${id}`}
    @click=${(event: Event) => {
      event.preventDefault();
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }}
    >${label}</a
  >`;
}

/** What a version is, as far as anyone can tell. Nothing, for the ordinary case. */
function badge(entry: ReleaseEntry, isCurrent: boolean): TemplateResult | typeof nothing {
  if (entry.status === 'untagged') {
    return html`<kt-badge tone="warning" size="small">Not tagged yet</kt-badge>`;
  }
  if (entry.prerelease) return html`<kt-badge tone="warning" size="small">Pre-release</kt-badge>`;
  if (isCurrent && entry.status === 'published') {
    return html`<kt-badge tone="success" size="small">Latest</kt-badge>`;
  }
  return nothing;
}

function sourceLine(): TemplateResult {
  if (state.status === 'failed') {
    return html`<p class="release-source">
      <span>From the changelog, because ${EXPLANATION[state.reason]}</span>
      <kt-button size="small" variant="text" @click=${retry}>Try GitHub again</kt-button>
    </p>`;
  }

  return html`<p class="release-source">
    ${state.status === 'ready' ? 'Dates and tags from GitHub' : 'Checking GitHub for tags…'}
  </p>`;
}

/**
 * No summary here: the first line of the history, directly below, already
 * says it, and the panel's one job is to get the right version installed.
 */
function currentRelease(entry: ReleaseEntry): TemplateResult {
  return html`<div class="release-current">
    <div class="release-current-head">
      <span class="release-current-tag">${entry.tag}</span>
      ${badge(entry, true)}
      ${entry.date ? html`<span class="release-current-date">${entry.date}</span>` : nothing}
    </div>

    <kt-code language="shell" copy>${INSTALL_COMMAND}</kt-code>

    <div class="release-current-links">
      ${jumpTo(anchorFor(entry.tag), 'Read the notes')}
      <a href=${entry.url} target="_blank" rel="noreferrer">The tag on GitHub</a>
      <a href=${NPM_URL} target="_blank" rel="noreferrer">The package on npm</a>
    </div>
  </div>`;
}

function historyRail(entries: readonly ReleaseEntry[], current: ReleaseEntry): TemplateResult {
  return html`<kt-timeline class="release-history">
    ${entries.map((entry) => {
      const isCurrent = entry === current;
      const summary = summarize(entry.notes);

      return html`<kt-timeline-item
        heading=${entry.tag}
        time=${entry.date}
        variant=${isCurrent ? 'primary' : 'neutral'}
        icon=${isCurrent ? 'tag' : ''}
      >
        <span slot="actions" class="release-history-actions">
          ${badge(entry, isCurrent)} ${jumpTo(anchorFor(entry.tag), 'Notes')}
        </span>
        ${summary ? html`<p class="release-history-summary">${summary}</p>` : nothing}
      </kt-timeline-item>`;
    })}
  </kt-timeline>`;
}

function notesFor(entry: ReleaseEntry, isCurrent: boolean): TemplateResult {
  const id = anchorFor(entry.tag);

  return html`<section class="release-entry" aria-labelledby=${id}>
    <header class="release-entry-head">
      <h3 id=${id}>${entry.tag}</h3>
      ${badge(entry, isCurrent)}
      <span class="release-entry-meta">
        ${entry.date}
        ${
          entry.status === 'published'
            ? html`<a href=${entry.url} target="_blank" rel="noreferrer">On GitHub</a>`
            : nothing
        }
      </span>
    </header>

    ${
      entry.notes.trim() === ''
        ? html`<p class="muted">No notes were written for this version.</p>`
        : html`<div class="prose release-notes">
            ${unsafeHTML(renderUntrustedMarkdown(entry.notes, { headingBase: 4 }))}
          </div>`
    }
  </section>`;
}

/* -------------------------------------------------------------------- page */

export function releasePage(changelog: string): DocPage {
  load();

  const entries = mergeReleases(parseChangelog(changelog), state.releases);
  // The version the site itself was built as, so the page and the header chip
  // never disagree; the newest entry only when the manifest's is not listed.
  const current = entries.find((entry) => entry.tag === VERSION_TAG) ?? entries[0];

  const versions: Heading[] = entries.map((entry) => ({
    id: anchorFor(entry.tag),
    text: entry.tag,
    level: 3,
  }));

  const headings: Heading[] = [
    { id: 'current-release', text: 'Current release', level: 2 },
    { id: 'history', text: 'History', level: 2 },
    { id: 'release-notes', text: 'Release notes', level: 2 },
    ...versions,
  ];

  return {
    title: 'Releases',
    summary: current
      ? `The current release is ${current.tag}${current.date ? `, from ${current.date}` : ''}.`
      : 'Nothing has been released yet.',
    eyebrow: 'Release',
    headings,
    sidebar: { group: 'Versions', items: versions },
    source: 'CHANGELOG.md',
    body: current
      ? html`
          <h2 class="release-heading" id="current-release">Current release</h2>
          ${currentRelease(current)}

          <div class="release-heading-row">
            <h2 class="release-heading" id="history">History</h2>
            ${sourceLine()}
          </div>
          ${historyRail(entries, current)}

          <h2 class="release-heading release-heading-notes" id="release-notes">Release notes</h2>
          ${entries.map((entry) => notesFor(entry, entry === current))}
        `
      : html`<kt-empty-state
          icon="tag"
          heading="Nothing released yet"
          description="The changelog has no version sections, and GitHub has no tags."
        ></kt-empty-state>`,
  };
}
