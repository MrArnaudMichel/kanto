import { describe, expect, it, vi } from 'vitest';
import { fixture, settle } from '#test/fixture';
import './kt-app-shell.js';
import type { KtAppShell } from 'kanto-ds';

const root = (el: KtAppShell) => el.shadowRoot!;
const toggle = (el: KtAppShell) => root(el).querySelector<HTMLElement>('.toggle')!;

describe('kt-app-shell', () => {
  it('gives each area its landmark: the sidebar an aside, the content a main', async () => {
    const el = await fixture<KtAppShell>('<kt-app-shell></kt-app-shell>');
    expect(root(el).querySelector('aside')!.getAttribute('aria-label')).toBe('Sidebar');
    expect(root(el).querySelector('main')).not.toBeNull();
    const named = await fixture<KtAppShell>('<kt-app-shell label="Workspace"></kt-app-shell>');
    expect(root(named).querySelector('aside')!.getAttribute('aria-label')).toBe('Workspace');
  });

  it('has slots for the header, the sidebar and the content', async () => {
    const el = await fixture<KtAppShell>('<kt-app-shell></kt-app-shell>');
    const names = [...root(el).querySelectorAll('slot')].map((slot) => slot.name || 'default');
    expect(names).toEqual(expect.arrayContaining(['header', 'sidebar', 'default']));
  });

  it('names its toggle after the sidebar it controls, and says whether it is open', async () => {
    const el = await fixture<KtAppShell>('<kt-app-shell></kt-app-shell>');
    const button = toggle(el);
    expect(button.getAttribute('label')).toBe('Sidebar');
    expect(button.getAttribute('aria-controls')).toBe(root(el).querySelector('aside')!.id);
    expect(button.getAttribute('aria-expanded')).toBe('true');
  });

  it('collapses the sidebar to a rail from its toggle, when wide, and says so', async () => {
    const el = await fixture<KtAppShell>('<kt-app-shell></kt-app-shell>');
    const toggled = vi.fn();
    el.addEventListener('kt-sidebar-toggle', toggled);
    toggle(el).click();
    await settle(el);
    expect(el.collapsed).toBe(true);
    expect(el.hasAttribute('collapsed')).toBe(true);
    expect(toggle(el).getAttribute('aria-expanded')).toBe('false');
    expect(toggled.mock.calls[0]![0].detail).toEqual({ open: false });
  });

  it('opens and closes the sidebar from script', async () => {
    const el = await fixture<KtAppShell>('<kt-app-shell collapsed></kt-app-shell>');
    el.toggleSidebar();
    await settle(el);
    expect(el.collapsed).toBe(false);
  });

  it('leaves the toggle out with no-toggle, for a header that has its own', async () => {
    const el = await fixture<KtAppShell>('<kt-app-shell no-toggle></kt-app-shell>');
    expect(root(el).querySelector('.toggle')).toBeNull();
  });
});
