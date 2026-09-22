import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'lit';
import { clearReleaseCache } from '../lib/github.js';
import { INSTALL_COMMAND, VERSION, VERSION_TAG } from '../lib/project.js';
import { releasePage, resetReleaseState } from './release.js';

/**
 * A changelog whose newest section is the version the manifest says is
 * current, so the tests follow `package.json` instead of pinning a number.
 */
const CHANGELOG = `# Changelog

All notable changes are documented here.

## [${VERSION}] — 2026-09-15

### Added

- \`kt-split-button\`, a primary action with a menu.

## [0.9.0] — 2026-08-01

The first preview.

### Fixed

- Something that was broken.
`;

/** Renders the page as it stands and returns the resulting DOM. */
function paint(changelog = CHANGELOG): HTMLElement {
  const host = document.createElement('div');
  render(releasePage(changelog).body, host);
  return host;
}

/** Lets the fetch settle and the page re-render. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

const ok = (payload: unknown) =>
  ({ ok: true, status: 200, headers: new Headers(), json: async () => payload }) as Response;

const failed = (status: number) =>
  ({ ok: false, status, headers: new Headers(), json: async () => ({}) }) as Response;

const pending = () => vi.fn(() => new Promise<Response>(() => {}));

const history = (host: HTMLElement) =>
  [...host.querySelectorAll('kt-timeline-item')].map((item) => item.getAttribute('heading'));

const sections = (host: HTMLElement) =>
  [...host.querySelectorAll('.release-entry h3')].map((heading) => heading.textContent!.trim());

describe('the release page', () => {
  beforeEach(() => {
    clearReleaseCache();
    resetReleaseState();
  });

  it('shows the history from the changelog straight away, without waiting on GitHub', () => {
    vi.stubGlobal('fetch', pending());
    const host = paint();

    expect(history(host)).toEqual([VERSION_TAG, 'v0.9.0']);
    expect(host.querySelectorAll('kt-skeleton')).toHaveLength(0);
  });

  it('leads with the current release and the command to install it', () => {
    vi.stubGlobal('fetch', pending());
    const current = paint().querySelector('.release-current')!;

    expect(current.querySelector('.release-current-tag')!.textContent).toBe(VERSION_TAG);
    expect(current.querySelector('kt-code')!.textContent).toContain(INSTALL_COMMAND);
    expect(current.textContent).toContain('15 September 2026');
  });

  it('gives each version its notes once, in its own section', () => {
    vi.stubGlobal('fetch', pending());
    const host = paint();

    expect(sections(host)).toEqual([VERSION_TAG, 'v0.9.0']);
    expect(host.textContent!.match(/Something that was broken/g)).toHaveLength(1);
  });

  it('lists the versions in the contents, not every "Added" and "Fixed"', () => {
    vi.stubGlobal('fetch', pending());
    const { headings } = releasePage(CHANGELOG);

    const texts = headings.map((heading) => heading.text);
    expect(texts).toEqual(['Current release', 'History', 'Release notes', VERSION_TAG, 'v0.9.0']);
    expect(texts).not.toContain('Added');
  });

  it('takes the date and the notes from GitHub once it answers', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        ok([
          {
            tag_name: VERSION_TAG,
            published_at: '2026-09-16T09:00:00Z',
            body: '## Added\n\n- Written on GitHub.',
          },
          { tag_name: 'v0.9.0', published_at: '2026-08-01T09:00:00Z', body: '' },
        ]),
      ),
    );

    paint();
    await settle();
    const host = paint();

    expect(host.querySelector('.release-current')!.textContent).toContain('16 September 2026');
    expect(host.textContent).toContain('Written on GitHub.');
    // An empty body on GitHub does not erase what the changelog says.
    expect(host.textContent).toContain('Something that was broken');
    expect(host.querySelector('.release-current kt-badge')!.textContent).toContain('Latest');
  });

  it('says when the current version is in the changelog but not tagged yet', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ok([{ tag_name: 'v0.9.0', body: 'Old.' }])),
    );

    paint();
    await settle();
    const badge = paint().querySelector('.release-current kt-badge')!;

    expect(badge.textContent).toContain('Not tagged yet');
  });

  it('keeps the whole history when GitHub cannot be read, and says why in one line', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => failed(404)),
    );

    paint();
    await settle();
    const host = paint();

    expect(history(host)).toEqual([VERSION_TAG, 'v0.9.0']);
    expect(host.querySelector('.release-source')!.textContent).toContain('not public yet');
    expect(host.querySelector('kt-alert')).toBeNull();
  });

  it('says a version with no notes has none, rather than leaving a blank', () => {
    vi.stubGlobal('fetch', pending());
    const host = paint(`## [${VERSION}] — 2026-09-15\n`);

    expect(host.querySelector('.release-entry')!.textContent).toContain('No notes were written');
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
