import { describe, expect, it, vi } from 'vitest';
import { fixture, formFixture, settle } from '#test/fixture';
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

  it('shows the error message in a tooltip on the alert icon', async () => {
    const el = await fixture<KtInput>('<kt-input error="Invalid address"></kt-input>');

    const tooltip = el.shadowRoot!.querySelector('kt-tooltip')!;
    expect(tooltip.text).toBe('Invalid address');
    expect(tooltip.querySelector('kt-icon[name="circle-alert"]')).not.toBeNull();
  });

  it('describes the control with its error message', async () => {
    const el = await fixture<KtInput>('<kt-input error="Enter an email."></kt-input>');

    const id = control(el).getAttribute('aria-describedby');
    expect(id).toBeTruthy();
    expect(el.shadowRoot!.getElementById(id!)!.textContent).toBe('Enter an email.');
    // An id reference, never the message itself: that used to be read as a
    // list of three ids that do not exist.
    expect(control(el).hasAttribute('aria-errormessage')).toBe(false);

    el.error = '';
    await settle(el);
    expect(control(el).hasAttribute('aria-describedby')).toBe(false);
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

  it('submits the full international number as the user types', async () => {
    const { element, internals } = await formFixture<KtInput>(
      '<kt-input type="tel" country="fr" value="612345678"></kt-input>',
    );
    expect(internals.setFormValue.mock.lastCall?.[0]).toBe('+33612345678');

    await type(element, '6 99 99 99 99');
    expect(internals.setFormValue.mock.lastCall?.[0]).toBe('+33699999999');
  });

  it('submits the new dialling code when the country changes', async () => {
    const { element, internals } = await formFixture<KtInput>(
      '<kt-input type="tel" country="fr" value="612345678"></kt-input>',
    );
    element.country = 'be';
    await settle(element);

    expect(internals.setFormValue.mock.lastCall?.[0]).toBe('+32612345678');
  });

  it('restores the digits and the country the browser saved', async () => {
    const { internals } = await formFixture<KtInput>(
      '<kt-input type="tel" country="fr" value="612345678"></kt-input>',
    );
    const saved = internals.setFormValue.mock.lastCall?.[1] as string;

    const restored = await fixture<KtInput>('<kt-input type="tel"></kt-input>');
    restored.formStateRestoreCallback(saved);
    await settle(restored);

    expect(restored.value).toBe('612345678');
    expect(restored.country).toBe('fr');
  });

  it('flags a number typed with the trunk prefix', async () => {
    const el = await fixture<KtInput>('<kt-input type="tel" country="fr"></kt-input>');
    await type(el, '06 12 34 56 78');

    expect(field(el).classList.contains('error')).toBe(true);
    expect(control(el).getAttribute('aria-invalid')).toBe('true');
    const id = control(el).getAttribute('aria-describedby')!;
    expect(el.shadowRoot!.getElementById(id)!.textContent).toBe(
      'Enter the number without the leading 0.',
    );
    expect(el.shadowRoot!.querySelector('kt-tooltip')!.text).toBe(
      'Enter the number without the leading 0.',
    );
  });

  it('reports the trunk prefix to the form as a pattern mismatch', async () => {
    const { internals } = await formFixture<KtInput>(
      '<kt-input type="tel" country="fr" value="0612345678"></kt-input>',
    );
    expect(internals.setValidity).toHaveBeenLastCalledWith(
      expect.objectContaining({ patternMismatch: true }),
      'Enter the number without the leading 0.',
      undefined,
    );
  });

  it('clears the error once the prefix is gone', async () => {
    const el = await fixture<KtInput>('<kt-input type="tel" country="fr" value="0612"></kt-input>');
    await type(el, '612');

    expect(field(el).classList.contains('error')).toBe(false);
    expect(el.shadowRoot!.querySelector('kt-tooltip')).toBeNull();
  });

  it('accepts a leading 0 where it belongs to the number', async () => {
    const el = await fixture<KtInput>(
      '<kt-input type="tel" country="it" value="0612345678"></kt-input>',
    );
    expect(field(el).classList.contains('error')).toBe(false);
  });

  it("lets the application's own error win over the prefix check", async () => {
    const el = await fixture<KtInput>(
      '<kt-input type="tel" country="fr" value="0612" error="Number already in use"></kt-input>',
    );
    expect(el.shadowRoot!.querySelector('kt-tooltip')!.text).toBe('Number already in use');
  });

  it('falls back to the country format as placeholder', async () => {
    const el = await fixture<KtInput>('<kt-input type="tel"></kt-input>');
    expect(control(el).getAttribute('placeholder')).toBe('201-555-0123');
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
