import { describe, expect, it, vi } from 'vitest';
import { fixture, formFixture, settle } from '#test/fixture';
import './kt-number-input.js';
import type { KtNumberInput } from 'kanto-ds';

const field = (el: KtNumberInput) => el.shadowRoot!.querySelector('input')!;
const minus = (el: KtNumberInput) => el.shadowRoot!.querySelector<HTMLButtonElement>('.minus')!;
const plus = (el: KtNumberInput) => el.shadowRoot!.querySelector<HTMLButtonElement>('.plus')!;

async function key(el: KtNumberInput, name: string) {
  field(el).dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true }));
  await settle(el);
}
async function typeIn(el: KtNumberInput, text: string) {
  field(el).value = text;
  field(el).dispatchEvent(new Event('input'));
  field(el).dispatchEvent(new Event('change'));
  field(el).dispatchEvent(new FocusEvent('blur'));
  await settle(el);
}

describe('kt-number-input', () => {
  it('is a spinbutton named by its label, with its bounds', async () => {
    const el = await fixture<KtNumberInput>(
      '<kt-number-input label="Seats" min="1" max="50" value="5"></kt-number-input>',
    );
    const input = field(el);
    expect(input.getAttribute('role')).toBe('spinbutton');
    expect(input.getAttribute('aria-label')).toBe('Seats');
    expect(input.getAttribute('aria-valuemin')).toBe('1');
    expect(input.getAttribute('aria-valuemax')).toBe('50');
    expect(input.getAttribute('aria-valuenow')).toBe('5');
    expect(input.getAttribute('inputmode')).toBe('decimal');
  });

  it('steps with its buttons, and stops them at its bounds', async () => {
    const el = await fixture<KtNumberInput>(
      '<kt-number-input min="0" max="2" value="1"></kt-number-input>',
    );
    const changed = vi.fn();
    el.addEventListener('kt-change', changed);
    plus(el).click();
    await settle(el);
    expect(el.value).toBe(2);
    expect(plus(el).disabled).toBe(true);
    expect(changed.mock.calls[0]![0].detail).toEqual({ value: 2 });
    minus(el).click();
    minus(el).click();
    await settle(el);
    expect(el.value).toBe(0);
    expect(minus(el).disabled).toBe(true);
  });

  it('steps with the arrows, by ten with Page Up and Down, to the bounds with Home and End', async () => {
    const el = await fixture<KtNumberInput>(
      '<kt-number-input min="0" max="100" step="2" value="10"></kt-number-input>',
    );
    await key(el, 'ArrowUp');
    expect(el.value).toBe(12);
    await key(el, 'PageDown');
    expect(el.value).toBe(0);
    await key(el, 'End');
    expect(el.value).toBe(100);
  });

  it('reads what is typed when it is left, kept within bounds and on the step', async () => {
    const el = await fixture<KtNumberInput>(
      '<kt-number-input min="0" max="100" step="5" value="10"></kt-number-input>',
    );
    await typeIn(el, '42');
    expect(el.value).toBe(40);
    await typeIn(el, '1000');
    expect(el.value).toBe(100);
  });

  it('reads a number written the way its language writes one', async () => {
    const el = await fixture<KtNumberInput>(
      '<kt-number-input locale="fr-FR" step="0.01"></kt-number-input>',
    );
    await typeIn(el, '1 234,5');
    expect(el.value).toBe(1234.5);
    // French groups with a narrow no-break space.
    expect(field(el).value.replace(/\s/g, ' ')).toBe('1 234,5');
  });

  it('formats its value at rest, through format options', async () => {
    const el = await fixture<KtNumberInput>(
      '<kt-number-input locale="en-US" value="1200"></kt-number-input>',
    );
    el.formatOptions = { style: 'currency', currency: 'USD', maximumFractionDigits: 0 };
    await settle(el);
    expect(field(el).value).toBe('$1,200');
    expect(field(el).getAttribute('aria-valuetext')).toBe('$1,200');
  });

  it('can be emptied, unless required', async () => {
    const el = await fixture<KtNumberInput>('<kt-number-input value="3"></kt-number-input>');
    await typeIn(el, '');
    expect(el.value).toBeNull();
  });

  it('puts back what it had when the text is not a number', async () => {
    const el = await fixture<KtNumberInput>('<kt-number-input value="3"></kt-number-input>');
    await typeIn(el, 'abc');
    expect(el.value).toBe(3);
    expect(field(el).value).toBe('3');
  });
});

describe('kt-number-input in error', () => {
  it('says its error to a screen reader, through the field', async () => {
    const el = await fixture<KtNumberInput>(
      '<kt-number-input value="3" error="Too many seats"></kt-number-input>',
    );
    const input = field(el);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(
      el.shadowRoot!.getElementById(input.getAttribute('aria-describedby')!)!.textContent,
    ).toBe('Too many seats');
  });
});

describe('kt-number-input in a form', () => {
  it('submits its number, and nothing while empty', async () => {
    const { element, internals } = await formFixture<KtNumberInput>(
      '<kt-number-input name="seats" value="5"></kt-number-input>',
    );
    expect(internals.setFormValue).toHaveBeenLastCalledWith('5');
    element.value = null;
    await settle(element);
    expect(internals.setFormValue).toHaveBeenLastCalledWith(null);
  });

  it('asks for a number while required', async () => {
    const { internals } = await formFixture<KtNumberInput>(
      '<kt-number-input name="seats" required></kt-number-input>',
    );
    expect(internals.setValidity).toHaveBeenLastCalledWith(
      expect.objectContaining({ valueMissing: true }),
      'Enter a number.',
      undefined,
    );
  });
});
