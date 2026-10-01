/**
 * Reading a date someone typed, in their language.
 *
 * A field that only opens a calendar makes a date ten years away, or one
 * already on paper, a chore. Typed, it is a second's work — if the field reads
 * it the way the person writes it: day then month in London, month then day in
 * New York, month names in their own words, the year left out when it is this
 * one.
 */
import { daysInMonth, parseDate, compareDates, type PlainDate } from './date.js';
import { dateFormat } from './locale.js';

/** Lowercase, without accents or a trailing full stop: "Févr." reads "fevr". */
function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\.$/, '')
    .toLowerCase();
}

/** The order the language writes day, month and year in numbers. */
function numericOrder(locale: string): ('day' | 'month' | 'year')[] {
  const parts = dateFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })
    .formatToParts(new Date(2026, 8, 30))
    .map((part) => part.type)
    .filter((type): type is 'day' | 'month' | 'year' => ['day', 'month', 'year'].includes(type));
  return parts.length === 3 ? parts : ['day', 'month', 'year'];
}

/** The month a word names in the language, or null when it names none or several. */
function monthNamed(word: string, locale: string): number | null {
  const typed = fold(word);
  if (typed.length < 3) return null;

  const matches = new Set<number>();
  for (let month = 1; month <= 12; month += 1) {
    const sample = new Date(2026, month - 1, 1);
    const long = fold(dateFormat(locale, { month: 'long' }).format(sample));
    const short = fold(dateFormat(locale, { month: 'short' }).format(sample));
    if (long.startsWith(typed) || short === typed) matches.add(month);
  }
  return matches.size === 1 ? [...matches][0]! : null;
}

/** A typed year: two digits are this century, or the last, whichever is nearer. */
function readYear(digits: string, reference: number): number | null {
  if (digits.length === 4) return Number(digits);
  if (digits.length > 2) return null;
  const year = 2000 + Number(digits);
  return year > reference + 20 ? year - 100 : year;
}

function valid(year: number, month: number, day: number): PlainDate | null {
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null;
  return { year, month, day };
}

/** The date, and whether a year was typed or borrowed. */
function read(
  text: string,
  locale: string,
  reference: PlainDate,
): { date: PlainDate; typedYear: boolean } | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const iso = /^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmed)
    ? parseDate(trimmed.replace(/-(\d)(?=-|$)/g, '-0$1'))
    : null;
  if (iso) return { date: iso, typedYear: true };

  const numbers: string[] = [];
  let named: number | null = null;
  for (const token of trimmed.split(/[\s/.,-]+/).filter(Boolean)) {
    if (/^\d+$/.test(token)) {
      numbers.push(token);
      continue;
    }
    const month = monthNamed(token, locale);
    if (month === null || named !== null) return null;
    named = month;
  }

  if (named !== null) {
    // "25 Sept 2026", "Sep 25, 2026", "3 march": the day, and maybe a year.
    if (numbers.length === 0 || numbers.length > 2) return null;
    const yearIndex = numbers.findIndex((token) => token.length === 4 || Number(token) > 31);
    const dayToken = numbers.find((_, index) => index !== yearIndex);
    if (dayToken === undefined || (numbers.length === 2 && yearIndex < 0)) return null;
    const year = yearIndex >= 0 ? readYear(numbers[yearIndex]!, reference.year) : reference.year;
    if (year === null) return null;
    const date = valid(year, named, Number(dayToken));
    return date && { date, typedYear: yearIndex >= 0 };
  }

  // All numbers, in the language's order; a leading four-digit year reads ISO-wise.
  if (numbers.length < 2 || numbers.length > 3) return null;
  const order =
    numbers[0]!.length === 4
      ? (['year', 'month', 'day'] as const)
      : numberOrderFor(numericOrder(locale), numbers.length);
  const field = (name: 'day' | 'month' | 'year') => numbers[order.indexOf(name)];

  const yearToken = field('year');
  const year = yearToken === undefined ? reference.year : readYear(yearToken, reference.year);
  if (year === null) return null;
  const date = valid(year, Number(field('month')), Number(field('day')));
  return date && { date, typedYear: yearToken !== undefined };
}

/** Two numbers are the day and month, in the language's order, with the year left out. */
function numberOrderFor(
  order: ('day' | 'month' | 'year')[],
  count: number,
): readonly ('day' | 'month' | 'year')[] {
  return count === 3 ? order : order.filter((part) => part !== 'year');
}

/** A date typed in `locale`, or null when it does not read as one. */
export function parseTypedDate(
  text: string,
  locale: string,
  reference: PlainDate,
): PlainDate | null {
  return read(text, locale, reference)?.date ?? null;
}

/**
 * A period typed as two dates around a dash — "1/9 – 25/9/2026" — in order.
 * A start typed without a year borrows the end's, the year before if that
 * would put it after the end: "20/12 – 5/1/2027" starts in December 2026.
 */
export function parseTypedRange(
  text: string,
  locale: string,
  reference: PlainDate,
): { start: PlainDate; end: PlainDate } | null {
  const halves = text.split(/\s*[–—]\s*|\s+-\s+|\s+(?:to|au|bis|à)\s+/i);
  if (halves.length !== 2) return null;

  const end = read(halves[1]!, locale, reference);
  if (!end) return null;
  const start = read(halves[0]!, locale, { ...reference, year: end.date.year });
  if (!start) return null;

  let from = start.date;
  if (!start.typedYear && compareDates(from, end.date) > 0) {
    const earlier = valid(from.year - 1, from.month, from.day);
    if (earlier) from = earlier;
  }
  return compareDates(from, end.date) <= 0
    ? { start: from, end: end.date }
    : { start: end.date, end: from };
}

/** `reference` written in numbers the way `locale` writes a date — for a hint. */
export function exampleDate(locale: string, reference: PlainDate): string {
  return dateFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    new Date(reference.year, reference.month - 1, reference.day, 12),
  );
}
