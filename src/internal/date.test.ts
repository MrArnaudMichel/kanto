import { describe, expect, it } from 'vitest';
import {
  addDays,
  addMonths,
  compareDates,
  daysInMonth,
  firstDayOfWeek,
  formatDate,
  isBetween,
  isoWeekday,
  monthGrid,
  parseDate,
  parseRange,
  startOfWeek,
} from './date.js';

const d = (value: string) => parseDate(value)!;

describe('plain dates', () => {
  it('parses ISO dates and refuses impossible ones', () => {
    expect(parseDate('2026-09-25')).toEqual({ year: 2026, month: 9, day: 25 });
    expect(parseDate('2028-02-29')).not.toBeNull();
    expect(parseDate('2026-02-29')).toBeNull();
    expect(parseDate('2026-13-01')).toBeNull();
    expect(parseDate('25/09/2026')).toBeNull();
    expect(parseDate(null)).toBeNull();
  });

  it('round-trips through ISO, zero-padded', () => {
    expect(formatDate(d('2026-01-05'))).toBe('2026-01-05');
    expect(formatDate({ year: 987, month: 3, day: 4 })).toBe('0987-03-04');
  });

  it('parses an ISO interval, tolerating a missing half', () => {
    expect(parseRange('2026-09-01/2026-09-25')).toEqual({
      start: d('2026-09-01'),
      end: d('2026-09-25'),
    });
    expect(parseRange('2026-09-01')).toEqual({ start: d('2026-09-01'), end: null });
  });

  it('knows month lengths, leap years included', () => {
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2028, 2)).toBe(29);
    expect(daysInMonth(2100, 2)).toBe(28);
    expect(daysInMonth(2026, 12)).toBe(31);
  });

  it('adds days across months and years', () => {
    expect(addDays(d('2026-12-31'), 1)).toEqual(d('2027-01-01'));
    expect(addDays(d('2026-03-01'), -1)).toEqual(d('2026-02-28'));
  });

  it('adds days across a DST change without losing one', () => {
    // 29 March 2026 is DST night in Europe; local-midnight arithmetic skips it.
    expect(addDays(d('2026-03-28'), 1)).toEqual(d('2026-03-29'));
    expect(addDays(d('2026-03-29'), 1)).toEqual(d('2026-03-30'));
  });

  it('adds months, clamping to the shorter month', () => {
    expect(addMonths(d('2026-01-31'), 1)).toEqual(d('2026-02-28'));
    expect(addMonths(d('2026-12-15'), 1)).toEqual(d('2027-01-15'));
    expect(addMonths(d('2026-01-15'), -13)).toEqual(d('2024-12-15'));
  });

  it('compares and ranges, in either order', () => {
    expect(compareDates(d('2026-09-01'), d('2026-09-02'))).toBeLessThan(0);
    expect(isBetween(d('2026-09-10'), d('2026-09-20'), d('2026-09-01'))).toBe(true);
    expect(isBetween(d('2026-09-21'), d('2026-09-01'), d('2026-09-20'))).toBe(false);
  });

  it('counts ISO weekdays, Monday first', () => {
    expect(isoWeekday(d('2026-09-21'))).toBe(1); // a Monday
    expect(isoWeekday(d('2026-09-27'))).toBe(7); // a Sunday
  });

  it('finds the start of a week for any first day', () => {
    expect(startOfWeek(d('2026-09-25'), 1)).toEqual(d('2026-09-21'));
    expect(startOfWeek(d('2026-09-25'), 7)).toEqual(d('2026-09-20'));
    expect(startOfWeek(d('2026-09-21'), 1)).toEqual(d('2026-09-21'));
  });

  it('lays out a month as six full weeks', () => {
    const grid = monthGrid(2026, 9, 1);

    expect(grid).toHaveLength(6);
    expect(grid.every((week) => week.length === 7)).toBe(true);
    expect(grid[0]![0]).toEqual(d('2026-08-31')); // the Monday before 1 September
    expect(grid.flat().filter((day) => day.month === 9)).toHaveLength(30);
  });

  it('reads the first day of the week from the locale, Monday by default', () => {
    expect(firstDayOfWeek('fr-FR')).toBe(1);
    expect([1, 7]).toContain(firstDayOfWeek('en-US')); // 7 where the engine knows
    expect(firstDayOfWeek('not a locale')).toBe(1);
  });
});
