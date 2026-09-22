import { nothing, svg, type SVGTemplateResult } from 'lit';
import type { Format, KtPoint, KtSeries, Measure, PlotBox } from './model.js';
import { project, tickCount, ticksFor, type Ticks } from './scale.js';
import type { Point } from './geometry.js';

/**
 * Scatter and bubble charts: two value axes, one dot per observation.
 *
 * Neither axis is forced through zero. A scatter plot is about how two
 * measures move together, and dragging the origin in would crush the cloud
 * into a corner.
 */

export interface PointInput {
  readonly width: number;
  readonly height: number;
  readonly series: readonly KtSeries[];
  readonly hidden: ReadonlySet<number>;
  readonly bubble: boolean;
  /** Pins the y axis. The x axis always follows the data. */
  readonly min: number | null;
  readonly max: number | null;
  readonly noAxis: boolean;
  readonly measure: Measure;
  readonly format: Format;
  readonly formatX: Format;
}

export interface PointLayout {
  readonly box: PlotBox;
  readonly x: Ticks;
  readonly y: Ticks;
  /** The largest bubble size among visible points; 0 for a scatter. */
  readonly maxR: number;
}

const PADDING = { top: 16, right: 16, bottom: 24 };
const LABEL_GAP = 12;
/** The largest bubble's radius, in px. */
const MAX_BUBBLE = 24;
const MIN_BUBBLE = 3;
const DOT = 4;
/** How close, in px, a pointer must be to pick a point up. */
const REACH = 24;

const pointsOf = (series: KtSeries | undefined): readonly KtPoint[] => series?.points ?? [];

function visiblePoints(input: PointInput): KtPoint[] {
  return input.series.flatMap((series, index) => (input.hidden.has(index) ? [] : pointsOf(series)));
}

function extent(values: readonly number[]): [number, number] {
  return values.length === 0 ? [0, 1] : [Math.min(...values), Math.max(...values)];
}

export function pointLayout(input: PointInput): PointLayout {
  const { width, height, measure, format, formatX, noAxis } = input;
  const points = visiblePoints(input);

  const plotHeight = Math.max(0, height - PADDING.top - PADDING.bottom);
  const [yLo, yHi] = extent(points.map((point) => point.y));
  const y = ticksFor(yLo, yHi, tickCount(plotHeight, 48), { min: input.min, max: input.max });
  const widest = noAxis ? 0 : Math.max(0, ...y.values.map((value) => measure(format(value))));
  const left = noAxis ? 4 : Math.ceil(widest) + LABEL_GAP;

  const [xLo, xHi] = extent(points.map((point) => point.x));
  const x = ticksFor(xLo, xHi, tickCount(Math.max(0, width - left - PADDING.right), 96), {
    min: null,
    max: null,
  });
  // The last x label is centred on the plot's right edge; keep half of it inside.
  const right = noAxis ? PADDING.right : Math.max(PADDING.right, measure(formatX(x.max)) / 2);

  return {
    box: {
      x: left,
      y: PADDING.top,
      width: Math.max(0, width - left - right),
      height: plotHeight,
    },
    x,
    y,
    maxR: input.bubble ? Math.max(0, ...points.map((point) => point.r ?? 0)) : 0,
  };
}

/** Where a point lands on screen. */
export function pointPosition(layout: PointLayout, point: Pick<KtPoint, 'x' | 'y'>): Point {
  const { box } = layout;
  return [
    project(point.x, layout.x, box.x, box.x + box.width),
    project(point.y, layout.y, box.y + box.height, box.y),
  ];
}

/**
 * A bubble's radius. The value is carried by the area, so the radius grows
 * with its square root: a bubble twice the value looks twice the size, not
 * four times.
 */
export function bubbleRadius(r: number | undefined, maxR: number): number {
  if (r === undefined || maxR <= 0 || r <= 0) return MIN_BUBBLE;
  return Math.max(MIN_BUBBLE, MAX_BUBBLE * Math.sqrt(r / maxR));
}

function radiusOf(input: PointInput, layout: PointLayout, point: KtPoint): number {
  return input.bubble ? bubbleRadius(point.r, layout.maxR) : DOT;
}

