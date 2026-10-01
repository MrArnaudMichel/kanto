import { describe, expect, it, vi } from 'vitest';
import { fixture, formFixture, settle } from '#test/fixture';
import './kt-date-picker.js';
import type { KtDatePicker } from 'kanto-ds';

const $ = (el: KtDatePicker, selector: string) =>
  el.shadowRoot!.querySelector<HTMLElement>(selector)!;
const calendar = (el: KtDatePicker) => el.shadowRoot!.querySelector('kt-calendar')!;
const day = (el: KtDatePicker, iso: string) =>
  calendar(el).shadowRoot!.querySelector<HTMLElement>(`[data-date="${iso}"]`)!;
const medium = (iso: string, locale = 'en-GB') =>
  new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(`${iso}T12:00`));

const input = (el: KtDatePicker) => el.shadowRoot!.querySelector('input')!;

/** Types into the field, as a person would, then presses `key` if given. */
async function type(el: KtDatePicker, text: string, key?: string) {
  input(el).value = text;
  input(el).dispatchEvent(new Event('input', { bubbles: true }));
  if (key) {
    input(el).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, composed: true }));
  }
  await settle(el);
}

async function open(el: KtDatePicker) {
  $(el, '.trigger').click();
  await settle(el);
}

/** Clicks inside the calendar, then lets both elements re-render. */
async function pick(el: KtDatePicker, target: HTMLElement) {
  target.click();
  await settle(calendar(el));
  await settle(el);
}

describe('kt-date-picker', () => {
  it('shows a placeholder while empty, for a day or a period', async () => {
    const single = await fixture<KtDatePicker>('<kt-date-picker locale="en-GB"></kt-date-picker>');
    expect(input(single).placeholder).toBe('Select a date');

    const range = await fixture<KtDatePicker>(
      '<kt-date-picker range locale="en-GB"></kt-date-picker>',
    );
    expect(input(range).placeholder).toBe('Select a period');
  });

  it('shows its ISO value formatted for the locale', async () => {
    const el = await fixture<KtDatePicker>(
      '<kt-date-picker locale="en-GB" value="2026-09-25"></kt-date-picker>',
    );
    expect(input(el).value).toBe(medium('2026-09-25'));
  });

  it('shows a period as one formatted range', async () => {
    const el = await fixture<KtDatePicker>(
      '<kt-date-picker range locale="en-GB" value="2026-09-05/2026-09-08"></kt-date-picker>',
    );
    const expected = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).formatRange(
      new Date('2026-09-05T12:00'),
      new Date('2026-09-08T12:00'),
    );
    expect(input(el).value).toBe(expected);
  });

  it('takes a date typed the way the reader writes it, on Enter', async () => {
    const el = await fixture<KtDatePicker>('<kt-date-picker locale="en-GB"></kt-date-picker>');
    const changed = vi.fn();
    el.addEventListener('kt-change', changed);

    await type(el, '10/09/2026', 'Enter');

    expect(el.value).toBe('2026-09-10');
    expect(changed).toHaveBeenCalledOnce();
    expect(input(el).value).toBe(medium('2026-09-10'));
  });

  it('takes a typed date when the field is left, too', async () => {
    const el = await fixture<KtDatePicker>('<kt-date-picker locale="en-US"></kt-date-picker>');
    await type(el, '9/10/2026');
    input(el).dispatchEvent(new Event('change'));
    await settle(el);

    expect(el.value).toBe('2026-09-10');
  });

  it('takes a typed period', async () => {
    const el = await fixture<KtDatePicker>(
      '<kt-date-picker range locale="en-GB"></kt-date-picker>',
    );
    await type(el, '01/09/2026 – 25/09/2026', 'Enter');
    expect(el.value).toBe('2026-09-01/2026-09-25');
  });

  it('flags text that is not a date, keeping the value it had', async () => {
    const el = await fixture<KtDatePicker>(
      '<kt-date-picker locale="en-GB" value="2026-09-25"></kt-date-picker>',
    );
    await type(el, 'soon', 'Enter');

    expect(el.value).toBe('2026-09-25');
    expect(input(el).getAttribute('aria-invalid')).toBe('true');
    const id = input(el).getAttribute('aria-describedby')!;
    expect(el.shadowRoot!.getElementById(id)!.textContent).toMatch(
      /^Enter a date like \d\d\/\d\d\/\d{4}\.$/,
    );

    // Typing something that reads clears the flag.
    await type(el, '26/09/2026', 'Enter');
    expect(input(el).hasAttribute('aria-invalid')).toBe(false);
  });

  it('turns down a typed date outside min and max', async () => {
    const el = await fixture<KtDatePicker>(
      '<kt-date-picker locale="en-GB" min="2026-01-01"></kt-date-picker>',
    );
    await type(el, '31/12/2025', 'Enter');

    expect(el.value).toBeNull();
    expect(input(el).getAttribute('aria-invalid')).toBe('true');
  });

  it('empties the value when the text is cleared', async () => {
    const el = await fixture<KtDatePicker>(
      '<kt-date-picker locale="en-GB" value="2026-09-25"></kt-date-picker>',
    );
    await type(el, '', 'Enter');
    expect(el.value).toBeNull();
  });

  it('puts the text back on Escape', async () => {
    const el = await fixture<KtDatePicker>(
      '<kt-date-picker locale="en-GB" value="2026-09-25"></kt-date-picker>',
    );
    await type(el, '01/0', 'Escape');

    expect(input(el).value).toBe(medium('2026-09-25'));
    expect(el.value).toBe('2026-09-25');
  });

  it('opens the calendar from ArrowDown in the field', async () => {
    const el = await fixture<KtDatePicker>('<kt-date-picker locale="en-GB"></kt-date-picker>');
    await type(el, '', 'ArrowDown');
    expect($(el, '.trigger').getAttribute('aria-expanded')).toBe('true');
  });

  it('opens a calendar set up like itself', async () => {
    const el = await fixture<KtDatePicker>(
      '<kt-date-picker range locale="fr-FR" min="2026-01-01" max="2026-12-31" value="2026-09-05/2026-09-08"></kt-date-picker>',
    );
    expect(calendar(el)).toBeNull(); // rendered only while open

    await open(el);

    expect($(el, '.trigger').getAttribute('aria-expanded')).toBe('true');
    expect(calendar(el)).toMatchObject({
      value: '2026-09-05/2026-09-08',
      range: true,
      min: '2026-01-01',
      max: '2026-12-31',
      locale: 'fr-FR',
    });
  });

  it('commits a day chosen in the calendar, closes, and reports it once', async () => {
    const el = await fixture<KtDatePicker>(
      '<kt-date-picker locale="en-GB" value="2026-09-25"></kt-date-picker>',
    );
    const changed = vi.fn();
    el.addEventListener('kt-change', changed);
    await open(el);
    await settle(calendar(el));

    await pick(el, day(el, '2026-09-10'));

    expect(el.value).toBe('2026-09-10');
    expect($(el, '.trigger').getAttribute('aria-expanded')).toBe('false');
    // The calendar's own kt-change stops inside: one event, from the picker.
    expect(changed).toHaveBeenCalledTimes(1);
    expect((changed.mock.calls[0]![0] as CustomEvent).target).toBe(el);
  });

  it('commits a period once both ends are chosen', async () => {
    const el = await fixture<KtDatePicker>(
      '<kt-date-picker range locale="en-GB" value="2026-09-01/2026-09-02"></kt-date-picker>',
    );
    await open(el);
    await settle(calendar(el));

    await pick(el, day(el, '2026-09-20'));
    expect($(el, '.trigger').getAttribute('aria-expanded')).toBe('true');

    await pick(el, day(el, '2026-09-05'));
    expect(el.value).toBe('2026-09-05/2026-09-20');
    expect($(el, '.trigger').getAttribute('aria-expanded')).toBe('false');
  });

  it('clears to null with its clear button', async () => {
    const el = await fixture<KtDatePicker>(
      '<kt-date-picker locale="en-GB" value="2026-09-25"></kt-date-picker>',
    );
    const changed = vi.fn();
    el.addEventListener('kt-change', changed);

    $(el, '.clear').click();
    await settle(el);

    expect(el.value).toBeNull();
    expect((changed.mock.calls[0]![0] as CustomEvent).detail).toEqual({ value: null });
  });

  it('closes on Escape from the days', async () => {
    const el = await fixture<KtDatePicker>('<kt-date-picker locale="en-GB"></kt-date-picker>');
    await open(el);

    $(el, '.panel').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await settle(el);

    expect($(el, '.trigger').getAttribute('aria-expanded')).toBe('false');
  });

  it('stays open when Escape only leaves the month and year panel', async () => {
    const el = await fixture<KtDatePicker>(
      '<kt-date-picker locale="en-GB" value="2026-09-25"></kt-date-picker>',
    );
    await open(el);
    await settle(calendar(el));
    calendar(el).shadowRoot!.querySelector<HTMLElement>('.title')!.click();
    await settle(calendar(el));

    calendar(el)
      .shadowRoot!.querySelector('table')!
      .dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }),
      );
    await settle(el);

    expect($(el, '.trigger').getAttribute('aria-expanded')).toBe('true');
  });
});

