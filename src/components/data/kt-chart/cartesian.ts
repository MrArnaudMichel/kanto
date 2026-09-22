import { nothing, svg, type SVGTemplateResult } from 'lit';
import type { Format, KtMark, KtSeries, Measure, PlotBox } from './model.js';
import { project, tickCount, ticksFor, valueBounds, type Ticks } from './scale.js';
import { barPath, linearPath, monotonePath, type Point, type Tip } from './geometry.js';

/**
 * Line, area and bar charts: one category axis, one value axis.
 *
 * The layout is computed once per render and every position is read from it,
 * so the marks, the labels, the tooltip and the hit test cannot disagree about
 * where a category is.
 */

export interface CartesianInput {
  readonly width: number;
  readonly height: number;
  readonly series: readonly KtSeries[];
  readonly hidden: ReadonlySet<number>;
  readonly labels: readonly string[];
  /** The chart's mark; a series can override it with its own `type`. */
  readonly type: KtMark;
  readonly stacked: boolean;
  readonly horizontal: boolean;
  readonly min: number | null;
  readonly max: number | null;
  readonly noAxis: boolean;
  readonly measure: Measure;
  readonly format: Format;
}

export interface CartesianLayout {
  readonly box: PlotBox;
  readonly ticks: Ticks;
  /** How many categories there are. */
  readonly count: number;
  readonly horizontal: boolean;
  /** Categories are bands rather than points — true as soon as a bar is shown. */
  readonly banded: boolean;
  /** The mark each series is drawn as, by series index. */
  readonly marks: readonly KtMark[];
  /** Indices of the series that are not hidden. */
  readonly visible: readonly number[];
}

/** Room above the plot, to its right, and below it for the category labels. */
const PADDING = { top: 12, right: 8, bottom: 24 };
/** Space between a label and the plot it labels. */
const LABEL_GAP = 12;
/** Roughly one value tick per this many px of axis. */
const TICK_SPACING = { vertical: 48, horizontal: 96 };

const valuesOf = (series: KtSeries | undefined): readonly number[] => series?.values ?? [];

export function cartesianLayout(input: CartesianInput): CartesianLayout {
  const { series, hidden, labels, measure, format, noAxis, width, height } = input;

  const marks = series.map((entry) => entry.type ?? input.type);
  const visible = series.map((_, index) => index).filter((index) => !hidden.has(index));
  const shown = visible.map((index) => marks[index]!);
  const count = Math.max(labels.length, 0, ...series.map((entry) => valuesOf(entry).length));

  const banded = shown.length > 0 ? shown.includes('bar') : input.type === 'bar';
  const horizontal =
    input.horizontal && banded && (shown.length === 0 || shown.every((mark) => mark === 'bar'));

  // Bars stack with bars and areas with areas; lines always stand alone.
  const ofMark = (mark: KtMark) =>
    visible.filter((index) => marks[index] === mark).map((index) => valuesOf(series[index]));
  const stacks = input.stacked
    ? [ofMark('bar'), ofMark('area')].filter((stack) => stack.length)
    : [];
  const loose = input.stacked ? ofMark('line') : visible.map((index) => valuesOf(series[index]));
  // A bar's or an area's size is its distance from zero, so zero must be on the axis.
  const includeZero =
    shown.length > 0 ? shown.some((mark) => mark !== 'line') : input.type !== 'line';
  const { lo, hi } = valueBounds(stacks, loose, { includeZero });
  const limits = { min: input.min, max: input.max };

  if (!horizontal) {
    const plotHeight = Math.max(0, height - PADDING.top - PADDING.bottom);
    const ticks = ticksFor(lo, hi, tickCount(plotHeight, TICK_SPACING.vertical), limits);
    const widest = noAxis ? 0 : Math.max(0, ...ticks.values.map((value) => measure(format(value))));
    const left = noAxis ? 4 : Math.ceil(widest) + LABEL_GAP;

    return {
      box: {
        x: left,
        y: PADDING.top,
        width: Math.max(0, width - left - PADDING.right),
        height: plotHeight,
      },
      ticks,
      count,
      horizontal,
      banded,
      marks,
      visible,
    };
  }

  // Sideways: the categories take the left gutter, the values run along the bottom.
  const widestLabel = Math.max(0, ...labels.map(measure));
  const left = Math.ceil(Math.min(widestLabel, width * 0.4)) + LABEL_GAP;
  const plotWidth = Math.max(0, width - left - PADDING.right);
  const ticks = ticksFor(lo, hi, tickCount(plotWidth, TICK_SPACING.horizontal), limits);
  // The last value label is centred on the plot's right edge; keep half of it inside.
  const right = noAxis ? PADDING.right : Math.max(PADDING.right, measure(format(ticks.max)) / 2);

  return {
    box: {
      x: left,
      y: PADDING.top,
      width: Math.max(0, width - left - right),
      height: Math.max(0, height - PADDING.top - (noAxis ? 4 : PADDING.bottom)),
    },
    ticks,
    count,
    horizontal,
    banded,
    marks,
    visible,
  };
}

