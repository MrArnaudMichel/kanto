import { css, html, nothing, type TemplateResult } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { live } from 'lit/directives/live.js';
import { KtElement, defineElement } from 'kanto/internal/kt-element';
import { emit, uniqueId } from 'kanto/internal/events';
import {
  filterOptions,
  firstEnabledIndex,
  lastEnabledIndex,
  listboxStyles,
  nextEnabledIndex,
  optionLabel,
  type KtOption,
} from 'kanto/internal/listbox';
import '../../core/kt-icon/kt-icon.js';

/**
 * A combobox: type to narrow the list, then pick.
 *
 * Reach for it over `<kt-select>` once the list is long enough that scanning it
 * is slower than typing three letters — somewhere around twenty options.
 *
 * @element kt-input-menu
 *
 * @csspart control - The field.
 * @csspart input - The native `<input>`.
 * @csspart popup - The option list.
 * @csspart option - An option row.
 *
 * @fires kt-change - An option was chosen or cleared. `detail: { value, option }`.
 * @fires kt-filter - The query changed. `detail: { query }`.
 */
export class KtInputMenu extends KtElement {
  static override styles = [
    KtElement.styles,
    listboxStyles,
    css`
      :host {
        position: relative;
        display: block;
        --field-height: var(--button-height);
      }

      .control {
        display: inline-flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--gap-element);
        width: 100%;
        height: var(--field-height);
        padding: 0 var(--button-padding-x);
        color: var(--text-body);
        font: var(--font-input);
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
        cursor: text;
        transition:
          background-color var(--duration-instant),
          outline-color var(--duration-instant);
      }

      .control:hover {
        outline: var(--outline-width) solid var(--color-text-700);
      }
      .control:focus-within {
        background-color: var(--color-dark-12);
        outline: var(--outline-width) solid var(--color-primary-base);
      }

      .error .control,
      .error .control:hover,
      .error .control:focus-within {
        outline: var(--outline-width) solid var(--color-danger-base);
      }

      :host([disabled]) {
        pointer-events: none;
        opacity: 0.6;
      }

      input {
        width: 100%;
        min-width: 0;
        color: var(--text-body);
        font: var(--font-input);
        background: transparent;
        border: none;
        outline: none;
      }

      input::placeholder {
        color: var(--color-text-500);
      }

      .icon-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        color: inherit;
        background: transparent;
        border: none;
        cursor: pointer;
      }

      .clear {
        transition: transform var(--duration-instant) ease-in-out;
      }
      .clear:hover {
        transform: rotate(90deg);
      }

      .toggle {
        transition: transform var(--duration-fast) ease-in-out;
      }
      .open .toggle {
        transform: scaleY(-1);
      }
    `,
  ];

  @query('input')
  private input!: HTMLInputElement;

  private readonly listId = uniqueId('kt-input-menu-list');

  @state()
  private open = false;

  @state()
  private query = '';

  @state()
  private activeIndex = -1;

  @property({ attribute: false })
  options: readonly KtOption[] = [];

  @property({ type: String })
  value: string | number | null = null;

