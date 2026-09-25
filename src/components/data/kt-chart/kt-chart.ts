import { css, html, nothing, type SVGTemplateResult, type TemplateResult } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { emit, uniqueId } from '#internal/events';
import { strings } from '#internal/strings';
import type { Format, KtChartType, KtMark, KtSeries } from './model.js';
import {
  cartesianLayout,
  categoryAt,
  renderCartesian,
  tooltipAnchor,
  type CartesianView,
} from './cartesian.js';
import {
  nearestPoint,
  pointLayout,
  pointPosition,
  renderPoints,
  walkOrder,
  type PointView,
} from './point.js';
import {
  radarRadius,
  radialLayout,
  renderRadial,
  sliceAnchor,
  sliceAt,
  type RadialKind,
  type RadialView,
} from './radial.js';
import { polar } from './geometry.js';

export type { KtChartType, KtMark, KtPoint, KtSeries } from './model.js';

interface Box {
  readonly width: number;
  readonly height: number;
}

type Family = 'cartesian' | 'point' | 'radial';

const MAX_SLOTS = 8;

/** One row of the tooltip. */
interface TooltipRow {
  readonly color: string;
  readonly name: string;
  readonly value: string;
}

interface Tooltip {
  readonly title: string;
  readonly subtitle?: string;
  readonly rows: readonly TooltipRow[];
  readonly total?: string;
  readonly x: number;
  readonly y: number;
  /** Which side of the anchor the tooltip opens on. */
  readonly side: 'above' | 'left' | 'right';
}

/**
 * A chart, drawn from the token layer.
 *
 * Line, area and bar — stacked, sideways or mixed — plus scatter, bubble,
 * pie, doughnut, polar area and radar, all in Kanto's voice: the eight
 * categorical hues in fixed order, one value axis, recessive grid, and the
 * data always available as a table.
 *
 * **Colour.** One series takes the brand hue: with nothing to tell apart there
 * is no identity to encode, and the title names it. Two or more take the fixed
 * categorical order in `--chart-series-1…8`, assigned by position and never
 * cycled, so a series keeps its colour when a filter removes its neighbours.
 * Slices take the same order by slice.
 *
 * **The table is not optional.** Every chart also renders its data as a table,
 * visually hidden by default. It is what a screen reader reads, and it is the
 * relief that four of the light-theme series hues require, sitting as they do
 * below 3:1 on a light surface.
 *
 * @element kt-chart
 *
 * @csspart svg - The plot.
 * @csspart legend - The legend.
 * @csspart table - The data table.
 *
 * @fires kt-point-hover - The active point changed. `detail: { index, series }`;
 *   `index` is -1 when nothing is active, `series` -1 when the index spans
 *   every series.
 * @fires kt-series-toggle - A legend item was pressed. `detail: { series, hidden }`.
 *   Cancelable.
 *
 * @example
 * ```js
 * chart.labels = ['Jan', 'Feb', 'Mar'];
 * chart.series = [{ name: 'Revenue', values: [42, 58, 36] }];
 * ```
 */
