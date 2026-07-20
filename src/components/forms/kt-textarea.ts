import { css, html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { live } from 'lit/directives/live.js';
import { KtElement, defineElement } from '../../internal/kt-element.js';
import { emit } from '../../internal/events.js';
import {
  attachFormInternals,
  setFormValue,
  setValidity,
  type UsableInternals,
} from '../../internal/form-control.js';
import '../core/kt-icon.js';

/**
 * A multi-line text field, with the same borderless fill and outline states as
 * `<kt-input>`.
 *
 * A character counter appears whenever `maxlength` is set — the field tells
 * the user where the limit is before the browser silently stops accepting
 * keystrokes.
 *
 * @element kt-textarea
 *
 * @csspart base - The field container.
 * @csspart control - The native `<textarea>`.
 * @csspart counter - The character counter.
 *
 * @fires kt-input - On every keystroke. `detail: { value }`.
 * @fires kt-change - When the value is committed. `detail: { value }`.
 */
export class KtTextarea extends KtElement {
  static readonly formAssociated = true;

  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: block;
      }

      .field {
        display: flex;
        align-items: flex-start;
        width: 100%;
        min-height: var(--button-height);
        background-color: var(--color-dark-12);
        border-radius: var(--radius-input);
        transition: outline-color var(--duration-instant);
      }

      .field:hover {
        outline: var(--outline-width) solid var(--color-text-700);
      }
      .field:focus-within {
        outline: var(--outline-width) solid var(--color-primary-base);
      }

      .error,
      .error:hover,
      .error:focus-within {
        outline: var(--outline-width) solid var(--color-danger-base);
      }
      .error textarea {
        color: var(--color-danger-base);
      }

      .disabled {
        background-color: var(--color-dark-14);
        pointer-events: none;
      }
      .disabled textarea {
        color: var(--text-disabled);
      }

      textarea {
        width: 100%;
        min-height: calc(var(--button-height) - var(--gap-element) * 2);
        padding: var(--text-area-padding);
        color: var(--text-body);
        font: var(--font-input);
        background: transparent;
        border: none;
        outline: none;
        resize: vertical;
      }

      :host([resize='none']) textarea {
        resize: none;
      }

      textarea::placeholder {
        color: var(--color-text-500);
      }

      .meta {
        display: flex;
        flex: none;
        flex-direction: column;
        align-items: center;
        gap: var(--gap-element);
        margin: 10px var(--button-padding-x) 0 0;
      }

      .counter {
        color: var(--color-text-700);
        font: var(--font-normal-small);
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }

      .counter.at-limit {
        color: var(--color-danger-base);
      }

      .error-icon {
        display: flex;
        color: var(--color-danger-base);
      }
    `,
  ];

  @query('textarea')
  private control!: HTMLTextAreaElement;

  private internals: UsableInternals | null = null;
  private defaultValue = '';

  @property({ type: String })
  value = '';

  @property({ type: String })
  name = '';

  @property({ type: String })
  placeholder = '';

  @property({ type: Number })
  rows = 3;

  @property({ type: Number })
  maxlength?: number;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  readonly = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  /** Error message. A non-empty value puts the field in its error state. */
  @property({ type: String, reflect: true })
  error = '';

  /** Accessible name, when no `<kt-label-input>` wraps the field. */
  @property({ type: String })
  label = '';

  /** Whether the user may drag the field taller. */
  @property({ type: String, reflect: true })
  resize: 'vertical' | 'none' = 'vertical';

  override connectedCallback(): void {
    super.connectedCallback();
    this.internals ??= attachFormInternals(this);
    this.defaultValue = this.value;
    setFormValue(this.internals, this.value);
  }

  override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has('value') || changed.has('required') || changed.has('error')) {
      setFormValue(this.internals, this.value);

      const missing = this.required && this.value.length === 0;
      setValidity(
        this.internals,
        { valueMissing: missing, customError: Boolean(this.error) },
        this.error || (missing ? 'This field is required.' : ''),
      );
    }
  }

  formResetCallback(): void {
    this.value = this.defaultValue;
  }

  formStateRestoreCallback(state: string): void {
    this.value = state;
  }

  override focus(options?: FocusOptions): void {
    this.control?.focus(options);
  }

  override blur(): void {
    this.control?.blur();
  }

  private onInput(event: Event): void {
    this.value = (event.target as HTMLTextAreaElement).value;
    emit(this, 'kt-input', { value: this.value });
  }

  private onChange(event: Event): void {
    event.stopPropagation();
    emit(this, 'kt-change', { value: this.value });
  }

  override render(): TemplateResult {
    const showCounter = this.maxlength !== undefined;
    const atLimit = this.maxlength !== undefined && this.value.length >= this.maxlength;

    return html`<div
      part="base"
      class=${classMap({
        field: true,
        error: Boolean(this.error),
        disabled: this.disabled,
      })}
    >
      <textarea
        part="control"
        name=${this.name || nothing}
        rows=${this.rows}
        maxlength=${this.maxlength ?? nothing}
        placeholder=${this.placeholder || nothing}
        aria-label=${this.label || nothing}
        aria-invalid=${this.error ? 'true' : nothing}
        .value=${live(this.value)}
        ?disabled=${this.disabled}
        ?readonly=${this.readonly}
        ?required=${this.required}
        @input=${this.onInput}
        @change=${this.onChange}
      ></textarea>

      ${
        this.error || showCounter
          ? html`<div class="meta">
              ${
                this.error
                  ? html`<span class="error-icon" title=${this.error}>
                      <kt-icon name="circle-alert" size="18" label=${this.error}></kt-icon>
                    </span>`
                  : nothing
              }
              ${
                showCounter
                  ? html`<span
                      part="counter"
                      class=${classMap({ counter: true, 'at-limit': atLimit })}
                      aria-live="polite"
                    >
                      ${this.value.length} / ${this.maxlength}
                    </span>`
                  : nothing
              }
            </div>`
          : nothing
      }
    </div>`;
  }
}

defineElement('kt-textarea', KtTextarea);

declare global {
  interface HTMLElementTagNameMap {
    'kt-textarea': KtTextarea;
  }
}
