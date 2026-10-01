/**
 * The arithmetic of a segmented field — a day, a month, a year, an hour —
 * each typed digit by digit and stepped with the arrows. Pure, so the two
 * fields that share it, `<kt-date-input>` and `<kt-time-input>`, agree on
 * every key.
 */

export interface SegmentSpec {
  readonly min: number;
  readonly max: number;
  /** Digits when full: 2 for a day, 4 for a year. */
  readonly length: number;
}

/**
 * The segment's text once `digit` is typed, and whether the focus should move
 * on. It moves on when the segment is full, or as soon as no further digit
 * could follow — a day starting with 4 is the 4th. A digit that would
 * overshoot the maximum, or one typed into a full segment, starts it over.
 */
export function typeDigit(
  current: string,
  digit: string,
  spec: SegmentSpec,
): { text: string; advance: boolean } {
  let text = current.length >= spec.length ? digit : current + digit;
  if (Number(text) > spec.max) text = digit;
  const advance = text.length >= spec.length || Number(text) * 10 > spec.max;
  return { text, advance };
}

/**
 * The value an arrow press lands on: the next multiple of the step — counted
 * from the minimum — in the direction of `by`, wrapping past either end. An
 * empty segment starts from its first value going up, its last going down.
 */
export function stepSegment(value: number | null, by: number, spec: SegmentSpec): number {
  const step = Math.abs(by) || 1;
  const first = spec.min;
  const last = spec.min + Math.floor((spec.max - spec.min) / step) * step;
  if (value === null) return by > 0 ? first : last;

  const offset = value - spec.min;
  if (by > 0) {
    const next = spec.min + (Math.floor(offset / step) + 1) * step;
    return next > spec.max ? first : next;
  }
  const next = offset % step === 0 ? value - step : spec.min + Math.floor(offset / step) * step;
  return next < spec.min ? last : next;
}

/** A value written with the segment's leading zeros: 4 → "04". */
export function padSegment(value: number, spec: SegmentSpec): string {
  return String(value).padStart(spec.length, '0');
}
