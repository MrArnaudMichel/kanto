import { css, html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { live } from 'lit/directives/live.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { emit, toggleListener, uniqueId } from '#internal/events';
import {
  attachFormInternals,
  setFormValue,
  setValidity,
  type UsableInternals,
} from '#internal/form-control';
import {
  filterOptions,
  firstEnabledIndex,
  lastEnabledIndex,
  listboxStyles,
  nextEnabledIndex,
  optionLabel,
  type KtOption,
} from '#internal/listbox';
import { FloatingController, floatingStyles } from '#internal/floating';
import type { Side } from '#internal/position';
import { strings } from '#internal/strings';
import '../../core/kt-icon/kt-icon.js';

export type KtMultiSelectValue = readonly (string | number)[];

/** Kept clear for the text you type — a few letters of a search — whatever the chips take. */
const INPUT_MIN_WIDTH = 48;

/** The "+N" before it is drawn and can be measured. */
const MORE_WIDTH_GUESS = 40;

/**
 * Several choices from a list: type to narrow it, pick as many as you need.
 *
 * Each choice shows in the field as a removable chip. The field keeps to one
 * line — the chips that do not fit collapse into a "+3" — so it sits in a row
 * of filters without changing its height; the open list shows everything,
 * chosen or not.
 *
 * @element kt-multi-select
 *
 * @csspart control - The field.
 * @csspart chips - The row of chips.
 * @csspart input - The native `<input>`.
 * @csspart popup - The option list.
 * @csspart option - An option row.
 *
 * @fires kt-change - The choice changed. `detail: { value, options }`.
 * @fires kt-filter - The query changed. `detail: { query }`.
 *
 * @example
 * ```js
 * select.options = [{ id: 'ne', label: 'North East' }, { id: 'sw', label: 'South West' }];
 * select.value = ['ne'];
 * select.addEventListener('kt-change', (e) => filter(e.detail.value));
 * ```
 */
export class KtMultiSelect extends KtElement {
  static readonly formAssociated = true;

  static override styles = [
    KtElement.styles,
    floatingStyles,
    listboxStyles,
    css`
      :host {
        position: relative;
        display: block;
        --field-height: var(--button-height);
        --chip-height: calc(var(--field-height) - 16px);
      }

      .control {
        display: flex;
        align-items: center;
        gap: var(--gap-element);
        width: 100%;
        height: var(--field-height);
        padding: 0 var(--button-padding-x);
        color: var(--text-body);
        font: var(--font-input);
        background-color: var(--color-dark-20);
        /* The same resting hairline and rings as kt-input-menu. */
        border: var(--border-width) solid var(--border-field);
        border-radius: var(--radius-input);
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

      :host(:disabled) {
        pointer-events: none;
        opacity: 0.6;
      }

      /* One line, whatever is chosen: the chips that do not fit are hidden
         and counted in the "+N" beside them. */
      .chips {
        display: flex;
        flex: 0 1 auto;
        align-items: center;
        gap: var(--gap-element);
        min-width: 0;
        overflow: hidden;
      }

      /* Chips sit inset in the field, the same distance from its top, bottom
         and left edge — a fill inside a fill, in the family of a chosen
         segment or option, never an outlined pill. */
      .has-chips {
        padding-left: calc((var(--field-height) - var(--chip-height)) / 2);
      }

      .chip,
      .more {
        display: inline-flex;
        flex: none;
        align-items: center;
        gap: 2px;
        height: var(--chip-height);
        padding: 0 8px;
        color: var(--text-body);
        font: var(--font-normal-small);
        white-space: nowrap;
        background: var(--color-dark-23);
        border-radius: calc(var(--radius-input) - 2px);
      }

      .chip.removable {
        padding-right: 4px;
      }

      /* The chips that do not fit are hidden by fitChips; their own display
         would otherwise win over the attribute and leave them drawn. */
      .chip[hidden] {
        display: none;
      }

      /* A count, not a choice: same shape, quieter. */
      .more {
        color: var(--text-muted);
      }

      .remove {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        padding: 0;
        color: var(--text-muted);
        background: transparent;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition:
          background-color var(--duration-instant),
          color var(--duration-instant);
      }
      .remove:hover {
        color: var(--text-body);
        background: var(--color-dark-24);
      }
      .remove:focus-visible {
        outline: var(--outline-width) solid var(--color-primary-base);
        outline-offset: 1px;
      }

      input {
        flex: 1;
        min-width: ${INPUT_MIN_WIDTH}px;
        color: var(--text-body);
        font: var(--font-input);
        background: transparent;
        border: none;
        outline: none;
      }

      input::placeholder {
        color: var(--text-muted);
      }

      .toggle {
        display: inline-flex;
        flex: none;
        align-items: center;
        padding: 0;
        color: inherit;
        background: transparent;
        border: none;
        cursor: pointer;
        transition: transform var(--duration-fast) ease-in-out;
      }
      .open .toggle {
        transform: scaleY(-1);
      }

      .option {
        display: flex;
        align-items: center;
        gap: var(--gap-element);
      }

      /* The tick's room is kept on every row, so labels line up whether or
         not their option is chosen. */
      .tick {
        display: inline-flex;
        width: 16px;
        color: var(--color-primary-text);
      }
    `,
  ];

  @query('input')
  private input!: HTMLInputElement;

  private internals: UsableInternals | null = null;
  private defaultValue: KtMultiSelectValue = [];
  private readonly listId = uniqueId('kt-multi-select-list');
  private readonly countId = uniqueId('kt-multi-select-count');
  private resizeObserver: ResizeObserver | undefined;

  @state()
  private open = false;

  /** The side the list opened on, for the direction of its entrance. */
  @state()
  private placement: Side = 'bottom';

  private floating = new FloatingController(this, {
    panel: () => this.shadowRoot?.querySelector<HTMLElement>('.popup'),
    anchor: () => this.shadowRoot?.querySelector('.control'),
    matchWidth: true,
    onPlace: (side) => {
      this.placement = side;
    },
  });

  @state()
  private query = '';

  @state()
  private activeIndex = -1;

  /** Chips hidden for want of room, counted in "+N". */
  @state()
  private overflowCount = 0;

  @property({ attribute: false })
  options: readonly KtOption[] = [];

  /** The ids of the chosen options, in the order they were chosen. */
  @property({ attribute: false })
  value: KtMultiSelectValue = [];

  @property({ type: String })
  placeholder = '';

  @property({ type: String })
  name = '';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  /** Disabled by an enclosing `<fieldset>`, which leaves `disabled` alone. */
  @state()
  private formDisabled = false;

  /** Whether the control is off, by its own `disabled` or by its form. */
  private get inactive(): boolean {
    return this.disabled || this.formDisabled;
  }

  /** At least one value must be chosen. */
  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ type: String, reflect: true })
  error = '';

  /** Accessible name, when no `<kt-label-input>` wraps the field. */
  @property({ type: String })
  label = '';

  /** Shown in the list when no option matches. */
  @property({ type: String, attribute: 'empty-text' })
  emptyText: string | undefined = undefined;

  override connectedCallback(): void {
    super.connectedCallback();
    this.internals ??= attachFormInternals(this);
    this.defaultValue = this.value;
    // Back on the document if it was reconnected while open.
    toggleListener(this.open, document, 'pointerdown', this.onDocumentPointerDown);
    // A web font changes every chip's width once it arrives.
    void document.fonts?.ready.then(() => this.fitChips());
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('pointerdown', this.onDocumentPointerDown);
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
  }

  override willUpdate(changed: PropertyValues<this>): void {
    if (
      changed.has('value') ||
      changed.has('name') ||
      changed.has('required') ||
      changed.has('error') ||
      this.stringsChanged(changed)
    ) {
      // One entry per value, under the one name, as <select multiple> does;
      // nothing at all when nothing is chosen.
      let data: FormData | null = null;
      if (this.value.length > 0) {
        data = new FormData();
        for (const id of this.value) data.append(this.name, String(id));
      }
      setFormValue(this.internals, data);

      const missing = this.required && this.value.length === 0;
      setValidity(
        this.internals,
        { valueMissing: missing, customError: Boolean(this.error) },
        this.error || (missing ? strings().selectOption : ''),
      );
    }
  }

  // Untyped: `open` is private, so not among the keys PropertyValues<this> knows.
  override updated(changed: PropertyValues): void {
    // Only an open list closes on an outside click, so only an open one listens.
    if (changed.has('open')) {
      toggleListener(this.open, document, 'pointerdown', this.onDocumentPointerDown);
    }
    this.floating.sync(this.open);
    this.observeWidth();
    this.fitChips();
  }

  formResetCallback(): void {
    this.value = this.defaultValue;
    this.close();
  }

  /**
   * Called by the platform when the control's disabled state changes — its
   * own `disabled`, or an ancestor `<fieldset disabled>` it cannot see.
   */
  formDisabledCallback(disabled: boolean): void {
    this.formDisabled = disabled;
  }

  /** Called by the platform when the browser restores a session. */
  formStateRestoreCallback(state: string | FormData | null): void {
    const saved =
      state instanceof FormData ? state.getAll(this.name).map(String) : state ? [state] : [];
    // Back to the options' own ids, which may be numbers.
    this.value = saved.map(
      (text) => this.options.find((option) => String(option.id) === text)?.id ?? text,
    );
  }

  override focus(options?: FocusOptions): void {
    this.input?.focus(options);
  }

  /** The chosen options, in the order chosen. */
  get selectedOptions(): readonly KtOption[] {
    return this.value.map(
      (id) => this.options.find((option) => option.id === id) ?? { id, label: String(id) },
    );
  }

  /** Options after the current query, which is what the keyboard walks. */
  private get visibleOptions(): readonly KtOption[] {
    return filterOptions(this.options, this.query);
  }

  private isChosen(option: KtOption): boolean {
    return this.value.includes(option.id);
  }

  private onDocumentPointerDown = (event: Event): void => {
    if (event.composedPath().includes(this)) return;
    this.close();
  };

  private openList(): void {
    if (this.inactive || this.open) return;
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

  /** Adds an option, or takes it out if it is already chosen. The list stays open. */
  private toggle(option: KtOption): void {
    if (option.disabled || this.inactive) return;
    this.commit(
      this.isChosen(option)
        ? this.value.filter((id) => id !== option.id)
        : [...this.value, option.id],
    );
  }

  private removeValue(id: string | number): void {
    if (this.inactive) return;
    this.commit(this.value.filter((chosen) => chosen !== id));
  }

  private commit(value: KtMultiSelectValue): void {
    this.value = value;
    emit(this, 'kt-change', { value, options: this.selectedOptions });
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
        if (option) this.toggle(option);
        return;
      }
      case 'Backspace': {
        // Only once the text is gone: until then Backspace edits the query.
        const last = this.value[this.value.length - 1];
        if (this.input?.value || last === undefined) return;
        this.removeValue(last);
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

  /** Measures again when the field's width changes, since that is what fits. */
  private observeWidth(): void {
    if (this.resizeObserver || typeof ResizeObserver === 'undefined') return;
    const control = this.shadowRoot?.querySelector('.control');
    if (!control) return;
    this.resizeObserver = new ResizeObserver(() => this.fitChips());
    this.resizeObserver.observe(control);
  }

  /**
   * Hides the chips that do not fit on the field's one line, and counts them
   * in "+N".
   *
   * The room comes from what never moves: the field's inner width, less the
   * input's minimum, the toggle and the gaps between them. It used to be read
   * from the chip row itself, whose width depends on the chips shown and on
   * the "+N" — so in Firefox each pass undid the last, and the loop between
   * this and the render it triggered froze the page.
   */
  private fitChips(): void {
    const control = this.shadowRoot?.querySelector<HTMLElement>('.control');
    const row = this.shadowRoot?.querySelector<HTMLElement>('.chips');
    if (!control || !row) return;
    const chips = [...row.querySelectorAll<HTMLElement>('.chip')];
    for (const chip of chips) chip.hidden = false;

    const style = getComputedStyle(control);
    const gap = parseFloat(style.columnGap) || 0;
    const toggle = control.querySelector('.toggle')?.getBoundingClientRect().width ?? 0;
    const inner =
      control.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    // Between the chips and the input, and between the input and the toggle.
    const room = inner - INPUT_MIN_WIDTH - toggle - 2 * gap;
    // No layout — a test DOM, or a field not on screen — so nothing to fit.
    if (control.clientWidth === 0 || room <= 0) return;

    const left = row.getBoundingClientRect().left;
    const fitting = (limit: number) =>
      chips.filter((chip) => chip.getBoundingClientRect().right - left <= limit).length;

    let shown = fitting(room);
    if (shown < chips.length) {
      // Room for the "+N" and its gap: as wide as it is, or a guess before it exists.
      const more = this.shadowRoot?.querySelector('.more')?.getBoundingClientRect().width;
      shown = fitting(room - (more || MORE_WIDTH_GUESS) - gap);
    }

    chips.forEach((chip, index) => {
      chip.hidden = index >= shown;
    });
    const hidden = chips.length - shown;
    if (hidden !== this.overflowCount) this.overflowCount = hidden;
  }

  private optionId(index: number): string {
    return `${this.listId}-option-${index}`;
  }

  override render(): TemplateResult {
    const options = this.visibleOptions;
    const chosen = this.selectedOptions;

    return html`<div
      class=${classMap({ open: this.open, error: Boolean(this.error) })}
      @keydown=${this.onKeyDown}
    >
      <span id=${this.countId} class="visually-hidden">
        ${chosen.length > 0 ? strings().selectedCount(chosen.length) : ''}
      </span>

      <div
        part="control"
        class=${classMap({ control: true, 'has-chips': chosen.length > 0 })}
        @click=${this.openList}
      >
        <div part="chips" class="chips">
          ${chosen.map(
            (option) =>
              html`<span class=${classMap({ chip: true, removable: !this.inactive })}>
                ${optionLabel(option)}
                ${
                  this.inactive
                    ? nothing
                    : html`<button
                        type="button"
                        class="remove"
                        tabindex="-1"
                        aria-label=${strings().remove(optionLabel(option))}
                        @click=${(event: Event) => {
                          // Removing a chip is not a request to open the list.
                          event.stopPropagation();
                          this.removeValue(option.id);
                        }}
                      >
                        <kt-icon name="x" size="12"></kt-icon>
                      </button>`
                }
              </span>`,
          )}
        </div>
        ${
          this.overflowCount > 0
            ? html`<span class="more"
                >${
                  // With not one chip left to count on from, "+3" says less
                  // than how many are chosen. The wider label only ever hides
                  // more chips, never fewer, so the fit cannot swing on it.
                  this.overflowCount === chosen.length
                    ? strings().selectedCount(chosen.length)
                    : `+${this.overflowCount}`
                }</span
              >`
            : nothing
        }

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
          aria-describedby=${this.countId}
          aria-invalid=${this.error ? 'true' : nothing}
          placeholder=${chosen.length === 0 && this.placeholder ? this.placeholder : nothing}
          .value=${live(this.query)}
          ?disabled=${this.inactive}
          @focus=${this.openList}
          @input=${this.onInput}
        />

        <button
          type="button"
          class="toggle"
          aria-label=${this.open ? strings().closeList : strings().openList}
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
        popover="manual"
        class=${classMap({
          popup: true,
          floating: true,
          open: this.open,
          top: this.placement === 'top',
        })}
        role="listbox"
        aria-multiselectable="true"
        aria-label=${this.label || this.placeholder}
        @pointerdown=${(event: Event) => {
          // Keeps the focus in the field while options are ticked.
          event.preventDefault();
        }}
      >
        ${
          options.length === 0
            ? html`<li class="empty">${this.emptyText ?? strings().noOptions}</li>`
            : options.map((option, index) => {
                const isChosen = this.isChosen(option);
                return html`<li
                  part="option"
                  id=${this.optionId(index)}
                  class=${classMap({
                    option: true,
                    selected: isChosen,
                    active: index === this.activeIndex,
                    disabled: Boolean(option.disabled),
                  })}
                  role="option"
                  aria-selected=${isChosen ? 'true' : 'false'}
                  aria-disabled=${option.disabled ? 'true' : nothing}
                  @click=${() => this.toggle(option)}
                >
                  <span class="tick" aria-hidden="true">
                    ${isChosen ? html`<kt-icon name="check" size="16"></kt-icon>` : nothing}
                  </span>
                  ${optionLabel(option)}
                </li>`;
              })
        }
      </ul>
    </div>`;
  }
}

defineElement('kt-multi-select', KtMultiSelect);

declare global {
  interface HTMLElementTagNameMap {
    'kt-multi-select': KtMultiSelect;
  }
}
