import { describe, expect, it, vi } from 'vitest';
import { fixture, settle } from '#test/fixture';
import './kt-input.js';
import type { KtInput } from 'kanto-ds';

const field = (el: KtInput) => el.shadowRoot!.querySelector('.field')!;
const control = (el: KtInput) => el.shadowRoot!.querySelector('input')!;
const button = (el: KtInput, label: string) =>
  el.shadowRoot!.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);

/** Types into the inner input the way a user would. */
async function type(el: KtInput, text: string) {
  control(el).value = text;
  control(el).dispatchEvent(new Event('input', { bubbles: true }));
  await settle(el);
}

describe('kt-input', () => {
  it('seeds the control from the value attribute', async () => {
    const el = await fixture<KtInput>('<kt-input value="Kanto"></kt-input>');
    expect(control(el).value).toBe('Kanto');
  });

  it('emits kt-input on each keystroke and kt-change on commit', async () => {
    const el = await fixture<KtInput>('<kt-input></kt-input>');
    const inputs: string[] = [];
    const changes: string[] = [];
    el.addEventListener('kt-input', (e) =>
      inputs.push((e as CustomEvent<{ value: string }>).detail.value),
    );
    el.addEventListener('kt-change', (e) =>
      changes.push((e as CustomEvent<{ value: string }>).detail.value),
    );

    await type(el, 'ab');
    expect(inputs).toEqual(['ab']);
    expect(el.value).toBe('ab');
    expect(changes).toEqual([]);

    control(el).dispatchEvent(new Event('change', { bubbles: true }));
    expect(changes).toEqual(['ab']);
  });

  it('does not let the inner change event escape unlabelled', async () => {
    const el = await fixture<KtInput>('<kt-input></kt-input>');
    const native = vi.fn();
    el.addEventListener('change', native);

    control(el).dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    expect(native).not.toHaveBeenCalled();
  });

  it('shows the clear button only when there is something to clear', async () => {
    const el = await fixture<KtInput>('<kt-input></kt-input>');
    expect(button(el, 'Clear')).toBeNull();

    await type(el, 'x');
    expect(button(el, 'Clear')).not.toBeNull();

    el.readonly = true;
    await settle(el);
    expect(button(el, 'Clear')).toBeNull();
  });

  it('clears the value and announces it', async () => {
    const el = await fixture<KtInput>('<kt-input value="Kanto"></kt-input>');
    const cleared = vi.fn();
    el.addEventListener('kt-clear', cleared);

    button(el, 'Clear')!.click();
    await settle(el);

    expect(el.value).toBe('');
    expect(control(el).value).toBe('');
    expect(cleared).toHaveBeenCalledOnce();
  });

  it('toggles password visibility without changing the value', async () => {
    const el = await fixture<KtInput>('<kt-input type="password" value="secret"></kt-input>');
    expect(control(el).type).toBe('password');

    button(el, 'Show password')!.click();
    await settle(el);

    expect(control(el).type).toBe('text');
    expect(el.value).toBe('secret');
    expect(button(el, 'Hide password')).not.toBeNull();
  });

  it('marks the field invalid and shows the alert icon on error', async () => {
    const el = await fixture<KtInput>('<kt-input error="Invalid address"></kt-input>');

    expect(field(el).classList.contains('error')).toBe(true);
    expect(control(el).getAttribute('aria-invalid')).toBe('true');
    expect(el.shadowRoot!.querySelector('kt-icon[name="circle-alert"]')).not.toBeNull();
  });

  it('exposes no clear button and no pointer events when disabled', async () => {
    const el = await fixture<KtInput>('<kt-input value="x" disabled></kt-input>');
    expect(control(el).disabled).toBe(true);
    expect(button(el, 'Clear')).toBeNull();
    expect(field(el).classList.contains('disabled')).toBe(true);
  });

  it('restores the seeded value when the form resets', async () => {
    const el = await fixture<KtInput>('<kt-input value="initial"></kt-input>');
    await type(el, 'edited');
    expect(el.value).toBe('edited');

    el.formResetCallback();
    await settle(el);

    expect(el.value).toBe('initial');
    expect(control(el).value).toBe('initial');
  });

  it('applies the size class', async () => {
    const el = await fixture<KtInput>('<kt-input size="large"></kt-input>');
    expect(field(el).classList.contains('large')).toBe(true);
  });
});

