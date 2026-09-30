import { describe, expect, it, vi } from 'vitest';
import { fixture, formFixture, settle } from '#test/fixture';
import './kt-multi-select.js';
import type { KtMultiSelect } from 'kanto-ds';

const REGIONS = [
  { id: 'ne', label: 'North East' },
  { id: 'sw', label: 'South West' },
  { id: 'mid', label: 'Midlands', disabled: true },
  { id: 'nw', label: 'North West' },
];

const input = (el: KtMultiSelect) => el.shadowRoot!.querySelector('input')!;
const list = (el: KtMultiSelect) => el.shadowRoot!.querySelector('[role="listbox"]')!;
const options = (el: KtMultiSelect) => [
  ...el.shadowRoot!.querySelectorAll<HTMLElement>('[role="option"]'),
];
const chips = (el: KtMultiSelect) => [...el.shadowRoot!.querySelectorAll<HTMLElement>('.chip')];

async function mount(value: (string | number)[] = []): Promise<KtMultiSelect> {
  const el = await fixture<KtMultiSelect>('<kt-multi-select label="Regions"></kt-multi-select>');
  el.options = REGIONS;
  el.value = value;
  await settle(el);
  return el;
}

async function key(el: KtMultiSelect, name: string) {
  input(el).dispatchEvent(
    new KeyboardEvent('keydown', { key: name, bubbles: true, composed: true }),
  );
  await settle(el);
}

async function open(el: KtMultiSelect) {
  input(el).dispatchEvent(new FocusEvent('focus'));
  await settle(el);
}

describe('kt-multi-select', () => {
  it('shows each chosen option as a removable chip, in the order chosen', async () => {
    const el = await mount(['nw', 'ne']);

    expect(chips(el).map((chip) => chip.textContent!.trim())).toEqual(['North West', 'North East']);
    expect(chips(el).every((chip) => chip.hasAttribute('removable'))).toBe(true);
  });

  it('toggles an option from the list, and stays open for the next one', async () => {
    const el = await mount();
    const changed = vi.fn();
    el.addEventListener('kt-change', changed);
    await open(el);

    options(el)[1]!.click();
    await settle(el);
    expect(el.value).toEqual(['sw']);
    expect(changed.mock.lastCall![0].detail).toEqual({ value: ['sw'], options: [REGIONS[1]] });
    expect(list(el).classList.contains('open')).toBe(true);

    options(el)[1]!.click();
    await settle(el);
    expect(el.value).toEqual([]);
  });

  it('ignores a disabled option', async () => {
    const el = await mount();
    await open(el);
    options(el)[2]!.click();
    await settle(el);
    expect(el.value).toEqual([]);
  });

  it('walks the list with the arrows and toggles with Enter', async () => {
    const el = await mount();
    await open(el);

    await key(el, 'ArrowDown');
    await key(el, 'Enter');
    expect(el.value).toEqual(['sw']);

    // Midlands is disabled, so the next stop is North West.
    await key(el, 'ArrowDown');
    await key(el, 'Enter');
    expect(el.value).toEqual(['sw', 'nw']);
  });

  it('closes on Escape, keeping what was chosen', async () => {
    const el = await mount(['ne']);
    await open(el);
    await key(el, 'Escape');
    expect(list(el).classList.contains('open')).toBe(false);
    expect(el.value).toEqual(['ne']);
  });

  it('removes a chip from its remove button', async () => {
    const el = await mount(['ne', 'sw']);
    const changed = vi.fn();
    el.addEventListener('kt-change', changed);

    chips(el)[0]!.dispatchEvent(new CustomEvent('kt-remove', { bubbles: true, composed: true }));
    await settle(el);

    expect(el.value).toEqual(['sw']);
    expect(changed).toHaveBeenCalledOnce();
  });

  it('removes the last chip with Backspace in an empty field', async () => {
    const el = await mount(['ne', 'sw']);
    await key(el, 'Backspace');
    expect(el.value).toEqual(['ne']);
  });

  it('keeps Backspace for the text while there is some', async () => {
    const el = await mount(['ne']);
    input(el).value = 'no';
    input(el).dispatchEvent(new Event('input'));
    await settle(el);
    await key(el, 'Backspace');
    expect(el.value).toEqual(['ne']);
  });

  it('filters the list as you type, and reports the query', async () => {
    const el = await mount();
    const filtered = vi.fn();
    el.addEventListener('kt-filter', filtered);

    input(el).value = 'north';
    input(el).dispatchEvent(new Event('input'));
    await settle(el);

    expect(options(el).map((option) => option.textContent!.trim())).toEqual([
      'North East',
      'North West',
    ]);
    expect(filtered.mock.lastCall![0].detail).toEqual({ query: 'north' });
  });

  it('is a multi-selectable listbox that marks each chosen option', async () => {
    const el = await mount(['sw']);
    expect(list(el).getAttribute('aria-multiselectable')).toBe('true');
    expect(options(el).map((option) => option.getAttribute('aria-selected'))).toEqual([
      'false',
      'true',
      'false',
      'false',
    ]);
  });

  it('tells a screen reader how many are chosen', async () => {
    const el = await mount(['ne', 'sw']);
    const id = input(el).getAttribute('aria-describedby')!;
    expect(el.shadowRoot!.getElementById(id)!.textContent!.trim()).toBe('2 selected');
  });

  it('submits one entry per value under its name, like <select multiple>', async () => {
    const { element, internals } = await formFixture<KtMultiSelect>(
      '<kt-multi-select name="region"></kt-multi-select>',
    );
    expect(internals.setFormValue).toHaveBeenLastCalledWith(null);

    element.options = REGIONS;
    element.value = ['ne', 'nw'];
    await settle(element);

    const data = internals.setFormValue.mock.lastCall![0] as FormData;
    expect(data.getAll('region')).toEqual(['ne', 'nw']);
  });

  it('asks for at least one value when required', async () => {
    const { element, internals } = await formFixture<KtMultiSelect>(
      '<kt-multi-select name="region" required></kt-multi-select>',
    );
    expect(internals.setValidity).toHaveBeenLastCalledWith(
      expect.objectContaining({ valueMissing: true }),
      'Select an option.',
      undefined,
    );

    element.value = ['ne'];
    await settle(element);
    // Valid again: the flags are cleared altogether.
    expect(internals.setValidity).toHaveBeenLastCalledWith({});
  });

  it('goes back to the values it started with when its form resets', async () => {
    // Given its value before it joins the page, as React and Vue set props.
    const el = document.createElement('kt-multi-select');
    el.options = REGIONS;
    el.value = ['ne'];
    document.body.append(el);
    await settle(el);

    el.value = ['ne', 'sw'];
    await settle(el);

    el.formResetCallback();
    await settle(el);
    expect(el.value).toEqual(['ne']);
    el.remove();
  });

  it('neither opens nor removes chips when disabled', async () => {
    const el = await mount(['ne']);
    el.disabled = true;
    await settle(el);
    await open(el);
    expect(list(el).classList.contains('open')).toBe(false);

    await key(el, 'Backspace');
    expect(el.value).toEqual(['ne']);
    expect(chips(el)[0]!.hasAttribute('removable')).toBe(false);
  });
});
