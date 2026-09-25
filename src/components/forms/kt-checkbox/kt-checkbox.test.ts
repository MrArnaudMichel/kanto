import { describe, expect, it, vi } from 'vitest';
import { fixture, formFixture, settle } from '#test/fixture';
import './kt-checkbox.js';
import type { KtCheckbox } from 'kanto-ds';

const input = (el: KtCheckbox) => el.shadowRoot!.querySelector('input')!;

/** Clicks the native checkbox, which toggles it and fires change, as a browser does. */
async function click(el: KtCheckbox) {
  input(el).click();
  await settle(el);
}

describe('kt-checkbox', () => {
  it('is a native checkbox under the drawn box', async () => {
    const el = await fixture<KtCheckbox>('<kt-checkbox>Remember me</kt-checkbox>');

    expect(input(el).type).toBe('checkbox');
    expect(el.shadowRoot!.querySelector('label')!.contains(input(el))).toBe(true);
  });

  it('checks, unchecks and reports it', async () => {
    const el = await fixture<KtCheckbox>('<kt-checkbox>Remember me</kt-checkbox>');
    const changed = vi.fn();
    el.addEventListener('kt-change', changed);

    await click(el);
    expect(el.checked).toBe(true);
    expect(el.hasAttribute('checked')).toBe(true);

    await click(el);
    expect(el.checked).toBe(false);
    expect(changed.mock.calls.map(([e]) => (e as CustomEvent).detail)).toEqual([
      { checked: true },
      { checked: false },
    ]);
  });

  it('shows the indeterminate state, and leaves it on the first click', async () => {
    const el = await fixture<KtCheckbox>('<kt-checkbox indeterminate>Select all</kt-checkbox>');
    expect(input(el).indeterminate).toBe(true);
    expect(el.shadowRoot!.querySelector('kt-icon')!.getAttribute('name')).toBe('minus');

    await click(el);

    expect(el.indeterminate).toBe(false);
    expect(el.checked).toBe(true);
    expect(el.shadowRoot!.querySelector('kt-icon')!.getAttribute('name')).toBe('check');
  });

  it('cannot be changed while disabled', async () => {
    const el = await fixture<KtCheckbox>('<kt-checkbox disabled>Locked</kt-checkbox>');
    expect(input(el).disabled).toBe(true);
  });

  it('takes its accessible name from the label property when nothing is slotted', async () => {
    const el = await fixture<KtCheckbox>('<kt-checkbox label="Select row"></kt-checkbox>');
    expect(input(el).getAttribute('aria-label')).toBe('Select row');
  });

  it('describes itself with its error, outside the label', async () => {
    const el = await fixture<KtCheckbox>(
      '<kt-checkbox error="Accept the terms">Terms</kt-checkbox>',
    );
    const id = input(el).getAttribute('aria-describedby')!;
    const message = el.shadowRoot!.getElementById(id)!;

    expect(input(el).getAttribute('aria-invalid')).toBe('true');
    expect(message.textContent).toBe('Accept the terms');
    expect(el.shadowRoot!.querySelector('label')!.contains(message)).toBe(false);
  });
});

describe('kt-checkbox in a form', () => {
  it('is a form-associated element', () => {
    expect(customElements.get('kt-checkbox')).toHaveProperty('formAssociated', true);
  });

  it('submits its value when checked, and nothing otherwise', async () => {
    const { element, internals } = await formFixture<KtCheckbox>(
      '<kt-checkbox name="terms" value="yes"></kt-checkbox>',
    );
    expect(internals.setFormValue).toHaveBeenLastCalledWith(null);

    await click(element);
    expect(internals.setFormValue).toHaveBeenLastCalledWith('yes');
  });

  it('reports a missing check while required', async () => {
    const { element, internals } = await formFixture<KtCheckbox>(
      '<kt-checkbox required></kt-checkbox>',
    );
    expect(internals.setValidity).toHaveBeenLastCalledWith(
      { valueMissing: true, customError: false },
      'Check this box to continue.',
      undefined,
    );

    await click(element);
    expect(internals.setValidity).toHaveBeenLastCalledWith({});
  });

  it('returns to its initial state on form reset', async () => {
    const el = await fixture<KtCheckbox>('<kt-checkbox checked></kt-checkbox>');
    await click(el);
    el.indeterminate = true;

    el.formResetCallback();
    await settle(el);

    expect(el.checked).toBe(true);
    expect(el.indeterminate).toBe(false);
  });

  it('takes the state the browser restores', async () => {
    const el = await fixture<KtCheckbox>('<kt-checkbox value="yes"></kt-checkbox>');
    el.formStateRestoreCallback('yes');
    expect(el.checked).toBe(true);
  });
});
