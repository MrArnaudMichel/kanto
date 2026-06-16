import { describe, expect, it, vi } from 'vitest';
import { fixture, settle } from '../../test/fixture.js';
import './kt-input.js';
import type { KtInput } from './kt-input.js';

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
    expect(button(el, 'Effacer')).toBeNull();

    await type(el, 'x');
    expect(button(el, 'Effacer')).not.toBeNull();

    el.readonly = true;
    await settle(el);
    expect(button(el, 'Effacer')).toBeNull();
  });

  it('clears the value and announces it', async () => {
    const el = await fixture<KtInput>('<kt-input value="Kanto"></kt-input>');
    const cleared = vi.fn();
    el.addEventListener('kt-clear', cleared);

    button(el, 'Effacer')!.click();
    await settle(el);

    expect(el.value).toBe('');
    expect(control(el).value).toBe('');
    expect(cleared).toHaveBeenCalledOnce();
  });

  it('toggles password visibility without changing the value', async () => {
    const el = await fixture<KtInput>('<kt-input type="password" value="secret"></kt-input>');
    expect(control(el).type).toBe('password');

    button(el, 'Afficher le mot de passe')!.click();
    await settle(el);

    expect(control(el).type).toBe('text');
    expect(el.value).toBe('secret');
    expect(button(el, 'Masquer le mot de passe')).not.toBeNull();
  });

  it('marks the field invalid and shows the alert icon on error', async () => {
    const el = await fixture<KtInput>('<kt-input error="Adresse invalide"></kt-input>');

    expect(field(el).classList.contains('error')).toBe(true);
    expect(control(el).getAttribute('aria-invalid')).toBe('true');
    expect(el.shadowRoot!.querySelector('kt-icon[name="circle-alert"]')).not.toBeNull();
  });

  it('exposes no clear button and no pointer events when disabled', async () => {
    const el = await fixture<KtInput>('<kt-input value="x" disabled></kt-input>');
    expect(control(el).disabled).toBe(true);
    expect(button(el, 'Effacer')).toBeNull();
    expect(field(el).classList.contains('disabled')).toBe(true);
  });

  it('restores the seeded value when the form resets', async () => {
    const el = await fixture<KtInput>('<kt-input value="initial"></kt-input>');
    await type(el, 'modifié');
    expect(el.value).toBe('modifié');

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
