import { beforeAll, describe, expect, it } from 'vitest';
import { VERSION_TAG } from './lib/project.js';

/**
 * Mounts the whole documentation site once and inspects what came out.
 *
 * Without this, a broken route table or a layout that renders nothing would
 * still build cleanly and still pass every other test — the site only fails at
 * the moment someone opens it.
 */
describe('the documentation shell', () => {
  let app: HTMLElement;

  beforeAll(async () => {
    document.body.innerHTML = '<div id="app"></div>';
    location.hash = '#/components/kt-button';
    await import('./main.js');
    app = document.querySelector<HTMLElement>('#app')!;
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  it('renders a header, a sidebar, a main column and a table of contents', () => {
    expect(app.querySelector('kt-header')).not.toBeNull();
    expect(app.querySelector('.sidebar')).not.toBeNull();
    expect(app.querySelector('main')).not.toBeNull();
    expect(app.querySelector('.toc')).not.toBeNull();
  });

  it('puts the top-level sections in the header', () => {
    const labels = [...app.querySelectorAll('.top-nav a')].map((a) => a.textContent!.trim());
    expect(labels).toEqual(['Guide', 'Components', 'Apps', 'Release']);
  });

  it('lists the components in the sidebar, grouped', () => {
    const links = [...app.querySelectorAll('.sidebar-group a')];
    expect(links.length).toBeGreaterThanOrEqual(28);

    const groups = [...app.querySelectorAll('.sidebar-group .overline')].map((g) =>
      g.textContent!.trim(),
    );
    expect(groups).toContain('Core');
    expect(groups).toContain('Overlays');
  });

  it('marks the current page in the sidebar', () => {
    const active = app.querySelector('.sidebar-group a.active')!;
    expect(active.textContent!.trim()).toBe('button');
    expect(active.getAttribute('aria-current')).toBe('page');
  });

  it('renders the page title, summary and live preview', () => {
    expect(app.querySelector('h1')!.textContent).toContain('kt-button');
    expect(app.querySelector('.doc-summary')!.textContent!.length).toBeGreaterThan(10);
    expect(app.querySelectorAll('.preview kt-button').length).toBeGreaterThan(3);
  });

  it('renders the markdown body, with code blocks and wrapped tables', () => {
    expect(app.querySelector('.prose')).not.toBeNull();
    expect(app.querySelector('.prose kt-code')).not.toBeNull();
    expect(app.querySelector('.prose .table-wrap table')).not.toBeNull();
  });

  it('builds a table of contents whose links point at real headings', () => {
    const ids = [...app.querySelectorAll('.toc nav a')]
      .map((a) => a.getAttribute('href')!.split('#').pop()!)
      .filter(Boolean);

    expect(ids.length).toBeGreaterThan(2);
    for (const id of ids) {
      expect(app.querySelector(`#${CSS.escape(id)}`), id).not.toBeNull();
    }
  });

  it('lists every version in the sidebar on the release page, each pointing at its notes', async () => {
    location.hash = '#/release/releases';
    await new Promise((resolve) => setTimeout(resolve, 0));

    const group = [...app.querySelectorAll('.sidebar-group')].find(
      (candidate) => candidate.querySelector('.overline')!.textContent!.trim() === 'Versions',
    );
    expect(group, 'a Versions group').toBeDefined();

    const links = [...group!.querySelectorAll('a')];
    expect(links.map((link) => link.textContent!.trim())).toContain(VERSION_TAG);
    for (const link of links) {
      const id = link.getAttribute('href')!.split('#').pop()!;
      expect(app.querySelector(`#${CSS.escape(id)}`), id).not.toBeNull();
    }
  });
});
