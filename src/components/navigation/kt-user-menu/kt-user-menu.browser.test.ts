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
