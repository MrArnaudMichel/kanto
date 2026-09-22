/**
 * The releases, from GitHub.
 *
 * The page used to carry a hand-written list, which is a promise to keep it in
 * step with the tags — and that promise is always broken eventually. This asks
 * the repository instead.
 *
 * Unauthenticated, because the docs site is public and has no business holding
 * a token. That means the anonymous rate limit applies: 60 requests an hour per
 * address, shared with everything else the reader's network is doing on
 * github.com. So the answer is cached for the session, and every failure —
 * offline, rate-limited, repository not published yet — falls back to the
 * changelog this repository ships rather than showing an error where the
 * content should be.
 */

import { REPO_SLUG, REPO_URL } from './project.js';

export { REPO_OWNER, REPO_NAME, REPO_URL } from './project.js';

const API = `https://api.github.com/repos/${REPO_SLUG}/releases?per_page=20`;
const CACHE_KEY = 'kanto-releases';

export interface Release {
  readonly tag: string;
  readonly name: string;
  readonly url: string;
  /** ISO 8601, or '' for a draft that was never published. */
  readonly publishedAt: string;
  /** The release notes, as markdown. */
  readonly body: string;
  readonly prerelease: boolean;
}

export type ReleaseFailure =
  'offline' | 'rate-limited' | 'not-published' | 'none-yet' | 'unavailable';

export type ReleaseResult =
  | { readonly ok: true; readonly releases: readonly Release[] }
  | { readonly ok: false; readonly reason: ReleaseFailure };

/** The shape we use, out of the much larger one GitHub returns. */
interface ApiRelease {
  tag_name?: unknown;
  name?: unknown;
  html_url?: unknown;
  published_at?: unknown;
  body?: unknown;
  prerelease?: unknown;
  draft?: unknown;
}

function toRelease(raw: ApiRelease): Release | null {
  const tag = typeof raw.tag_name === 'string' ? raw.tag_name : '';
  if (!tag) return null;

  return {
    tag,
    name: typeof raw.name === 'string' && raw.name.trim() !== '' ? raw.name : tag,
    url: typeof raw.html_url === 'string' ? raw.html_url : `${REPO_URL}/releases/tag/${tag}`,
    publishedAt: typeof raw.published_at === 'string' ? raw.published_at : '',
    body: typeof raw.body === 'string' ? raw.body : '',
    prerelease: raw.prerelease === true,
  };
}

/** Parses a response body into releases, dropping drafts and anything malformed. */
export function parseReleases(payload: unknown): Release[] {
  if (!Array.isArray(payload)) return [];

  return payload
    .filter((raw): raw is ApiRelease => typeof raw === 'object' && raw !== null)
    .filter((raw) => raw.draft !== true)
    .map(toRelease)
    .filter((release): release is Release => release !== null);
}

/** Why a response that is not 200 failed, in terms the page can explain. */
export function failureFor(response: { status: number; headers: Headers }): ReleaseFailure {
  if (response.status === 404) return 'not-published';
  if (
    (response.status === 403 || response.status === 429) &&
    response.headers.get('x-ratelimit-remaining') === '0'
  ) {
    return 'rate-limited';
  }
  return 'unavailable';
}

function readCache(): ReleaseResult | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as ReleaseResult) : null;
  } catch {
    // A private window, or storage the browser has turned off. Not a problem
    // worth telling anybody about; it only costs one more request.
    return null;
  }
}

function writeCache(result: ReleaseResult): void {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(result));
  } catch {
    /* see readCache */
  }
}

/**
 * Fetches the releases, once per session.
 *
 * Never rejects: every outcome is a value the page can render, because a
 * documentation page that throws on a network hiccup is worse than one that
 * says the list is unavailable.
 */
export async function fetchReleases(fetcher: typeof fetch = fetch): Promise<ReleaseResult> {
  const cached = readCache();
  if (cached) return cached;

  let result: ReleaseResult;
  try {
    const response = await fetcher(API, {
      headers: { Accept: 'application/vnd.github+json' },
    });

    if (!response.ok) {
      result = { ok: false, reason: failureFor(response) };
    } else {
      const releases = parseReleases(await response.json());
      result = releases.length > 0 ? { ok: true, releases } : { ok: false, reason: 'none-yet' };
    }
  } catch {
    result = { ok: false, reason: 'offline' };
  }

  // A failure is cached too. Retrying on every navigation is how a rate limit
  // that would have cleared in a minute lasts the whole visit.
  writeCache(result);
  return result;
}

/** Forgets the cached answer. For the page's own retry button. */
export function clearReleaseCache(): void {
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {
    /* see readCache */
  }
}

// In UTC: a changelog date is a bare `YYYY-MM-DD`, which parses as UTC
// midnight, and formatting it in the reader's zone would put every release a
// day early for anyone west of Greenwich.
const FORMATTER = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatReleaseDate(iso: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : FORMATTER.format(date);
}
