/**
 * Which rows a virtual table renders: those under the viewport, and a few
 * either side so a fast scroll does not show blank space before the next
 * render lands.
 */

/** Rendered before the first row has been measured, to measure it. */
const FIRST_BATCH = 50;

export interface RowWindowInput {
  readonly rowCount: number;
  /** Every row's height, in px; 0 until one has been measured. */
  readonly rowHeight: number;
  readonly viewportHeight: number;
  readonly scrollTop: number;
  /** Extra rows rendered above and below the viewport. */
  readonly overscan: number;
}

/** Rows `start` (inclusive) to `end` (exclusive). */
export function rowWindow({
  rowCount,
  rowHeight,
  viewportHeight,
  scrollTop,
  overscan,
}: RowWindowInput): { start: number; end: number } {
  if (rowCount === 0) return { start: 0, end: 0 };
  if (rowHeight <= 0) return { start: 0, end: Math.min(rowCount, FIRST_BATCH) };

  // Past the end — a scroll position left over from longer data — the window
  // settles on the last screenful rather than on nothing.
  const fits = Math.ceil(viewportHeight / rowHeight);
  const first = Math.min(Math.floor(scrollTop / rowHeight), Math.max(0, rowCount - fits));
  const last = Math.ceil((scrollTop + viewportHeight) / rowHeight);

  return {
    start: Math.max(0, first - overscan),
    end: Math.min(rowCount, last + overscan),
  };
}
