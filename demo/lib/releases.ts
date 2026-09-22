/**
 * The release history, as one list.
 *
 * There are two accounts of what shipped: the changelog this repository
 * carries, and the releases tagged on GitHub. The page used to show both, one
 * under the other, which meant reading the same notes twice. This folds them
 * into a single list instead — GitHub's word wins where it has one, the
 * changelog fills in the rest — so the page renders one history whichever
 * source happens to be reachable.
 */
import { REPO_URL } from './project.js';
import { formatReleaseDate, type Release } from './github.js';

/** One `## [x.y.z] — YYYY-MM-DD` section of the changelog. */
export interface ChangelogEntry {
  readonly version: string;
  /** As written in the heading, `YYYY-MM-DD`. */
  readonly date: string;
  /** The markdown under the heading, trimmed. */
  readonly notes: string;
}

/**
 * - `published`: tagged on GitHub.
 * - `untagged`: GitHub answered, and this version is not among its releases.
 * - `unknown`: GitHub has not answered, so nothing can be said either way.
 */
export type ReleaseStatus = 'published' | 'untagged' | 'unknown';

export interface ReleaseEntry {
  readonly tag: string;
  /** Formatted for reading, or '' when neither source dates it. */
  readonly date: string;
  readonly notes: string;
  readonly url: string;
  readonly prerelease: boolean;
  readonly status: ReleaseStatus;
}

const HEADING = /^##\s+\[([^\]]+)\](?:\s*[—–-]\s*(\S+))?\s*$/;
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

/** Splits the changelog into its version sections, in the order written. */
export function parseChangelog(markdown: string): ChangelogEntry[] {
  const lines = markdown.split(/\r?\n/);
  const entries: ChangelogEntry[] = [];
  let current: { version: string; date: string; start: number } | null = null;

  const close = (end: number) => {
    if (!current) return;
    const notes = lines.slice(current.start, end).join('\n').trim();
    entries.push({ version: current.version, date: current.date, notes });
    current = null;
  };

  lines.forEach((line, index) => {
    const match = HEADING.exec(line);
    if (!match) return;

    close(index);
    const [, label = '', date = ''] = match;
    // `[Unreleased]` and friends are sections, but not versions anyone can install.
    if (SEMVER.test(label)) current = { version: label, date, start: index + 1 };
  });
  close(lines.length);

  return entries;
}

/**
 * The first thing the notes say, as one plain line: the opening paragraph if
 * there is one, otherwise the first bullet. Headings are skipped — "Added"
 * says nothing about what was added.
 */
export function summarize(notes: string): string {
  const block = notes
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .find((chunk) => chunk !== '' && !chunk.startsWith('#'));

  if (!block) return '';

  const first =
    block.startsWith('- ') || block.startsWith('* ')
      ? (block.split(/\n(?=[-*] )/)[0] ?? '').slice(2)
      : block;

  return first
    .replace(/\s*\n\s*/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[`*_]/g, '')
    .trim();
}

/** Numeric parts of `v1.10.0-beta.1`, for ordering; non-versions sort last. */
function versionKey(tag: string): number[] {
  const match = /^v?(\d+)\.(\d+)\.(\d+)/.exec(tag);
  return match ? match.slice(1).map(Number) : [-1, -1, -1];
}

function newestFirst(a: ReleaseEntry, b: ReleaseEntry): number {
  const [ka, kb] = [versionKey(a.tag), versionKey(b.tag)];
  for (let i = 0; i < 3; i += 1) {
    if (ka[i] !== kb[i]) return kb[i]! - ka[i]!;
  }
  // A pre-release comes before the release it leads up to.
  return Number(a.prerelease) - Number(b.prerelease);
}

/**
 * One history from both sources. `published` is GitHub's list, or `null` when
 * it could not be read — which is not the same as an empty list, and must not
 * mark every version as untagged.
 */
export function mergeReleases(
  changelog: readonly ChangelogEntry[],
  published: readonly Release[] | null,
): ReleaseEntry[] {
  const byTag = new Map<string, ReleaseEntry>();

  for (const entry of changelog) {
    const tag = `v${entry.version}`;
    byTag.set(tag, {
      tag,
      date: formatReleaseDate(entry.date),
      notes: entry.notes,
      url: `${REPO_URL}/releases/tag/${tag}`,
      prerelease: entry.version.includes('-'),
      status: published ? 'untagged' : 'unknown',
    });
  }

  for (const release of published ?? []) {
    const known = byTag.get(release.tag);
    byTag.set(release.tag, {
      tag: release.tag,
      date: formatReleaseDate(release.publishedAt) || known?.date || '',
      notes: release.body.trim() !== '' ? release.body.trim() : (known?.notes ?? ''),
      url: release.url,
      prerelease: release.prerelease,
      status: 'published',
    });
  }

  return [...byTag.values()].sort(newestFirst);
}