/** Where category `index` sits along its axis, in px. */
export function categoryCentre(layout: CartesianLayout, index: number): number {
  const { box, count, horizontal, banded } = layout;
  const start = horizontal ? box.y : box.x;
  const length = horizontal ? box.height : box.width;

  if (banded) return start + ((index + 0.5) * length) / Math.max(1, count);
  if (count <= 1) return start + length / 2;
  return start + (index / (count - 1)) * length;
}

/** Where `value` sits along the value axis, in px. */
export function valuePosition(layout: CartesianLayout, value: number): number {
  const { box, ticks, horizontal } = layout;
  return horizontal
    ? project(value, ticks, box.x, box.x + box.width)
    : project(value, ticks, box.y + box.height, box.y);
}

/** The category under a pointer at `x`, `y`: the band it is in, or the nearest sample. */
export function categoryAt(layout: CartesianLayout, x: number, y: number): number {
  const { box, count, horizontal, banded } = layout;
  if (count === 0) return -1;

  const position = horizontal ? y - box.y : x - box.x;
  const length = horizontal ? box.height : box.width;
  if (length <= 0) return -1;

  const index = banded
    ? Math.floor(position / (length / count))
    : Math.round((position / length) * (count - 1));
  return Math.min(Math.max(index, 0), count - 1);
}

/* ---------------------------------------------------------------- rendering */

export interface CartesianView extends CartesianInput {
  readonly layout: CartesianLayout;
  /** The active category, or -1. */
  readonly active: number;
  readonly smooth: boolean;
  readonly noGrid: boolean;
  readonly colorOf: (series: number) => string;
  /** Prefix for ids inside the shadow root, so two charts never share a gradient. */
  readonly idPrefix: string;
}

/** Bars fill this much of their band; the rest is the gap between categories. */
const GROUP_SHARE = 0.64;
const BAR_GAP = 2;
const BAR_RADIUS = 4;
const MAX_BAR = { grouped: 40, stacked: 48 };
/** Below this many samples, and unsmoothed, every sample gets a dot. */
const DOTS_UP_TO = 12;

/** `Array.prototype.findLastIndex`, which the ES2022 target does not have. */
function lastIndexWhere<T>(items: readonly T[], test: (item: T) => boolean): number {
  for (let index = items.length - 1; index >= 0; index -= 1) {
    if (test(items[index]!)) return index;
  }
  return -1;
}

/** A label cut to fit `width`, with an ellipsis. */
function fit(text: string, width: number, measure: Measure): string {
  if (measure(text) <= width) return text;
  let cut = text;
  while (cut.length > 1 && measure(`${cut}…`) > width) cut = cut.slice(0, -1);
  return `${cut}…`;
}

function renderValueAxis(view: CartesianView): SVGTemplateResult {
  const { layout, noGrid, noAxis, format } = view;
  const { box, ticks, horizontal } = layout;

  const lines = noGrid
    ? nothing
    : ticks.values.map((value) => {
        const at = valuePosition(layout, value);
        return horizontal
          ? svg`<line class="grid" x1=${at} y1=${box.y} x2=${at} y2=${box.y + box.height} />`
          : svg`<line class="grid" x1=${box.x} y1=${at} x2=${box.x + box.width} y2=${at} />`;
      });

  // Zero inside the range is the line a negative value hangs from; give it weight.
  const zero =
    ticks.min < 0 && ticks.max > 0
      ? (() => {
          const at = valuePosition(layout, 0);
          return horizontal
            ? svg`<line class="baseline" x1=${at} y1=${box.y} x2=${at} y2=${box.y + box.height} />`
            : svg`<line class="baseline" x1=${box.x} y1=${at} x2=${box.x + box.width} y2=${at} />`;
        })()
      : nothing;

  const labels = noAxis
    ? nothing
    : ticks.values.map((value) => {
        const at = valuePosition(layout, value);
        return horizontal
          ? svg`<text class="tick-label" x=${at} y=${box.y + box.height + 16} text-anchor="middle">${format(value)}</text>`
          : svg`<text class="tick-label" x=${box.x - 8} y=${at} text-anchor="end" dominant-baseline="middle">${format(value)}</text>`;
      });

  return svg`${lines}${zero}${labels}`;
}

