import { css, html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { emit } from '#internal/events';
import { attachFormInternals, setFormValue, type UsableInternals } from '#internal/form-control';
import { strings } from '#internal/strings';

/**
 * A value picked by sliding along a range: a volume, a threshold, or with
 * `range`, a price between two ends.
 *
 * Each thumb is a native `<input type="range">`, so the keyboard — arrows,
 * Page Up and Down, Home and End — and what a screen reader announces come
 * from the platform. The value is text, like a form field's: `"40"`, or
 * `"20/80"` with `range`, low then high. It is kept within `min` and `max`
 * and on `step`, and two thumbs never cross.
 *
 * @element kt-slider
 *
 * @csspart track - The rail.
 * @csspart fill - The selected stretch of it.
 * @csspart value - The shown value, with `show-value`.
 *
 * @fires kt-input - While sliding. `detail: { value }`.
 * @fires kt-change - Once let go. `detail: { value }`.
 *
 * @example
 * ```html
 * <kt-slider label="Volume" value="40" show-value></kt-slider>
 * <kt-slider label="Price" range min="0" max="500" step="10" value="50/300"></kt-slider>
 * ```
 */
export class KtSlider extends KtElement {
  static readonly formAssociated = true;

  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: block;
        --kt-slider-thumb: calc(18px * var(--density-scale, 1));
        --kt-slider-track: 6px;
      }
      :host([disabled]) {
        opacity: 0.5;
      }

      .head {
        display: flex;
        justify-content: space-between;
        gap: var(--gap-button);
        margin-bottom: 8px;
        color: var(--text-body);
        font: var(--font-normal-regular);
      }
      .value {
        color: var(--text-muted);
        font-variant-numeric: tabular-nums;
      }

      .control {
        position: relative;
        height: var(--kt-slider-thumb);
      }
      .track,
      .fill {
        position: absolute;
        top: 50%;
        height: var(--kt-slider-track);
        border-radius: var(--radius-full);
        transform: translateY(-50%);
      }
      .track {
        right: 0;
        left: 0;
        background: var(--color-dark-22);
      }
      .fill {
        background: var(--color-primary-base);
      }

      /* The native inputs lie over the track, invisible but for their thumbs:
         two can share it, and each thumb still catches its own pointer. */
      input {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        margin: 0;
        background: none;
        pointer-events: none;
        appearance: none;
      }
      input:focus {
        outline: none;
      }
      input::-webkit-slider-runnable-track {
        height: 100%;
        background: none;
      }
      input::-moz-range-track {
        background: none;
      }
      input::-webkit-slider-thumb {
        width: var(--kt-slider-thumb);
        height: var(--kt-slider-thumb);
        background: var(--color-white);
        border: 2px solid var(--color-primary-base);
        border-radius: 50%;
        box-shadow: 0 1px 3px color-mix(in srgb, var(--color-backdrop) 70%, transparent);
        cursor: grab;
        pointer-events: auto;
        appearance: none;
        transition: box-shadow var(--duration-instant);
      }
      input::-moz-range-thumb {
        box-sizing: border-box;
        width: var(--kt-slider-thumb);
        height: var(--kt-slider-thumb);
        background: var(--color-white);
        border: 2px solid var(--color-primary-base);
        border-radius: 50%;
        box-shadow: 0 1px 3px color-mix(in srgb, var(--color-backdrop) 70%, transparent);
        cursor: grab;
        pointer-events: auto;
      }
      input:focus-visible::-webkit-slider-thumb {
        box-shadow:
          0 0 0 4px var(--color-primary-soft),
          0 0 0 2px var(--color-primary-base);
      }
      input:focus-visible::-moz-range-thumb {
        box-shadow:
          0 0 0 4px var(--color-primary-soft),
          0 0 0 2px var(--color-primary-base);
      }
      input:disabled::-webkit-slider-thumb {
        cursor: not-allowed;
      }
    `,
  ];

  /** `"40"`, or `"20/80"` with `range`. Kept within bounds and on the step. */
  @property({ type: String, reflect: true })
  value = '';

  @property({ type: Number })
  min = 0;

  @property({ type: Number })
  max = 100;

  @property({ type: Number })
  step = 1;

  /** Two thumbs: a low and a high end. */
  @property({ type: Boolean, reflect: true })
  range = false;

  /** Accessible name; shown above the slider with `show-value`. */
  @property({ type: String })
  label = '';

  @property({ type: String })
  name = '';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  /** Shows the label and the current value above the slider. */
  @property({ type: Boolean, attribute: 'show-value' })
  showValue = false;

  /** How a number is shown and announced: `(n) => \`$${n}\``. */
  @property({ attribute: false })
  format: (value: number) => string = (value) => String(value);

  @state() private formDisabled = false;

  private internals: UsableInternals | null = null;
  private defaultValue = '';

  override connectedCallback(): void {
    super.connectedCallback();
    this.internals ??= attachFormInternals(this);
    this.value = this.normalised(this.value);
    this.defaultValue = this.value;
  }

  override willUpdate(changed: PropertyValues<this>): void {
    if (
      changed.has('value') ||
      changed.has('min') ||
      changed.has('max') ||
      changed.has('step') ||
      changed.has('range')
    ) {
      const normalised = this.normalised(this.value);
      if (normalised !== this.value) this.value = normalised;
      setFormValue(this.internals, this.value);
    }
  }

  formResetCallback(): void {
    this.value = this.defaultValue;
  }

  formDisabledCallback(disabled: boolean): void {
    this.formDisabled = disabled;
  }

  formStateRestoreCallback(state: string | null): void {
    if (state !== null) this.value = state;
  }

  /** The thumbs' numbers: one, or low and high. */
  private get numbers(): number[] {
    return this.value.split('/').map(Number);
  }

  /** `n` within bounds and on the step. */
  private snap(n: number): number {
    if (!Number.isFinite(n)) return this.min;
    const step = this.step > 0 ? this.step : 1;
    const snapped = this.min + Math.round((n - this.min) / step) * step;
    // Rounding to the step's decimals keeps 0.1 + 0.2 from showing as 0.30000000000000004.
    const decimals = (String(step).split('.')[1] ?? '').length;
    return Number(Math.min(this.max, Math.max(this.min, snapped)).toFixed(decimals));
  }

  private normalised(value: string): string {
    const parts = value === '' ? [] : value.split('/').map(Number);
    if (!this.range) return String(this.snap(parts[0] ?? this.min));
    const low = this.snap(parts[0] ?? this.min);
    const high = this.snap(parts[1] ?? this.max);
    return `${Math.min(low, high)}/${Math.max(low, high)}`;
  }

  /** A thumb moved: the low one cannot pass the high one, nor the other way. */
  private onSlide(event: Event, index: number, commit: boolean): void {
    const input = event.target as HTMLInputElement;
    let next = this.snap(Number(input.value));
    if (this.range) {
      const [low, high] = this.numbers as [number, number];
      if (index === 0) next = Math.min(next, high);
      else next = Math.max(next, low);
      input.value = String(next);
      this.value = index === 0 ? `${next}/${high}` : `${low}/${next}`;
    } else {
      this.value = String(next);
    }
    emit(this, commit ? 'kt-change' : 'kt-input', { value: this.value });
  }

  private percent(n: number): number {
    return this.max > this.min ? ((n - this.min) / (this.max - this.min)) * 100 : 0;
  }

  override render(): TemplateResult {
    const s = strings();
    const numbers = this.numbers;
    const [start, end] = this.range ? [numbers[0]!, numbers[1]!] : [this.min, numbers[0]!];
    const inactive = this.disabled || this.formDisabled;
    const shown = this.range
      ? `${this.format(numbers[0]!)} – ${this.format(numbers[1]!)}`
      : this.format(numbers[0]!);
    const names = this.range
      ? [`${this.label}, ${s.sliderMinimum}`, `${this.label}, ${s.sliderMaximum}`]
      : [this.label];

    return html`${
        this.showValue
          ? html`<div class="head">
              <span>${this.label}</span>
              <span part="value" class="value">${shown}</span>
            </div>`
          : nothing
      }
      <div class="control">
        <div part="track" class="track"></div>
        <div
          part="fill"
          class="fill"
          style=${`left: ${this.percent(start)}%; right: ${100 - this.percent(end)}%`}
        ></div>
        ${numbers.map(
          (n, index) =>
            html`<input
              type="range"
              min=${this.min}
              max=${this.max}
              step=${this.step}
              .value=${String(n)}
              ?disabled=${inactive}
              aria-label=${names[index] || nothing}
              aria-valuetext=${this.format(n)}
              @input=${(event: Event) => this.onSlide(event, index, false)}
              @change=${(event: Event) => this.onSlide(event, index, true)}
            />`,
        )}
      </div>`;
  }
}

defineElement('kt-slider', KtSlider);

declare global {
  interface HTMLElementTagNameMap {
    'kt-slider': KtSlider;
  }
}
