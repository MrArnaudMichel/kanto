import { describe, expect, it, vi } from 'vitest';
import { fixture, settle } from 'kanto-ds/test/fixture';
import './kt-header.js';
import type { KtHeader } from 'kanto-ds';

const banner = (el: KtHeader) => el.shadowRoot!.querySelector('header')!;
const menuButton = (el: KtHeader) => el.shadowRoot!.querySelector('.menu-button')!;
const panel = (el: KtHeader) => el.shadowRoot!.querySelector('.panel')!;

const mount = (attrs = '') =>
  fixture<KtHeader>(`<kt-header ${attrs}>
    <span slot="brand">KANTO</span>
    <nav><a href="/docs">Docs</a></nav>
    <button slot="actions">Search</button>
    <nav slot="menu"><a href="/docs">Docs</a></nav>
  </kt-header>`);

describe('kt-header', () => {
  it('is a banner landmark', async () => {
    const el = await mount();
    expect(banner(el).getAttribute('role')).toBe('banner');
  });

  it('names the banner only when asked, for pages with more than one', async () => {
    const plain = await mount();
    expect(banner(plain).hasAttribute('aria-label')).toBe(false);

    const named = await mount('label="Documentation"');
    expect(banner(named).getAttribute('aria-label')).toBe('Documentation');
  });

  it('exposes a slot for brand, navigation, actions, menu and a second row', async () => {
    const el = await mount();
    const names = [...el.shadowRoot!.querySelectorAll('slot')].map((s) => s.name);
    expect(names).toEqual(expect.arrayContaining(['brand', '', 'actions', 'menu', 'bottom']));
  });

  it('is not sticky or blurred unless asked', async () => {
    const el = await mount();
    expect(el.hasAttribute('sticky')).toBe(false);

    const sticky = await mount('sticky');
    expect(sticky.hasAttribute('sticky')).toBe(true);
  });

  it('is bordered by default', async () => {
    const el = await mount();
    expect(el.bordered).toBe(true);
  });

  it('opens and closes the collapsed menu, and reports it', async () => {
    const el = await mount();
    const listener = vi.fn();
    el.addEventListener('kt-menu-toggle', listener);

    expect(el.isMenuOpen).toBe(false);
    expect(panel(el).classList.contains('open')).toBe(false);

    menuButton(el).dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await settle(el);

    expect(el.isMenuOpen).toBe(true);
    expect(panel(el).classList.contains('open')).toBe(true);
    expect(listener.mock.calls[0]![0].detail).toEqual({ open: true });
    expect(menuButton(el).getAttribute('label')).toBe('Close menu');

    menuButton(el).dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await settle(el);
    expect(el.isMenuOpen).toBe(false);
  });

  it('closeMenu() is a no-op when the menu is already shut', async () => {
    const el = await mount();
    const listener = vi.fn();
    el.addEventListener('kt-menu-toggle', listener);

    el.closeMenu();
    await settle(el);
    expect(listener).not.toHaveBeenCalled();

    menuButton(el).dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await settle(el);
    el.closeMenu();
    await settle(el);

    expect(el.isMenuOpen).toBe(false);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('reflects the menu state to assistive technology', async () => {
    const el = await mount();
    expect(menuButton(el).getAttribute('aria-expanded')).toBe('false');

    menuButton(el).dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await settle(el);
    expect(menuButton(el).getAttribute('aria-expanded')).toBe('true');
  });
});
