import { beforeAll, describe, expect, it } from 'vitest';

/**
 * Mounts every full-bleed application once.
 *
 * The docs shell has its own test, but the applications hang off a separate
 * route table (`#/app/...`) that the shell never touches, so a console page
 * that throws on first paint would build cleanly, pass every unit test, and
 * only fail when somebody opened it. This walks the whole table.
 */

const APP_ROUTES = [
  { hash: '#/app/console/home', marker: '.tile-row', label: 'Good evening' },
  { hash: '#/app/console/inbox', marker: '.mail', label: 'Inbox' },
  { hash: '#/app/console/customers', marker: 'kt-table', label: 'Customers' },
  { hash: '#/app/console/files', marker: 'kt-table', label: 'Files' },
  { hash: '#/app/console/activity', marker: 'kt-timeline', label: 'Activity' },
  { hash: '#/app/console/integrations', marker: '.integration-grid', label: 'Integrations' },
  { hash: '#/app/console/settings/general', marker: '.settings-grid', label: 'General' },
  { hash: '#/app/console/settings/members/people', marker: 'kt-table', label: 'People' },
  { hash: '#/app/console/settings/members/roles', marker: 'kt-table', label: 'Roles' },
  {
    hash: '#/app/console/settings/notifications',
    marker: '.settings-narrow',
    label: 'Notifications',
  },
  { hash: '#/app/console/settings/security', marker: '.settings-narrow', label: 'Security' },
  { hash: '#/app/landing', marker: '.hero', label: null },
  { hash: '#/app/chat', marker: '.chat-transcript', label: null },
  { hash: '#/app/portfolio', marker: '.portrait', label: null },
] as const;

describe('the full-bleed applications', () => {
  let app: HTMLElement;

  beforeAll(async () => {
    document.body.innerHTML = '<div id="app"></div>';
    location.hash = '#/app/console/home';
    await import('./main.js');
    app = document.querySelector<HTMLElement>('#app')!;
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  const show = async (hash: string) => {
    location.hash = hash;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    await new Promise((resolve) => setTimeout(resolve, 0));
  };

  for (const route of APP_ROUTES) {
    it(`renders ${route.hash}`, async () => {
      await show(route.hash);
      expect(app.querySelector(route.marker), route.marker).not.toBeNull();
      expect(app.textContent!.trim().length).toBeGreaterThan(200);
    });
  }

  it('drops the documentation chrome on an application route', async () => {
    await show('#/app/landing');
    expect(app.querySelector('.sidebar-group')).toBeNull();
    expect(app.querySelector('.toc')).toBeNull();
  });

  it('brings the documentation chrome back on the way out', async () => {
    await show('#/app/landing');
    await show('#/components/kt-button');
    expect(app.querySelector('.sidebar-group')).not.toBeNull();
    expect(app.querySelector('.toc')).not.toBeNull();
  });

  it('titles each console page in the page, not the top bar', async () => {
    // A heading repeated in two places is a heading nobody reads: the bar
    // carries search and notifications, the page carries its own name.
    for (const route of APP_ROUTES) {
      if (!route.label) continue;
      await show(route.hash);
      expect(app.querySelector('.app-topbar h1'), route.hash).toBeNull();
      expect(app.querySelector('kt-page-header')!.getAttribute('heading'), route.hash).toContain(
        route.label,
      );
    }
  });

  it('drives the whole console sidebar from kt-sub-menu-navigation', async () => {
    // Including the third level. If the console has to hand-roll its own
    // nesting, the component is not finished.
    await show('#/app/console/settings/members/roles');

    const nav = app.querySelector('kt-sub-menu-navigation')!;
    expect(app.querySelectorAll('.app-sidebar nav')).toHaveLength(0);

    const rows = [...nav.shadowRoot!.querySelectorAll('.item')].map((row) =>
      row.querySelector('.label')!.textContent!.trim(),
    );
    expect(rows).toContain('Settings');
    expect(rows).toContain('Members');
    expect(rows).toContain('Roles');

    const current = nav.shadowRoot!.querySelector('[aria-current="page"]')!;
    expect(current.querySelector('.label')!.textContent!.trim()).toBe('Roles');
  });

  it('has a documentation page for every application', async () => {
    for (const slug of ['console-home', 'landing', 'chat', 'portfolio']) {
      await show(`#/apps/${slug}`);
      expect(app.querySelector('main'), slug).not.toBeNull();
      expect(app.querySelector('main')!.textContent!.trim().length).toBeGreaterThan(40);
    }
  });
});
