import { describe, expect, it, vi } from 'vitest';
import { fixture, settle } from '#test/fixture';
import './kt-calendar.js';
import type { KtCalendar } from 'kanto-ds';

const $ = (el: KtCalendar, selector: string) =>
  el.shadowRoot!.querySelector<HTMLElement>(selector)!;
const $$ = (el: KtCalendar, selector: string) => [
  ...el.shadowRoot!.querySelectorAll<HTMLElement>(selector),
];
const day = (el: KtCalendar, iso: string) => $(el, `[data-date="${iso}"]`);
const cell = (el: KtCalendar, key: string) => $(el, `[data-key="${key}"]`);
const focusedCell = (el: KtCalendar) => $(el, '.cell[tabindex="0"]');
const focusedDay = (el: KtCalendar) => focusedCell(el).dataset.date;
const headings = (el: KtCalendar) => $$(el, '.heading');

async function mount(markup: string) {
  const el = await fixture<KtCalendar>(markup);
  await settle(el);
  return el;
}

async function key(el: KtCalendar, name: string, init: KeyboardEventInit = {}) {
  $(el, 'table').dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, ...init }));
  await settle(el);
}

async function click(el: KtCalendar, target: HTMLElement) {
  target.click();
  await settle(el);
}

describe('kt-calendar: days', () => {
  it('shows the month of its value, six weeks, the value selected and focusable', async () => {
    const el = await mount('<kt-calendar locale="en-GB" value="2026-09-25"></kt-calendar>');

    expect($$(el, '[role="gridcell"]')).toHaveLength(42);
    expect(day(el, '2026-09-25').getAttribute('aria-selected')).toBe('true');
    expect(focusedDay(el)).toBe('2026-09-25');
  });

  it('starts weeks on the day the locale does', async () => {
    const el = await mount('<kt-calendar locale="fr-FR" value="2026-09-25"></kt-calendar>');
    const monday = new Intl.DateTimeFormat('fr-FR', { weekday: 'long' }).format(
      new Date('2026-09-21T12:00'),
    );
    expect($(el, 'th abbr').getAttribute('title')).toBe(monday);
  });

  it('chooses a day with a click and reports it', async () => {
    const el = await mount('<kt-calendar locale="en-GB" value="2026-09-25"></kt-calendar>');
    const changed = vi.fn();
    el.addEventListener('kt-change', changed);

    await click(el, day(el, '2026-09-10'));

    expect(el.value).toBe('2026-09-10');
    expect((changed.mock.calls[0]![0] as CustomEvent).detail).toEqual({ value: '2026-09-10' });
  });

  it('walks the grid from the keyboard and chooses with Enter', async () => {
    const el = await mount('<kt-calendar locale="en-GB" value="2026-09-25"></kt-calendar>');

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

  it('pages months with the arrows beside the title', async () => {
    const el = await mount('<kt-calendar locale="en-GB" value="2026-09-25"></kt-calendar>');

    await click(el, $$(el, '.nav')[1]!);

    expect(day(el, '2026-10-15').classList.contains('outside')).toBe(false);
    expect($$(el, '.nav')[0]!.getAttribute('aria-label')).toBe('Previous month');
  });

  it('lets days outside min and max be reached but not chosen', async () => {
    const el = await mount(
      '<kt-calendar locale="en-GB" value="2026-09-15" min="2026-09-10" max="2026-09-20"></kt-calendar>',
    );

    expect(day(el, '2026-09-09').getAttribute('aria-disabled')).toBe('true');
    expect(day(el, '2026-09-10').hasAttribute('aria-disabled')).toBe(false);

    await click(el, day(el, '2026-09-21'));
    expect(el.value).toBe('2026-09-15');
  });

  it('opens on the nearest bound when today is out of range', async () => {
    const el = await mount('<kt-calendar locale="en-GB" min="2031-03-10"></kt-calendar>');
    expect(focusedDay(el)).toBe('2031-03-10');
  });

  it('chooses a period in two picks, in either order, reporting once', async () => {
    const el = await mount(
      '<kt-calendar range locale="en-GB" value="2026-09-01/2026-09-02"></kt-calendar>',
    );
    const changed = vi.fn();
    el.addEventListener('kt-change', changed);

    await click(el, day(el, '2026-09-20'));
    expect(changed).not.toHaveBeenCalled();

    await click(el, day(el, '2026-09-05'));
    expect(el.value).toBe('2026-09-05/2026-09-20');
    expect(changed).toHaveBeenCalledTimes(1);
  });

  it('marks the days of a period as one band', async () => {
    const el = await mount(
      '<kt-calendar range locale="en-GB" value="2026-09-05/2026-09-08"></kt-calendar>',
    );

    const band = ['2026-09-05', '2026-09-06', '2026-09-07', '2026-09-08'];
    expect(band.every((iso) => day(el, iso).classList.contains('in-range'))).toBe(true);
    expect(day(el, '2026-09-05').classList.contains('range-start')).toBe(true);
    expect(day(el, '2026-09-08').classList.contains('range-end')).toBe(true);
    expect(day(el, '2026-09-09').classList.contains('in-range')).toBe(false);
  });

  it('moves to a value set from outside', async () => {
    const el = await mount('<kt-calendar locale="en-GB" value="2026-09-25"></kt-calendar>');

    el.value = '2030-02-14';
    await settle(el);

    expect(focusedDay(el)).toBe('2030-02-14');
  });
});

describe('kt-calendar: months and years', () => {
  it('opens the month grid from the month in the title, and returns on a pick', async () => {
    const el = await mount('<kt-calendar locale="en-GB" value="2026-09-25"></kt-calendar>');

    await click(el, headings(el)[0]!);
    expect($$(el, '[role="gridcell"]')).toHaveLength(12);
    expect(cell(el, '2026-9').getAttribute('aria-selected')).toBe('true');

    await click(el, cell(el, '2026-3'));

    expect($$(el, '[role="gridcell"]')).toHaveLength(42);
    expect(focusedDay(el)).toBe('2026-03-25'); // same day, the chosen month
  });

  it('reaches a year far away in three picks', async () => {
    const el = await mount('<kt-calendar locale="en-GB" value="2026-09-25"></kt-calendar>');

    await click(el, headings(el)[1]!); // the year: twelve years
    expect(cell(el, '2026').getAttribute('aria-selected')).toBe('true');

    await click(el, $$(el, '.nav')[0]!); // twelve years back
    await click(el, $$(el, '.nav')[0]!); // and twelve more
    await click(el, cell(el, '1996')); // → the months of 1996
    await click(el, cell(el, '1996-2')); // → the days of February 1996

    expect(focusedDay(el)).toBe('1996-02-25');
  });

  it('walks months and years from the keyboard', async () => {
    const el = await mount('<kt-calendar locale="en-GB" value="2026-09-25"></kt-calendar>');
    await click(el, headings(el)[0]!);

    await key(el, 'ArrowRight');
    expect(focusedCell(el).dataset.key).toBe('2026-10');
    await key(el, 'ArrowDown');
    expect(focusedCell(el).dataset.key).toBe('2027-1');
    await key(el, 'PageUp');
    expect(focusedCell(el).dataset.key).toBe('2026-1');

    await key(el, 'Enter');
    expect(focusedDay(el)).toBe('2026-01-25');
  });

  it('goes back to the days with Escape, without letting it out', async () => {
    const el = await mount('<kt-calendar locale="en-GB" value="2026-09-25"></kt-calendar>');
    const outside = vi.fn();
    el.addEventListener('keydown', outside);
    await click(el, headings(el)[1]!);

    await key(el, 'Escape');

    expect($$(el, '[role="gridcell"]')).toHaveLength(42);
    expect(outside).not.toHaveBeenCalled();
  });

  it('disables months and years wholly outside min and max', async () => {
    const el = await mount(
      '<kt-calendar locale="en-GB" value="2026-09-25" min="2026-03-15" max="2027-06-01"></kt-calendar>',
    );

    await click(el, headings(el)[0]!);
    expect(cell(el, '2026-2').getAttribute('aria-disabled')).toBe('true');
    expect(cell(el, '2026-3').hasAttribute('aria-disabled')).toBe(false);

    await click(el, headings(el)[0]!); // the year, in the month view
    expect(cell(el, '2025').getAttribute('aria-disabled')).toBe('true');
    expect(cell(el, '2027').hasAttribute('aria-disabled')).toBe(false);
  });
});
