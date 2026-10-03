import { css, html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { emit, uniqueId } from '#internal/events';
import {
  attachFormInternals,
  setFormValue,
  setValidity,
  type UsableInternals,
} from '#internal/form-control';
import { resolveLocale } from '#internal/locale';
import { strings } from '#internal/strings';
import { decimalsOf } from '#internal/numbers';
import { play } from '#internal/motion';
import '../../core/kt-icon/kt-icon.js';

export type KtNumberInputSize = 'small' | 'medium' | 'large';

/** How `locale` writes a number: its group and decimal separators. */
function separators(locale: string): { group: string; decimal: string } {
  const parts = new Intl.NumberFormat(locale).formatToParts(12345.6);
  return {
    group: parts.find((part) => part.type === 'group')?.value ?? ',',
    decimal: parts.find((part) => part.type === 'decimal')?.value ?? '.',
  };
}

/**
 * A number typed the way `locale` writes one, or NaN. "1 234,5" in French is
 * 1234.5; "−20" with a true minus sign is -20; a percent sign is dropped, and
 * `percent` divides by a hundred. Text holding letters is no number: it is
 * turned down rather than guessed at.
 */
export function parseLocaleNumber(text: string, locale: string, percent = false): number {
  const { group, decimal } = separators(locale);
  const plain = text
    // Bidi marks around a number in Arabic or Hebrew text.
    .replace(/[\u200e\u200f\u061c]/g, '')
    // Minus signs other than the hyphen: Swedish and Finnish write U+2212.
    .replace(/[\u2212\u2012\u2013\u2014]/g, '-')
    .replace(/\s/g, '')
    .split(group)
    .join('')
    .replace(decimal, '.')
    .replace(/[%\p{Sc}]/gu, '');
  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(plain)) return NaN;
  const n = Number(plain);
  return percent ? n / 100 : n;
}

/**
 * A number field with − and + beside it: a quantity, a seat count, an amount.
 *
 * Type a number the way your language writes one — "1 234,5" in French — or
 * step it with the buttons, the arrows (Page Up and Down by ten steps, Home
 * and End to the bounds). It is kept within `min` and `max` and on `step`
 * when the field is left. At rest it reads as the locale writes it, through
 * `formatOptions` — a currency, a percentage, a unit.
 *
 * @element kt-number-input
 *
 * @csspart field - The field.
 * @csspart input - The text field.
 * @csspart decrease - The − button.
 * @csspart increase - The + button.
 *
 * @fires kt-change - The value changed. `detail: { value }`, a number or null.
 *
 * @example
 * ```html
 * <kt-number-input label="Seats" min="1" max="50" value="5"></kt-number-input>
 * ```
 */
