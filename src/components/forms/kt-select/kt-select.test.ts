import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fixture, settle } from '../../../test/fixture.js';
import './kt-select.js';
import type { KtSelect } from './kt-select.js';
import type { KtOption } from '../../../internal/listbox.js';

const OPTIONS: KtOption[] = [
  { id: 'ne', label: 'North East' },
  { id: 'nw', label: 'North West', disabled: true },
  { id: 'sw', label: 'South West' },
];

const trigger = (el: KtSelect) => el.shadowRoot!.querySelector<HTMLButtonElement>('.trigger')!;
const popup = (el: KtSelect) => el.shadowRoot!.querySelector('.popup')!;
const rows = (el: KtSelect) => [...el.shadowRoot!.querySelectorAll<HTMLElement>('.option')];
const key = (el: KtSelect, k: string) =>
  trigger(el).dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));

async function open(el: KtSelect) {
  trigger(el).click();
  await settle(el);
}

describe('kt-select', () => {
  let el: KtSelect;

  beforeEach(async () => {
    el = await fixture<KtSelect>('<kt-select></kt-select>');
    el.options = OPTIONS;
    await settle(el);
  });

  it('shows the placeholder until something is chosen', () => {
    expect(trigger(el).textContent).toContain('Select');
    expect(trigger(el).getAttribute('aria-expanded')).toBe('false');
  });

  it('says so when there are no options', async () => {
    el.options = [];
    await settle(el);
    expect(el.shadowRoot!.querySelector('.empty')!.textContent).toContain('No options');
  });

  it('opens and closes on the trigger', async () => {
    await open(el);
    expect(popup(el).classList.contains('open')).toBe(true);
    expect(trigger(el).getAttribute('aria-expanded')).toBe('true');

    trigger(el).click();
    await settle(el);
    expect(popup(el).classList.contains('open')).toBe(false);
  });

  it('keeps the popup mounted so it can animate out', async () => {
    expect(popup(el)).not.toBeNull();
    expect(popup(el).classList.contains('open')).toBe(false);
  });

  it('chooses an option and reports it', async () => {
    const listener = vi.fn();
    el.addEventListener('kt-change', listener);

    await open(el);
    rows(el)[2]!.click();
    await settle(el);

    expect(el.value).toBe('sw');
    expect(el.selectedOption?.label).toBe('South West');
    expect(trigger(el).textContent).toContain('South West');
    expect(listener.mock.calls[0]![0].detail.value).toBe('sw');
    expect(popup(el).classList.contains('open')).toBe(false);
  });

  it('refuses a disabled option', async () => {
    await open(el);
    rows(el)[1]!.click();
    await settle(el);

    expect(el.value).toBeNull();
    expect(rows(el)[1]!.getAttribute('aria-disabled')).toBe('true');
  });

  it('walks the list with the arrows, skipping disabled options', async () => {
    key(el, 'ArrowDown');
    await settle(el);
    expect(popup(el).classList.contains('open')).toBe(true);
    expect(rows(el)[0]!.classList.contains('active')).toBe(true);

    key(el, 'ArrowDown');
    await settle(el);
    expect(rows(el)[2]!.classList.contains('active')).toBe(true);

    key(el, 'ArrowDown');
    await settle(el);
    expect(rows(el)[0]!.classList.contains('active')).toBe(true);
  });

  it('jumps to the ends with Home and End', async () => {
    await open(el);
    key(el, 'End');
    await settle(el);
    expect(rows(el)[2]!.classList.contains('active')).toBe(true);

    key(el, 'Home');
    await settle(el);
    expect(rows(el)[0]!.classList.contains('active')).toBe(true);
  });

  it('commits the active option with Enter', async () => {
    key(el, 'ArrowDown');
    await settle(el);
    key(el, 'ArrowDown');
    await settle(el);
    key(el, 'Enter');
    await settle(el);

    expect(el.value).toBe('sw');
  });

  it('closes on Escape without changing the value', async () => {
    const listener = vi.fn();
    el.addEventListener('kt-change', listener);

    await open(el);
    key(el, 'Escape');
    await settle(el);

    expect(popup(el).classList.contains('open')).toBe(false);
    expect(el.value).toBeNull();
    expect(listener).not.toHaveBeenCalled();
  });

  it('closes on an outside pointer press', async () => {
    await open(el);
    document.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
    await settle(el);
    expect(popup(el).classList.contains('open')).toBe(false);
  });

  it('exposes the active descendant to assistive technology', async () => {
    await open(el);
    const active = rows(el).find((row) => row.classList.contains('active'))!;
    expect(trigger(el).getAttribute('aria-activedescendant')).toBe(active.id);
  });

  it('clears the selection', async () => {
    el.value = 'sw';
    await settle(el);

    el.shadowRoot!.querySelector<HTMLElement>('.clear')!.click();
    await settle(el);

    expect(el.value).toBeNull();
    expect(trigger(el).textContent).toContain('Select');
  });

  it('restores the initial selection on form reset', async () => {
    const seeded = await fixture<KtSelect>('<kt-select value="ne"></kt-select>');
    seeded.options = OPTIONS;
    await settle(seeded);

    seeded.value = 'sw';
    await settle(seeded);
    seeded.formResetCallback();
    await settle(seeded);

    expect(seeded.value).toBe('ne');
  });
});
