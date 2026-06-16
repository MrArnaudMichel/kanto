import { css, html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property, query, state } from 'lit/decorators.js';
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

export type KtInputSize = 'small' | 'medium' | 'large';

/** Icon size inside a field, at every field size. */
const ICON_SIZE = 18;

/**
 * A single-line text field.
 *
 * Borderless by design: the field is a fill on `--color-dark-12` that gains a
 * 2px *outline* — grey on hover, primary on focus, danger on error. An outline
 * sits outside the box, so nothing reflows when the state changes.
 *
 * The element is form-associated: it serialises into `FormData` under its
 * `name`, resets with the form, and reports validity like a native input.
 *
 * @element kt-input
 *
 * @csspart base - The field container.
 * @csspart control - The native `<input>`.
 * @csspart actions - The trailing icon row.
 *
 * @fires kt-input - On every keystroke. `detail: { value }`.
 * @fires kt-change - When the value is committed (blur or Enter). `detail: { value }`.
 * @fires kt-clear - The clear button was pressed.
 *
 * @example
 * ```html
 * <kt-input placeholder="Rechercher partout..." icon="search"></kt-input>
 * <kt-input type="password" name="password"></kt-input>
 * <kt-input error="Adresse invalide" value="pas-une-adresse"></kt-input>
 * ```
 */
