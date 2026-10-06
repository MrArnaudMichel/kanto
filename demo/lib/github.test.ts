import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearReleaseCache,
  failureFor,
  fetchReleases,
  formatReleaseDate,
  parseReleases,
} from './github.js';

const ok = (payload: unknown) =>
  ({
    ok: true,
    status: 200,
    headers: new Headers(),
    json: async () => payload,
  }) as unknown as Response;

const failed = (status: number, headers: Record<string, string> = {}) =>
  ({
    ok: false,
    status,
    headers: new Headers(headers),
    json: async () => ({}),
  }) as unknown as Response;

afterEach(() => clearReleaseCache());

describe('parseReleases', () => {
  it('keeps the fields the page uses and fills the rest in', () => {
    expect(
      parseReleases([
        {
          tag_name: 'v1.2.0',
          name: 'Meter and page header',
          html_url: 'https://example.test/tag',
          published_at: '2026-10-02T14:00:00Z',
          body: '## Added\n- kt-meter',
          prerelease: false,
        },
      ]),
    ).toEqual([
      {
        tag: 'v1.2.0',
        name: 'Meter and page header',
        url: 'https://example.test/tag',
        publishedAt: '2026-10-02T14:00:00Z',
        body: '## Added\n- kt-meter',
        prerelease: false,
      },
    ]);
  });

  it('falls back to the tag when a release has no name', () => {
    expect(parseReleases([{ tag_name: 'v1.0.0', name: '   ' }])[0]!.name).toBe('v1.0.0');
  });

  it('drops drafts, and anything without a tag to link to', () => {
    const out = parseReleases([
      { tag_name: 'v2.0.0' },
      { tag_name: 'v1.9.0', draft: true },
      { name: 'no tag' },
      null,
      'nonsense',
    ]);
    expect(out.map((r) => r.tag)).toEqual(['v2.0.0']);
  });

  it('survives a payload that is not a list at all', () => {
    expect(parseReleases({ message: 'Not Found' })).toEqual([]);
    expect(parseReleases(null)).toEqual([]);
  });
});

describe('failureFor', () => {
  it('tells a missing repository from an exhausted rate limit', () => {
    expect(failureFor({ status: 404, headers: new Headers() })).toBe('not-published');
    expect(
      failureFor({ status: 403, headers: new Headers({ 'x-ratelimit-remaining': '0' }) }),
    ).toBe('rate-limited');
    expect(
      failureFor({ status: 429, headers: new Headers({ 'x-ratelimit-remaining': '0' }) }),
    ).toBe('rate-limited');
    // A 403 with budget left is a different problem, and saying "rate-limited"
    // would send the reader off to wait for nothing.
    expect(
      failureFor({ status: 403, headers: new Headers({ 'x-ratelimit-remaining': '58' }) }),
    ).toBe('unavailable');
    expect(failureFor({ status: 500, headers: new Headers() })).toBe('unavailable');
  });
});

describe('fetchReleases', () => {
  it('returns the releases when GitHub answers', async () => {
    const fetcher = vi.fn().mockResolvedValue(ok([{ tag_name: 'v1.0.0' }]));
    const result = await fetchReleases(fetcher as unknown as typeof fetch);

    expect(result).toEqual({ ok: true, releases: [expect.objectContaining({ tag: 'v1.0.0' })] });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('reports an empty list as none-yet rather than as success', async () => {
    const fetcher = vi.fn().mockResolvedValue(ok([]));
    expect(await fetchReleases(fetcher as unknown as typeof fetch)).toEqual({
      ok: false,
      reason: 'none-yet',
    });
  });

  it('never rejects: a network error becomes a value', async () => {
    const fetcher = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    expect(await fetchReleases(fetcher as unknown as typeof fetch)).toEqual({
      ok: false,
      reason: 'offline',
    });
  });

  it('explains a 404 as a repository that is not public yet', async () => {
    const fetcher = vi.fn().mockResolvedValue(failed(404));
    expect(await fetchReleases(fetcher as unknown as typeof fetch)).toEqual({
      ok: false,
      reason: 'not-published',
    });
  });

  it('asks GitHub once per session, success or failure', async () => {
    // Retrying on every navigation is how a rate limit that would have cleared
    // in a minute lasts the whole visit.
    const fetcher = vi.fn().mockResolvedValue(failed(403, { 'x-ratelimit-remaining': '0' }));

    await fetchReleases(fetcher as unknown as typeof fetch);
    await fetchReleases(fetcher as unknown as typeof fetch);
    expect(fetcher).toHaveBeenCalledOnce();

    clearReleaseCache();
    await fetchReleases(fetcher as unknown as typeof fetch);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});

describe('formatReleaseDate', () => {
  it('reads as a date, and says nothing when there is none', () => {
    expect(formatReleaseDate('2026-10-02T14:00:00Z')).toBe('2 October 2026');
    expect(formatReleaseDate('')).toBe('');
    expect(formatReleaseDate('not a date')).toBe('');
  });
});
