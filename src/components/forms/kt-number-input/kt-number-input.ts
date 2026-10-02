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

/** A number typed the way `locale` writes one, or NaN. "1 234,5" in French is 1234.5. */
export function parseLocaleNumber(text: string, locale: string): number {
  const { group, decimal } = separators(locale);
  const cleaned = text
    .replace(/\s/g, '')
    .split(group)
    .join('')
    .replace(decimal, '.')
    .replace(/[^0-9.+-]/g, '');
  return cleaned === '' || cleaned === '-' ? NaN : Number(cleaned);
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

  @property({ type: Number })
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
    const decimals = (String(step).split('.')[1] ?? '').length;
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
    const decimals = (String(this.step).split('.')[1] ?? '').length;
    const options = this.focused
      ? { maximumFractionDigits: Math.max(decimals, 20), useGrouping: false }
      : { maximumFractionDigits: Math.max(decimals, 3), ...this.formatOptions };
    return new Intl.NumberFormat(this.resolvedLocale, options).format(value);
  }

  private stepBy(steps: number): void {
    if (this.inactive) return;
    const from = this.value ?? (Number.isFinite(this.min) ? this.min : 0);
    this.commit(this.value === null ? from : from + steps * this.step);
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
    const parsed = parseLocaleNumber(typed, this.resolvedLocale);
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
