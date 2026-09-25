/**
 * Calendar dates without a time or a time zone.
 *
 * A date picker deals in days, and `Date` deals in instants: "2026-03-29" at
 * local midnight does not exist in some zones on DST night, and a day computed
 * in UTC is off by one for half the planet. So dates here are plain
 * `{ year, month, day }` values (month 1–12), serialised as ISO `YYYY-MM-DD`.
 * `Date` is only built — at noon, clear of any DST gap — to hand to `Intl`
 * for formatting.
 */

export interface PlainDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** `2026-09-25` → date, or `null` when malformed or impossible (Feb 30). */
export function parseDate(value: string | null | undefined): PlainDate | null {
  const match = ISO.exec(value?.trim() ?? '');
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null;
  return { year, month, day };
}

export function formatDate(date: PlainDate): string {
  const pad = (n: number, width = 2) => String(n).padStart(width, '0');
  return `${pad(date.year, 4)}-${pad(date.month)}-${pad(date.day)}`;
}

/** An ISO 8601 interval, `start/end`. Either half may be missing or malformed. */
export function parseRange(value: string | null | undefined): {
  start: PlainDate | null;
  end: PlainDate | null;
} {
  const [start, end] = (value ?? '').split('/');
  return { start: parseDate(start), end: parseDate(end) };
}

export function formatRange(start: PlainDate, end: PlainDate): string {
  return `${formatDate(start)}/${formatDate(end)}`;
}

/** Negative, zero or positive, like a sort comparator. */
export function compareDates(a: PlainDate, b: PlainDate): number {
  return a.year - b.year || a.month - b.month || a.day - b.day;
}

export function isSameDay(a: PlainDate | null, b: PlainDate | null): boolean {
  return a !== null && b !== null && compareDates(a, b) === 0;
}

/** Whether `date` falls between `a` and `b`, inclusive, in either order. */
export function isBetween(date: PlainDate, a: PlainDate, b: PlainDate): boolean {
  const [low, high] = compareDates(a, b) <= 0 ? [a, b] : [b, a];
  return compareDates(date, low) >= 0 && compareDates(date, high) <= 0;
}

function fromUtc(time: number): PlainDate {
  const d = new Date(time);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

/** Day arithmetic in UTC, where every day is 24 hours long. */
export function addDays(date: PlainDate, days: number): PlainDate {
  return fromUtc(Date.UTC(date.year, date.month - 1, date.day + days));
}

/** Month arithmetic that clamps: 31 January + 1 month is 28 or 29 February. */
export function addMonths(date: PlainDate, months: number): PlainDate {
  const index = date.year * 12 + (date.month - 1) + months;
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return { year, month, day: Math.min(date.day, daysInMonth(year, month)) };
}

/** 1 = Monday … 7 = Sunday, as ISO 8601 and `Intl.Locale#weekInfo` count them. */
export function isoWeekday(date: PlainDate): number {
  const day = new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
  return day === 0 ? 7 : day;
}

/** The first day of the week containing `date`, weeks starting on `firstDay`. */
export function startOfWeek(date: PlainDate, firstDay: number): PlainDate {
  return addDays(date, -((isoWeekday(date) - firstDay + 7) % 7));
}

/**
 * The six weeks a month view shows — always six, so the calendar keeps its
 * height from one month to the next instead of jumping under the pointer.
 */
export function monthGrid(year: number, month: number, firstDay: number): PlainDate[][] {
  let cursor = startOfWeek({ year, month, day: 1 }, firstDay);
  const weeks: PlainDate[][] = [];
  for (let week = 0; week < 6; week += 1) {
    const days: PlainDate[] = [];
    for (let day = 0; day < 7; day += 1) {
      days.push(cursor);
      cursor = addDays(cursor, 1);
    }
    weeks.push(days);
  }
  return weeks;
}

export function today(): PlainDate {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}

/** A `Date` for `Intl` to format: local noon, clear of any DST transition. */
export function toLocalDate(date: PlainDate): Date {
  return new Date(date.year, date.month - 1, date.day, 12);
}

/**
 * The first day of the week in `locale` — Monday in most of the world,
 * Sunday in the US, Saturday in parts of the Middle East. Read from
 * `Intl.Locale#getWeekInfo` (or the older `weekInfo` getter) where the
 * browser has it, Monday otherwise.
 */
export function firstDayOfWeek(locale: string): number {
  try {
    const info = new Intl.Locale(locale) as Intl.Locale & {
      getWeekInfo?: () => { firstDay: number };
      weekInfo?: { firstDay: number };
    };
    const firstDay = info.getWeekInfo?.().firstDay ?? info.weekInfo?.firstDay;
    return firstDay && firstDay >= 1 && firstDay <= 7 ? firstDay : 1;
  } catch {
    return 1;
  }
}
