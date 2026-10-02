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
    expect(labels).toEqual(['Guide', 'Components', 'Templates', 'Apps', 'Release']);
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

  it('opens on the home page, full width, for an empty hash, #/ and #/home', async () => {
    for (const hash of ['', '#/', '#/home']) {
      location.hash = hash;
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(app.querySelector('.home'), hash || 'empty').not.toBeNull();
      expect(app.querySelector('.sidebar'), hash || 'empty').toBeNull();
    }
  });

  it('takes the wordmark home', () => {
    expect(app.querySelector('.wordmark')!.getAttribute('href')).toBe('#/');
  });

  it('starts the playground from the site on each visit to the home page', async () => {
    const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
    location.hash = '#/';
    await tick();
    app.querySelector<HTMLElement>('.playground [data-accent-id="teal"]')!.click();
    await tick();
    location.hash = '#/guide/introduction';
    await tick();
    location.hash = '#/';
    await tick();
    const checked = app.querySelector('.playground [data-accent-id][aria-checked="true"]');
    expect(checked!.getAttribute('data-accent-id')).toBe('violet');
  });

  it('names each page in the tab title, and the home page by what Kanto is', async () => {
    const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
    location.hash = '#/components/kt-date-picker';
    await tick();
    expect(document.title).toMatch(/date-picker.* — Kanto$/);
    location.hash = '#/guide/installation';
    await tick();
    expect(document.title).toBe('Installation — Kanto');
    location.hash = '#/';
    await tick();
    expect(document.title).toBe('Kanto — web components in your colours, in any framework');
  });

  it('opens a guide page at a section linked with an anchor', async () => {
    location.hash = '#/guide/installation#no-build-step';
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(document.title).toBe('Installation — Kanto');
    expect(app.querySelector('#no-build-step')).not.toBeNull();
  });

  it('gives each template a page, and the template a screen of its own', async () => {
    const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
    location.hash = '#/templates/dashboard';
    await tick();
    expect(document.title).toBe('Dashboard — Kanto');
    expect(app.querySelector('.app-preview-frame')!.getAttribute('src')).toContain(
      '#/template/dashboard',
    );
    expect(app.querySelector('kt-code')).not.toBeNull();

    location.hash = '#/template/dashboard';
    await tick();
    expect(app.querySelector('kt-header')).toBeNull();
    expect(app.querySelector('#orders')).not.toBeNull();
    expect((app.querySelector('#orders') as HTMLElement & { data: unknown[] }).data.length).toBe(5);
  });

  it('runs the script of each template when moving from one to the next', async () => {
    const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
    location.hash = '#/template/dashboard';
    await tick();
    location.hash = '#/template/onboarding';
    await tick();
    await tick();
    expect((app.querySelector('#steps') as HTMLElement & { steps: unknown[] }).steps.length).toBe(
      3,
    );
  });
});
