import { css, html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property, query } from 'lit/decorators.js';
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

export type KtCheckboxSize = 'small' | 'medium' | 'large';

/**
 * A checkbox: a choice that applies when the form is submitted.
 *
 * Built on a real `<input type="checkbox">`, laid invisibly over the drawn
 * box, so the keyboard, the label click, the indeterminate state and what a
 * screen reader announces all come from the platform rather than a
 * reimplementation of it.
 *
 * For a setting that takes effect the moment it is flipped, use
 * `<kt-toggle>`; for one choice among several, `<kt-radio-group>`.
 *
 * @element kt-checkbox
 *
 * @slot - The label, clickable.
 *
 * @csspart base - The `<label>` around box and text.
 * @csspart input - The native checkbox.
 * @csspart box - The drawn box.
 *
 * @fires kt-change - The box was checked or unchecked. `detail: { checked }`.
 *
 * @example
 * ```html
 * <kt-checkbox name="terms" required>I accept the terms</kt-checkbox>
 * <kt-checkbox indeterminate>Select all</kt-checkbox>
 * ```
 */
export class KtCheckbox extends KtElement {
  static readonly formAssociated = true;

  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: inline-flex;
        vertical-align: middle;
        /* Sized off the button heights, like the toggle, so a checkbox lines
           up with the fields and buttons beside it. */
        --checkbox-size: calc(var(--button-height) * 0.45);
      }
      :host([size='small']) {
        --checkbox-size: calc(var(--button-height-small) * 0.45);
      }
      :host([size='large']) {
        --checkbox-size: calc(var(--button-height-large) * 0.45);
      }

      label {
        display: inline-flex;
        align-items: flex-start;
        gap: var(--gap-button);
        color: var(--text-body);
        font: var(--font-normal-regular);
        cursor: pointer;
      }

      .control {
        position: relative;
        flex: none;
        width: var(--checkbox-size);
        height: var(--checkbox-size);
        /* Centre the box on the first line of text, not the whole block. */
        margin-top: calc((1lh - var(--checkbox-size)) / 2);
      }

      input {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        margin: 0;
        opacity: 0;
        cursor: inherit;
      }

      .box {
        display: grid;
        place-items: center;
        width: 100%;
        height: 100%;
        color: var(--color-white);
        background-color: var(--surface-field);
        border: var(--border-width) solid var(--border-field);
        border-radius: var(--radius-sub-menu);
        transition:
          background-color var(--duration-instant),
          border-color var(--duration-instant);
        pointer-events: none;
      }

      label:hover .box {
        border-color: var(--text-muted);
      }

      input:focus-visible + .box {
        outline: var(--outline-width) solid var(--color-primary-base);
        outline-offset: 2px;
      }

      input:checked + .box,
      input:indeterminate + .box {
        background-color: var(--color-primary-base);
        border-color: var(--color-primary-base);
      }

      .error .box {
        border-color: var(--color-danger-base);
      }

      :host([disabled]) label {
        color: var(--text-disabled);
        cursor: not-allowed;
      }
      :host([disabled]) .box {
        background-color: var(--color-dark-22);
        border-color: var(--color-dark-24);
        color: var(--text-disabled);
      }
    `,
  ];

  @query('input')
  private input?: HTMLInputElement;

  private internals: UsableInternals | null = null;
  private defaultChecked = false;

  @property({ type: Boolean, reflect: true })
  checked = false;

  /**
   * Neither checked nor unchecked — for a "select all" over a partial
   * selection. Cleared as soon as the user clicks, as on a native checkbox.
   */
  @property({ type: Boolean, reflect: true })
  indeterminate = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ type: String, reflect: true })
  size: KtCheckboxSize = 'medium';

  @property({ type: String })
  name = '';

  /** Submitted when checked, as for a native checkbox. */
  @property({ type: String })
  value = 'on';

  /** Accessible name, when nothing is slotted. */
  @property({ type: String })
  label = '';

  /** Error message. A non-empty value puts the box in its error state. */
  @property({ type: String, reflect: true })
  error = '';

  override connectedCallback(): void {
    super.connectedCallback();
    this.internals ??= attachFormInternals(this);
    this.defaultChecked = this.checked;
  }

  override willUpdate(changed: PropertyValues<this>): void {
    if (
      changed.has('checked') ||
      changed.has('value') ||
      changed.has('required') ||
      changed.has('error') ||
      this.stringsChanged(changed)
    ) {
      // Unchecked contributes nothing to the submission, not an empty string.
      setFormValue(this.internals, this.checked ? this.value : null);

      const missing = this.required && !this.checked;
      setValidity(
        this.internals,
        { valueMissing: missing, customError: Boolean(this.error) },
        this.error || (missing ? strings().checkRequired : ''),
      );
    }
  }

  formResetCallback(): void {
    this.checked = this.defaultChecked;
    this.indeterminate = false;
  }

  formStateRestoreCallback(state: string | null): void {
    this.checked = state === this.value;
  }

  override focus(options?: FocusOptions): void {
    this.input?.focus(options);
  }

  private onChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.checked = input.checked;
    this.indeterminate = false;
    emit(this, 'kt-change', { checked: this.checked });
  }

  override render(): TemplateResult {
    const icon = this.indeterminate ? 'minus' : this.checked ? 'check' : '';

    // The message sits outside the <label>: inside it, it would become part of
    // the checkbox's name instead of its description.
    return html`${
        this.error
          ? html`<span id="error-message" class="visually-hidden">${this.error}</span>`
          : nothing
      }<label part="base" class=${this.error ? 'error' : ''}>
        <span class="control">
          <input
            part="input"
            type="checkbox"
            .checked=${live(this.checked)}
            .indeterminate=${this.indeterminate}
            ?disabled=${this.disabled}
            ?required=${this.required}
            aria-label=${this.label || nothing}
            aria-invalid=${this.error ? 'true' : nothing}
            aria-describedby=${this.error ? 'error-message' : nothing}
            @change=${this.onChange}
          />
          <span part="box" class="box">
            ${icon ? html`<kt-icon name=${icon} size="14"></kt-icon>` : nothing}
          </span>
        </span>
        <span class="text"><slot></slot></span>
      </label>`;
  }
}

defineElement('kt-checkbox', KtCheckbox);

declare global {
  interface HTMLElementTagNameMap {
    'kt-checkbox': KtCheckbox;
  }
}