export class KtNumberInput extends KtElement {
  static readonly formAssociated = true;

  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: block;
        --field-height: var(--button-height);
      }
      :host([size='small']) {
        --field-height: var(--button-height-small);
      }
      :host([size='large']) {
        --field-height: var(--button-height-large);
      }

      .field {
        display: flex;
        align-items: center;
        height: var(--field-height);
        background-color: var(--surface-field);
        border: var(--border-width) solid var(--border-field);
        border-radius: var(--radius-input);
        /* Keeps a rolling number inside the field. */
        overflow: clip;
        outline: var(--outline-width) solid transparent;
        transition: outline-color var(--duration-instant);
      }
      .field:hover {
        outline: var(--outline-width) solid var(--color-text-700);
      }
      .field:focus-within {
        outline: var(--outline-width) solid var(--color-primary-base);
      }
      .field.error,
      .field.error:hover,
      .field.error:focus-within {
        outline: var(--outline-width) solid var(--color-danger-base);
      }
      .field.disabled {
        background-color: var(--color-dark-14);
        pointer-events: none;
      }

      input {
        flex: 1;
        min-width: 0;
        height: 100%;
        padding: 0 4px;
        color: var(--text-body);
        font: var(--font-input);
        font-variant-numeric: tabular-nums;
        text-align: center;
        background: transparent;
        border: none;
        outline: none;
      }
      .disabled input {
        color: var(--text-disabled);
      }

      button {
        display: inline-grid;
        flex: none;
        place-items: center;
        width: var(--field-height);
        height: 100%;
        padding: 0;
        color: var(--text-muted);
        background: none;
        border: none;
        cursor: pointer;
        transition:
          color var(--duration-instant),
          background-color var(--duration-instant);
      }
      button:hover:not(:disabled) {
        color: var(--text-body);
        background: var(--surface-hover);
      }
      .minus {
        border-radius: calc(var(--radius-input) - 1px) 0 0 calc(var(--radius-input) - 1px);
      }
      .plus {
        border-radius: 0 calc(var(--radius-input) - 1px) calc(var(--radius-input) - 1px) 0;
      }
      button:disabled {
        color: var(--text-disabled);
        cursor: not-allowed;
      }
      .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }
      button:focus-visible {
        outline: var(--outline-width) solid var(--color-primary-base);
        outline-offset: -2px;
      }
    `,
  ];

  /** The number, or null while empty. An attribute that is no number reads as empty. */
  @property({
    converter: {
      fromAttribute: (text: string | null) => {
        const n = text === null || text.trim() === '' ? NaN : Number(text);
        return Number.isFinite(n) ? n : null;
      },
    },
  })
  value: number | null = null;

  @property({ type: Number })
  min = Number.NEGATIVE_INFINITY;

  @property({ type: Number })
  max = Number.POSITIVE_INFINITY;

  @property({ type: Number })
  step = 1;

  @property({ type: String })
  name = '';

  /** Accessible name, when no `<kt-label-input>` wraps it. */
  @property({ type: String })
  label = '';

  /** BCP 47 locale for reading and writing numbers. Empty: page, then browser. */
  @property({ type: String })
  locale = '';

  @property({ type: String })
  placeholder = '';

  @property({ type: String, reflect: true })
  size: KtNumberInputSize = 'medium';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  /** Error message. A non-empty value puts the field in its error state. */
  @property({ type: String, reflect: true })
  error = '';

  /** How the number reads at rest: `{ style: 'currency', currency: 'EUR' }`. */
  @property({ attribute: false })
  formatOptions: Intl.NumberFormatOptions = {};

  @state() private focused = false;
  @state() private formDisabled = false;

  @query('input') private input!: HTMLInputElement;

  private internals: UsableInternals | null = null;
  private defaultValue: number | null = null;
  private readonly errorId = uniqueId('kt-number-error');

  override connectedCallback(): void {
    super.connectedCallback();
    this.internals ??= attachFormInternals(this);
    this.value = this.value === null ? null : this.clamp(this.value);
    this.defaultValue = this.value;
  }

  override willUpdate(changed: PropertyValues<this>): void {
    if (
      changed.has('value') ||
      changed.has('required') ||
      changed.has('error') ||
      this.stringsChanged(changed)
    ) {
      setFormValue(this.internals, this.value === null ? null : String(this.value));
      const missing = this.required && this.value === null;
      setValidity(
        this.internals,
        { valueMissing: missing, customError: Boolean(this.error) },
        this.error || (missing ? strings().numberRequired : ''),
      );
    }
  }

  formResetCallback(): void {
    this.value = this.defaultValue;
  }

  formDisabledCallback(disabled: boolean): void {
    this.formDisabled = disabled;
  }

  formStateRestoreCallback(state: string | null): void {
    this.value = state === null || state === '' ? null : Number(state);
  }

  override focus(options?: FocusOptions): void {
    this.input?.focus(options);
  }

  private get resolvedLocale(): string {
    return resolveLocale(this.locale);
  }

  private get inactive(): boolean {
    return this.disabled || this.formDisabled;
  }

  /** `n` within bounds and on the step, counted from `min` when it has one. */
  private clamp(n: number): number {
    const step = this.step > 0 ? this.step : 1;
    const origin = Number.isFinite(this.min) ? this.min : 0;
    const snapped = origin + Math.round((n - origin) / step) * step;
    // Decimals of the step and of the origin: min 0.5 with step 1 lands on 1.5.
    const decimals = Math.max(decimalsOf(step), decimalsOf(origin));
    return Number(Math.min(this.max, Math.max(this.min, snapped)).toFixed(decimals));
  }

  private commit(next: number | null): void {
    const value = next === null ? null : this.clamp(next);
    if (this.input) this.input.value = this.text(value);
    if (value === this.value) return;
    this.value = value;
    emit(this, 'kt-change', { value });
  }

  /** The text for `value`: plain while typing, the locale's format at rest. */
  private text(value: number | null): string {
    if (value === null) return '';
    const decimals = Math.max(decimalsOf(this.step), decimalsOf(this.min));
    if (this.focused) {
      // The plain number to edit, on the scale it is shown at: 50 for 50%.
      const shown = this.percent ? value * 100 : value;
      return new Intl.NumberFormat(this.resolvedLocale, {
        maximumFractionDigits: 20,
        useGrouping: false,
      }).format(Number(shown.toPrecision(15)));
    }
    const minimum = this.formatOptions.minimumFractionDigits ?? 0;
    return new Intl.NumberFormat(this.resolvedLocale, {
      maximumFractionDigits: Math.max(decimals, 3, minimum),
      ...this.formatOptions,
    }).format(value);
  }

  /** Shown as a percentage: what is typed is on a scale of a hundred. */
  private get percent(): boolean {
    return this.formatOptions.style === 'percent';
  }

  /** Which way the last step went, for the number to roll that way: 1, -1 or 0. */
  private rolling = 0;

  private stepBy(steps: number): void {
    if (this.inactive) return;
    const before = this.value;
    const from = before ?? (Number.isFinite(this.min) ? this.min : 0);
    this.commit(before === null ? from : from + steps * this.step);
    if (before !== null && this.value !== null && this.value !== before) {
      this.rolling = Math.sign(this.value - before);
    }
  }

  override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (!this.rolling) return;
    // Up as it grows, the new number coming from below; down as it shrinks.
    const offset = `${this.rolling * 0.6}em`;
    this.rolling = 0;
    play(
      this.renderRoot.querySelector('input')!,
      [
        { translate: `0 ${offset}`, opacity: 0 },
        { translate: '0 0', opacity: 1 },
      ],
      '--duration-fast',
      'kt-number-roll',
    );
  }

  private onKeyDown(event: KeyboardEvent): void {
    const moves: Record<string, () => void> = {
      ArrowUp: () => this.stepBy(1),
      ArrowDown: () => this.stepBy(-1),
      PageUp: () => this.stepBy(10),
      PageDown: () => this.stepBy(-10),
      Home: () => Number.isFinite(this.min) && this.commit(this.min),
      End: () => Number.isFinite(this.max) && this.commit(this.max),
      Enter: () => this.readTyped(),
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    move();
  }

  /** What was typed, read; text that is no number puts back what it had. */
  private readTyped(): void {
    const typed = this.input.value.trim();
    if (typed === '') {
      this.commit(null);
      return;
    }
    const parsed = parseLocaleNumber(typed, this.resolvedLocale, this.percent);
    if (Number.isNaN(parsed)) {
      this.input.value = this.text(this.value);
      return;
    }
    this.commit(parsed);
  }

  private onFocus(): void {
    this.focused = true;
    this.input.value = this.text(this.value);
  }

  private onBlur(): void {
    this.readTyped();
    this.focused = false;
    this.input.value = this.text(this.value);
  }

  override render(): TemplateResult {
    const s = strings();
    const inactive = this.inactive;
    const atMin = this.value !== null && this.value <= this.min;
    const atMax = this.value !== null && this.value >= this.max;
    const shown = this.text(this.value);

    return html`${
        this.error
          ? html`<span id=${this.errorId} class="visually-hidden">${this.error}</span>`
          : nothing
      }
      <div
        part="field"
        class=${classMap({ field: true, error: Boolean(this.error), disabled: inactive })}
      >
        <button
          part="decrease"
          class="minus"
          type="button"
          tabindex="-1"
          aria-label=${s.decrease}
          ?disabled=${inactive || atMin}
          @click=${() => this.stepBy(-1)}
        >
          <kt-icon name="minus" size="16"></kt-icon>
        </button>
        <input
          part="input"
          type="text"
          role="spinbutton"
          inputmode="decimal"
          autocomplete="off"
          .value=${shown}
          placeholder=${this.placeholder || nothing}
          aria-label=${this.label || nothing}
          aria-valuenow=${this.value ?? nothing}
          aria-valuetext=${this.value === null ? nothing : shown}
          aria-valuemin=${Number.isFinite(this.min) ? this.min : nothing}
          aria-valuemax=${Number.isFinite(this.max) ? this.max : nothing}
          aria-invalid=${this.error ? 'true' : nothing}
          aria-describedby=${this.error ? this.errorId : nothing}
          aria-required=${this.required ? 'true' : nothing}
          ?disabled=${inactive}
          @keydown=${this.onKeyDown}
          @focus=${this.onFocus}
          @blur=${this.onBlur}
        />
        <button
          part="increase"
          class="plus"
          type="button"
          tabindex="-1"
          aria-label=${s.increase}
          ?disabled=${inactive || atMax}
          @click=${() => this.stepBy(1)}
        >
          <kt-icon name="plus" size="16"></kt-icon>
        </button>
      </div>`;
  }
}

defineElement('kt-number-input', KtNumberInput);

declare global {
  interface HTMLElementTagNameMap {
    'kt-number-input': KtNumberInput;
  }
}
