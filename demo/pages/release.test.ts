import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'lit';
import { clearReleaseCache } from '../lib/github.js';
import { releasePage, resetReleaseState } from './release.js';

const CHANGELOG = '# Changelog\n\nAll notable changes are documented here.\n';

/** Renders the page as it stands and returns the resulting DOM. */
function paint(): HTMLElement {
  const host = document.createElement('div');
  render(releasePage(CHANGELOG).body, host);
  return host;
}

/** Lets the fetch settle and the page re-render. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

const ok = (payload: unknown) =>
  ({ ok: true, status: 200, headers: new Headers(), json: async () => payload }) as Response;

const failed = (status: number) =>
  ({ ok: false, status, headers: new Headers(), json: async () => ({}) }) as Response;

describe('the release page', () => {
  beforeEach(() => {
    clearReleaseCache();
    resetReleaseState();
  });

  it('shows skeletons while it is asking', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>(() => {})),
    );
    const host = paint();
    expect(host.querySelectorAll('kt-skeleton').length).toBeGreaterThan(0);
  });

  it('lists what the repository actually returned', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        ok([
          {
            tag_name: 'v1.1.0',
            name: 'Meter and page header',
            published_at: '2026-10-02T14:00:00Z',
            body: '## Added\n- `kt-meter`',
          },
          { tag_name: 'v1.0.0', published_at: '2026-09-09T09:00:00Z', body: '' },
        ]),
      ),
    );

    paint();
    await settle();
    const host = paint();

    const cards = [...host.querySelectorAll('.release-version')].map((e) => e.textContent!.trim());
    expect(cards).toEqual(['v1.1.0', 'v1.0.0']);
    expect(host.textContent).toContain('2 October 2026');
    expect(host.textContent).toContain('kt-meter');
    // The newest one is the current one; nothing here is hard-coded.
    expect(host.querySelector('kt-badge')!.textContent).toContain('Latest');
  });

  it('says a tag with no notes has none, rather than showing an empty card', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ok([{ tag_name: 'v0.9.0', body: '   ' }])),
    );
    paint();
    await settle();
    expect(paint().textContent).toContain('No notes were written for this tag');
  });

  it('falls back to the changelog, and says why, when GitHub cannot be read', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => failed(404)),
    );
    paint();
    await settle();
    const host = paint();

    expect(host.querySelector('.release-grid')).toBeNull();
    expect(host.querySelector('kt-alert')!.getAttribute('description')).toContain('not public yet');
    // The reason someone came to this page is still on it.
    expect(host.querySelector('.prose')!.textContent).toContain('All notable changes');
  });

  it('asks once, however many times it renders', async () => {
    // The page renders on every update; a load that ran again on each one
    // would spin the tab at full speed off a cached failure.
    const fetcher = vi.fn(async () => failed(500));
    vi.stubGlobal('fetch', fetcher);

    paint();
    await settle();
    paint();
    paint();
    await settle();

    expect(fetcher).toHaveBeenCalledOnce();
  });
});