describe('kt-date-picker in a form', () => {
  it('is a form-associated element', () => {
    expect(customElements.get('kt-date-picker')).toHaveProperty('formAssociated', true);
  });

  it('submits the ISO value, and nothing for an incomplete period', async () => {
    const { element, internals } = await formFixture<KtDatePicker>(
      '<kt-date-picker name="due" value="2026-09-25"></kt-date-picker>',
    );
    expect(internals.setFormValue).toHaveBeenLastCalledWith('2026-09-25');

    element.range = true;
    element.value = '2026-09-25';
    await settle(element);
    expect(internals.setFormValue).toHaveBeenLastCalledWith(null);

    element.value = '2026-09-01/2026-09-25';
    await settle(element);
    expect(internals.setFormValue).toHaveBeenLastCalledWith('2026-09-01/2026-09-25');
  });

  it('reports a missing date while required', async () => {
    const { element, internals } = await formFixture<KtDatePicker>(
      '<kt-date-picker required></kt-date-picker>',
    );
    expect(internals.setValidity).toHaveBeenLastCalledWith(
      { valueMissing: true, badInput: false, customError: false },
      'Select a date.',
      undefined,
    );

    element.value = '2026-09-25';
    await settle(element);
    expect(internals.setValidity).toHaveBeenLastCalledWith({});
  });

  it('returns to its initial value on form reset', async () => {
    const el = await fixture<KtDatePicker>('<kt-date-picker value="2026-09-25"></kt-date-picker>');
    el.value = '2026-01-01';
    await settle(el);

    el.formResetCallback();
    await settle(el);

    expect(el.value).toBe('2026-09-25');
  });
});