function renderCategoryAxis(view: CartesianView): SVGTemplateResult {
  const { layout, labels, measure } = view;
  const { box, count, horizontal, banded } = layout;

  if (horizontal) {
    // One label per band while they fit, thinned when the bands get shorter than a line.
    const every = Math.max(1, Math.ceil(count / Math.max(1, Math.floor(box.height / 18))));
    return svg`${labels.map((text, index) =>
      index % every === 0
        ? svg`<text
            class="axis-label"
            x=${box.x - 8}
            y=${categoryCentre(layout, index)}
            text-anchor="end"
            dominant-baseline="middle"
          >${fit(text, box.x - LABEL_GAP, measure)}</text>`
        : nothing,
    )}`;
  }

  // Thin the labels rather than letting them collide: each gets the widest one's room.
  const room = Math.max(0, ...labels.map(measure)) + LABEL_GAP;
  const every = Math.max(1, Math.ceil(count / Math.max(1, Math.floor(box.width / room))));

  return svg`${labels.map((text, index) => {
    if (index % every !== 0) return nothing;
    // On a line the first and last samples sit on the plot's edges; a centred
    // label there would hang out of the chart.
    const anchor =
      banded || count <= 1
        ? 'middle'
        : index === 0
          ? 'start'
          : index === count - 1
            ? 'end'
            : 'middle';
    return svg`<text
      class="axis-label"
      x=${categoryCentre(layout, index)}
      y=${box.y + box.height + 16}
      text-anchor=${anchor}
    >${text}</text>`;
  })}`;
}

/** The screen points of one series' samples. */
function pointsOf(
  view: CartesianView,
  values: readonly number[],
  offsets?: readonly number[],
): Point[] {
  return values.map((value, index) => [
    categoryCentre(view.layout, index),
    valuePosition(view.layout, value + (offsets?.[index] ?? 0)),
  ]);
}

function pathThrough(view: CartesianView, points: readonly Point[], move = true): string {
  return view.smooth ? monotonePath(points, move) : linearPath(points, move);
}

