import { describe, expect, it, vi } from 'vitest';
import { fixture, settle } from '#test/fixture';
import './kt-user-menu.js';
import type { KtUserMenu } from 'kanto-ds';

const ITEMS = [
  { id: 'profile', label: 'Profile', icon: 'user' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
  { id: 'signout', label: 'Sign out', separator: true, danger: true },
];

async function mount(
  markup = '<kt-user-menu name="Dana Whitfield" email="dana@northwind.io"></kt-user-menu>',
) {
  const el = await fixture<KtUserMenu>(markup);
  el.items = ITEMS;
  await settle(el);
  return el;
}

const trigger = (el: KtUserMenu) => el.shadowRoot!.querySelector<HTMLButtonElement>('.trigger')!;
const items = (el: KtUserMenu) => [
  ...el.shadowRoot!.querySelectorAll<HTMLElement>('[role="menuitem"]'),
];

function key(target: Element, name: string) {
  const event = new KeyboardEvent('keydown', {
    key: name,
    bubbles: true,
    composed: true,
    cancelable: true,
  });
  target.dispatchEvent(event);
  return event;
}

describe('kt-user-menu', () => {
  it('is a button named after the person, that opens a menu', async () => {
    const el = await mount();
    expect(trigger(el).getAttribute('aria-label')).toBe('Dana Whitfield');
    expect(trigger(el).getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger(el).getAttribute('aria-expanded')).toBe('false');
    expect(el.shadowRoot!.querySelector('kt-avatar')!.getAttribute('name')).toBe('Dana Whitfield');
  });

  it('opens on a click, showing who is signed in above the items', async () => {
    const el = await mount();
    trigger(el).click();
    await settle(el);
    expect(el.open).toBe(true);
    expect(trigger(el).getAttribute('aria-expanded')).toBe('true');
    const head = el.shadowRoot!.querySelector('.who')!.textContent!;
    expect(head).toContain('Dana Whitfield');
    expect(head).toContain('dana@northwind.io');
    expect(items(el).map((item) => item.textContent!.trim())).toEqual([
      'Profile',
      'Settings',
      'Sign out',
    ]);
    expect(el.shadowRoot!.querySelector('[role="menu"]')!.getAttribute('aria-label')).toBe(
      'Dana Whitfield',
    );
  });

  it('separates an item from the ones before it, and marks the dangerous one', async () => {
    const el = await mount();
    trigger(el).click();
    await settle(el);
    expect(el.shadowRoot!.querySelector('[role="separator"]')).not.toBeNull();
    expect(items(el)[2]!.classList.contains('danger')).toBe(true);
  });

  it('runs an item, says which, and closes', async () => {
    const el = await mount();
    const selected = vi.fn();
    el.addEventListener('kt-select', selected);
    trigger(el).click();
    await settle(el);
    items(el)[1]!.click();
    await settle(el);
    expect(selected.mock.calls[0]![0].detail).toMatchObject({ id: 'settings' });
    expect(el.open).toBe(false);
  });

  it('moves between items on the arrows, Home and End', async () => {
    const el = await mount();
    key(trigger(el), 'ArrowDown');
    await settle(el);
    expect(el.open).toBe(true);
    expect(el.shadowRoot!.activeElement).toBe(items(el)[0]);
    key(items(el)[0]!, 'ArrowDown');
    expect(el.shadowRoot!.activeElement).toBe(items(el)[1]);
    key(items(el)[1]!, 'End');
    expect(el.shadowRoot!.activeElement).toBe(items(el)[2]);
    key(items(el)[2]!, 'ArrowDown');
    expect(el.shadowRoot!.activeElement).toBe(items(el)[0]);
    key(items(el)[0]!, 'ArrowUp');
    expect(el.shadowRoot!.activeElement).toBe(items(el)[2]);
  });

  it('closes on Escape and gives the focus back to its button', async () => {
    const el = await mount();
    key(trigger(el), 'ArrowDown');
    await settle(el);
    key(items(el)[0]!, 'Escape');
    await settle(el);
    expect(el.open).toBe(false);
    expect(el.shadowRoot!.activeElement).toBe(trigger(el));
  });

  it('can show the name beside the avatar', async () => {
    const el = await mount('<kt-user-menu name="Dana Whitfield" show-name></kt-user-menu>');
    expect(trigger(el).textContent).toContain('Dana Whitfield');
  });
});
