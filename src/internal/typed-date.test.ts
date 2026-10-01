import { describe, expect, it } from 'vitest';
import { exampleDate, parseTypedDate, parseTypedRange } from './typed-date.js';

const reference = { year: 2026, month: 9, day: 30 };
const parse = (text: string, locale = 'en-GB') => parseTypedDate(text, locale, reference);
const iso = (date: { year: number; month: number; day: number } | null) =>
  date
    ? `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`
    : null;

describe('parseTypedDate', () => {
  it('reads numbers in the order the language writes a date', () => {
    expect(iso(parse('25/09/2026', 'en-GB'))).toBe('2026-09-25');
    expect(iso(parse('09/25/2026', 'en-US'))).toBe('2026-09-25');
    expect(iso(parse('25.09.2026', 'de-DE'))).toBe('2026-09-25');
  });

  it('takes any separator, and single digits', () => {
    expect(iso(parse('25-9-2026'))).toBe('2026-09-25');
    expect(iso(parse('25 9 2026'))).toBe('2026-09-25');
  });

  it('always reads ISO, whatever the language', () => {
    expect(iso(parse('2026-09-25', 'en-US'))).toBe('2026-09-25');
  });

  it('reads month names, short or long, in the language', () => {
    expect(iso(parse('25 Sept 2026', 'en-GB'))).toBe('2026-09-25');
    expect(iso(parse('Sep 25, 2026', 'en-US'))).toBe('2026-09-25');
    expect(iso(parse('25 septembre 2026', 'fr-FR'))).toBe('2026-09-25');
    expect(iso(parse('25 sept. 2026', 'fr-FR'))).toBe('2026-09-25');
    expect(iso(parse('1 févr. 2026', 'fr-FR'))).toBe('2026-02-01');
  });

  it('takes the current year when none is typed', () => {
    expect(iso(parse('25/09'))).toBe('2026-09-25');
    expect(iso(parse('3 march'))).toBe('2026-03-03');
  });

  it('reads a two-digit year as the nearest century that makes sense', () => {
    expect(iso(parse('1/1/98'))).toBe('1998-01-01');
    expect(iso(parse('1/1/30'))).toBe('2030-01-01');
  });

  it('turns down what is not a date', () => {
    expect(parse('')).toBeNull();
    expect(parse('soon')).toBeNull();
    expect(parse('31/02/2026')).toBeNull();
    expect(parse('25/13/2026')).toBeNull();
    expect(parse('25/09/2026/1')).toBeNull();
  });
});

describe('parseTypedRange', () => {
  it('reads two dates around a dash', () => {
    expect(parseTypedRange('01/09/2026 – 25/09/2026', 'en-GB', reference)).toEqual({
      start: { year: 2026, month: 9, day: 1 },
      end: { year: 2026, month: 9, day: 25 },
    });
    expect(parseTypedRange('1/9/2026 - 25/9/2026', 'en-GB', reference)).not.toBeNull();
  });

  it('lends the end year to a start typed without one', () => {
    expect(parseTypedRange('20/12 – 5/1/2027', 'en-GB', reference)).toEqual({
      start: { year: 2026, month: 12, day: 20 },
      end: { year: 2027, month: 1, day: 5 },
    });
  });

  it('puts the two ends in order', () => {
    expect(parseTypedRange('25/09/2026 – 01/09/2026', 'en-GB', reference)).toEqual({
      start: { year: 2026, month: 9, day: 1 },
      end: { year: 2026, month: 9, day: 25 },
    });
  });

  it('turns down a period with a missing or unreadable end', () => {
    expect(parseTypedRange('01/09/2026', 'en-GB', reference)).toBeNull();
    expect(parseTypedRange('01/09/2026 – later', 'en-GB', reference)).toBeNull();
  });
});

describe('exampleDate', () => {
  it('shows a date written the way the language writes it', () => {
    expect(exampleDate('en-GB', reference)).toBe('30/09/2026');
    expect(exampleDate('en-US', reference)).toBe('09/30/2026');
  });
});
