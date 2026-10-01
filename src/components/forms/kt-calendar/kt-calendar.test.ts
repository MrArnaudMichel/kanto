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
const title = (el: KtCalendar) => $(el, '.title');
const years = (el: KtCalendar) => $(el, '[role="listbox"]');
const year = (el: KtCalendar, value: number) => $(el, `[role="option"][data-year="${value}"]`);
const selectedYear = (el: KtCalendar) =>
  $(el, '[role="option"][aria-selected="true"]').dataset.year;

async function mount(markup: string) {
  const el = await fixture<KtCalendar>(markup);
  await settle(el);
  return el;
}

async function key(el: KtCalendar, name: string, init: KeyboardEventInit = {}) {
  $(el, 'table').dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, ...init }));
  await settle(el);
}

async function yearKey(el: KtCalendar, name: string) {
  years(el).dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true }));
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

  it('makes its date formats once, not once per day per render', async () => {
    const el = await mount('<kt-calendar value="2026-09-14" locale="fr"></kt-calendar>');
    const made = vi.spyOn(Intl, 'DateTimeFormat');
    try {
      // Moving through the month re-renders all forty-two days.
      await key(el, 'ArrowRight');
      await key(el, 'ArrowDown');
      expect(made).not.toHaveBeenCalled();
    } finally {
      made.mockRestore();
    }
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

describe('kt-calendar: month and year', () => {
  it('opens one panel of years and months from the title, and returns on a month', async () => {
    const el = await mount('<kt-calendar locale="en-GB" value="2026-09-25"></kt-calendar>');

    await click(el, title(el));
    expect(title(el).getAttribute('aria-expanded')).toBe('true');
    expect(selectedYear(el)).toBe('2026');
    expect($$(el, '[role="gridcell"]')).toHaveLength(12);
    expect(cell(el, '2026-9').getAttribute('aria-selected')).toBe('true');

    await click(el, cell(el, '2026-3'));

    expect($$(el, '[role="gridcell"]')).toHaveLength(42);
    expect(focusedDay(el)).toBe('2026-03-25'); // same day, the chosen month
  });

  it('changes the year from its list without leaving the panel', async () => {
    const el = await mount('<kt-calendar locale="en-GB" value="2026-09-25"></kt-calendar>');
    await click(el, title(el));

    await click(el, year(el, 1990));
    expect(selectedYear(el)).toBe('1990');
    expect(cell(el, '1990-6')).not.toBeNull();

    await click(el, cell(el, '1990-6'));
    expect(focusedDay(el)).toBe('1990-06-25');
  });

  it('jumps to a year typed on the keyboard', async () => {
    const el = await mount('<kt-calendar locale="en-GB" value="2026-09-25"></kt-calendar>');
    await click(el, title(el));

    for (const digit of '1987') await yearKey(el, digit);

    expect(selectedYear(el)).toBe('1987');
  });

  it('walks the years with the arrows, ten at a time with Page Up and Down', async () => {
    const el = await mount('<kt-calendar locale="en-GB" value="2026-09-25"></kt-calendar>');
    await click(el, title(el));

    await yearKey(el, 'ArrowUp');
    expect(selectedYear(el)).toBe('2025');
    await yearKey(el, 'PageUp');
    expect(selectedYear(el)).toBe('2015');
    await yearKey(el, 'ArrowDown');
    expect(selectedYear(el)).toBe('2016');
  });

  it('walks the months from the keyboard and returns to the days with Enter', async () => {
    const el = await mount('<kt-calendar locale="en-GB" value="2026-09-25"></kt-calendar>');
    await click(el, title(el));

    await key(el, 'ArrowRight');
    expect(focusedCell(el).dataset.key).toBe('2026-10');
    await key(el, 'ArrowDown');
    expect(focusedCell(el).dataset.key).toBe('2027-1');

    await key(el, 'Enter');
    expect(focusedDay(el)).toBe('2027-01-25');
  });

  it('goes back to the days with Escape, without letting it out', async () => {
    const el = await mount('<kt-calendar locale="en-GB" value="2026-09-25"></kt-calendar>');
    const outside = vi.fn();
    el.addEventListener('keydown', outside);
    await click(el, title(el));

    await yearKey(el, 'Escape');

    expect($$(el, '[role="gridcell"]')).toHaveLength(42);
    expect(outside).not.toHaveBeenCalled();
  });

  it('lists only the years within min and max, and disables months wholly outside', async () => {
    const el = await mount(
      '<kt-calendar locale="en-GB" value="2026-09-25" min="2026-03-15" max="2027-06-01"></kt-calendar>',
    );
    await click(el, title(el));

    expect($$(el, '[role="option"]').map((option) => option.dataset.year)).toEqual([
      '2026',
      '2027',
    ]);
    expect(cell(el, '2026-2').getAttribute('aria-disabled')).toBe('true');
    expect(cell(el, '2026-3').hasAttribute('aria-disabled')).toBe(false);
  });
});

describe('kt-calendar: two months', () => {
  const grids = (el: KtCalendar) => $$(el, 'table[role="grid"]');

  it('shows two months side by side under one header', async () => {
    const el = await mount(
      '<kt-calendar locale="en-GB" months="2" value="2026-09-25"></kt-calendar>',
    );

    expect(grids(el)).toHaveLength(2);
    expect(grids(el).map((grid) => grid.getAttribute('aria-label'))).toEqual([
      'September 2026',
      'October 2026',
    ]);
    expect($$(el, '.title')).toHaveLength(1);
    expect($(el, '.second-title').textContent!.trim()).toBe('October 2026');
  });

  it('leaves out the days of the neighbouring months, so none shows twice', async () => {
    const el = await mount(
      '<kt-calendar locale="en-GB" months="2" value="2026-09-25"></kt-calendar>',
    );
    // 30 September is September's, not also the first row of October's grid.
    expect($$(el, '[data-date="2026-09-30"]')).toHaveLength(1);
    expect($$(el, '[data-date="2026-10-01"]')).toHaveLength(1);
  });

  it('keeps the keyboard moving across both months, and pages only past the second', async () => {
    const el = await mount(
      '<kt-calendar locale="en-GB" months="2" value="2026-09-30"></kt-calendar>',
    );

    await key(el, 'ArrowRight', {});
    expect(focusedDay(el)).toBe('2026-10-01');
    expect(grids(el)[0]!.getAttribute('aria-label')).toBe('September 2026');

    for (let step = 0; step < 31; step += 1) await key(el, 'ArrowRight');
    expect(focusedDay(el)).toBe('2026-11-01');
    expect(grids(el)[0]!.getAttribute('aria-label')).toBe('October 2026');
  });

  it('pages by one month with its arrows', async () => {
    const el = await mount(
      '<kt-calendar locale="en-GB" months="2" value="2026-09-25"></kt-calendar>',
    );
    await click(el, $$(el, '.nav')[1]!);
    expect(grids(el).map((grid) => grid.getAttribute('aria-label'))).toEqual([
      'October 2026',
      'November 2026',
    ]);
  });
});
