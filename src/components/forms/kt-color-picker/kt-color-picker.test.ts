import { describe, expect, it, vi } from 'vitest';
import { fixture, formFixture, settle } from '#test/fixture';
import './kt-color-picker.js';
import type { KtColorPicker } from 'kanto-ds';

const SWATCHES = [
  { value: '#5f5dea', label: 'Violet' },
  { value: '#1f6feb', label: 'Blue' },
  { value: '#0f9488', label: 'Teal' },
];

async function mount(
  markup = '<kt-color-picker label="Accent" value="#1f6feb"></kt-color-picker>',
) {
  const el = await fixture<KtColorPicker>(markup);
  el.swatches = SWATCHES;
  await settle(el);
  return el;
}

const radios = (el: KtColorPicker) => [
  ...el.shadowRoot!.querySelectorAll<HTMLElement>('[role="radio"]'),
];
const hex = (el: KtColorPicker) => el.shadowRoot!.querySelector<HTMLInputElement>('input.hex')!;
const native = (el: KtColorPicker) =>
  el.shadowRoot!.querySelector<HTMLInputElement>('input[type="color"]')!;

describe('kt-color-picker', () => {
  it('is a named group of swatches, each a radio named after its colour', async () => {
    const el = await mount();
    expect(el.shadowRoot!.querySelector('[role="radiogroup"]')!.getAttribute('aria-label')).toBe(
      'Accent',
    );
    expect(radios(el).map((radio) => radio.getAttribute('aria-label'))).toEqual([
      'Violet',
      'Blue',
      'Teal',
    ]);
    expect(radios(el).map((radio) => radio.getAttribute('aria-checked'))).toEqual([
      'false',
      'true',
      'false',
    ]);
    expect(radios(el).map((radio) => radio.tabIndex)).toEqual([-1, 0, -1]);
  });

  it('picks a swatch on a click, and says so', async () => {
    const el = await mount();
    const changed = vi.fn();
    el.addEventListener('kt-change', changed);
    radios(el)[2]!.click();
    await settle(el);
    expect(el.value).toBe('#0f9488');
    expect(changed.mock.calls[0]![0].detail).toEqual({ value: '#0f9488' });
  });

  it('moves and picks with the arrows, wrapping', async () => {
    const el = await mount();
    radios(el)[1]!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    await settle(el);
    expect(el.value).toBe('#0f9488');
    radios(el)[2]!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    await settle(el);
    expect(el.value).toBe('#5f5dea');
  });

  it('takes any colour from the hex field, once it is a whole one', async () => {
    const el = await mount();
    hex(el).value = '#e11d4';
    hex(el).dispatchEvent(new Event('input'));
    await settle(el);
    expect(el.value).toBe('#1f6feb');
    hex(el).value = 'E11D48';
    hex(el).dispatchEvent(new Event('input'));
    await settle(el);
    expect(el.value).toBe('#e11d48');
    expect(radios(el).every((radio) => radio.getAttribute('aria-checked') === 'false')).toBe(true);
  });

  it('takes it from the system picker too', async () => {
    const el = await mount();
    native(el).value = '#22c55e';
    native(el).dispatchEvent(new Event('input'));
    await settle(el);
    expect(el.value).toBe('#22c55e');
  });

  it('leaves the free colour out with no-custom', async () => {
    const el = await mount('<kt-color-picker no-custom></kt-color-picker>');
    expect(el.shadowRoot!.querySelector('input.hex')).toBeNull();
    expect(el.shadowRoot!.querySelector('input[type="color"]')).toBeNull();
  });

  it('has Kanto’s accents for swatches until given others', async () => {
    const el = await fixture<KtColorPicker>('<kt-color-picker></kt-color-picker>');
    expect(radios(el).length).toBeGreaterThanOrEqual(5);
  });

  it('is a form control', async () => {
    const { element, internals } = await formFixture<KtColorPicker>(
      '<kt-color-picker name="accent" value="#1f6feb"></kt-color-picker>',
    );
    expect(internals.setFormValue).toHaveBeenLastCalledWith('#1f6feb');
    element.value = '#0f9488';
    await settle(element);
    element.formResetCallback();
    await settle(element);
    expect(element.value).toBe('#1f6feb');
  });
});
