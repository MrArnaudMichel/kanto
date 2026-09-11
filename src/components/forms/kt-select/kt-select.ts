import { css, html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { KtElement, defineElement } from 'kanto-ds/internal/kt-element';
import { emit, uniqueId } from 'kanto-ds/internal/events';
import {
  attachFormInternals,
  setFormValue,
  setValidity,
  type UsableInternals,
} from 'kanto-ds/internal/form-control';
import {
  firstEnabledIndex,
  lastEnabledIndex,
  listboxStyles,
  nextEnabledIndex,
  optionLabel,
  type KtOption,
} from 'kanto-ds/internal/listbox';
import '../../core/kt-icon/kt-icon.js';

export type KtSelectSize = 'small' | 'medium' | 'large';
export type { KtOption };

/**
 * A single-choice dropdown.
 *
 * Unlike the trigger-plus-div it replaces, this is a real listbox: arrow keys
 * move an active descendant, Home and End jump to the ends, Enter commits,
 * Escape closes without changing anything, and disabled options are skipped
 * rather than merely unclickable.
 *
 * @element kt-select
 *
 * @csspart trigger - The button that opens the list.
 * @csspart popup - The option list.
 * @csspart option - An option row.
 *
 * @fires kt-change - An option was chosen or cleared.
 *   `detail: { value, option }`.
 *
 * @example
 * ```html
 * <kt-select placeholder="Select a region"></kt-select>
 * ```
 * ```js
 * select.options = [{ id: 'ne', label: 'North East' }, { id: 'sw', label: 'South West' }];
 * ```
 */
export class KtSelect extends KtElement {
  static readonly formAssociated = true;

  static override styles = [
    KtElement.styles,
    listboxStyles,
    css`
      :host {
        position: relative;
        display: block;
        --field-height: var(--button-height);
      }

      :host([size='small']) {
        --field-height: var(--button-height-small);
      }
      :host([size='large']) {
        --field-height: var(--button-height-large);
      }

      .trigger {
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: center;
        gap: var(--gap-element);
        width: 100%;
        height: var(--field-height);
        padding: 0 var(--button-padding-x);
        color: var(--text-body);
        font: var(--font-input);
        text-align: left;
        background-color: var(--color-dark-20);
        border: none;
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
        cursor: pointer;
        transition:
          background-color var(--duration-instant),
          outline-color var(--duration-instant);
      }

      .trigger:hover {
        outline: var(--outline-width) solid var(--color-text-700);
      }
      .trigger:focus-visible,
      .open .trigger {
        background-color: var(--color-dark-12);
        outline: var(--outline-width) solid var(--color-primary-base);
      }

      .error .trigger,
      .error .trigger:hover {
        outline: var(--outline-width) solid var(--color-danger-base);
      }

      :host([disabled]) {
        pointer-events: none;
      }
      :host([disabled]) .trigger {
        color: var(--text-disabled);
        background-color: var(--color-dark-14);
      }

      .value {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      .placeholder {
        color: var(--color-text-500);
      }

      .icons {
        display: inline-flex;
        align-items: center;
        gap: var(--gap-element);
      }

      .clear {
        display: inline-flex;
        padding: 0;
        color: inherit;
        background: none;
        border: none;
        cursor: pointer;
        transition: transform var(--duration-instant) ease-in-out;
      }
      .clear:hover {
        transform: rotate(90deg);
      }

      .chevron {
        display: inline-flex;
        align-items: center;
        transition: transform var(--duration-fast) ease-in-out;
      }
      .open .chevron {
        transform: scaleY(-1);
      }
    `,
  ];

  private internals: UsableInternals | null = null;
  private defaultValue: string | number | null = null;
  private readonly listId = uniqueId('kt-select-list');

  @state()
  private open = false;

  /** Index of the active descendant while the list is open; -1 for none. */
  @state()
  private activeIndex = -1;

  /** The options to choose from. A property: this is data, not an attribute. */
  @property({ attribute: false })
  options: readonly KtOption[] = [];

  /** The selected option's id, or `null`. */
  @property({ type: String })
  value: string | number | null = null;

  @property({ type: String })
  placeholder = 'Select';

  @property({ type: String })
  name = '';

  @property({ type: String, reflect: true })
  size: KtSelectSize = 'medium';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  /** Error message. A non-empty value puts the control in its error state. */
  @property({ type: String, reflect: true })
  error = '';

  /** Shows the clear button once something is selected. */
  @property({ type: Boolean })
  clearable = true;

  /** Accessible name, when no `<kt-label-input>` wraps the control. */
  @property({ type: String })
  label = '';

  /** Shown when `options` is empty. */
  @property({ type: String, attribute: 'empty-text' })
  emptyText = 'No options available';

  override connectedCallback(): void {
    super.connectedCallback();
    this.internals ??= attachFormInternals(this);
    this.defaultValue = this.value;
    document.addEventListener('pointerdown', this.onDocumentPointerDown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('pointerdown', this.onDocumentPointerDown);
  }

  override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has('value') || changed.has('required') || changed.has('error')) {
      setFormValue(this.internals, this.value === null ? null : String(this.value));

      const missing = this.required && this.value === null;
      setValidity(
        this.internals,
        { valueMissing: missing, customError: Boolean(this.error) },
        this.error || (missing ? 'Select an option.' : ''),
      );
    }
  }

  formResetCallback(): void {
    this.value = this.defaultValue;
    this.open = false;
  }

  formStateRestoreCallback(state: string): void {
    this.value = state;
  }

  override focus(options?: FocusOptions): void {
    this.shadowRoot?.querySelector<HTMLButtonElement>('.trigger')?.focus(options);
  }

  /** The currently selected option, if the id still matches one. */
  get selectedOption(): KtOption | undefined {
    return this.options.find((option) => option.id === this.value);
  }

  private onDocumentPointerDown = (event: Event): void => {
    if (event.composedPath().includes(this)) return;
    this.open = false;
  };

  private openList(): void {
    if (this.disabled) return;
    this.open = true;
    const selected = this.options.findIndex((option) => option.id === this.value);
    this.activeIndex = selected >= 0 ? selected : firstEnabledIndex(this.options);
  }

  private closeList(): void {
    this.open = false;
    this.activeIndex = -1;
  }

  private toggleList(): void {
    if (this.open) this.closeList();
    else this.openList();
  }

  private choose(option: KtOption): void {
    if (option.disabled) return;
    this.value = option.id;
    this.closeList();
    this.focus();
    emit(this, 'kt-change', { value: option.id, option });
  }

  private clear(event: Event): void {
    event.stopPropagation();
    this.value = null;
    emit(this, 'kt-change', { value: null, option: null });
  }

  private onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault();
        if (!this.open) return this.openList();
        this.activeIndex = nextEnabledIndex(
          this.options,
          this.activeIndex,
          event.key === 'ArrowDown' ? 1 : -1,
        );
        return;
      }
      case 'Home':
        if (!this.open) return;
        event.preventDefault();
        this.activeIndex = firstEnabledIndex(this.options);
        return;
      case 'End':
        if (!this.open) return;
        event.preventDefault();
        this.activeIndex = lastEnabledIndex(this.options);
        return;
      case 'Enter':
      case ' ': {
        event.preventDefault();
        if (!this.open) return this.openList();
        const option = this.options[this.activeIndex];
        if (option) this.choose(option);
        return;
      }
      case 'Escape':
        if (!this.open) return;
        event.stopPropagation();
        this.closeList();
        return;
      case 'Tab':
        this.closeList();
    }
  }

  private optionId(index: number): string {
    return `${this.listId}-option-${index}`;
  }

  override render(): TemplateResult {
    const selected = this.selectedOption;
    const showClear = this.clearable && selected !== undefined && !this.disabled;

    return html`<div
      class=${classMap({ open: this.open, error: Boolean(this.error) })}
      @keydown=${this.onKeyDown}
    >
      <button
        part="trigger"
        type="button"
        class="trigger"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded=${this.open ? 'true' : 'false'}
        aria-controls=${this.listId}
        aria-activedescendant=${
          this.open && this.activeIndex >= 0 ? this.optionId(this.activeIndex) : nothing
        }
        aria-label=${this.label || nothing}
        aria-invalid=${this.error ? 'true' : nothing}
        ?disabled=${this.disabled}
        @click=${this.toggleList}
      >
        <span class=${classMap({ value: true, placeholder: !selected })}>
          ${selected ? optionLabel(selected) : this.placeholder}
        </span>
        <span class="icons">
          ${
            showClear
              ? html`<span
                  class="clear"
                  role="button"
                  tabindex="-1"
                  aria-label="Clear"
                  @click=${this.clear}
                >
                  <kt-icon name="x" size="18"></kt-icon>
                </span>`
              : nothing
          }
          <span class="chevron"><kt-icon name="chevron-down" size="18"></kt-icon></span>
        </span>
      </button>

      <ul
        part="popup"
        id=${this.listId}
        class=${classMap({ popup: true, open: this.open })}
        role="listbox"
        aria-label=${this.label || this.placeholder}
      >
        ${
          this.options.length === 0
            ? html`<li class="empty">${this.emptyText}</li>`
            : this.options.map(
                (option, index) =>
                  html`<li
                    part="option"
                    id=${this.optionId(index)}
                    class=${classMap({
                      option: true,
                      selected: option.id === this.value,
                      active: index === this.activeIndex,
                      disabled: Boolean(option.disabled),
                    })}
                    role="option"
                    aria-selected=${option.id === this.value ? 'true' : 'false'}
                    aria-disabled=${option.disabled ? 'true' : nothing}
                    @click=${() => this.choose(option)}
                  >
                    ${optionLabel(option)}
                  </li>`,
              )
        }
      </ul>
    </div>`;
  }
}

defineElement('kt-select', KtSelect);

declare global {
  interface HTMLElementTagNameMap {
    'kt-select': KtSelect;
  }
}
