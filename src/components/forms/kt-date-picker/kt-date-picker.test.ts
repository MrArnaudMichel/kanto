import { describe, expect, it, vi } from 'vitest';
import { fixture, formFixture, settle } from '#test/fixture';
import './kt-date-picker.js';
import type { KtDatePicker } from 'kanto-ds';

const $ = (el: KtDatePicker, selector: string) =>
  el.shadowRoot!.querySelector<HTMLElement>(selector)!;
const $$ = (el: KtDatePicker, selector: string) => [
  ...el.shadowRoot!.querySelectorAll<HTMLElement>(selector),
];
const day = (el: KtDatePicker, iso: string) => $(el, `[data-date="${iso}"]`);
const focusedDay = (el: KtDatePicker) => $(el, '.day[tabindex="0"]').dataset.date;
const medium = (iso: string, locale = 'en-GB') =>
  new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(`${iso}T12:00`));

async function open(el: KtDatePicker) {
  $(el, '.trigger').click();
  await settle(el);
}

async function key(el: KtDatePicker, name: string, init: KeyboardEventInit = {}) {
  $(el, 'table').dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, ...init }));
  await settle(el);
}

describe('kt-date-picker', () => {
  it('shows a placeholder while empty, for a day or a period', async () => {
    const single = await fixture<KtDatePicker>('<kt-date-picker locale="en-GB"></kt-date-picker>');
    expect($(single, '.value').textContent!.trim()).toBe('Select a date');

    const range = await fixture<KtDatePicker>(
      '<kt-date-picker range locale="en-GB"></kt-date-picker>',
    );
    expect($(range, '.value').textContent!.trim()).toBe('Select a period');
  });

  it('shows its ISO value formatted for the locale', async () => {
    const el = await fixture<KtDatePicker>(
      '<kt-date-picker locale="en-GB" value="2026-09-25"></kt-date-picker>',
    );
    expect($(el, '.value').textContent!.trim()).toBe(medium('2026-09-25'));
  });

  it('opens on the month of its value, with the value selected and focusable', async () => {
    const el = await fixture<KtDatePicker>(
      '<kt-date-picker locale="en-GB" value="2026-09-25"></kt-date-picker>',
    );
    await open(el);

    expect($(el, '.trigger').getAttribute('aria-expanded')).toBe('true');
    expect($$(el, '.day')).toHaveLength(42);
    expect(day(el, '2026-09-25').getAttribute('aria-selected')).toBe('true');
    expect(focusedDay(el)).toBe('2026-09-25');
    expect($(el, '.title').textContent).toContain('2026');
  });

  it('starts weeks on the day the locale does', async () => {
    const el = await fixture<KtDatePicker>(
      '<kt-date-picker locale="fr-FR" value="2026-09-25"></kt-date-picker>',
    );
    await open(el);

    const monday = new Intl.DateTimeFormat('fr-FR', { weekday: 'long' }).format(
      new Date('2026-09-21T12:00'),
    );
    expect($(el, 'th abbr').getAttribute('title')).toBe(monday);
  });

  it('chooses a day with a click, closes and reports it', async () => {
    const el = await fixture<KtDatePicker>(
      '<kt-date-picker locale="en-GB" value="2026-09-25"></kt-date-picker>',
    );
    const changed = vi.fn();
    el.addEventListener('kt-change', changed);
    await open(el);

    day(el, '2026-09-10').click();
    await settle(el);

    expect(el.value).toBe('2026-09-10');
    expect($(el, '.trigger').getAttribute('aria-expanded')).toBe('false');
    expect((changed.mock.calls[0]![0] as CustomEvent).detail).toEqual({ value: '2026-09-10' });
  });

  it('walks the grid from the keyboard and chooses with Enter', async () => {
    const el = await fixture<KtDatePicker>(
      '<kt-date-picker locale="en-GB" value="2026-09-25"></kt-date-picker>',
    );
    await open(el);

    await key(el, 'ArrowRight');
    expect(focusedDay(el)).toBe('2026-09-26');
    await key(el, 'ArrowDown');
    expect(focusedDay(el)).toBe('2026-10-03');
    await key(el, 'PageUp');
    expect(focusedDay(el)).toBe('2026-09-03');
    await key(el, 'PageDown', { shiftKey: true });
    expect(focusedDay(el)).toBe('2027-09-03');
    await key(el, 'Home');
    expect(focusedDay(el)).toBe('2027-08-30'); // the Monday of that week
    await key(el, 'End');
    expect(focusedDay(el)).toBe('2027-09-05');

    await key(el, 'Enter');
    expect(el.value).toBe('2027-09-05');
  });

  it('pages months with the header buttons', async () => {
    const el = await fixture<KtDatePicker>(
      '<kt-date-picker locale="en-GB" value="2026-09-25"></kt-date-picker>',
    );
    await open(el);

    $$(el, '.nav')[1]!.click();
    await settle(el);

    expect(day(el, '2026-10-15').classList.contains('outside')).toBe(false);
    expect($$(el, '.nav')[0]!.getAttribute('aria-label')).toBe('Previous month');
  });

  it('lets days outside min and max be reached but not chosen', async () => {
    const el = await fixture<KtDatePicker>(
      '<kt-date-picker locale="en-GB" value="2026-09-15" min="2026-09-10" max="2026-09-20"></kt-date-picker>',
    );
    await open(el);

    expect(day(el, '2026-09-09').getAttribute('aria-disabled')).toBe('true');
    expect(day(el, '2026-09-10').hasAttribute('aria-disabled')).toBe(false);

    day(el, '2026-09-21').click();
    await settle(el);
    expect(el.value).toBe('2026-09-15');
  });

  it('chooses a period in two picks, in either order', async () => {
    const el = await fixture<KtDatePicker>(
      '<kt-date-picker range locale="en-GB"></kt-date-picker>',
    );
    const changed = vi.fn();
    el.addEventListener('kt-change', changed);
    el.value = '2026-09-01/2026-09-02';
    await settle(el);
    await open(el);

    day(el, '2026-09-20').click();
    await settle(el);
    expect(changed).not.toHaveBeenCalled(); // still open for the second end

    day(el, '2026-09-05').click();
    await settle(el);

    expect(el.value).toBe('2026-09-05/2026-09-20');
    expect(changed).toHaveBeenCalledTimes(1);
  });

  it('marks the days of a period as one band', async () => {
    const el = await fixture<KtDatePicker>(
      '<kt-date-picker range locale="en-GB" value="2026-09-05/2026-09-08"></kt-date-picker>',
    );
    await open(el);

    const band = ['2026-09-05', '2026-09-06', '2026-09-07', '2026-09-08'];
    expect(band.every((iso) => day(el, iso).classList.contains('in-range'))).toBe(true);
    expect(day(el, '2026-09-05').classList.contains('range-start')).toBe(true);
    expect(day(el, '2026-09-08').classList.contains('range-end')).toBe(true);
    expect(day(el, '2026-09-09').classList.contains('in-range')).toBe(false);
  });

  it('shows a period as one formatted range', async () => {
    const el = await fixture<KtDatePicker>(
      '<kt-date-picker range locale="en-GB" value="2026-09-05/2026-09-08"></kt-date-picker>',
    );
    const expected = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).formatRange(
      new Date('2026-09-05T12:00'),
      new Date('2026-09-08T12:00'),
    );
    expect($(el, '.value').textContent!.trim()).toBe(expected);
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

  it('closes on Escape', async () => {
    const el = await fixture<KtDatePicker>('<kt-date-picker locale="en-GB"></kt-date-picker>');
    await open(el);

    $(el, '.panel').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await settle(el);

    expect($(el, '.trigger').getAttribute('aria-expanded')).toBe('false');
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
      { valueMissing: true, customError: false },
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