describe('kt-input in phone mode', () => {
  const picker = (el: KtInput) => el.shadowRoot!.querySelector<HTMLButtonElement>('.country')!;
  const options = (el: KtInput) => [
    ...el.shadowRoot!.querySelectorAll<HTMLElement>('.country-item'),
  ];

  it('shows the country picker only for type="tel"', async () => {
    const text = await fixture<KtInput>('<kt-input></kt-input>');
    expect(text.shadowRoot!.querySelector('.country')).toBeNull();

    const phone = await fixture<KtInput>('<kt-input type="tel"></kt-input>');
    expect(picker(phone).textContent).toContain('+1');
  });

  it('no longer guesses phone mode from the placeholder or the name', async () => {
    const el = await fixture<KtInput>('<kt-input name="telephone" placeholder="Phone"></kt-input>');
    expect(el.shadowRoot!.querySelector('.country')).toBeNull();
  });

  it('stores digits and displays them grouped', async () => {
    const el = await fixture<KtInput>('<kt-input type="tel"></kt-input>');
    await type(el, '(415) 555-24');

    expect(el.value).toBe('41555524');
    expect(control(el).value).toBe('415 555 24');
    expect(control(el).getAttribute('inputmode')).toBe('tel');
  });

  it('groups French numbers as a leading digit then pairs', async () => {
    const el = await fixture<KtInput>('<kt-input type="tel" country="fr"></kt-input>');
    await type(el, '06 12-34');

    expect(el.value).toBe('061234');
    expect(control(el).value).toBe('0 61 23 4');
  });

  it('falls back to the country format as placeholder', async () => {
    const el = await fixture<KtInput>('<kt-input type="tel"></kt-input>');
    expect(control(el).getAttribute('placeholder')).toBe('123-456-7890');
  });

  it('opens, searches and picks a country', async () => {
    const el = await fixture<KtInput>('<kt-input type="tel"></kt-input>');
    const changed = vi.fn();
    el.addEventListener('kt-country-change', changed);

    picker(el).click();
    await settle(el);
    expect(options(el).length).toBeGreaterThan(1);

    const search = el.shadowRoot!.querySelector<HTMLInputElement>('.country-search')!;
    search.value = 'switz';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    await settle(el);
    expect(options(el)).toHaveLength(1);

    options(el)[0]!.click();
    await settle(el);

    expect(el.country).toBe('ch');
    expect(picker(el).textContent).toContain('+41');
    expect(el.shadowRoot!.querySelector('.country-panel')).toBeNull();
    expect(changed).toHaveBeenCalledOnce();
  });

  it('says so when the search matches nothing', async () => {
    const el = await fixture<KtInput>('<kt-input type="tel"></kt-input>');
    picker(el).click();
    await settle(el);

    const search = el.shadowRoot!.querySelector<HTMLInputElement>('.country-search')!;
    search.value = 'atlantis';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    await settle(el);

    expect(options(el)).toHaveLength(0);
    expect(el.shadowRoot!.querySelector('.country-empty')!.textContent).toContain('No country');
  });

  it('closes the panel on Escape and on an outside click', async () => {
    const el = await fixture<KtInput>('<kt-input type="tel"></kt-input>');

    picker(el).click();
    await settle(el);
    el.shadowRoot!.querySelector('.field')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    await settle(el);
    expect(el.shadowRoot!.querySelector('.country-panel')).toBeNull();

    picker(el).click();
    await settle(el);
    document.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
    await settle(el);
    expect(el.shadowRoot!.querySelector('.country-panel')).toBeNull();
  });
});