function renderLinesAndAreas(view: CartesianView): SVGTemplateResult {
  const { layout, series, colorOf, active, idPrefix, stacked, smooth } = view;
  const { box, count, visible, marks } = layout;
  const floor = valuePosition(layout, Math.min(Math.max(0, layout.ticks.min), layout.ticks.max));

  // Running totals for stacked areas: each area sits on the ones before it.
  const stackBase = new Array<number>(count).fill(0);

  const fills: SVGTemplateResult[] = [];
  const strokes: SVGTemplateResult[] = [];

  for (const index of visible) {
    const mark = marks[index]!;
    if (mark === 'bar') continue;

    const values = valuesOf(series[index]);
    if (values.length === 0) continue;
    const color = colorOf(index);
    const onStack = mark === 'area' && stacked;
    const base = onStack ? [...stackBase] : undefined;
    const upper = pointsOf(view, values, base);

    if (mark === 'area') {
      const gradient = `${idPrefix}-fill-${index}`;
      const lower: Point[] = base
        ? values.map((_, i) => [categoryCentre(layout, i), valuePosition(layout, base[i]!)])
        : [
            [upper.at(-1)![0], floor],
            [upper[0]![0], floor],
          ];
      const closing = base
        ? pathThrough(view, [...lower].reverse(), false)
        : linearPath(lower, false);

      fills.push(svg`
        <defs>
          <linearGradient id=${gradient} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color=${color} stop-opacity="0.28" />
            <stop offset="100%" stop-color=${color} stop-opacity="0.02" />
          </linearGradient>
        </defs>
        <path class="area" d=${`${pathThrough(view, upper)} ${closing} Z`} fill=${`url(#${gradient})`} />`);

      if (base) values.forEach((value, i) => (stackBase[i] = base[i]! + value));
    }

    strokes.push(
      svg`<path class="line" d=${pathThrough(view, upper)} stroke=${color} pathLength="1" />`,
    );

    if (count <= DOTS_UP_TO && !smooth) {
      strokes.push(
        svg`${upper.map(([x, y]) => svg`<circle class="point" cx=${x} cy=${y} r="3" fill=${color} />`)}`,
      );
    }
    if (active >= 0 && upper[active]) {
      const [x, y] = upper[active];
      strokes.push(svg`<circle class="marker" cx=${x} cy=${y} r="5" fill=${color} />`);
    }
  }

  const crosshair =
    active >= 0 && !layout.banded
      ? svg`<line class="crosshair"
          x1=${categoryCentre(layout, active)} y1=${box.y}
          x2=${categoryCentre(layout, active)} y2=${box.y + box.height} />`
      : nothing;

  return svg`${fills}${crosshair}${strokes}`;
}

/** One bar or stack segment running from `from` to `to` on the value axis. */
function barSegment(
  view: CartesianView,
  options: {
    readonly from: number;
    readonly to: number;
    /** Offset across the band, and thickness, in px. */
    readonly offset: number;
    readonly thickness: number;
    /** Round the tip: only the outermost segment of a bar has one. */
    readonly outer: boolean;
    readonly series: number;
    readonly index: number;
  },
): SVGTemplateResult {
  const { layout, active, colorOf } = view;
  const { from, to, offset, thickness, outer, series, index } = options;
  const negative = to < from;

  let start = valuePosition(layout, from);
  let end = valuePosition(layout, to);
  // Stack segments meet with a hairline of surface between them, not fused.
  const inset = 0.5;
  const direction = Math.sign(end - start) || 1;
  if (from !== 0) start += inset * direction;
  if (!outer) end -= inset * direction;
  // A non-zero value never disappears into the baseline.
  if (Math.abs(end - start) < 1) end = start + direction;

  const low = Math.min(start, end);
  const length = Math.abs(end - start);
  const tip: Tip = !outer
    ? 'none'
    : layout.horizontal
      ? negative
        ? 'left'
        : 'right'
      : negative
        ? 'bottom'
        : 'top';

  const d = layout.horizontal
    ? barPath(low, offset, length, thickness, BAR_RADIUS, tip)
    : barPath(offset, low, thickness, length, BAR_RADIUS, tip);

  return svg`<path
    class=${`bar${negative ? ' negative' : ''}${layout.horizontal ? ' sideways' : ''}`}
    d=${d}
    fill=${colorOf(series)}
    data-series=${series}
    data-index=${index}
    opacity=${active === -1 || active === index ? 1 : 0.45}
  />`;
}

function renderBars(view: CartesianView): SVGTemplateResult | typeof nothing {
  const { layout, series } = view;
  const { box, count, horizontal, visible, marks } = layout;
  const bars = visible.filter((index) => marks[index] === 'bar');
  if (bars.length === 0 || count === 0) return nothing;

  const band = (horizontal ? box.height : box.width) / count;
  const group = band * GROUP_SHARE;
  const segments: SVGTemplateResult[] = [];

  for (let index = 0; index < count; index += 1) {
    const centre = categoryCentre(layout, index);

    if (view.stacked) {
      // One bar per category. Positives pile up from zero and negatives down
      // from it, each pile rounded only at its far end.
      const thickness = Math.max(2, Math.min(MAX_BAR.stacked, group));
      const values = bars.map((seriesIndex) => valuesOf(series[seriesIndex])[index] ?? 0);
      const lastAbove = lastIndexWhere(values, (value) => value > 0);
      const lastBelow = lastIndexWhere(values, (value) => value < 0);
      let above = 0;
      let below = 0;

      values.forEach((value, position) => {
        if (value === 0) return;
        const from = value > 0 ? above : below;
        const to = from + value;
        if (value > 0) above = to;
        else below = to;
        segments.push(
          barSegment(view, {
            from,
            to,
            offset: centre - thickness / 2,
            thickness,
            outer: position === (value > 0 ? lastAbove : lastBelow),
            series: bars[position]!,
            index,
          }),
        );
      });
      continue;
    }

    const thickness = Math.max(
      2,
      Math.min(MAX_BAR.grouped, (group - BAR_GAP * (bars.length - 1)) / bars.length),
    );
    const total = thickness * bars.length + BAR_GAP * (bars.length - 1);
    bars.forEach((seriesIndex, position) => {
      const value = valuesOf(series[seriesIndex])[index];
      if (value === undefined || value === 0) return;
      segments.push(
        barSegment(view, {
          from: 0,
          to: value,
          offset: centre - total / 2 + position * (thickness + BAR_GAP),
          thickness,
          outer: true,
          series: seriesIndex,
          index,
        }),
      );
    });
  }

  return svg`${segments}`;
}

export function renderCartesian(view: CartesianView): SVGTemplateResult {
  return svg`
    ${renderValueAxis(view)}
    ${renderBars(view)}
    ${renderLinesAndAreas(view)}
    ${renderCategoryAxis(view)}`;
}

/** Where the tooltip for the active category points: at its tallest mark. */
export function tooltipAnchor(view: CartesianView): { x: number; y: number } {
  const { layout, series, active, stacked } = view;
  const at = (index: number) => valuesOf(series[index])[active] ?? 0;

  let peak = layout.ticks.min;
  for (const mark of ['bar', 'area', 'line'] as const) {
    const values = layout.visible.filter((index) => layout.marks[index] === mark).map(at);
    if (values.length === 0) continue;
    // A stack is as tall as its positive values together; anything else, its largest value.
    const top =
      stacked && mark !== 'line'
        ? values.filter((value) => value > 0).reduce((sum, value) => sum + value, 0)
        : Math.max(...values);
    peak = Math.max(peak, top);
  }

  const across = categoryCentre(layout, active);
  const along = valuePosition(layout, Math.min(peak, layout.ticks.max));
  return layout.horizontal ? { x: along, y: across } : { x: across, y: along };
}
