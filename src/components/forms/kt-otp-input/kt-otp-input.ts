import { css, html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property, queryAll, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { emit, uniqueId } from '#internal/events';
import {
  attachFormInternals,
  setFormValue,
  setValidity,
  type UsableInternals,
} from '#internal/form-control';
import { strings } from '#internal/strings';

export type KtOtpInputType = 'numeric' | 'alphanumeric';

/**
 * A one-time code — the six digits of a sign-in, a verification, a
 * second factor — one box per character.
 *
 * Typing moves to the next box, Backspace from an empty box steps back and
 * clears the one before, the arrows move between boxes, and a pasted code is
 * spread over them. The first box asks the browser for `one-time-code`, so a
 * code that arrived by text message fills itself in. `kt-complete` fires when
 * the code is whole.
 *
 * A form control: submitted under `name`, `required` until whole, reset with
 * the form.
 *
 * @element kt-otp-input
 *
 * @csspart group - The boxes.
 * @csspart box - One box.
 * @csspart error - The error message.
 *
 * @fires kt-change - The code changed. `detail: { value }`.
 * @fires kt-complete - The code is whole. `detail: { value }`.
 *
 * @example
 * ```html
 * <kt-otp-input label="Verification code" name="code" required></kt-otp-input>
 * ```
 */
export class KtOtpInput extends KtElement {
  static readonly formAssociated = true;

  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: inline-block;
        --kt-otp-box-size: calc(var(--button-height) + 8px);
      }

      .group {
        display: flex;
        gap: var(--gap-button);
      }

      input {
        box-sizing: border-box;
        width: var(--kt-otp-box-size);
        height: var(--kt-otp-box-size);
        padding: 0;
        color: var(--text-body);
        font: 600 calc(20px * var(--text-scale, 1)) / 1 var(--font-family-body);
        font-variant-numeric: tabular-nums;
        text-align: center;
        text-transform: uppercase;
        background-color: var(--surface-field);
        border: var(--border-width) solid var(--border-field);
        border-radius: var(--radius-input);
        outline: var(--outline-width) solid transparent;
        caret-color: var(--color-primary-base);
        transition: outline-color var(--duration-instant);
      }
      input:hover {
        outline-color: var(--color-text-700);
      }
      input:focus {
        outline-color: var(--color-primary-base);
      }
      input[aria-invalid='true'] {
        outline-color: var(--color-danger-base);
      }
      input:disabled {
        color: var(--text-disabled);
        background-color: var(--color-dark-14);
        cursor: not-allowed;
        outline-color: transparent;
      }

      .error {
        margin: var(--gap-element) 0 0;
        color: var(--color-danger-text);
        font: var(--font-normal-small);
      }
    `,
  ];

  /** The code so far. */
  @property({ type: String })
  value = '';

  /** How many characters the code has. */
  @property({ type: Number })
  length = 6;

  /** `numeric` takes digits; `alphanumeric` letters and digits, in capitals. */
  @property({ type: String })
  type: KtOtpInputType = 'numeric';

  /** Accessible name for the group: "Verification code". */
  @property({ type: String })
  label = '';

  @property({ type: String })
  name = '';

  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  /** An error to show and announce under the boxes. */
  @property({ type: String, reflect: true })
  error = '';

  @state() private formDisabled = false;

  @queryAll('input') private boxes!: NodeListOf<HTMLInputElement>;

  private internals: UsableInternals | null = null;
  private defaultValue = '';
  private readonly errorId = uniqueId('kt-otp-error');

  override connectedCallback(): void {
    super.connectedCallback();
    this.internals ??= attachFormInternals(this);
    this.value = this.clean(this.value);
    this.defaultValue = this.value;
  }

  override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has('value') || changed.has('length') || changed.has('type')) {
      const cleaned = this.clean(this.value);
      if (cleaned !== this.value) this.value = cleaned;
    }
  }

  // After the render: the first box anchors the browser's message.
  override updated(changed: PropertyValues<this>): void {
    if (
      changed.has('value') ||
      changed.has('required') ||
      changed.has('error') ||
      changed.has('length') ||
      this.stringsChanged(changed)
    ) {
      setFormValue(this.internals, this.value || null);
      const missing = this.required && this.value.length < this.length;
      setValidity(
        this.internals,
        { valueMissing: missing, customError: Boolean(this.error) },
        this.error || (missing ? strings().otpRequired : ''),
        this.boxes?.[0],
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
    this.value = state ?? '';
  }

  override focus(options?: FocusOptions): void {
    this.box(Math.min(this.value.length, this.length - 1))?.focus(options);
  }

  private get inactive(): boolean {
    return this.disabled || this.formDisabled;
  }

  /** What the code may hold: digits, or letters and digits in capitals, and no more than `length`. */
  private clean(text: string): string {
    const allowed = this.type === 'numeric' ? /[0-9]/ : /[A-Za-z0-9]/;
    return [...text]
      .filter((character) => allowed.test(character))
      .join('')
      .toUpperCase()
      .slice(0, Math.max(1, this.length));
  }

  private box(index: number): HTMLInputElement | undefined {
    return this.boxes?.[index];
  }

  /** Sets the code, says so, and says when it is whole. */
  private commit(next: string): void {
    const value = this.clean(next);
    if (value === this.value) {
      this.requestUpdate();
      return;
    }
    this.value = value;
    emit(this, 'kt-change', { value });
    if (value.length === this.length) emit(this, 'kt-complete', { value });
  }

  private onInput(event: InputEvent, index: number): void {
    const typed = this.clean((event.target as HTMLInputElement).value);
    // Characters go in order: a box past the first empty one fills that one.
    const at = Math.min(index, this.value.length);
    if (!typed) {
      this.commit(this.value);
      return;
    }
    // More than one character — autofill, a fast typist — spreads on.
    const next = (this.value.slice(0, at) + typed).slice(0, this.length);
    this.commit(next + this.value.slice(at + typed.length));
    void this.updateComplete.then(() => this.box(Math.min(next.length, this.length - 1))?.focus());
  }

  private onKeyDown(event: KeyboardEvent, index: number): void {
    const move = (to: number) => {
      event.preventDefault();
      this.box(Math.max(0, Math.min(this.length - 1, to)))?.focus();
    };
    switch (event.key) {
      case 'Backspace': {
        event.preventDefault();
        const at = index < this.value.length ? index : this.value.length - 1;
        if (at < 0) return;
        this.commit(this.value.slice(0, at) + this.value.slice(at + 1));
        void this.updateComplete.then(() => this.box(at)?.focus());
        break;
      }
      case 'ArrowLeft':
        move(index - 1);
        break;
      case 'ArrowRight':
        move(Math.min(index + 1, this.value.length));
        break;
      case 'Home':
        move(0);
        break;
      case 'End':
        move(this.value.length);
        break;
    }
  }

  private onPaste(event: ClipboardEvent, index: number): void {
    const pasted = this.clean(event.clipboardData?.getData('text') ?? '');
    if (!pasted) return;
    event.preventDefault();
    const at = Math.min(index, this.value.length);
    const next = (this.value.slice(0, at) + pasted).slice(0, this.length);
    this.commit(next);
    void this.updateComplete.then(() => this.box(Math.min(next.length, this.length - 1))?.focus());
  }

  override render(): TemplateResult {
    const s = strings();
    const count = Math.max(1, Math.round(this.length));
    return html`<div part="group" class="group" role="group" aria-label=${this.label || nothing}>
        ${Array.from({ length: count }, (_, index) => {
          const character = this.value[index] ?? '';
          return html`<input
            part="box"
            .value=${live(character)}
            maxlength=${index === 0 ? count : 1}
            inputmode=${this.type === 'numeric' ? 'numeric' : 'text'}
            autocomplete=${index === 0 ? 'one-time-code' : 'off'}
            autocapitalize="characters"
            spellcheck="false"
            aria-label=${s.otpCharacter(index + 1, count)}
            aria-invalid=${this.error ? 'true' : nothing}
            aria-describedby=${this.error ? this.errorId : nothing}
            ?disabled=${this.inactive}
            @input=${(event: InputEvent) => this.onInput(event, index)}
            @keydown=${(event: KeyboardEvent) => this.onKeyDown(event, index)}
            @paste=${(event: ClipboardEvent) => this.onPaste(event, index)}
            @focus=${(event: FocusEvent) => (event.target as HTMLInputElement).select()}
          />`;
        })}
      </div>
      ${
        this.error
          ? html`<p part="error" class="error" id=${this.errorId}>${this.error}</p>`
          : nothing
      }`;
  }
}

defineElement('kt-otp-input', KtOtpInput);

declare global {
  interface HTMLElementTagNameMap {
    'kt-otp-input': KtOtpInput;
  }
}