  @property({ type: String })
  placeholder = '';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: String, reflect: true })
  error = '';

  @property({ type: String })
  label = '';

  @property({ type: String, attribute: 'empty-text' })
  emptyText = 'No options available';

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('pointerdown', this.onDocumentPointerDown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('pointerdown', this.onDocumentPointerDown);
  }

  get selectedOption(): KtOption | undefined {
    return this.options.find((option) => option.id === this.value);
  }

  /** Options after the current query, which is what the keyboard walks. */
  private get visibleOptions(): readonly KtOption[] {
    return filterOptions(this.options, this.query);
  }

  /**
   * While filtering, the field shows the query; otherwise it shows the chosen
   * option. Keeping the two in one input is what makes it a combobox rather
   * than a search box that happens to sit above a list.
   */
  private get displayValue(): string {
    if (this.open && this.query) return this.query;
    const selected = this.selectedOption;
    return selected ? optionLabel(selected) : this.query;
  }

  private onDocumentPointerDown = (event: Event): void => {
    if (event.composedPath().includes(this)) return;
    this.close();
  };

  private openList(): void {
    if (this.disabled || this.open) return;
    this.open = true;
    this.activeIndex = firstEnabledIndex(this.visibleOptions);
  }

  private close(): void {
    this.open = false;
    this.query = '';
    this.activeIndex = -1;
  }

  private onInput(event: Event): void {
    this.query = (event.target as HTMLInputElement).value;
    this.open = true;
    this.activeIndex = firstEnabledIndex(this.visibleOptions);
    emit(this, 'kt-filter', { query: this.query });
  }

  private choose(option: KtOption): void {
    if (option.disabled) return;
    this.value = option.id;
    this.close();
    emit(this, 'kt-change', { value: option.id, option });
  }

  private clear(event: Event): void {
    event.stopPropagation();
    this.value = null;
    this.query = '';
    emit(this, 'kt-change', { value: null, option: null });
    this.input?.focus();
  }

  private onKeyDown(event: KeyboardEvent): void {
    const options = this.visibleOptions;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        event.preventDefault();
        if (!this.open) return this.openList();
        this.activeIndex = nextEnabledIndex(
          options,
          this.activeIndex,
          event.key === 'ArrowDown' ? 1 : -1,
        );
        return;
      case 'Home':
        if (!this.open) return;
        event.preventDefault();
        this.activeIndex = firstEnabledIndex(options);
        return;
      case 'End':
        if (!this.open) return;
        event.preventDefault();
        this.activeIndex = lastEnabledIndex(options);
        return;
      case 'Enter': {
        if (!this.open) return;
        event.preventDefault();
        const option = options[this.activeIndex];
        if (option) this.choose(option);
        return;
      }
      case 'Escape':
        if (!this.open) return;
        event.stopPropagation();
        this.close();
        return;
      case 'Tab':
        this.close();
    }
  }

  private optionId(index: number): string {
    return `${this.listId}-option-${index}`;
  }

  override render(): TemplateResult {
    const options = this.visibleOptions;
    const showClear = this.selectedOption !== undefined && !this.disabled;

    return html`<div
      class=${classMap({ open: this.open, error: Boolean(this.error) })}
      @keydown=${this.onKeyDown}
    >
      <div part="control" class="control" @click=${this.openList}>
        <input
          part="input"
          role="combobox"
          aria-expanded=${this.open ? 'true' : 'false'}
          aria-controls=${this.listId}
          aria-autocomplete="list"
          aria-activedescendant=${
            this.open && this.activeIndex >= 0 ? this.optionId(this.activeIndex) : nothing
          }
          aria-label=${this.label || nothing}
          aria-invalid=${this.error ? 'true' : nothing}
          placeholder=${this.placeholder || nothing}
          .value=${live(this.displayValue)}
          ?disabled=${this.disabled}
          @focus=${this.openList}
          @input=${this.onInput}
        />

        ${
          showClear
            ? html`<button
                type="button"
                class="icon-button clear"
                aria-label="Clear"
                tabindex="-1"
                @click=${this.clear}
              >
                <kt-icon name="x" size="18"></kt-icon>
              </button>`
            : nothing
        }

        <button
          type="button"
          class="icon-button toggle"
          aria-label=${this.open ? 'Close list' : 'Open list'}
          tabindex="-1"
          @click=${(event: Event) => {
            event.stopPropagation();
            if (this.open) this.close();
            else this.openList();
          }}
        >
          <kt-icon name="chevron-down" size="18"></kt-icon>
        </button>
      </div>

      <ul
        part="popup"
        id=${this.listId}
        class=${classMap({ popup: true, open: this.open })}
        role="listbox"
        aria-label=${this.label || this.placeholder}
      >
        ${
          options.length === 0
            ? html`<li class="empty">${this.emptyText}</li>`
            : options.map(
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

defineElement('kt-input-menu', KtInputMenu);

declare global {
  interface HTMLElementTagNameMap {
    'kt-input-menu': KtInputMenu;
  }
}