/** The visible point nearest a pointer, if it is close enough to mean it. */
export function nearestPoint(
  input: PointInput,
  layout: PointLayout,
  x: number,
  y: number,
): { series: number; index: number } | null {
  let best: { series: number; index: number } | null = null;
  let bestDistance = Infinity;

  input.series.forEach((series, seriesIndex) => {
    if (input.hidden.has(seriesIndex)) return;
    pointsOf(series).forEach((point, index) => {
      const [px, py] = pointPosition(layout, point);
      const distance = Math.hypot(px - x, py - y);
      const reach = Math.max(REACH, radiusOf(input, layout, point) + 4);
      if (distance <= reach && distance < bestDistance) {
        best = { series: seriesIndex, index };
        bestDistance = distance;
      }
    });
  });

  return best;
}

/** A series' point indices in x order, the order the keyboard walks them in. */
export function walkOrder(series: KtSeries | undefined): number[] {
  const points = pointsOf(series);
  return points.map((_, index) => index).sort((a, b) => points[a]!.x - points[b]!.x);
}

export interface PointView extends PointInput {
  readonly layout: PointLayout;
  readonly active: number;
  readonly activeSeries: number;
  readonly noGrid: boolean;
  readonly colorOf: (series: number) => string;
}

export function renderPoints(view: PointView): SVGTemplateResult {
  const { layout, noGrid, noAxis, format, formatX, bubble, colorOf, active, activeSeries } = view;
  const { box } = layout;

  const grid = noGrid
    ? nothing
    : svg`
      ${layout.y.values.map((value) => {
        const at = project(value, layout.y, box.y + box.height, box.y);
        return svg`<line class="grid" x1=${box.x} y1=${at} x2=${box.x + box.width} y2=${at} />`;
      })}
      ${layout.x.values.map((value) => {
        const at = project(value, layout.x, box.x, box.x + box.width);
        return svg`<line class="grid" x1=${at} y1=${box.y} x2=${at} y2=${box.y + box.height} />`;
      })}`;

  const axes = noAxis
    ? nothing
    : svg`
      ${layout.y.values.map(
        (value) =>
          svg`<text class="tick-label" x=${box.x - 8} y=${project(value, layout.y, box.y + box.height, box.y)}
            text-anchor="end" dominant-baseline="middle">${format(value)}</text>`,
      )}
      ${layout.x.values.map(
        (value) =>
          svg`<text class="tick-label" x=${project(value, layout.x, box.x, box.x + box.width)}
            y=${box.y + box.height + 16} text-anchor="middle">${formatX(value)}</text>`,
      )}`;

  // Largest first, so a small bubble is never buried under a big one.
  const dots = view.series
    .flatMap((series, seriesIndex) =>
      view.hidden.has(seriesIndex)
        ? []
        : pointsOf(series).map((point, index) => ({
            point,
            index,
            seriesIndex,
            radius: radiusOf(view, layout, point),
          })),
    )
    .sort((a, b) => b.radius - a.radius);

  const marks = dots.map(({ point, index, seriesIndex, radius }) => {
    const [x, y] = pointPosition(layout, point);
    const color = colorOf(seriesIndex);
    return svg`<circle
      class="dot"
      cx=${x}
      cy=${y}
      r=${radius}
      fill=${color}
      fill-opacity=${bubble ? 0.55 : 0.85}
      stroke=${bubble ? color : 'var(--surface-card)'}
      stroke-width=${bubble ? 1.5 : 2}
      data-series=${seriesIndex}
      data-index=${index}
    />`;
  });

  const focus = (() => {
    const point = pointsOf(view.series[activeSeries])[active];
    if (!point || view.hidden.has(activeSeries)) return nothing;
    const [x, y] = pointPosition(layout, point);
    return svg`<circle class="focus-ring" cx=${x} cy=${y}
      r=${radiusOf(view, layout, point) + 4} fill="none" stroke=${colorOf(activeSeries)} stroke-width="2" />`;
  })();

  return svg`${grid}${axes}${marks}${focus}`;
}
