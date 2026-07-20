import { describe, expect, it, vi } from 'vitest';
import { fixture, settle } from '../../test/fixture.js';
import './kt-textarea.js';
import type { KtTextarea } from './kt-textarea.js';

const control = (el: KtTextarea) => el.shadowRoot!.querySelector('textarea')!;
const counter = (el: KtTextarea) => el.shadowRoot!.querySelector('.counter');

async function type(el: KtTextarea, text: string) {
  control(el).value = text;
  control(el).dispatchEvent(new Event('input', { bubbles: true }));
  await settle(el);
}

describe('kt-textarea', () => {
  it('seeds the control and reports keystrokes', async () => {
    const el = await fixture<KtTextarea>('<kt-textarea value="Hello"></kt-textarea>');
    expect(control(el).value).toBe('Hello');

    const listener = vi.fn();
    el.addEventListener('kt-input', listener);
    await type(el, 'Good evening');

    expect(el.value).toBe('Good evening');
    expect(listener).toHaveBeenCalledOnce();
  });

  it('re-emits change as kt-change and keeps the native one inside', async () => {
    const el = await fixture<KtTextarea>('<kt-textarea></kt-textarea>');
    const native = vi.fn();
    const retargeted = vi.fn();
    el.addEventListener('change', native);
    el.addEventListener('kt-change', retargeted);

    control(el).dispatchEvent(new Event('change', { bubbles: true, composed: true }));

    expect(native).not.toHaveBeenCalled();
    expect(retargeted).toHaveBeenCalledOnce();
  });

  it('shows no counter until maxlength is set', async () => {
    const el = await fixture<KtTextarea>('<kt-textarea></kt-textarea>');
    expect(counter(el)).toBeNull();

    el.maxlength = 10;
    await settle(el);
    expect(counter(el)!.textContent!.replace(/\s+/g, ' ').trim()).toBe('0 / 10');
  });

  it('turns the counter red at the limit', async () => {
    const el = await fixture<KtTextarea>('<kt-textarea maxlength="3"></kt-textarea>');
    expect(counter(el)!.classList.contains('at-limit')).toBe(false);

    await type(el, 'abc');
    expect(counter(el)!.classList.contains('at-limit')).toBe(true);
  });

  it('shows the alert icon and marks the control invalid on error', async () => {
    const el = await fixture<KtTextarea>('<kt-textarea error="Too short"></kt-textarea>');
    expect(control(el).getAttribute('aria-invalid')).toBe('true');
    expect(el.shadowRoot!.querySelector('kt-icon[name="circle-alert"]')).not.toBeNull();
  });

  it('restores the seeded value on form reset', async () => {
    const el = await fixture<KtTextarea>('<kt-textarea value="initial"></kt-textarea>');
    await type(el, 'edited');
    el.formResetCallback();
    await settle(el);

    expect(control(el).value).toBe('initial');
  });
});
