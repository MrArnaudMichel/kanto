import { nothing, svg, type SVGTemplateResult } from 'lit';
import type { Format, KtSeries, Measure } from './model.js';
import { niceTicks, type Ticks } from './scale.js';
import { TAU, arcPath, linearPath, polar } from './geometry.js';

/**
 * Pie, doughnut, polar area and radar: charts drawn around a centre.
 *
 * Pie, doughnut and polar area read the labels as slices and the first series
 * as their values — they show one distribution. Comparing two is a stacked
 * bar's job. A radar reads the labels as spokes and draws every series.
 */

export type RadialKind = 'pie' | 'doughnut' | 'polar-area' | 'radar';

export interface RadialInput {
  readonly width: number;
  readonly height: number;
  readonly kind: RadialKind;
  readonly series: readonly KtSeries[];
  /** Slice indices for pie, doughnut and polar area; series indices for radar. */
  readonly hidden: ReadonlySet<number>;
  readonly labels: readonly string[];
  readonly measure: Measure;
}

/** A slice, or for a radar a spoke (whose start and end are the same angle). */
export interface Slice {
  readonly index: number;
  /** The value drawn: never negative, and 0 when hidden. */
  readonly value: number;
  readonly start: number;
  readonly end: number;
  /** Outer radius; varies per slice only for polar area. */
  readonly outer: number;
}

export interface RadialLayout {
  readonly cx: number;
  readonly cy: number;
  readonly outer: number;
  readonly inner: number;
  readonly slices: readonly Slice[];
  /** Rings for polar area and radar. */
  readonly ticks: Ticks;
  /** The sum of the visible slices. */
  readonly total: number;
}

const PADDING = 8;
/** A doughnut's hole, as a share of its radius. */
const HOLE = 0.62;
const RING_COUNT = 4;
const LABEL_GAP = 12;

export function radialLayout(input: RadialInput): RadialLayout {
  const { width, height, kind, series, hidden, labels, measure } = input;
  const cx = width / 2;
  const cy = height / 2;

  if (kind === 'radar') {
    const values = series.flatMap((entry, index) =>
      hidden.has(index) ? [] : (entry.values ?? []),
    );
    const lo = Math.min(0, ...values);
    const hi = Math.max(0, ...values);
    const ticks = niceTicks(lo, hi === lo ? lo + 1 : hi, RING_COUNT);
    // The labels sit outside the outermost ring; keep them on the canvas.
    const room = Math.min(Math.max(0, ...labels.map(measure)), width * 0.25) + LABEL_GAP;
    const outer = Math.max(0, Math.min(cx - room, cy - LABEL_GAP * 2));
    const count = Math.max(labels.length, ...series.map((entry) => entry.values?.length ?? 0));

    return {
      cx,
      cy,
      outer,
      inner: 0,
      slices: Array.from({ length: count }, (_, index) => {
        const angle = (index * TAU) / Math.max(1, count);
        return { index, value: 0, start: angle, end: angle, outer };
      }),
      ticks,
      total: 0,
    };
  }

  const values = series[0]?.values ?? [];
  const count = Math.max(labels.length, values.length);
  const shown = (index: number) => (hidden.has(index) ? 0 : Math.max(0, values[index] ?? 0));
  const total = Array.from({ length: count }, (_, index) => shown(index)).reduce(
    (a, b) => a + b,
    0,
  );
  const outer = Math.max(0, Math.min(width, height) / 2 - PADDING);
  const peak = Math.max(0, ...Array.from({ length: count }, (_, index) => shown(index)));
  const ticks = niceTicks(0, peak || 1, RING_COUNT);
  const visibleCount = Array.from({ length: count }, (_, index) => index).filter(
    (index) => !hidden.has(index),
  ).length;

  let angle = 0;
  const slices = Array.from({ length: count }, (_, index): Slice => {
    const value = shown(index);
    const start = angle;

    if (kind === 'polar-area') {
      // Equal angles; the area carries the value, so the radius is its square root.
      if (!hidden.has(index)) angle += TAU / Math.max(1, visibleCount);
      return { index, value, start, end: angle, outer: outer * Math.sqrt(value / ticks.max) };
    }

    angle += total > 0 ? (value / total) * TAU : 0;
    return { index, value, start, end: angle, outer };
  });

  return { cx, cy, outer, inner: kind === 'doughnut' ? outer * HOLE : 0, slices, ticks, total };
}

/** The slice, or radar spoke, under a pointer; -1 for none. */
export function sliceAt(layout: RadialLayout, kind: RadialKind, x: number, y: number): number {
  const dx = x - layout.cx;
  const dy = y - layout.cy;
  const distance = Math.hypot(dx, dy);
  let angle = Math.atan2(dx, -dy);
  if (angle < 0) angle += TAU;

  if (kind === 'radar') {
    const count = layout.slices.length;
    if (count === 0 || distance > layout.outer + LABEL_GAP * 2) return -1;
    return Math.round(angle / (TAU / count)) % count;
  }

  if (distance > layout.outer || distance < layout.inner) return -1;
  const slice = layout.slices.find(
    ({ start, end }) => end > start && angle >= start && angle < end,
  );
  return slice?.index ?? -1;
}

/** Where a slice's tooltip points: the middle of the slice. */
export function sliceAnchor(layout: RadialLayout, index: number): readonly [number, number] {
  const slice = layout.slices[index];
  if (!slice) return [layout.cx, layout.cy];
  const middle = (slice.start + slice.end) / 2;
  const radius = layout.inner > 0 ? (layout.inner + slice.outer) / 2 : slice.outer * 0.6;
  return polar(layout.cx, layout.cy, radius, middle);
}

