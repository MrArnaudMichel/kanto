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
  { hash: '#/app/console/home', marker: '.stat-row', label: 'Home' },
  { hash: '#/app/console/inbox', marker: '.mail', label: 'Inbox' },
  { hash: '#/app/console/customers', marker: 'kt-table', label: 'Customers' },
  { hash: '#/app/console/settings/general', marker: '.settings-grid', label: 'Settings' },
  { hash: '#/app/console/settings/members', marker: 'kt-table', label: 'Settings' },
  { hash: '#/app/console/settings/notifications', marker: '.settings-narrow', label: 'Settings' },
  { hash: '#/app/console/settings/security', marker: '.settings-narrow', label: 'Settings' },
  { hash: '#/app/landing', marker: '.hero', label: null },
  { hash: '#/app/chat', marker: '.chat-transcript', label: null },
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

  it('titles each console page', async () => {
    for (const route of APP_ROUTES) {
      if (!route.label) continue;
      await show(route.hash);
      expect(app.querySelector('.app-topbar h1')!.textContent, route.hash).toContain(route.label);
    }
  });

  it('has a documentation page for every application', async () => {
    for (const route of APP_ROUTES) {
      const slug = route.hash.replace('#/app/', '').split('/')[0]!;
      await show(`#/apps/${slug === 'console' ? 'console-home' : slug}`);
      expect(app.querySelector('main'), slug).not.toBeNull();
      expect(app.querySelector('main')!.textContent!.trim().length).toBeGreaterThan(40);
    }
  });
});
