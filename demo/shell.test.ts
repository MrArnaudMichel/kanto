// @vitest-environment-options {"url": "https://kanto.arnaudmichel.fr/components/kt-button/", "settings": {"navigation": {"disableChildFrameNavigation": true}}}
// A real address, so the site routes on its path; frames stay unloaded, as on about:blank.
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { go } from './lib/address.js';
import { NPM_URL, REPO_URL, VERSION_TAG } from './lib/project.js';

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
/** Goes to a page the way a link of the site does. */
const visit = async (path: string) => {
  go(path);
  await tick();
};
/** Follows an old `#/…` link from inside the site: only the hash changes. */
const followOld = async (hash: string) => {
  location.hash = hash;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
  await tick();
};

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
    // As the prerender wrote it: the app takes the page over, not beside it.
    document.body.innerHTML =
      '<div id="app" data-prerendered><h1 class="prerendered">kt-button</h1></div>';
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
    expect(labels).toEqual(['Guide', 'Components', 'Templates', 'Pro', 'Apps', 'Release']);
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
    await visit('/release/releases/');

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

  it('opens on the home page, full width, at / and /home', async () => {
    for (const hash of ['/', '/home']) {
      await visit(hash);
      expect(app.querySelector('.home'), hash).not.toBeNull();
      expect(app.querySelector('.sidebar'), hash).toBeNull();
    }
  });

  it('takes the wordmark home', () => {
    expect(app.querySelector('.wordmark')!.getAttribute('href')).toBe('/');
  });

  it('starts the hero colour from the site on each visit to the home page', async () => {
    await visit('/');
    app.querySelector<HTMLElement>('.home-hero [data-accent-id="teal"]')!.click();
    await tick();
    await visit('/guide/introduction/');
    await visit('/');
    const checked = app.querySelector('.home-hero [data-accent-id][aria-checked="true"]');
    expect(checked!.getAttribute('data-accent-id')).toBe('violet');
  });

  it('has a page for AI agents, with the line each one needs', async () => {
    await visit('/guide/ai-agents/');
    const page = app.querySelector('main')!;
    expect(page.querySelector('h1')!.textContent).toContain('AI agents');
    const text = page.textContent!;
    expect(text).toContain('@node_modules/kanto-ds/dist/AGENTS.md');
    for (const agent of ['Claude Code', 'Cursor', 'GitHub Copilot', 'Codex']) {
      expect(text, agent).toContain(agent);
    }
    expect(text).toContain('llms-full.txt');
    expect(text).toContain('claude mcp add kanto -- npx -y kanto-mcp');
    const nav = [...app.querySelectorAll('a')].map((link) => link.getAttribute('href'));
    expect(nav).toContain('/guide/ai-agents/');
  });

  it('names each page in the tab title, and the home page by what Kanto is', async () => {
    await visit('/components/kt-date-picker/');
    expect(document.title).toMatch(/date-picker.* — Kanto$/);
    await visit('/guide/installation/');
    expect(document.title).toBe('Installation — Kanto');
    await visit('/');
    expect(document.title).toBe('Kanto — web components in your colours, in any framework');
  });

  it('opens a guide page at a section linked with an anchor', async () => {
    await visit('/guide/installation/#no-build-step');
    expect(document.title).toBe('Installation — Kanto');
    expect(app.querySelector('#no-build-step')).not.toBeNull();
  });

  it('sends the old blocks page to the first block, and keeps the blocks in Components', async () => {
    for (const hash of ['/blocks/', '/blocks/#marketing']) {
      await followOld(hash);
      expect(document.title, hash).toBe('hero — Kanto');
    }
    await visit('/components/kt-hero/');
    const groups = [...app.querySelectorAll('.sidebar-group .overline')].map((g) =>
      g.textContent!.trim(),
    );
    expect(groups).toContain('Blocks');
  });

  it('shows the templates in a gallery, each with its live demo and its page', async () => {
    await visit('/templates/');
    expect(document.title).toBe('Templates — Kanto');
    const card = app.querySelector('.templates-gallery .template-card')!;
    expect(card.querySelector('a[href="/templates/saas/"]')).not.toBeNull();
    const demo = card.querySelector<HTMLAnchorElement>('a.template-demo')!;
    expect(new URL(demo.getAttribute('href')!, location.href).pathname).toBe('/live/saas/');
    expect(card.querySelector('img')!.getAttribute('src')).toBe('/templates/saas-overview.png');
  });

  it('gives each template a page: screens, the command for each stack, what is inside', async () => {
    await visit('/templates/saas/');
    expect(document.title).toBe('SaaS — Kanto');
    expect(app.querySelector<HTMLIFrameElement>('.template-run iframe')!.getAttribute('src')).toBe(
      '/live/saas/#/sign-in',
    );
    // From the template's page too, the demo is the live build, not the page.
    const demo = app.querySelector<HTMLAnchorElement>('a.template-demo')!;
    expect(new URL(demo.getAttribute('href')!, location.href).pathname).toBe('/live/saas/');
    expect(app.querySelector('.template-start kt-code')!.textContent).toContain(
      'npm create kanto@latest my-app -- --template saas --stack react',
    );
    const tabs = app.querySelector('.template-start kt-tabs')!;
    tabs.dispatchEvent(new CustomEvent('kt-change', { detail: { value: 'vue' } }));
    await tick();
    expect(app.querySelector('.template-start kt-code')!.textContent).toContain('--stack vue');
    expect(app.querySelector('a[href="/components/kt-auth-form/"]')).not.toBeNull();
  });

  it('sends an old template link to the gallery', async () => {
    await visit('/templates/sign-in/');
    expect(document.title).toBe('Templates — Kanto');
  });
  it('shows products built with Kanto in Apps, and how to add one', async () => {
    await visit('/apps/');
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
    for (const hash of ['/templates/', '/templates/saas/', '/apps/']) {
      await visit(hash);
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

  it('runs every demo in Templates, the dashboard from its own build', async () => {
    await visit('/templates/');
    expect(app.querySelectorAll('.templates-gallery .template-card').length).toBeGreaterThanOrEqual(
      5,
    );
    await visit('/templates/dashboard/');
    expect(document.title).toBe('Dashboard — Kanto');
    expect(app.querySelector<HTMLIFrameElement>('.template-run iframe')!.getAttribute('src')).toBe(
      '/live/dashboard/#/',
    );
    expect(app.querySelector('.template-start kt-code')).not.toBeNull();
    expect(app.querySelector('#try')).not.toBeNull();
  });

  it('sends the old demo pages to their templates', async () => {
    for (const [old, title] of [
      ['/apps/console-home/', 'Dashboard'],
      ['/app/console/home/', 'Dashboard'],
      ['/app/console/settings/security/', 'Dashboard'],
      ['/apps/landing/', 'Landing'],
      ['/apps/chat/', 'Chat'],
      ['/apps/portfolio/', 'Portfolio'],
      ['/app/landing/', 'Landing'],
      ['/app/portfolio/', 'Portfolio'],
      ['/app/chat/', 'Chat'],
    ]) {
      await visit(old!);
      expect(document.title, old).toBe(`${title} — Kanto`);
      // The template's page itself, in the docs — not a title left over from the last one.
      expect(app.querySelector('.template-run iframe'), old).not.toBeNull();
    }
  });

  it('links the release page to the repository, and ships the changelog either way', async () => {
    // GitHub may or may not answer here. Either way the history comes from the
    // changelog this repository ships, so the version the manifest names is on
    // the page, with the way out to the repository and to npm.
    await visit('/release/releases/');

    const links = [...app.querySelectorAll<HTMLAnchorElement>('a')].map((a) => a.href);
    expect(links.some((h) => h.includes(REPO_URL))).toBe(true);
    expect(links.some((h) => h.includes(NPM_URL))).toBe(true);
    expect(app.querySelector('.release-current-tag')!.textContent).toBe(VERSION_TAG);
  });

  it("opens the buyer's thank-you page from Polar's return, its checkout id in the address", async () => {
    await followOld('/pro/thanks/?checkout_id=abc123');
    expect(location.pathname + location.search).toBe('/pro/thanks/?checkout_id=abc123');
    expect(app.querySelector('h1')?.textContent).toMatch(/Thank you/);
    expect(
      app.querySelector('a[href="https://github.com/kanto-ds/kanto-saas-pro/invitations"]'),
    ).not.toBeNull();
  });

  it('takes over the page the prerender wrote, instead of drawing beside it', async () => {
    await visit('/components/kt-button/');
    expect(app.querySelector('.prerendered')).toBeNull();
    expect(app.hasAttribute('data-prerendered')).toBe(false);
    expect(app.querySelectorAll('main h1')).toHaveLength(1);
  });

  it('gives each page its description and its one address', async () => {
    const canonical = () =>
      document.head.querySelector('link[rel="canonical"]')!.getAttribute('href');
    const description = () =>
      document.head.querySelector('meta[name="description"]')!.getAttribute('content');
    await visit('/components/kt-button/');
    expect(canonical()).toBe('https://kanto.arnaudmichel.fr/components/kt-button/');
    expect(description()).toBe(app.querySelector('.doc-summary')!.textContent!.trim());
    for (const [path, address] of [
      ['/pro/', '/pro/'],
      ['/templates/', '/templates/'],
      ['/apps/', '/apps/'],
      ['/', '/'],
    ]) {
      await visit(path!);
      expect(canonical(), path).toBe(`https://kanto.arnaudmichel.fr${address}`);
      expect(description(), path).toBeTruthy();
    }
    expect(app.querySelector('.top-nav a[href="/templates/"]')).not.toBeNull();
  });

  it("keeps the buyer's thank-you page out of search engines", async () => {
    await visit('/pro/thanks/');
    expect(document.head.querySelector('meta[name="robots"]')!.getAttribute('content')).toBe(
      'noindex',
    );
    await visit('/pro/');
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
  });

  it('scrolls to a heading linked on the same page, without drawing the page again', async () => {
    await visit('/guide/installation/');
    const top = vi.spyOn(window, 'scrollTo');
    // What the browser does for a plain `#id` link: the hash, then popstate.
    history.pushState(null, '', '#no-build-step');
    window.dispatchEvent(new PopStateEvent('popstate'));
    await tick();
    expect(top).not.toHaveBeenCalled();
    top.mockRestore();
    await visit('/guide/introduction/');
    expect(document.title).toBe('Introduction — Kanto');
  });
});