export class KtChart extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: block;
        position: relative;
      }

      .plot {
        position: relative;
        width: 100%;
      }

      svg {
        display: block;
        width: 100%;
        overflow: visible;
        border-radius: var(--border-radius);
      }

      svg:focus-visible {
        outline: var(--outline-width) solid var(--color-primary-base);
        outline-offset: 4px;
      }

      /* Recessive: the data is the loud part. */
      .grid {
        stroke: var(--chart-grid);
        stroke-width: 1;
        opacity: 0.6;
      }

      .baseline {
        stroke: var(--chart-axis);
        stroke-width: 1;
        opacity: 0.5;
      }

      .axis-label,
      .tick-label {
        fill: var(--chart-axis);
        font: var(--font-normal-small);
        font-family: var(--font-family-body);
        font-variant-numeric: tabular-nums;
      }

      /* Ring values sit on top of the marks; a halo of the surface keeps them
         readable without boxing them in. */
      .ring-label {
        paint-order: stroke;
        stroke: var(--surface-card);
        stroke-width: 2px;
        stroke-linejoin: round;
      }

      .line {
        fill: none;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .point,
      .marker {
        stroke: var(--surface-card);
        stroke-width: 2;
      }

      .bar,
      .slice {
        transition: opacity var(--duration-fast) var(--easing-standard);
      }

      /* One entrance, when a mark first appears: bars grow from the baseline,
         lines draw along their length, everything else fades in. Nothing
         moves on hover, and the reduced-motion block in the token layer
         zeroes the duration. Backwards fill, so the animation never holds a
         value past its end — the dimming on hover stays in charge. */
      .bar {
        transform-box: fill-box;
        transform-origin: 50% 100%;
        animation: kt-chart-grow-y var(--duration-normal) var(--easing-standard) backwards;
      }
      .bar.negative {
        transform-origin: 50% 0;
      }
      .bar.sideways {
        transform-origin: 0 50%;
        animation-name: kt-chart-grow-x;
      }
      .bar.sideways.negative {
        transform-origin: 100% 50%;
      }

      .line {
        stroke-dasharray: 1;
        animation: kt-chart-draw var(--duration-normal) var(--easing-standard) backwards;
      }

      .area,
      .point,
      .dot,
      .slice,
      .radar {
        animation: kt-chart-fade var(--duration-normal) var(--easing-standard) backwards;
      }

      @keyframes kt-chart-grow-y {
        from {
          transform: scaleY(0);
        }
      }
      @keyframes kt-chart-grow-x {
        from {
          transform: scaleX(0);
        }
      }
      @keyframes kt-chart-draw {
        from {
          stroke-dashoffset: 1;
        }
      }
      @keyframes kt-chart-fade {
        from {
          opacity: 0;
        }
      }

      .radar {
        stroke-width: 2;
        stroke-linejoin: round;
        fill-opacity: 0.16;
      }

      .center-value {
        fill: var(--text-body);
        font: var(--font-title-h6);
        font-variant-numeric: tabular-nums;
      }

      .center-label {
        fill: var(--text-muted);
        font: var(--font-normal-small);
      }

      .crosshair {
        stroke: var(--chart-axis);
        stroke-width: 1;
        stroke-dasharray: 3 3;
      }

      .tooltip {
        position: absolute;
        z-index: var(--z-tooltip);
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 120px;
        padding: 8px 10px;
        color: var(--text-inverted);
        font: var(--font-normal-small);
        background: var(--surface-inverted);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-toast);
        pointer-events: none;
      }

      .tooltip.above {
        transform: translate(-50%, calc(-100% - 12px));
      }
      .tooltip.right {
        transform: translate(12px, -50%);
      }
      .tooltip.left {
        transform: translate(calc(-100% - 12px), -50%);
      }

      .tooltip-row {
        display: flex;
        align-items: center;
        gap: 6px;
        white-space: nowrap;
      }

      .swatch {
        flex: none;
        width: 8px;
        height: 8px;
        background: var(--swatch);
        border-radius: 2px;
      }

      .swatch.hollow {
        background: none;
        box-shadow: inset 0 0 0 var(--border-width) var(--swatch);
      }

      .tooltip-name {
        flex: 1;
        opacity: 0.75;
      }

      .tooltip-subtitle {
        margin-top: -2px;
        opacity: 0.75;
      }

      .tooltip-value {
        font-variant-numeric: tabular-nums;
      }

      .tooltip-total {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        margin-top: 2px;
        padding-top: 4px;
        border-top: var(--border-width) solid color-mix(in srgb, currentColor 20%, transparent);
        font-variant-numeric: tabular-nums;
      }

      .legend {
        display: flex;
        flex-wrap: wrap;
        gap: 4px 14px;
        margin-top: 10px;
      }

      .legend-item {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 2px 0;
        color: var(--text-muted);
        font: var(--font-normal-small);
        background: none;
        border: none;
        border-radius: var(--border-radius);
        cursor: pointer;
      }

      .legend-item:hover {
        color: var(--text-body);
      }

      .legend-item[aria-pressed='false'] {
        text-decoration: line-through;
        opacity: 0.6;
      }

      .legend-item:focus-visible {
        outline: var(--outline-width) solid var(--color-primary-base);
        outline-offset: 2px;
      }

      /* Present for assistive technology and for anyone who needs the
         numbers; show-table puts it on screen. */
      .table {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }

      :host([show-table]) .table {
        position: static;
        width: auto;
        height: auto;
        margin-top: 16px;
        overflow: visible;
        clip-path: none;
        white-space: normal;
      }

      :host([show-table]) table {
        width: 100%;
        border-collapse: collapse;
        font: var(--font-normal-small);
      }

      :host([show-table]) th,
      :host([show-table]) td {
        padding: 6px 10px;
        color: var(--text-muted);
        text-align: right;
        border-bottom: var(--border-width) solid var(--border-subtle);
      }

      :host([show-table]) th:first-child,
      :host([show-table]) td:first-child {
        color: var(--text-body);
        text-align: left;
      }
    `,
  ];

  @query('.plot')
  private plot!: HTMLElement;

  private observer?: ResizeObserver;
  private readonly tableId = uniqueId('kt-chart-table');

  @state()
  private box: Box = { width: 0, height: 0 };

  /** The active category, point or slice, or -1. */
  @state()
  private active = -1;

  /** The series the active point belongs to, for scatter and bubble; -1 otherwise. */
  @state()
  private activeSeries = -1;

  /**
   * Series hidden from the legend — or slices, for pie, doughnut and polar
   * area. Not `hidden`: that is HTMLElement's, and shadowing it would stop
   * `chart.hidden = true` from hiding the chart.
   */
  @state()
  private hiddenSeries: ReadonlySet<number> = new Set();

  @property({ type: String, reflect: true })
  type: KtChartType = 'area';

  @property({ attribute: false })
  series: readonly KtSeries[] = [];

  /** One label per index along the category axis, or per slice or spoke. */
  @property({ attribute: false })
  labels: readonly string[] = [];

  @property({ type: Number })
  height = 200;

  /** Formats a value for the value axis, the tooltip and the table. */
  @property({ attribute: false })
  format: Format = (value) => String(value);

  /** Formats the x value of a scatter or bubble point. */
  @property({ attribute: false })
  formatX: Format = (value) => String(value);

  /** Grid lines. */
  @property({ type: Boolean, attribute: 'no-grid' })
  noGrid = false;

  /** Hides the value axis labels, for a chart too small to carry them. */
  @property({ type: Boolean, attribute: 'no-axis' })
  noAxis = false;

  /** Puts the data table on screen instead of only in the accessibility tree. */
  @property({ type: Boolean, reflect: true, attribute: 'show-table' })
  showTable = false;

  /**
   * Smooths lines and areas through a monotone spline.
   *
   * Off by default on purpose: a curve between two samples draws values that
   * were never measured. Turn it on when the underlying quantity really is
   * continuous and the reader knows it.
   */
  @property({ type: Boolean })
  smooth = false;

  /** Bars, and areas, on top of one another instead of side by side. */
  @property({ type: Boolean })
  stacked = false;

  /** Bars along the horizontal axis, with the categories down the left. */
  @property({ type: Boolean })
  horizontal = false;

  /** Pins the bottom of the value axis. */
  @property({ type: Number })
  min: number | null = null;

  /** Pins the top of the value axis. */
  @property({ type: Number })
  max: number | null = null;

  /** Names the total in the middle of a doughnut. */
  @property({ type: String, attribute: 'center-label' })
  centerLabel: string | undefined = undefined;

  /** Names the sum in a stacked chart's tooltip and table. */
  @property({ type: String, attribute: 'total-label' })
  totalLabel: string | undefined = undefined;

  /** Accessible name. Say what the chart shows. */
  @property({ type: String })
  label = '';

  override connectedCallback(): void {
    super.connectedCallback();
    // Real pixel geometry rather than a scaled viewBox: a stretched viewBox
    // would scale the 2px strokes along with it.
    this.observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      this.box = { width: entry.contentRect.width, height: this.height };
    });
  }

  override firstUpdated(): void {
    if (this.plot) this.observer?.observe(this.plot);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.observer?.disconnect();
  }

  override willUpdate(changed: Map<PropertyKey, unknown>): void {
    // New data is a new picture: a series hidden from the old one has no
    // reason to stay hidden in this one, and an index may no longer exist.
    if (changed.has('series') || changed.has('type') || changed.has('labels')) {
      if (this.hiddenSeries.size > 0) this.hiddenSeries = new Set();
      if (this.active >= this.pointCount) {
        this.active = -1;
        this.activeSeries = -1;
      }
    }
  }

  /* ------------------------------------------------------------- helpers */

  private get family(): Family {
    if (this.type === 'scatter' || this.type === 'bubble') return 'point';
    if (
      this.type === 'pie' ||
      this.type === 'doughnut' ||
      this.type === 'polar-area' ||
      this.type === 'radar'
    ) {
      return 'radial';
    }
    return 'cartesian';
  }

  private get pointCount(): number {
    return Math.max(this.labels.length, 0, ...this.series.map((s) => s.values?.length ?? 0));
  }

  private colorOf = (index: number): string => {
    const series = this.series[index];
    if (series?.color) return series.color;
    // One series has no identity to encode; the brand hue reads as "the data".
    if (this.series.length === 1) return 'var(--color-primary-base)';
    return `var(--chart-series-${(index % MAX_SLOTS) + 1})`;
  };

  private measureContext: CanvasRenderingContext2D | null | undefined;

  /** Text width in the axis font. Estimated where there is no canvas to ask. */
  private measure = (text: string): number => {
    if (this.measureContext === undefined) {
      try {
        const context = document.createElement('canvas').getContext('2d');
        const family = getComputedStyle(this).getPropertyValue('--font-family-body').trim();
        if (context) context.font = `12px ${family || 'sans-serif'}`;
        this.measureContext = context;
      } catch {
        this.measureContext = null;
      }
    }
    return this.measureContext ? this.measureContext.measureText(text).width : text.length * 6.5;
  };

  private get cartesianView(): CartesianView {
    const input = {
      width: this.box.width,
      height: this.height,
      series: this.series,
      hidden: this.hiddenSeries,
      labels: this.labels,
      type: (this.family === 'cartesian' ? this.type : 'line') as KtMark,
      stacked: this.stacked,
      horizontal: this.horizontal,
      min: this.min,
      max: this.max,
      noAxis: this.noAxis,
      measure: this.measure,
      format: this.format,
    };
    return {
      ...input,
      layout: cartesianLayout(input),
      active: this.active,
      smooth: this.smooth,
      noGrid: this.noGrid,
      colorOf: this.colorOf,
      idPrefix: this.tableId,
    };
  }

  private get pointView(): PointView {
    const input = {
      width: this.box.width,
      height: this.height,
      series: this.series,
      hidden: this.hiddenSeries,
      bubble: this.type === 'bubble',
      min: this.min,
      max: this.max,
      noAxis: this.noAxis,
      measure: this.measure,
      format: this.format,
      formatX: this.formatX,
    };
    return {
      ...input,
      layout: pointLayout(input),
      active: this.active,
      activeSeries: this.activeSeries,
      noGrid: this.noGrid,
      colorOf: this.colorOf,
    };
  }

  /** Pie, doughnut and polar area: one series, whose slices are the labels. */
  private get sliced(): boolean {
    return this.type === 'pie' || this.type === 'doughnut' || this.type === 'polar-area';
  }

  private sliceColor = (index: number): string => `var(--chart-series-${(index % MAX_SLOTS) + 1})`;

  private get radialView(): RadialView {
    const input = {
      width: this.box.width,
      height: this.height,
      kind: this.type as RadialKind,
      series: this.series,
      hidden: this.hiddenSeries,
      labels: this.labels,
      measure: this.measure,
    };
    return {
      ...input,
      layout: radialLayout(input),
      active: this.active,
      noGrid: this.noGrid,
      noAxis: this.noAxis,
      centerLabel: this.centerLabel ?? strings().total,
      format: this.format,
      colorOf: this.colorOf,
      sliceColor: this.sliceColor,
    };
  }

  /** Whether there is anything to draw. */
  private get hasData(): boolean {
    return this.family === 'point'
      ? this.series.some((series) => (series.points?.length ?? 0) > 0)
      : this.pointCount > 0;
  }

  private setActive(index: number, series = -1): void {
    if (index === this.active && series === this.activeSeries) return;
    this.active = index;
    this.activeSeries = series;
    emit(this, 'kt-point-hover', { index, series });
  }

  /* --------------------------------------------------------- interaction */

  private onPointerMove(event: PointerEvent): void {
    if (this.box.width === 0) return;
    if (this.family === 'cartesian') {
      const index = categoryAt(this.cartesianView.layout, event.offsetX, event.offsetY);
      this.setActive(index);
    } else if (this.family === 'radial') {
      const view = this.radialView;
      this.setActive(sliceAt(view.layout, view.kind, event.offsetX, event.offsetY));
    } else if (this.family === 'point') {
      const view = this.pointView;
      const hit = nearestPoint(view, view.layout, event.offsetX, event.offsetY);
      this.setActive(hit?.index ?? -1, hit?.series ?? -1);
    }
  }

  private onPointerLeave(): void {
    this.setActive(-1);
  }

  /** How many positions the keyboard walks through, in order. */
  private get stops(): readonly number[] {
    const all = Array.from({ length: this.pointCount }, (_, index) => index);
    // A hidden slice is not there to land on.
    return this.sliced ? all.filter((index) => !this.hiddenSeries.has(index)) : all;
  }

  /**
   * Arrows walk the points, Home and End jump to the ends, Escape lets go.
   * Every move emits `kt-point-hover` and opens the tooltip, which is a live
   * region, so a keyboard user hears what a pointer user sees.
   */
  private onKeyDown(event: KeyboardEvent): void {
    if (this.family === 'point') {
      this.onPointKeyDown(event);
      return;
    }
    const stops = this.stops;
    if (stops.length === 0) return;

    const at = stops.indexOf(this.active);
    const last = stops.length - 1;
    const next: Record<string, number> = {
      ArrowRight: at < 0 ? 0 : Math.min(at + 1, last),
      ArrowDown: at < 0 ? 0 : Math.min(at + 1, last),
      ArrowLeft: at < 0 ? 0 : Math.max(at - 1, 0),
      ArrowUp: at < 0 ? 0 : Math.max(at - 1, 0),
      Home: 0,
      End: last,
    };

    if (event.key === 'Escape') {
      this.setActive(-1);
      return;
    }
    const target = next[event.key];
    if (target === undefined) return;

    event.preventDefault();
    this.setActive(stops[target]!);
  }

  /**
   * Scatter and bubble: left and right walk the current series in x order,
   * up and down move to the neighbouring visible series.
   */
  private onPointKeyDown(event: KeyboardEvent): void {
    const visible = this.series
      .map((series, index) => ({ index, count: series.points?.length ?? 0 }))
      .filter(({ index, count }) => count > 0 && !this.hiddenSeries.has(index))
      .map(({ index }) => index);
    if (visible.length === 0) return;

    if (event.key === 'Escape') {
      this.setActive(-1);
      return;
    }

    const seriesAt = visible.indexOf(this.activeSeries);
    const current = seriesAt < 0 ? visible[0]! : this.activeSeries;
    const order = walkOrder(this.series[current]);
    const at = seriesAt < 0 ? -1 : order.indexOf(this.active);
    const last = order.length - 1;

    const moveSeries = (step: number) => {
      const target =
        visible[Math.min(Math.max((seriesAt < 0 ? 0 : seriesAt) + step, 0), visible.length - 1)]!;
      this.setActive(walkOrder(this.series[target])[0]!, target);
    };

    switch (event.key) {
      case 'ArrowRight':
        this.setActive(order[at < 0 ? 0 : Math.min(at + 1, last)]!, current);
        break;
      case 'ArrowLeft':
        this.setActive(order[at < 0 ? 0 : Math.max(at - 1, 0)]!, current);
        break;
      case 'ArrowDown':
        moveSeries(seriesAt < 0 ? 0 : 1);
        break;
      case 'ArrowUp':
        moveSeries(seriesAt < 0 ? 0 : -1);
        break;
      case 'Home':
        this.setActive(order[0]!, current);
        break;
      case 'End':
        this.setActive(order[last]!, current);
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  private toggle(index: number): void {
    const hidden = !this.hiddenSeries.has(index);
    if (emit(this, 'kt-series-toggle', { series: index, hidden }).defaultPrevented) return;

    const next = new Set(this.hiddenSeries);
    if (hidden) next.add(index);
    else next.delete(index);
    this.hiddenSeries = next;
    this.setActive(-1);
  }

  /* ----------------------------------------------------------- rendering */

  private renderMarks(): SVGTemplateResult | typeof nothing {
    if (this.family === 'cartesian') return renderCartesian(this.cartesianView);
    if (this.family === 'point') return renderPoints(this.pointView);
    return renderRadial(this.radialView);
  }

  private get tooltip(): Tooltip | null {
    if (this.active < 0 || this.box.width === 0) return null;

    if (this.family === 'cartesian') {
      const view = this.cartesianView;
      const rows = view.layout.visible.map((index) => ({
        color: this.colorOf(index),
        name: this.series[index]!.name,
        value: this.format(this.series[index]!.values?.[this.active] ?? 0),
      }));
      const { x, y } = tooltipAnchor(view);
      // A stack is read as parts of a whole, so the whole is worth stating.
      const stackedParts = view.layout.visible.filter(
        (index) => this.stacked && view.layout.marks[index] !== 'line',
      );
      const total =
        stackedParts.length > 1
          ? this.format(
              stackedParts.reduce(
                (sum, index) => sum + (this.series[index]!.values?.[this.active] ?? 0),
                0,
              ),
            )
          : undefined;
      return {
        title: this.labels[this.active] ?? `#${this.active + 1}`,
        rows,
        ...(total === undefined ? {} : { total }),
        x,
        y,
        side: view.layout.horizontal ? 'right' : 'above',
      };
    }

    if (this.sliced) {
      const layout = this.radialView.layout;
      const value = this.series[0]?.values?.[this.active] ?? 0;
      const share = layout.total > 0 ? Math.round((Math.max(0, value) / layout.total) * 100) : 0;
      const [x, y] = sliceAnchor(layout, this.active);
      return {
        title: this.labels[this.active] ?? `#${this.active + 1}`,
        rows: [
          {
            color: this.sliceColor(this.active),
            name: this.series[0]?.name ?? '',
            value: `${this.format(value)} (${share}%)`,
          },
        ],
        x,
        y,
        side: 'above',
      };
    }

    if (this.type === 'radar') {
      const layout = this.radialView.layout;
      const visible = this.series
        .map((_, index) => index)
        .filter((index) => !this.hiddenSeries.has(index));
      const peak = Math.max(
        layout.ticks.min,
        ...visible.map((index) => this.series[index]!.values?.[this.active] ?? layout.ticks.min),
      );
      const angle = layout.slices[this.active]?.start ?? 0;
      const [x, y] = polar(layout.cx, layout.cy, radarRadius(layout, peak), angle);
      return {
        title: this.labels[this.active] ?? `#${this.active + 1}`,
        rows: visible.map((index) => ({
          color: this.colorOf(index),
          name: this.series[index]!.name,
          value: this.format(this.series[index]!.values?.[this.active] ?? 0),
        })),
        x,
        y,
        side: 'above',
      };
    }

    if (this.family === 'point') {
      const series = this.series[this.activeSeries];
      const point = series?.points?.[this.active];
      if (!series || !point) return null;

      const [x, y] = pointPosition(this.pointView.layout, point);
      const color = this.colorOf(this.activeSeries);
      const rows: TooltipRow[] = [
        { color, name: 'x', value: this.formatX(point.x) },
        { color, name: 'y', value: this.format(point.y) },
      ];
      if (this.type === 'bubble' && point.r !== undefined) {
        rows.push({ color, name: 'r', value: String(point.r) });
      }
      // A named point is titled by its name; the series then goes underneath.
      return {
        title: point.label ?? series.name,
        ...(point.label ? { subtitle: series.name } : {}),
        rows,
        x,
        y,
        side: 'above',
      };
    }

    return null;
  }

  private renderTooltip(): TemplateResult | typeof nothing {
    const tooltip = this.tooltip;
    if (!tooltip) return nothing;

    // Keep it inside the chart and off the mark it describes. With no room
    // above, it opens beside the mark rather than below it — below would sit
    // right on top of a tall bar. Beside means to the right, or to the left
    // near the right edge, and never past the top or bottom.
    const estimatedHeight = 36 + tooltip.rows.length * 20 + (tooltip.total ? 24 : 0);
    const clearance = 20;
    let side = tooltip.side;
    let x = tooltip.x;
    let y = tooltip.y;

    if (side === 'above' && tooltip.y - estimatedHeight < 0) {
      side = 'right';
      x = tooltip.x + clearance;
    }
    if (side === 'right' && x + 180 > this.box.width) {
      side = 'left';
      x = tooltip.x - (tooltip.side === 'above' ? clearance : 0);
    }
    if (side === 'above') {
      x = Math.min(Math.max(x, 72), Math.max(72, this.box.width - 72));
    } else {
      y = Math.min(
        Math.max(y, estimatedHeight / 2),
        Math.max(estimatedHeight / 2, this.height - estimatedHeight / 2),
      );
    }

    return html`<div class=${`tooltip ${side}`} style=${`left:${x}px;top:${y}px`} role="status">
      <strong>${tooltip.title}</strong>
      ${tooltip.subtitle ? html`<span class="tooltip-subtitle">${tooltip.subtitle}</span>` : nothing}
      ${tooltip.rows.map(
        (row) =>
          html`<span class="tooltip-row">
            <span class="swatch" style=${`--swatch:${row.color}`}></span>
            <span class="tooltip-name">${row.name}</span>
            <span class="tooltip-value">${row.value}</span>
          </span>`,
      )}
      ${
        tooltip.total
          ? html`<span class="tooltip-total"
              ><span>${this.totalLabel ?? strings().total}</span><span>${tooltip.total}</span></span
            >`
          : nothing
      }
    </div>`;
  }

  private renderLegend(): TemplateResult | typeof nothing {
    // Slices always need naming; series only once there are two to tell apart.
    const entries = this.sliced
      ? Array.from({ length: this.pointCount }, (_, index) => ({
          name: this.labels[index] ?? `#${index + 1}`,
          color: this.sliceColor(index),
        }))
      : this.series.map((series, index) => ({ name: series.name, color: this.colorOf(index) }));
    if (entries.length === 0 || (!this.sliced && entries.length < 2)) return nothing;

    return html`<div part="legend" class="legend">
      ${entries.map((entry, index) => {
        const hidden = this.hiddenSeries.has(index);
        return html`<button
          type="button"
          class="legend-item"
          aria-pressed=${hidden ? 'false' : 'true'}
          @click=${() => this.toggle(index)}
        >
          <span
            class=${classMap({ swatch: true, hollow: hidden })}
            style=${`--swatch:${entry.color}`}
          ></span>
          ${entry.name}
        </button>`;
      })}
    </div>`;
  }

  private renderPointTable(): TemplateResult {
    const bubble = this.type === 'bubble';
    return html`<div part="table" class="table" id=${this.tableId}>
      <table>
        <caption>
          ${this.label || strings().chartData}
        </caption>
        <thead>
          <tr>
            <th scope="col">${strings().chartSeries}</th>
            <th scope="col">${strings().chartPoint}</th>
            <th scope="col">x</th>
            <th scope="col">y</th>
            ${bubble ? html`<th scope="col">r</th>` : nothing}
          </tr>
        </thead>
        <tbody>
          ${this.series.flatMap((series) =>
            (series.points ?? []).map(
              (point, index) =>
                html`<tr>
                  <th scope="row">${series.name}</th>
                  <td>${point.label ?? `#${index + 1}`}</td>
                  <td>${this.formatX(point.x)}</td>
                  <td>${this.format(point.y)}</td>
                  ${bubble ? html`<td>${point.r ?? ''}</td>` : nothing}
                </tr>`,
            ),
          )}
        </tbody>
      </table>
    </div>`;
  }

  private renderSliceTable(): TemplateResult {
    const values = this.series[0]?.values ?? [];
    const total = values.reduce((sum, value) => sum + Math.max(0, value), 0);
    return html`<div part="table" class="table" id=${this.tableId}>
      <table>
        <caption>
          ${this.label || strings().chartData}
        </caption>
        <thead>
          <tr>
            <th scope="col">${strings().chartSlice}</th>
            <th scope="col">${this.series[0]?.name ?? strings().chartValue}</th>
            <th scope="col">${strings().chartShare}</th>
          </tr>
        </thead>
        <tbody>
          ${Array.from({ length: this.pointCount }, (_, index) => {
            const value = values[index] ?? 0;
            const share = total > 0 ? Math.round((Math.max(0, value) / total) * 100) : 0;
            return html`<tr>
              <th scope="row">${this.labels[index] ?? `#${index + 1}`}</th>
              <td>${this.format(value)}</td>
              <td>${share}%</td>
            </tr>`;
          })}
        </tbody>
      </table>
    </div>`;
  }

  private renderTable(): TemplateResult {
    if (this.family === 'point') return this.renderPointTable();
    if (this.sliced) return this.renderSliceTable();

    const withTotal = this.family === 'cartesian' && this.stacked && this.series.length > 1;
    const totalAt = (index: number) =>
      this.series.reduce(
        (sum, series) => sum + (series.type === 'line' ? 0 : (series.values?.[index] ?? 0)),
        0,
      );

    return html`<div part="table" class="table" id=${this.tableId}>
      <table>
        <caption>
          ${this.label || strings().chartData}
        </caption>
        <thead>
          <tr>
            <th scope="col">${strings().chartPoint}</th>
            ${this.series.map((series) => html`<th scope="col">${series.name}</th>`)}
            ${withTotal ? html`<th scope="col">${this.totalLabel ?? strings().total}</th>` : nothing}
          </tr>
        </thead>
        <tbody>
          ${Array.from(
            { length: this.pointCount },
            (_, index) =>
              html`<tr>
                <th scope="row">${this.labels[index] ?? `#${index + 1}`}</th>
                ${this.series.map(
                  (series) => html`<td>${this.format(series.values?.[index] ?? 0)}</td>`,
                )}
                ${withTotal ? html`<td>${this.format(totalAt(index))}</td>` : nothing}
              </tr>`,
          )}
        </tbody>
      </table>
    </div>`;
  }

  override render(): TemplateResult {
    const ready = this.box.width > 0 && this.hasData;

    return html`<div class="plot" style=${`height:${this.height}px`}>
        <svg
          part="svg"
          width=${this.box.width}
          height=${this.height}
          role="img"
          aria-label=${this.label || nothing}
          aria-describedby=${this.tableId}
          tabindex="0"
          @pointermove=${this.onPointerMove}
          @pointerleave=${this.onPointerLeave}
          @keydown=${this.onKeyDown}
          @blur=${this.onPointerLeave}
        >
          ${ready ? this.renderMarks() : nothing}
        </svg>
        ${this.renderTooltip()}
      </div>
      ${this.renderLegend()} ${this.renderTable()}`;
  }
}

defineElement('kt-chart', KtChart);

declare global {
  interface HTMLElementTagNameMap {
    'kt-chart': KtChart;
  }
}
