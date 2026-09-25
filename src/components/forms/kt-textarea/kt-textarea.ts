import { css, html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { live } from 'lit/directives/live.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { emit } from '#internal/events';
import {
  attachFormInternals,
  setFormValue,
  setValidity,
  type UsableInternals,
} from '#internal/form-control';
import { strings } from '#internal/strings';
import '../../core/kt-icon/kt-icon.js';

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
        background-color: var(--surface-field);
        border-radius: var(--radius-input);
        /* A resting hairline. A field is a fill on --surface-field, which is
           one ramp step from the page in dark and almost the same colour in
           light — so on a card or inside a modal it simply disappeared and
           read as a bare native control.

           A border rather than an outline, because the control inside fills
           the field exactly and a coincident outline is painted over by the
           native widget. A border insets the control by its own width, so it
           cannot be covered. box-sizing: border-box keeps the outer size.

           The hover and focus rings stay outlines on top of it, and the
           transparent resting outline is what they animate from: without it
           outline-color starts at the initial value, which resolves to the
           text colour, and hover flashed near-white before settling. */
        border: var(--border-width) solid var(--border-field);
        outline: var(--outline-width) solid transparent;
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
        color: var(--color-danger-text);
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
        resize: none;
      }

      :host([resize='vertical']) textarea {
        resize: vertical;
      }

      textarea::placeholder {
        color: var(--text-muted);
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
        color: var(--color-danger-text);
      }

      .error-icon {
        display: flex;
        color: var(--color-danger-text);
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

  /**
   * Whether the reader may drag the field taller.
   *
   * Off by default, as in the rest of Kanto: the grip is drawn by the operating
   * system, lands on the field's rounded corner and belongs to no design
   * system — and a field the layout sized is not usually the reader's to
   * resize. Turn it on where the content genuinely varies.
   */
  @property({ type: String, reflect: true })
  resize: 'vertical' | 'none' = 'none';

  override connectedCallback(): void {
    super.connectedCallback();
    this.internals ??= attachFormInternals(this);
    this.defaultValue = this.value;
    setFormValue(this.internals, this.value);
  }

  override willUpdate(changed: PropertyValues<this>): void {
    if (
      changed.has('value') ||
      changed.has('required') ||
      changed.has('error') ||
      this.stringsChanged(changed)
    ) {
      setFormValue(this.internals, this.value);

      const missing = this.required && this.value.length === 0;
      setValidity(
        this.internals,
        { valueMissing: missing, customError: Boolean(this.error) },
        this.error || (missing ? strings().required : ''),
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
      ${
        this.error
          ? html`<span id="error-message" class="visually-hidden">${this.error}</span>`
          : nothing
      }
      <textarea
        part="control"
        name=${this.name || nothing}
        rows=${this.rows}
        maxlength=${this.maxlength ?? nothing}
        placeholder=${this.placeholder || nothing}
        aria-label=${this.label || nothing}
        aria-invalid=${this.error ? 'true' : nothing}
        aria-describedby=${this.error ? 'error-message' : nothing}
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