export class KtInput extends KtElement {
  static readonly formAssociated = true;

  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: block;
      }

      .field {
        position: relative;
        display: inline-flex;
        align-items: center;
        width: 100%;
        height: var(--button-height);
        padding: 0 var(--button-padding-x);
        gap: var(--gap-button);
        background-color: var(--color-dark-12);
        border-radius: var(--radius-input);
        transition: outline-color var(--duration-instant);
      }

      /* Outline, never border: it sits outside the box, so hover and focus
         change nothing about the layout. */
      .field:hover {
        outline: var(--outline-width) solid var(--color-text-700);
      }
      .field:focus-within {
        outline: var(--outline-width) solid var(--color-primary-base);
      }

      .small {
        height: var(--button-height-small);
      }
      .large {
        height: var(--button-height-large);
      }

      .error,
      .error:hover,
      .error:focus-within {
        outline: var(--outline-width) solid var(--color-danger-base);
      }
      .error input {
        color: var(--color-danger-base);
      }

      .disabled {
        background-color: var(--color-dark-14);
        pointer-events: none;
      }
      .disabled input {
        color: var(--text-disabled);
      }

      input {
        width: 100%;
        min-width: 0;
        padding: 0;
        color: var(--text-body);
        font: var(--font-input);
        background: transparent;
        border: none;
        outline: none;
      }

      input::placeholder {
        color: var(--color-text-500);
      }

      /* The clear button is ours; the browser's is redundant. */
      input::-webkit-search-cancel-button {
        display: none;
      }

      .actions {
        display: flex;
        flex: none;
        align-items: center;
        gap: var(--gap-button);
      }

      .icon-button {
        display: inline-flex;
        align-items: center;
        padding: 0;
        color: var(--text-body);
        background: none;
        border: none;
        cursor: pointer;
      }

      .icon-button:focus-visible {
        outline: var(--outline-width) solid var(--color-primary-base);
        outline-offset: 2px;
        border-radius: 2px;
      }

      .clear {
        transition: transform var(--duration-instant) ease-in-out;
      }
      .clear:hover {
        transform: rotate(90deg);
      }

      .adornment {
        display: flex;
        align-items: center;
        color: var(--text-muted);
      }

      .error-icon {
        color: var(--color-danger-base);
      }
    `,
  ];

  @query('input')
  private input!: HTMLInputElement;

  private internals: UsableInternals | null = null;

  /** True while a `password` field is showing its contents. */
  @state()
  private passwordVisible = false;

  /** The field's value. The `value` attribute seeds it and acts as the reset value. */
  @property({ type: String })
  value = '';

  @property({ type: String })
  name = '';

  /** Any native input type. `password` adds the reveal toggle. */
  @property({ type: String })
  type = 'text';

  @property({ type: String })
  placeholder = '';

  /** Field height: 32 / 40 / 48px at the desktop scale. */
  @property({ type: String, reflect: true })
  size: KtInputSize = 'medium';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  readonly = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  /** Trailing Lucide icon, kebab-case. */
  @property({ type: String })
  icon = '';

  /** Error message. A non-empty value puts the field in its error state. */
  @property({ type: String, reflect: true })
  error = '';

  /** Shows the clear button once there is something to clear. */
  @property({ type: Boolean })
  clearable = true;

  /** Accessible name, when no `<kt-label-input>` wraps the field. */
  @property({ type: String })
  label = '';

  @property({ type: String })
  autocomplete = '';

  @property({ type: Number })
  maxlength?: number;

  /** The value the enclosing form resets to. */
  private defaultValue = '';

  override connectedCallback(): void {
    super.connectedCallback();
    this.internals ??= attachFormInternals(this);
    this.defaultValue = this.value;
    setFormValue(this.internals, this.value);
  }

  override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has('value') || changed.has('required') || changed.has('error')) {
      setFormValue(this.internals, this.value);
      this.refreshValidity();
    }
  }

  private refreshValidity(): void {
    const missing = this.required && this.value.length === 0;
    const message = this.error || (missing ? 'Ce champ est requis.' : '');
    setValidity(
      this.internals,
      { valueMissing: missing, customError: Boolean(this.error) },
      message,
    );
  }

  /** Called by the platform when the enclosing form is reset. */
  formResetCallback(): void {
    this.value = this.defaultValue;
    this.passwordVisible = false;
  }

  /** Called by the platform when the browser restores a session. */
  formStateRestoreCallback(state: string): void {
    this.value = state;
  }

  override focus(options?: FocusOptions): void {
    this.input?.focus(options);
  }

  override blur(): void {
    this.input?.blur();
  }

  /** Selects the field's contents, as `HTMLInputElement.select()` does. */
  select(): void {
    this.input?.select();
  }

  private get showClear(): boolean {
    return this.clearable && this.value.length > 0 && !this.readonly && !this.disabled;
  }

  private get resolvedType(): string {
    if (this.type !== 'password') return this.type;
    return this.passwordVisible ? 'text' : 'password';
  }

  private onInput(event: Event): void {
    this.value = (event.target as HTMLInputElement).value;
    emit(this, 'kt-input', { value: this.value });
  }

  private onChange(event: Event): void {
    // The native change event does not cross the shadow boundary; re-emit it
    // under a name consumers can actually listen for.
    event.stopPropagation();
    emit(this, 'kt-change', { value: this.value });
  }

  private clear(): void {
    this.value = '';
    emit(this, 'kt-clear');
    emit(this, 'kt-input', { value: '' });
    emit(this, 'kt-change', { value: '' });
    this.focus();
  }

  private togglePassword(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  /** Clicking the padding around the input should focus it, as on a native field. */
  private onFieldPointerDown(event: PointerEvent): void {
    if (event.target === this.input) return;
    if ((event.target as HTMLElement).closest('button')) return;
    event.preventDefault();
    this.focus();
  }

  override render(): TemplateResult {
    const hasActions =
      this.type === 'password' || Boolean(this.icon) || Boolean(this.error) || this.showClear;

    return html`<div
      part="base"
      class=${classMap({
        field: true,
        [this.size]: true,
        error: Boolean(this.error),
        disabled: this.disabled,
      })}
      @pointerdown=${this.onFieldPointerDown}
    >
      <input
        part="control"
        type=${this.resolvedType}
        name=${this.name || nothing}
        .value=${live(this.value)}
        placeholder=${this.placeholder || nothing}
        autocomplete=${this.autocomplete || nothing}
        maxlength=${this.maxlength ?? nothing}
        aria-label=${this.label || nothing}
        aria-invalid=${this.error ? 'true' : nothing}
        aria-errormessage=${this.error || nothing}
        ?disabled=${this.disabled}
        ?readonly=${this.readonly}
        ?required=${this.required}
        @input=${this.onInput}
        @change=${this.onChange}
      />

      ${
        hasActions
          ? html`<div part="actions" class="actions">
              ${
              this.type === 'password'
                ? html`<button
                    type="button"
                    class="icon-button"
                    tabindex="-1"
                    aria-label=${
                    this.passwordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
                  }
                    @click=${this.togglePassword}
                  >
                    <kt-icon
                      name=${this.passwordVisible ? 'eye-off' : 'eye'}
                      size=${ICON_SIZE}
                    ></kt-icon>
                  </button>`
                : nothing
            }
              ${
              this.icon
                ? html`<span class="adornment">
                    <kt-icon name=${this.icon} size=${ICON_SIZE}></kt-icon>
                  </span>`
                : nothing
            }
              ${
              this.error
                ? html`<span class="adornment error-icon" title=${this.error}>
                    <kt-icon name="circle-alert" size=${ICON_SIZE} label=${this.error}></kt-icon>
                  </span>`
                : nothing
            }
              ${
              this.showClear
                ? html`<button
                    type="button"
                    class="icon-button clear"
                    tabindex="-1"
                    aria-label="Effacer"
                    @click=${this.clear}
                  >
                    <kt-icon name="x" size=${ICON_SIZE}></kt-icon>
                  </button>`
                : nothing
            }
            </div>`
          : nothing
      }
    </div>`;
  }
}

defineElement('kt-input', KtInput);

declare global {
  interface HTMLElementTagNameMap {
    'kt-input': KtInput;
  }
}
