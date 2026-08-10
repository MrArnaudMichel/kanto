import { css, html, nothing, svg, type SVGTemplateResult, type TemplateResult } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { KtElement, defineElement } from '../../../internal/kt-element.js';
import { emit, uniqueId } from '../../../internal/events.js';

export type KtChartType = 'area' | 'line' | 'bar';

export interface KtSeries {
  readonly name: string;
  readonly values: readonly number[];
  /** Overrides the slot this series would take from the categorical order. */
  readonly color?: string;
}

interface Box {
  readonly width: number;
  readonly height: number;
}

/** Room for the axis labels; the plot gets the rest. */
const PADDING = { top: 12, right: 4, bottom: 22, left: 4 };
const MAX_SLOTS = 8;

/**
 * A small chart, drawn from the token layer.
 *
 * Deliberately narrow: one axis, one to eight series, three marks. It is the
 * shape a product dashboard actually needs, not a charting library — anything
 * past this and you want a real one.
 *
 * **Colour.** One series takes the brand hue: with nothing to tell apart there
 * is no identity to encode, and the title names it. Two or more take the fixed
 * categorical order in `--chart-series-1…8`, assigned by position and never
 * cycled, so a series keeps its colour when a filter removes its neighbours.
 * Those hues are kept clear of the semantic palette, so a line can never be
 * mistaken for a status.
 *
 * **The table is not optional.** Every chart also renders its data as a table,
 * visually hidden by default. It is what a screen reader reads, and it is the
 * relief that four of the light-theme series hues require, sitting as they do
 * below 3:1 on a light surface.
 *
 * @element kt-chart
 *
 * @csspart svg - The plot.
 * @csspart legend - The legend, when there are two or more series.
 * @csspart table - The data table.
 *
 * @fires kt-point-hover - The hovered index changed. `detail: { index }`,
 *   with `index` of -1 when the pointer leaves.
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
      }

      /* Recessive: the data is the loud part. */
      .grid {
        stroke: var(--chart-grid);
        stroke-width: 1;
        opacity: 0.6;
      }

      .axis-label {
        fill: var(--chart-axis);
        font: var(--font-normal-small);
        font-family: var(--font-family-body);
      }

      .line {
        fill: none;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .marker {
        stroke: var(--surface-card);
        stroke-width: 2;
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
        transform: translate(-50%, calc(-100% - 12px));
      }

      .tooltip-row {
        display: flex;
        align-items: center;
        gap: 6px;
        white-space: nowrap;
      }

      .swatch {
        width: 8px;
        height: 8px;
        border-radius: 2px;
      }

      .tooltip-name {
        flex: 1;
        opacity: 0.75;
      }

      .tooltip-value {
        font-variant-numeric: tabular-nums;
      }

      .legend {
        display: flex;
        flex-wrap: wrap;
        gap: 14px;
        margin-top: 10px;
      }

      .legend-item {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--text-muted);
        font: var(--font-normal-small);
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

  @state()
  private active = -1;

  @property({ type: String, reflect: true })
  type: KtChartType = 'area';

  @property({ attribute: false })
  series: readonly KtSeries[] = [];

  /** One label per index along the x axis. */
  @property({ attribute: false })
  labels: readonly string[] = [];

  @property({ type: Number })
  height = 200;

  /** Formats a value for the tooltip and the table. */
  @property({ attribute: false })
  format: (value: number) => string = (value) => String(value);

  /** Horizontal grid lines. */
  @property({ type: Boolean, attribute: 'no-grid' })
  noGrid = false;

  /** Puts the data table on screen instead of only in the accessibility tree. */
  @property({ type: Boolean, reflect: true, attribute: 'show-table' })
  showTable = false;

  /**
   * Smooths the line through a monotone spline.
   *
   * Off by default on purpose: a curve between two samples draws values that
   * were never measured. Turn it on when the underlying quantity really is
   * continuous and the reader knows it.
   */
  @property({ type: Boolean })
  smooth = false;

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

  private colorFor(index: number, series: KtSeries): string {
    if (series.color) return series.color;
    // One series has no identity to encode; the brand hue reads as "the data".
    if (this.series.length === 1) return 'var(--color-primary-base)';
    return `var(--chart-series-${(index % MAX_SLOTS) + 1})`;
  }

  private get pointCount(): number {
    return Math.max(0, ...this.series.map((s) => s.values.length));
  }

  private get bounds(): { min: number; max: number } {
    const all = this.series.flatMap((s) => [...s.values]);
    if (all.length === 0) return { min: 0, max: 1 };

    const max = Math.max(...all, 0);
    const min = Math.min(...all, 0);
    return { min, max: max === min ? min + 1 : max };
  }

  private get plotArea() {
    return {
      x: PADDING.left,
      y: PADDING.top,
      width: Math.max(0, this.box.width - PADDING.left - PADDING.right),
      height: Math.max(0, this.height - PADDING.top - PADDING.bottom),
    };
  }

  private xFor(index: number): number {
    const area = this.plotArea;
    const count = this.pointCount;
    if (count <= 1) return area.x + area.width / 2;
    return area.x + (index / (count - 1)) * area.width;
  }

  private yFor(value: number): number {
    const area = this.plotArea;
    const { min, max } = this.bounds;
    return area.y + area.height - ((value - min) / (max - min)) * area.height;
  }

  /**
   * A monotone cubic path — it never overshoots the samples, which a plain
   * cardinal spline happily does, inventing peaks that are not in the data.
   */
  private pathFor(values: readonly number[]): string {
    const points = values.map((value, index) => [this.xFor(index), this.yFor(value)] as const);
    if (points.length === 0) return '';
    if (points.length === 1 || !this.smooth) {
      return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
    }

    let path = `M${points[0]![0]},${points[0]![1]}`;
    for (let i = 0; i < points.length - 1; i += 1) {
      const [x0, y0] = points[i]!;
      const [x1, y1] = points[i + 1]!;
      const dx = (x1 - x0) / 3;
      path += ` C${x0 + dx},${y0} ${x1 - dx},${y1} ${x1},${y1}`;
    }
    return path;
  }

  private onPointerMove(event: PointerEvent): void {
    const area = this.plotArea;
    const count = this.pointCount;
    if (count === 0 || area.width === 0) return;

    const x = event.offsetX - area.x;
    const index = Math.round((x / area.width) * (count - 1));
    const clamped = Math.min(Math.max(index, 0), count - 1);

    if (clamped === this.active) return;
    this.active = clamped;
    emit(this, 'kt-point-hover', { index: clamped });
  }

  private onPointerLeave(): void {
    if (this.active === -1) return;
    this.active = -1;
    emit(this, 'kt-point-hover', { index: -1 });
  }

  private renderGrid(): SVGTemplateResult | typeof nothing {
    if (this.noGrid) return nothing;
    const area = this.plotArea;

    return svg`${[0, 0.25, 0.5, 0.75, 1].map((step) => {
      const y = area.y + area.height * step;
      return svg`<line class="grid" x1=${area.x} y1=${y} x2=${area.x + area.width} y2=${y} />`;
    })}`;
  }

  private renderBars(): SVGTemplateResult {
    const area = this.plotArea;
    const count = this.pointCount;
    const groups = this.series.length;
    // A 2px gap of surface between neighbours, so two bars never fuse.
    const slot = count > 0 ? area.width / count : 0;
    const barWidth = Math.max(2, slot / groups - 2);
    const baseline = this.yFor(Math.max(0, this.bounds.min));

    return svg`${this.series.map((series, s) =>
      series.values.map((value, i) => {
        const y = this.yFor(value);
        const x = area.x + i * slot + (slot - barWidth * groups) / 2 + s * barWidth;
        const height = Math.max(1, baseline - y);
        return svg`<rect
          x=${x} y=${y} width=${barWidth} height=${height}
          rx="4" ry="4"
          fill=${this.colorFor(s, series)}
          opacity=${this.active === -1 || this.active === i ? 1 : 0.45}
        />`;
      }),
    )}`;
  }

  private renderLines(): SVGTemplateResult {
    const area = this.plotArea;

    return svg`${this.series.map((series, index) => {
      const color = this.colorFor(index, series);
      const path = this.pathFor(series.values);
      const gradient = `${this.tableId}-fill-${index}`;

      return svg`
        ${
          this.type === 'area'
            ? svg`
              <defs>
                <linearGradient id=${gradient} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color=${color} stop-opacity="0.28" />
                  <stop offset="100%" stop-color=${color} stop-opacity="0.02" />
                </linearGradient>
              </defs>
              <path
                d=${`${path} L${this.xFor(series.values.length - 1)},${area.y + area.height} L${this.xFor(0)},${area.y + area.height} Z`}
                fill=${`url(#${gradient})`}
              />`
            : nothing
        }
        <path class="line" d=${path} stroke=${color} />
        ${
          this.active >= 0 && series.values[this.active] !== undefined
            ? svg`<circle
                class="marker"
                cx=${this.xFor(this.active)}
                cy=${this.yFor(series.values[this.active]!)}
                r="5"
                fill=${color}
              />`
            : nothing
        }`;
    })}`;
  }

  private renderAxis(): SVGTemplateResult {
    const area = this.plotArea;
    const count = this.pointCount;
    // Thin the labels rather than letting them collide.
    const every = Math.max(1, Math.ceil(count / Math.max(1, Math.floor(area.width / 56))));

    return svg`${this.labels.map((text, index) =>
      index % every === 0
        ? svg`<text
            class="axis-label"
            x=${this.xFor(index)}
            y=${area.y + area.height + 16}
            text-anchor="middle"
          >${text}</text>`
        : nothing,
    )}`;
  }

  private renderTooltip(): TemplateResult | typeof nothing {
    if (this.active < 0 || this.box.width === 0) return nothing;

    return html`<div
      class="tooltip"
      style=${`left:${this.xFor(this.active)}px;top:${this.plotArea.y + this.plotArea.height}px`}
      role="status"
    >
      <strong>${this.labels[this.active] ?? `#${this.active + 1}`}</strong>
      ${this.series.map(
        (series, index) =>
          html`<span class="tooltip-row">
            <span class="swatch" style=${`background:${this.colorFor(index, series)}`}></span>
            <span class="tooltip-name">${series.name}</span>
            <span class="tooltip-value">${this.format(series.values[this.active] ?? 0)}</span>
          </span>`,
      )}
    </div>`;
  }

  override render(): TemplateResult {
    const area = this.plotArea;
    const ready = this.box.width > 0 && this.pointCount > 0;

    return html`<div class="plot" style=${`height:${this.height}px`}>
        <svg
          part="svg"
          width=${this.box.width}
          height=${this.height}
          role="img"
          aria-label=${this.label || nothing}
          aria-describedby=${this.tableId}
          @pointermove=${this.onPointerMove}
          @pointerleave=${this.onPointerLeave}
        >
          ${ready ? this.renderGrid() : nothing}
          ${ready && this.type === 'bar' ? this.renderBars() : nothing}
          ${ready && this.type !== 'bar' ? this.renderLines() : nothing}
          ${
            ready && this.active >= 0 && this.type !== 'bar'
              ? svg`<line
              class="crosshair"
              x1=${this.xFor(this.active)} y1=${area.y}
              x2=${this.xFor(this.active)} y2=${area.y + area.height}
            />`
              : nothing
          }
          ${ready ? this.renderAxis() : nothing}
        </svg>
        ${this.renderTooltip()}
      </div>

      ${
        this.series.length > 1
          ? html`<div part="legend" class="legend">
              ${this.series.map(
                (series, index) =>
                  html`<span class="legend-item">
                    <span
                      class="swatch"
                      style=${`background:${this.colorFor(index, series)}`}
                    ></span>
                    ${series.name}
                  </span>`,
              )}
            </div>`
          : nothing
      }

      <div part="table" class="table" id=${this.tableId}>
        <table>
          <caption>
            ${this.label || 'Chart data'}
          </caption>
          <thead>
            <tr>
              <th scope="col">Point</th>
              ${this.series.map((series) => html`<th scope="col">${series.name}</th>`)}
            </tr>
          </thead>
          <tbody>
            ${Array.from(
              { length: this.pointCount },
              (_, index) =>
                html`<tr>
                  <th scope="row">${this.labels[index] ?? `#${index + 1}`}</th>
                  ${this.series.map(
                    (series) => html`<td>${this.format(series.values[index] ?? 0)}</td>`,
                  )}
                </tr>`,
            )}
          </tbody>
        </table>
      </div>`;
  }
}

defineElement('kt-chart', KtChart);

declare global {
  interface HTMLElementTagNameMap {
    'kt-chart': KtChart;
  }
}
