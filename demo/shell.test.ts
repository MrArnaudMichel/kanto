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

  // It imports and draws the whole site, which a loaded machine takes a while over.
  beforeAll(async () => {
    document.body.innerHTML = '<div id="app"></div>';
    location.hash = '#/components/kt-button';
    await import('./main.js');
    app = document.querySelector<HTMLElement>('#app')!;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }, 30_000);

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

  it('starts the hero colour from the site on each visit to the home page', async () => {
    const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
    location.hash = '#/';
    await tick();
    app.querySelector<HTMLElement>('.home-hero [data-accent-id="teal"]')!.click();
    await tick();
    location.hash = '#/guide/introduction';
    await tick();
    location.hash = '#/';
    await tick();
    const checked = app.querySelector('.home-hero [data-accent-id][aria-checked="true"]');
    expect(checked!.getAttribute('data-accent-id')).toBe('violet');
  });

  it('has a page for AI agents, with the line each one needs', async () => {
    const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
    location.hash = '#/guide/ai-agents';
    await tick();
    const page = app.querySelector('main')!;
    expect(page.querySelector('h1')!.textContent).toContain('AI agents');
    const text = page.textContent!;
    expect(text).toContain('@node_modules/kanto-ds/dist/AGENTS.md');
    for (const agent of ['Claude Code', 'Cursor', 'GitHub Copilot', 'Codex']) {
      expect(text, agent).toContain(agent);
    }
    expect(text).toContain('llms-full.txt');
    const nav = [...app.querySelectorAll('a')].map((link) => link.getAttribute('href'));
    expect(nav).toContain('#/guide/ai-agents');
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

  it('sends the old blocks page to the first block, and keeps the blocks in Components', async () => {
    const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
    for (const hash of ['#/blocks', '#/blocks#marketing']) {
      location.hash = hash;
      await tick();
      expect(document.title, hash).toBe('hero — Kanto');
    }
    location.hash = '#/components/kt-hero';
    await tick();
    const groups = [...app.querySelectorAll('.sidebar-group .overline')].map((g) =>
      g.textContent!.trim(),
    );
    expect(groups).toContain('Blocks');
  });

  it('shows the templates in a gallery, each with its live demo and its page', async () => {
    const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
    location.hash = '#/templates';
    await tick();
    expect(document.title).toBe('Templates — Kanto');
    const card = app.querySelector('.templates-gallery .template-card')!;
    expect(card.querySelector('a[href="#/templates/saas"]')).not.toBeNull();
    const demo = card.querySelector<HTMLAnchorElement>('a.template-demo')!;
    expect(
      new URL(
        demo.getAttribute('href')!,
        location.href.replace(/^about:blank/, 'https://kanto.arnaudmichel.fr/'),
      ).pathname,
    ).toBe('/templates/saas/');
    expect(card.querySelector('img')!.getAttribute('src')).toBe('./templates/saas-overview.png');
  });

  it('gives each template a page: screens, the command for each stack, what is inside', async () => {
    const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
    location.hash = '#/templates/saas';
    await tick();
    expect(document.title).toBe('SaaS — Kanto');
    expect(app.querySelector<HTMLIFrameElement>('.template-run iframe')!.getAttribute('src')).toBe(
      './templates/saas/#/sign-in',
    );
    // From the template's page too, the demo resolves beside the site, not under the hash.
    const demo = app.querySelector<HTMLAnchorElement>('a.template-demo')!;
    expect(
      new URL(
        demo.getAttribute('href')!,
        location.href.replace(/^about:blank/, 'https://kanto.arnaudmichel.fr/'),
      ).pathname,
    ).toBe('/templates/saas/');
    expect(app.querySelector('.template-start kt-code')!.textContent).toContain(
      'npm create kanto@latest my-app -- --template saas --stack react',
    );
    const tabs = app.querySelector('.template-start kt-tabs')!;
    tabs.dispatchEvent(new CustomEvent('kt-change', { detail: { value: 'vue' } }));
    await tick();
    expect(app.querySelector('.template-start kt-code')!.textContent).toContain('--stack vue');
    expect(app.querySelector('a[href="#/components/kt-auth-form"]')).not.toBeNull();
  });

  it('sends an old template link to the gallery', async () => {
    location.hash = '#/templates/sign-in';
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(document.title).toBe('Templates — Kanto');
  });
  it('shows products built with Kanto in Apps, and how to add one', async () => {
    const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
    location.hash = '#/apps';
    await tick();
    expect(document.title).toBe('Showcase — Kanto');
    const cards = [...app.querySelectorAll('.built-with .built-with-card')];
    expect(cards.length).toBeGreaterThanOrEqual(2);
    expect(cards[0]!.querySelector('a[href="https://kanto.arnaudmichel.fr"]')).not.toBeNull();
    expect(
      app.querySelector(
        '.built-with a[href^="https://github.com/MrArnaudMichel/kanto/issues/new?template=showcase.yml"]',
      ),
    ).not.toBeNull();
    // The demos are templates now: Apps holds the showcase alone.
    const groups = [...app.querySelectorAll('.sidebar-group .overline')].map((g) =>
      g.textContent!.trim(),
    );
    expect(groups).toEqual(['Apps']);
  });

  it('names every link on the templates and apps pages, or hides it from assistive tech', async () => {
    const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
    for (const hash of ['#/templates', '#/templates/saas', '#/apps']) {
      location.hash = hash;
      await tick();
      const unnamed = [...app.querySelectorAll<HTMLAnchorElement>('main a')]
        .filter((link) => link.getAttribute('aria-hidden') !== 'true')
        .filter(
          (link) =>
            !link.textContent!.trim() &&
            !link.getAttribute('aria-label') &&
            ![...link.querySelectorAll('img')].some((img) => img.getAttribute('alt')),
        )
        .map((link) => link.getAttribute('href'));
      expect(unnamed, hash).toEqual([]);
    }
  });

  it('runs every demo in Templates, and says when a project is still to come', async () => {
    const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
    location.hash = '#/templates';
    await tick();
    expect(app.querySelectorAll('.templates-gallery .template-card').length).toBeGreaterThanOrEqual(
      5,
    );
    const cards = [...app.querySelectorAll('.template-card')];
    const dashboard = cards.find((card) => card.querySelector('a[href="#/templates/dashboard"]'))!;
    expect(dashboard.querySelector('.template-stacks')!.textContent).toMatch(/coming/i);
    location.hash = '#/templates/dashboard';
    await tick();
    expect(document.title).toBe('Dashboard — Kanto');
    expect(app.querySelector<HTMLIFrameElement>('.template-run iframe')!.getAttribute('src')).toBe(
      './#/app/console/home',
    );
    expect(app.querySelector('.template-start kt-code')).toBeNull();
    expect(app.querySelector('.template-start')!.textContent).toMatch(/coming/i);
    expect(app.querySelector('#try')).not.toBeNull();
  });

  it('sends the old demo pages to their templates', async () => {
    const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
    for (const [old, title] of [
      ['#/apps/console-home', 'Dashboard'],
      ['#/apps/landing', 'Landing'],
      ['#/apps/chat', 'Chat'],
      ['#/apps/portfolio', 'Portfolio'],
      ['#/app/landing', 'Landing'],
      ['#/app/portfolio', 'Portfolio'],
    ]) {
      location.hash = old!;
      await tick();
      expect(document.title, old).toBe(`${title} — Kanto`);
    }
  });
});
