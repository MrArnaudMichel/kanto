/** The menu in the top layer, under its button and lined up with its end. */
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { fixture, settle } from '#test/fixture';
import '../../../styles.css';
import './kt-user-menu.js';
import type { KtUserMenu } from 'kanto-ds';

async function mount() {
  const el = await fixture<KtUserMenu>(
    '<kt-user-menu name="Dana Whitfield" email="dana@northwind.io" style="margin-left: 300px"></kt-user-menu>',
  );
  el.items = [
    { id: 'profile', label: 'Profile', icon: 'user' },
    { id: 'signout', label: 'Sign out', separator: true, danger: true },
  ];
  await settle(el);
  return el;
}

describe('kt-user-menu, laid out', () => {
  it('opens under its button, its end against the button’s, on Enter, on the first item', async () => {
    const el = await mount();
    el.shadowRoot!.querySelector<HTMLElement>('.trigger')!.focus();
    await userEvent.keyboard('{Enter}');
    await settle(el);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const button = el.shadowRoot!.querySelector('.trigger')!.getBoundingClientRect();
    const panel = el.shadowRoot!.querySelector('.panel')!;
    expect(panel.matches(':popover-open')).toBe(true);
    const box = panel.getBoundingClientRect();
    expect(box.top).toBeGreaterThanOrEqual(button.bottom);
    expect(Math.abs(box.right - button.right)).toBeLessThan(2);
    expect(el.shadowRoot!.activeElement?.textContent?.trim()).toBe('Profile');
  });

  it('closes on a click outside', async () => {
    const el = await mount();
    await userEvent.click(el.shadowRoot!.querySelector<HTMLElement>('.trigger')!);
    await settle(el);
    expect(el.open).toBe(true);
    await userEvent.click(document.body, { position: { x: 5, y: 5 } });
    await settle(el);
    expect(el.open).toBe(false);
  });
});

describe('kt-user-menu, block — the account at the foot of a sidebar', () => {
  async function inSidebar(showName = true) {
    const el = await fixture<KtUserMenu>(
      `<div style="position: fixed; left: 16px; bottom: 12px; width: 240px"><kt-user-menu block ${showName ? 'show-name' : ''} name="Dana Whitfield" email="dana@northwind.io"></kt-user-menu></div>`,
    );
    const menu = el.querySelector('kt-user-menu') as KtUserMenu;
    menu.items = [{ id: 'profile', label: 'Profile', icon: 'user' }];
    await settle(menu);
    return menu;
  }
  const token = (name: string) => {
    const probe = document.body.appendChild(document.createElement('div'));
    probe.style.borderRadius = `var(${name})`;
    const value = getComputedStyle(probe).borderTopLeftRadius;
    probe.remove();
    return value;
  };

  it('is a row as wide as the sidebar, shaped as its items are: their radius, the name and the email', async () => {
    const menu = await inSidebar();
    const trigger = menu.shadowRoot!.querySelector<HTMLElement>('.trigger')!;
    expect(Math.round(trigger.getBoundingClientRect().width)).toBe(240);
    expect(getComputedStyle(trigger).borderTopLeftRadius).toBe(token('--radius-input'));
    expect(trigger.textContent).toContain('Dana Whitfield');
    expect(trigger.textContent).toContain('dana@northwind.io');
    expect(trigger.querySelector('kt-icon[name="chevrons-up-down"]')).not.toBeNull();
  });

  it('centres the avatar alone in a rail', async () => {
    const menu = await inSidebar(false);
    const trigger = menu.shadowRoot!.querySelector('.trigger')!.getBoundingClientRect();
    const avatar = menu.shadowRoot!.querySelector('kt-avatar')!.getBoundingClientRect();
    expect(
      Math.abs(avatar.left + avatar.width / 2 - (trigger.left + trigger.width / 2)),
    ).toBeLessThan(1);
  });

  it('opens above itself at the foot of the screen, as wide as the row', async () => {
    const menu = await inSidebar();
    await userEvent.click(menu.shadowRoot!.querySelector<HTMLElement>('.trigger')!);
    await settle(menu);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const trigger = menu.shadowRoot!.querySelector('.trigger')!.getBoundingClientRect();
    const panel = menu.shadowRoot!.querySelector('.panel')!.getBoundingClientRect();
    expect(panel.bottom).toBeLessThanOrEqual(trigger.top);
    expect(Math.abs(panel.left - trigger.left)).toBeLessThan(2);
    expect(Math.abs(panel.width - trigger.width)).toBeLessThan(2);
  });
});
