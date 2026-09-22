/**
 * SVG path geometry for the chart's marks. Every function is pure and writes
 * coordinates rounded to two decimals, so paths stay short and comparable.
 */

export type Point = readonly [number, number];

/** One cubic Bézier piece of a curve. */
export interface Segment {
  readonly from: Point;
  readonly c1: Point;
  readonly c2: Point;
  readonly to: Point;
}

export const TAU = Math.PI * 2;

export const round = (value: number): number => Math.round(value * 100) / 100 || 0;

const xy = ([x, y]: Point) => `${round(x)},${round(y)}`;

/** Straight segments through `points`. `move` false continues an open path. */
export function linearPath(points: readonly Point[], move = true): string {
  return points.map((point, index) => `${index === 0 && move ? 'M' : 'L'}${xy(point)}`).join(' ');
}

/**
 * A monotone cubic through `points` (Fritsch–Carlson).
 *
 * Between two samples the curve stays within their range, so it never draws a
 * peak or a dip that is not in the data — the failure of the cardinal splines
 * most charts use. Needs at least three points; fewer have nothing to smooth.
 */
export function monotoneSegments(points: readonly Point[]): Segment[] {
  const count = points.length;
  if (count < 3) return [];

  const secants = points.slice(0, -1).map(([x0, y0], index) => {
    const [x1, y1] = points[index + 1]!;
    return x1 === x0 ? 0 : (y1 - y0) / (x1 - x0);
  });

  const tangents = points.map((_, index) => {
    if (index === 0) return secants[0]!;
    if (index === count - 1) return secants[count - 2]!;
    const before = secants[index - 1]!;
    const after = secants[index]!;
    // A turning point gets a flat tangent; otherwise the average slope.
    return before * after <= 0 ? 0 : (before + after) / 2;
  });

  secants.forEach((secant, index) => {
    if (secant === 0) {
      tangents[index] = 0;
      tangents[index + 1] = 0;
      return;
    }
    const a = tangents[index]! / secant;
    const b = tangents[index + 1]! / secant;
    const sum = a * a + b * b;
    // Past this circle the cubic overshoots; pull both tangents back onto it.
    if (sum > 9) {
      const tau = 3 / Math.sqrt(sum);
      tangents[index] = tau * a * secant;
      tangents[index + 1] = tau * b * secant;
    }
  });

  return secants.map((_, index) => {
    const from = points[index]!;
    const to = points[index + 1]!;
    const third = (to[0] - from[0]) / 3;
    return {
      from,
      c1: [from[0] + third, from[1] + tangents[index]! * third],
      c2: [to[0] - third, to[1] - tangents[index + 1]! * third],
      to,
    };
  });
}

/** A monotone curve as a path, or straight segments when there is nothing to smooth. */
export function monotonePath(points: readonly Point[], move = true): string {
  if (points.length < 3) return linearPath(points, move);

  const start = move ? `M${xy(points[0]!)}` : `L${xy(points[0]!)}`;
  return [
    start,
    ...monotoneSegments(points).map(({ c1, c2, to }) => `C${xy(c1)} ${xy(c2)} ${xy(to)}`),
  ].join(' ');
}

/** The point at `radius` and `angle` from a centre; 0 is twelve o'clock, clockwise. */
export function polar(cx: number, cy: number, radius: number, angle: number): Point {
  return [cx + radius * Math.sin(angle), cy - radius * Math.cos(angle)];
}

/**
 * A slice from `start` to `end`: a wedge to the centre when `inner` is 0, an
 * annular sector otherwise. A whole turn is drawn as circles (and a hole, with
 * `fill-rule="evenodd"`) because a single SVG arc cannot close on itself.
 */
export function arcPath(
  cx: number,
  cy: number,
  inner: number,
  outer: number,
  start: number,
  end: number,
): string {
  const span = end - start;
  if (span <= 0 || outer <= 0) return '';

  if (span >= TAU - 1e-6) {
    const circle = (radius: number, sweep: 0 | 1) => {
      const top = polar(cx, cy, radius, 0);
      const bottom = polar(cx, cy, radius, Math.PI);
      const arc = `A${round(radius)},${round(radius)} 0 1 ${sweep}`;
      return `M${xy(top)} ${arc} ${xy(bottom)} ${arc} ${xy(top)} Z`;
    };
    return inner > 0 ? `${circle(outer, 1)} ${circle(inner, 0)}` : circle(outer, 1);
  }

  const large = span > Math.PI ? 1 : 0;
  const outerArc = `A${round(outer)},${round(outer)} 0 ${large} 1 ${xy(polar(cx, cy, outer, end))}`;

  if (inner <= 0) {
    return `M${xy([cx, cy])} L${xy(polar(cx, cy, outer, start))} ${outerArc} Z`;
  }

  const innerArc = `A${round(inner)},${round(inner)} 0 ${large} 0 ${xy(polar(cx, cy, inner, start))}`;
  return `M${xy(polar(cx, cy, outer, start))} ${outerArc} L${xy(polar(cx, cy, inner, end))} ${innerArc} Z`;
}

/** Which end of a bar is rounded. The baseline end always stays square. */
export type Tip = 'top' | 'bottom' | 'left' | 'right' | 'none';

/**
 * A bar, rounded at its tip only. A bar rounded at the baseline too floats
 * above the axis instead of standing on it.
 */
export function barPath(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  tip: Tip,
): string {
  const vertical = tip === 'top' || tip === 'bottom';
  const r = Math.max(
    0,
    vertical ? Math.min(radius, width / 2, height) : Math.min(radius, height / 2, width),
  );
  const [x0, y0, x1, y1] = [x, y, x + width, y + height];
  const arc = (to: Point) => `A${round(r)},${round(r)} 0 0 1 ${xy(to)}`;
  const line = (to: Point) => `L${xy(to)}`;

  if (tip === 'none' || r === 0) {
    return `M${xy([x0, y0])} ${line([x1, y0])} ${line([x1, y1])} ${line([x0, y1])} Z`;
  }

  switch (tip) {
    case 'top':
      return `M${xy([x0, y1])} ${line([x0, y0 + r])} ${arc([x0 + r, y0])} ${line([x1 - r, y0])} ${arc([x1, y0 + r])} ${line([x1, y1])} Z`;
    case 'bottom':
      return `M${xy([x0, y0])} ${line([x1, y0])} ${line([x1, y1 - r])} ${arc([x1 - r, y1])} ${line([x0 + r, y1])} ${arc([x0, y1 - r])} Z`;
    case 'right':
      return `M${xy([x0, y0])} ${line([x1 - r, y0])} ${arc([x1, y0 + r])} ${line([x1, y1 - r])} ${arc([x1 - r, y1])} ${line([x0, y1])} Z`;
    case 'left':
      return `M${xy([x1, y0])} ${line([x1, y1])} ${line([x0 + r, y1])} ${arc([x0, y1 - r])} ${line([x0, y0 + r])} ${arc([x0 + r, y0])} Z`;
  }
}
