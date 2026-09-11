import { describe, expect, it, vi } from 'vitest';
import { fixture, settle } from '#test/fixture';
import './kt-toggle.js';
import type { KtToggle } from 'kanto-ds';

const control = (el: KtToggle) => el.shadowRoot!.querySelector('button')!;

describe('kt-toggle', () => {
  it('announces itself as a switch with its state', async () => {
    const el = await fixture<KtToggle>('<kt-toggle></kt-toggle>');
    expect(control(el).getAttribute('role')).toBe('switch');
    expect(control(el).getAttribute('aria-checked')).toBe('false');

    el.checked = true;
    await settle(el);
    expect(control(el).getAttribute('aria-checked')).toBe('true');
  });

  it('flips on click and reports the new state', async () => {
    const el = await fixture<KtToggle>('<kt-toggle></kt-toggle>');
    const listener = vi.fn();
    el.addEventListener('kt-change', listener);

    control(el).click();
    await settle(el);

    expect(el.checked).toBe(true);
    expect(listener.mock.calls[0]![0].detail).toEqual({ checked: true });
  });

  it('flips from the slotted label too', async () => {
    const el = await fixture<KtToggle>('<kt-toggle>Notifications</kt-toggle>');
    el.shadowRoot!.querySelector<HTMLElement>('.label')!.click();
    await settle(el);
    expect(el.checked).toBe(true);
  });

  it('ignores clicks while disabled', async () => {
    const el = await fixture<KtToggle>('<kt-toggle disabled></kt-toggle>');
    const listener = vi.fn();
    el.addEventListener('kt-change', listener);

    control(el).click();
    el.shadowRoot!.querySelector<HTMLElement>('.label')!.click();
    await settle(el);

    expect(el.checked).toBe(false);
    expect(listener).not.toHaveBeenCalled();
    expect(control(el).disabled).toBe(true);
  });

  it('restores its initial state on form reset', async () => {
    const el = await fixture<KtToggle>('<kt-toggle checked></kt-toggle>');
    control(el).click();
    await settle(el);
    expect(el.checked).toBe(false);

    el.formResetCallback();
    await settle(el);
    expect(el.checked).toBe(true);
  });

  it('takes its accessible name from the label attribute when nothing is slotted', async () => {
    const el = await fixture<KtToggle>('<kt-toggle label="Dark mode"></kt-toggle>');
    expect(control(el).getAttribute('aria-label')).toBe('Dark mode');
  });
});
