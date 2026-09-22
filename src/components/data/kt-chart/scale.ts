/**
 * Value scales: how far the axis runs, and where its ticks fall.
 *
 * Ticks land on 1, 2 or 5 times a power of ten. A reader can interpolate
 * between 0, 20 and 40; between 0, 17.75 and 35.5 they cannot.
 */

export interface Ticks {
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly values: readonly number[];
}

/** The nearest 1, 2, 5 or 10 × 10ⁿ. */
function niceNumber(value: number): number {
  const exponent = Math.floor(Math.log10(value));
  const fraction = value / 10 ** exponent;
  const nice = fraction < 1.5 ? 1 : fraction < 3 ? 2 : fraction < 7 ? 5 : 10;
  return nice * 10 ** exponent;
}

/** Round steps covering `lo…hi`, aiming for about `count` ticks. */
export function niceTicks(lo: number, hi: number, count: number): Ticks {
  if (hi === lo) {
    // A flat series still needs an axis; open it around the value.
    const pad = Math.abs(lo) || 1;
    lo -= pad;
    hi += pad;
  }

  // The step is rounded from the real range. Rounding the range first as well
  // (Heckbert's original) compounds the two and can run the axis to nearly
  // twice the data: 610 became an axis to 1000.
  const step = niceNumber((hi - lo) / Math.max(1, count - 1));
  const decimals = Math.max(0, -Math.floor(Math.log10(step)));
  // toFixed strips the 0.30000000000000004; `|| 0` turns -0 into 0.
  const clean = (value: number) => Number(value.toFixed(decimals)) || 0;

  const min = clean(Math.floor(lo / step) * step);
  const max = clean(Math.ceil(hi / step) * step);
  const values: number[] = [];
  for (let index = 0; min + index * step <= max + step / 2; index += 1) {
    values.push(clean(min + index * step));
  }

  return { min, max, step, values };
}

/**
 * The extent of the data.
 *
 * `stacks` are drawn on top of each other: each is a list of series, each
 * series a list of values by index, and a stack is as tall as its positive
 * values added up and as deep as its negative ones. `loose` series stand alone.
 * `includeZero` is for bars and areas, whose length is only honest from zero.
 */
export function valueBounds(
  stacks: readonly (readonly (readonly number[])[])[],
  loose: readonly (readonly number[])[],
  { includeZero }: { includeZero: boolean },
): { lo: number; hi: number } {
  const extremes: number[] = loose.flat();

  for (const stack of stacks) {
    const length = Math.max(0, ...stack.map((series) => series.length));
    for (let index = 0; index < length; index += 1) {
      let above = 0;
      let below = 0;
      for (const series of stack) {
        const value = series[index] ?? 0;
        if (value >= 0) above += value;
        else below += value;
      }
      extremes.push(above, below);
    }
  }

  const finite = extremes.filter(Number.isFinite);
  if (finite.length === 0) return { lo: 0, hi: 1 };

  let lo = Math.min(...finite);
  let hi = Math.max(...finite);
  if (includeZero) {
    lo = Math.min(lo, 0);
    hi = Math.max(hi, 0);
  }
  return { lo, hi };
}

/** Nice ticks, pinned to an author's `min` and `max` when they gave any. */
export function ticksFor(
  lo: number,
  hi: number,
  count: number,
  limits: { readonly min: number | null; readonly max: number | null },
): Ticks {
  const ticks = niceTicks(limits.min ?? lo, limits.max ?? hi, count);
  const min = limits.min ?? ticks.min;
  const max = limits.max ?? ticks.max;
  if (max <= min) return ticks;

  return {
    min,
    max,
    step: ticks.step,
    values: ticks.values.filter((value) => value >= min && value <= max),
  };
}

/** Where `value` falls between `from` and `to`, in px. */
export function project(value: number, ticks: Ticks, from: number, to: number): number {
  return from + ((value - ticks.min) / (ticks.max - ticks.min)) * (to - from);
}

/** How many ticks fit along `length`, one every `spacing` px, between three and six. */
export function tickCount(length: number, spacing: number): number {
  return Math.min(6, Math.max(3, Math.round(length / spacing)));
}