/** On a radar, the distance from the centre of `value`. */
export function radarRadius(layout: RadialLayout, value: number): number {
  const { ticks, outer } = layout;
  return ((value - ticks.min) / (ticks.max - ticks.min)) * outer;
}

export interface RadialView extends RadialInput {
  readonly layout: RadialLayout;
  readonly active: number;
  readonly noGrid: boolean;
  readonly noAxis: boolean;
  readonly centerLabel: string;
  readonly format: Format;
  readonly colorOf: (series: number) => string;
  readonly sliceColor: (slice: number) => string;
}

function renderSlices(view: RadialView): SVGTemplateResult {
  // No values on a polar area's rings: its radius is a square root, which
  // nobody reads off a ring. The tooltip and the table carry the numbers.
  const { layout, active, sliceColor, kind, noGrid, format, centerLabel } = view;
  const { cx, cy, inner, ticks } = layout;

  const rings =
    kind === 'polar-area' && !noGrid
      ? ticks.values
          .filter((value) => value > 0)
          .map(
            (value) =>
              svg`<circle class="grid" cx=${cx} cy=${cy} r=${layout.outer * Math.sqrt(value / ticks.max)} fill="none" />`,
          )
      : nothing;

  const shown = layout.slices.filter((slice) => slice.end > slice.start && slice.outer > 0);
  const paths = shown.map(
    (slice) => svg`<path
      class="slice"
      d=${arcPath(cx, cy, inner, slice.outer, slice.start, slice.end)}
      fill=${sliceColor(slice.index)}
      fill-rule="evenodd"
      stroke="var(--surface-card)"
      stroke-width=${shown.length > 1 ? 2 : 0}
      stroke-linejoin="round"
      data-index=${slice.index}
      opacity=${active === -1 || active === slice.index ? 1 : 0.45}
    />`,
  );

  const centre =
    kind === 'doughnut'
      ? svg`
        <text class="center-value" x=${cx} y=${cy} text-anchor="middle" dominant-baseline="middle">${format(layout.total)}</text>
        ${
          inner > 36
            ? svg`<text class="center-label" x=${cx} y=${cy + 20} text-anchor="middle" dominant-baseline="middle">${centerLabel}</text>`
            : nothing
        }`
      : nothing;

  return svg`${rings}${paths}${centre}`;
}

function renderRadar(view: RadialView): SVGTemplateResult {
  const { layout, series, hidden, labels, colorOf, active, noGrid, noAxis, format } = view;
  const { cx, cy, outer, ticks, slices } = layout;
  const spokes = slices.map((slice) => slice.start);

  const grid = noGrid
    ? nothing
    : svg`
      ${ticks.values
        .filter((value) => value > ticks.min)
        .map((value) => {
          const radius = radarRadius(layout, value);
          return svg`<path class="grid" fill="none" d=${`${linearPath(spokes.map((angle) => polar(cx, cy, radius, angle)))} Z`} />`;
        })}
      ${spokes.map((angle) => {
        const [x, y] = polar(cx, cy, outer, angle);
        return svg`<line class="grid" x1=${cx} y1=${cy} x2=${x} y2=${y} />`;
      })}`;

  const ringLabels = noAxis
    ? nothing
    : ticks.values
        .filter((value) => value > ticks.min)
        .map(
          (value) =>
            svg`<text class="tick-label ring-label" x=${cx + 4} y=${cy - radarRadius(layout, value) + 3} dominant-baseline="hanging">${format(value)}</text>`,
        );

  const axisLabels = spokes.map((angle, index) => {
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    const anchor = sin > 0.1 ? 'start' : sin < -0.1 ? 'end' : 'middle';
    // Top and bottom labels sit clear of the ring, above or below it, so the
    // ring values running up the first spoke never collide with them.
    const [x, y] = polar(cx, cy, outer + (Math.abs(cos) > 0.5 ? 8 : LABEL_GAP), angle);
    const baseline = cos > 0.5 ? 'auto' : cos < -0.5 ? 'hanging' : 'middle';
    return svg`<text class="axis-label" x=${x} y=${y} text-anchor=${anchor} dominant-baseline=${baseline}>${labels[index] ?? ''}</text>`;
  });

  const outlines = series.map((entry, seriesIndex) => {
    if (hidden.has(seriesIndex)) return nothing;
    const color = colorOf(seriesIndex);
    const points = spokes.map((angle, index) =>
      polar(cx, cy, radarRadius(layout, entry.values?.[index] ?? ticks.min), angle),
    );
    const markers =
      active >= 0 && points[active]
        ? svg`<circle class="marker" cx=${points[active][0]} cy=${points[active][1]} r="5" fill=${color} />`
        : nothing;
    return svg`
      <path class="radar" d=${`${linearPath(points)} Z`} stroke=${color} fill=${color} />
      ${markers}`;
  });

  const spoke =
    active >= 0 && spokes[active] !== undefined
      ? (() => {
          const [x, y] = polar(cx, cy, outer, spokes[active]);
          return svg`<line class="crosshair" x1=${cx} y1=${cy} x2=${x} y2=${y} />`;
        })()
      : nothing;

  return svg`${grid}${spoke}${outlines}${ringLabels}${axisLabels}`;
}

export function renderRadial(view: RadialView): SVGTemplateResult {
  return view.kind === 'radar' ? renderRadar(view) : renderSlices(view);
}
