import { css, html, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { KtElement, defineElement } from 'kanto-ds/internal/kt-element';

export interface KtMeterSegment {
  readonly label: string;
  readonly value: number;
  /** Any CSS colour. Defaults to the chart palette slot for its position. */
  readonly color?: string;
}

/**
 * How a fixed total is spent: storage by file type, a budget by category, seats
 * by role.
 *
 * Against `<kt-progress-bar>`: a progress bar answers "how far along", so it
 * fills toward completion and turns green when it gets there. A meter answers
 * "how is it divided", so it is full from the start and reaching the end is
 * bad news, not good. Different question, different component — and the bar
 * that shows one and means the other is a common way to mislead a reader.
 *
 * @element kt-meter
 *
 * @csspart base - The container.
 * @csspart track - The bar.
 * @csspart legend - The legend list.
 *
 * @example
 * ```html
 * <kt-meter label="Storage" used="25.8 GB used" total="of 983 GB" value="3"></kt-meter>
 * ```
 * ```js
 * meter.segments = [
 *   { label: 'Documents', value: 16.1 },
 *   { label: 'Photos', value: 3.9 },
 * ];
 * meter.max = 983;
 * ```
 */
export class KtMeter extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: block;
      }

      .meter {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .top {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
      }

      .label {
        color: var(--text-body);
        font: var(--font-medium-regular);
      }

      .caption {
        color: var(--text-muted);
        font: var(--font-normal-small);
        font-variant-numeric: tabular-nums;
      }

      .track {
        display: flex;
        gap: 2px;
        width: 100%;
        height: var(--kt-meter-height, 8px);
        overflow: hidden;
        background: var(--surface-raised);
        border-radius: var(--radius-full);
      }

      /* A 2px surface gap between fills, so two adjacent segments of similar
         hue still read as two. */
      .segment {
        min-width: 2px;
        height: 100%;
        border-radius: var(--radius-full);
      }

      .legend {
        display: flex;
        flex-wrap: wrap;
        gap: 6px 18px;
        margin: 4px 0 0;
        padding: 0;
        list-style: none;
      }

      .legend li {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--text-muted);
        font: var(--font-normal-small);
      }

      .dot {
        flex: none;
        width: 8px;
        height: 8px;
        border-radius: var(--radius-full);
      }

      .legend .value {
        color: var(--text-body);
        font-variant-numeric: tabular-nums;
      }
    `,
  ];

  @property({ type: String })
  label = '';

  /** Free text on the left of the caption row — "25.8 GB used". */
  @property({ type: String })
  used = '';

  /** Free text on the right of the caption row — "of 983 GB". */
  @property({ type: String })
  total = '';

  /** A single filled proportion, as a percentage. Ignored when `segments` is set. */
  @property({ type: Number })
  value = 0;

  /** The composition. Positions map to `--chart-series-N` unless given a colour. */
  @property({ attribute: false })
  segments: readonly KtMeterSegment[] = [];

  /** The total the segments are measured against. Defaults to their sum. */
  @property({ type: Number })
  max = 0;

  /** Renders the segment list under the bar. */
  @property({ type: Boolean, attribute: 'show-legend' })
  showLegend = false;

  /** Formats a segment value in the legend. */
  @property({ attribute: false })
  format: (value: number) => string = (value) => String(value);

  private get scale(): number {
    if (this.max > 0) return this.max;
    const sum = this.segments.reduce((total, segment) => total + Math.max(segment.value, 0), 0);
    return sum > 0 ? sum : 100;
  }

  private colorAt(index: number, segment: KtMeterSegment): string {
    // Eight slots, fixed order, never cycled — a ninth series folds into
    // "Other" rather than starting the palette again under a new meaning.
    return segment.color ?? `var(--chart-series-${Math.min(index + 1, 8)})`;
  }

  private renderTrack(): TemplateResult {
    if (this.segments.length === 0) {
      const filled = Math.min(Math.max(this.value, 0), 100);
      return html`<div part="track" class="track">
        <div class="segment" style="width:${filled}%;background:var(--color-primary-base)"></div>
      </div>`;
    }

    const scale = this.scale;
    return html`<div part="track" class="track">
      ${this.segments.map((segment, index) => {
        const share = (Math.max(segment.value, 0) / scale) * 100;
        return html`<div
          class="segment"
          style="width:${share}%;background:${this.colorAt(index, segment)}"
        ></div>`;
      })}
    </div>`;
  }

  override render(): TemplateResult {
    const scale = this.scale;
    const filled =
      this.segments.length > 0
        ? this.segments.reduce((total, segment) => total + Math.max(segment.value, 0), 0)
        : (Math.min(Math.max(this.value, 0), 100) / 100) * scale;

    return html`<div
      part="base"
      class="meter"
      role="meter"
      aria-label=${this.label || nothing}
      aria-valuemin="0"
      aria-valuemax=${scale}
      aria-valuenow=${Math.round(filled * 100) / 100}
      aria-valuetext=${this.used && this.total ? `${this.used} ${this.total}` : nothing}
    >
      ${
        this.label || this.used || this.total
          ? html`<div class="top">
              ${this.label ? html`<span class="label">${this.label}</span>` : nothing}
              ${
                this.used || this.total
                  ? html`<span class="caption">${this.used} ${this.total}</span>`
                  : nothing
              }
            </div>`
          : nothing
      }
      ${this.renderTrack()}
      ${
        this.showLegend && this.segments.length > 0
          ? html`<ul part="legend" class="legend">
              ${this.segments.map(
                (segment, index) =>
                  html`<li>
                    <span class="dot" style="background:${this.colorAt(index, segment)}"></span>
                    <span>${segment.label}</span>
                    <span class="value">${this.format(segment.value)}</span>
                  </li>`,
              )}
            </ul>`
          : nothing
      }
    </div>`;
  }
}

defineElement('kt-meter', KtMeter);

declare global {
  interface HTMLElementTagNameMap {
    'kt-meter': KtMeter;
  }
}
