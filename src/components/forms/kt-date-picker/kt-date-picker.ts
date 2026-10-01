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
import { FloatingController, floatingStyles } from '#internal/floating';
import { dateFormat, resolveLocale } from '#internal/locale';
import { strings } from '#internal/strings';
import {
  compareDates,
  formatDate,
  formatRange,
  parseDate,
  parseRange,
  toLocalDate,
  today,
  type PlainDate,
} from '#internal/date';
import { exampleDate, parseTypedDate, parseTypedRange } from '#internal/typed-date';
import '../kt-calendar/kt-calendar.js';
import type { KtCalendar } from '../kt-calendar/kt-calendar.js';
import '../../core/kt-icon/kt-icon.js';
import '../../feedback/kt-tooltip/kt-tooltip.js';

export type KtDatePickerSize = 'small' | 'medium' | 'large';

/**
 * A date field with a calendar, for one day or a period.
 *
 * The value is ISO 8601 text, the format a server and a `<input type="date">`
 * already speak: `2026-09-25`, or `2026-09-01/2026-09-25` for a period. What
 * the field shows is the same date formatted for the reader's language, and
 * the calendar starts its weeks on the day their region does.
 *
 * The field takes a date typed the way the reader writes it — `25/09/2026` in
 * London, `9/25/2026` in New York, `25 sept.` in Paris, ISO anywhere — on Enter
 * or when it is left. What does not read as a date is flagged, and the value
 * it had is kept.
 *
 * The popup is a `<kt-calendar>`, with its keyboard model and its month and
 * year views: the WAI-ARIA date picker dialog pattern, where Escape closes the
 * dialog and hands focus back to the field, and tabbing out closes it too.
 *
 * @element kt-date-picker
 *
 * @csspart field - The field.
 * @csspart input - The text the date is typed into.
 * @csspart trigger - The button that opens the calendar.
 * @csspart panel - The calendar popup.
 * @csspart calendar - The `<kt-calendar>` inside it.
 *
 * @fires kt-change - A date or a whole period was chosen, or the value cleared.
 *   `detail: { value }` — the ISO date or interval, or `null`.
 *
 * @example
 * ```html
 * <kt-date-picker label="Due date" name="due" min="2026-01-01"></kt-date-picker>
 * <kt-date-picker range label="Report period" value="2026-09-01/2026-09-25"></kt-date-picker>
 * ```
 */
export class KtDatePicker extends KtElement {
  static readonly formAssociated = true;

  static override styles = [
    KtElement.styles,
    floatingStyles,
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

      /* The field, as kt-input draws one: a fill with a resting hairline, an
         outline on hover and focus that never reflows it. */
      .field {
        display: flex;
        align-items: center;
        gap: 2px;
        height: var(--field-height);
        padding: 0 10px 0 4px;
        color: var(--text-body);
        background-color: var(--color-dark-20);
        border: var(--border-width) solid var(--border-field);
        border-radius: var(--radius-input);
        outline: var(--outline-width) solid transparent;
        transition:
          background-color var(--duration-instant),
          outline-color var(--duration-instant);
      }
      .field:hover {
        outline: var(--outline-width) solid var(--color-text-700);
      }
      .field:focus-within,
      .open .field {
        background-color: var(--color-dark-12);
        outline: var(--outline-width) solid var(--color-primary-base);
      }
      .error .field,
      .error .field:hover,
      .error .field:focus-within {
        outline: var(--outline-width) solid var(--color-danger-base);
      }
      :host(:disabled) .field {
        color: var(--text-disabled);
        background-color: var(--color-dark-14);
      }

      /* The calendar button leads: it says what kind of field this is. */
      .trigger,
      .clear {
        display: inline-flex;
        flex: none;
        align-items: center;
        justify-content: center;
        padding: 0;
        color: var(--text-muted);
        background: none;
        border: none;
        border-radius: calc(var(--radius-input) - 2px);
        cursor: pointer;
        transition:
          background-color var(--duration-instant),
          color var(--duration-instant);
      }
      .trigger {
        width: calc(var(--field-height) - 10px);
        height: calc(var(--field-height) - 10px);
      }
      .trigger:hover,
      .open .trigger {
        color: var(--text-body);
        background: var(--color-dark-22);
      }
      .clear:hover {
        color: var(--text-body);
      }
      .trigger:focus-visible,
      .clear:focus-visible {
        outline: var(--outline-width) solid var(--color-primary-base);
      }
      :host(:disabled) .trigger {
        cursor: not-allowed;
      }

      input {
        flex: 1;
        min-width: 0;
        height: 100%;
        padding: 0 4px;
        color: inherit;
        font: var(--font-input);
        background: transparent;
        border: none;
        outline: none;
      }
      input::placeholder {
        color: var(--text-muted);
      }
      .error input {
        color: var(--color-danger-text);
      }

      .error-icon {
        flex: none;
        color: var(--color-danger-text);
      }

      /* Placed from the field by FloatingController. */
      .panel {
        box-sizing: border-box;
        padding: var(--padding-expand);
        background: var(--color-dark-20);
        border-radius: var(--radius-input);

        visibility: hidden;
        opacity: 0;
        transform: translateY(-6px);
        pointer-events: none;
        transition:
          opacity var(--duration-fast) var(--easing-standard),
          transform var(--duration-fast) var(--easing-standard),
          visibility 0s linear var(--duration-fast);
      }
      .panel.top:not(.open) {
        transform: translateY(6px);
      }
      .panel.open {
        visibility: visible;
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
        transition:
          opacity var(--duration-fast) var(--easing-standard),
          transform var(--duration-fast) var(--easing-standard);
      }

      .panel kt-calendar {
        display: block;
      }
    `,
  ];

  @query('input')
  private input?: HTMLInputElement;

  @query('kt-calendar')
  private calendar?: KtCalendar;

  private internals: UsableInternals | null = null;
  private defaultValue: string | null = null;
  private readonly panelId = uniqueId('kt-date-picker-panel');

  @state() private open = false;
  /** What is typed, while it differs from the value shown. */
  @state() private text = '';
  @state() private editing = false;
  /** Why the typed text was turned down, if it was. */
  @state() private typedError = '';
  @state() private focused = false;
  @state() private placement: 'bottom' | 'top' = 'bottom';

  private floating = new FloatingController(this, {
    panel: () => this.shadowRoot?.querySelector<HTMLElement>('.panel'),
    anchor: () => this.shadowRoot?.querySelector('.field'),
    onPlace: (side) => {
      this.placement = side === 'top' ? 'top' : 'bottom';
    },
  });

  /** ISO date, or `start/end` interval with `range`. `null` when empty. */
  @property({ type: String, reflect: true })
  value: string | null = null;

  /** Choose a period — two dates — instead of one day. */
  @property({ type: Boolean, reflect: true })
  range = false;

  /** Earliest date that can be chosen, ISO. */
  @property({ type: String })
  min = '';

  /** Latest date that can be chosen, ISO. */
  @property({ type: String })
  max = '';

  @property({ type: String })
  name = '';

  /** Accessible name, when no `<kt-label-input>` wraps the field. */
  @property({ type: String })
  label = '';

  /** Shown while empty. Defaults to the strings registry. */
  @property({ type: String })
  placeholder: string | undefined = undefined;

  /**
   * BCP 47 language tag for formatting and for the first day of the week.
   * Empty: the page's `lang`, then the browser's language.
   */
  @property({ type: String })
  locale = '';

  @property({ type: String, reflect: true })
  size: KtDatePickerSize = 'medium';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  /** Disabled by an enclosing `<fieldset>`, which leaves `disabled` alone. */
  @state()
  private formDisabled = false;

  /** Whether the control is off, by its own `disabled` or by its form. */
  private get inactive(): boolean {
    return this.disabled || this.formDisabled;
  }

  @property({ type: Boolean, reflect: true })
  required = false;

  /** Shows a button that empties the field once it holds a value. */
  @property({ type: Boolean })
  clearable = true;

  /** Error message. A non-empty value puts the field in its error state. */
  @property({ type: String, reflect: true })
  error = '';

  override connectedCallback(): void {
    super.connectedCallback();
    this.internals ??= attachFormInternals(this);
    this.defaultValue = this.value;
    // Back on the document if it was reconnected while open.
    toggleListener(this.open, document, 'pointerdown', this.onDocumentPointerDown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('pointerdown', this.onDocumentPointerDown);
  }

  // Untyped: `open` is private, so not among the keys PropertyValues<this> knows.
  override updated(changed: PropertyValues): void {
    // Only an open list closes on an outside click, so only an open one listens.
    if (changed.has('open')) {
      toggleListener(this.open, document, 'pointerdown', this.onDocumentPointerDown);
    }
    this.floating.sync(this.open);
  }

  override willUpdate(changed: PropertyValues<this>): void {
    if (
      changed.has('value') ||
      changed.has('range') ||
      changed.has('required') ||
      changed.has('error') ||
      changed.has('typedError' as keyof KtDatePicker) ||
      this.stringsChanged(changed)
    ) {
      const complete = this.isComplete();
      setFormValue(this.internals, complete ? this.value : null);

      const missing = this.required && !complete;
      setValidity(
        this.internals,
        {
          valueMissing: missing,
          badInput: Boolean(this.typedError),
          customError: Boolean(this.error),
        },
        this.error || this.typedError || (missing ? strings().dateRequired : ''),
      );
    }
  }

  formResetCallback(): void {
    this.value = this.defaultValue;
    this.editing = false;
    this.typedError = '';
    this.close(false);
  }

  /**
   * Called by the platform when the control's disabled state changes — its
   * own `disabled`, or an ancestor `<fieldset disabled>` it cannot see.
   */
  formDisabledCallback(disabled: boolean): void {
    this.formDisabled = disabled;
  }

  formStateRestoreCallback(state: string | null): void {
    this.value = state;
  }

  override focus(options?: FocusOptions): void {
    this.input?.focus(options);
  }

  // --- Reading the value ---

  private get resolvedLocale(): string {
    return resolveLocale(this.locale);
  }

  private get selection(): { start: PlainDate | null; end: PlainDate | null } {
    return this.range
      ? parseRange(this.value)
      : { start: parseDate(this.value), end: parseDate(this.value) };
  }

  private isComplete(): boolean {
    const { start, end } = this.selection;
    return start !== null && end !== null && compareDates(start, end) <= 0;
  }

  private display(): string | null {
    const { start, end } = this.selection;
    if (!start || !end) return null;
    const format = dateFormat(this.resolvedLocale, { dateStyle: 'medium' });
    if (!this.range) return format.format(toLocalDate(start));
    return format.formatRange(toLocalDate(start), toLocalDate(end));
  }

  // --- Opening and closing ---

  private onDocumentPointerDown = (event: Event): void => {
    if (this.open && !event.composedPath().includes(this)) this.close(false);
  };

  /** Tabbing out of the calendar closes it; moving within it does not. */
  private onFocusOut = (event: FocusEvent): void => {
    const next = event.relatedTarget as Node | null;
    if (!this.open || !next) return;
    if (this.contains(next) || this.shadowRoot?.contains(next)) return;
    // Focus moving into the calendar's own shadow root is still inside.
    if (event.composedPath().includes(next)) return;
    if (this.calendar?.shadowRoot?.contains(next)) return;
    this.close(false);
  };

  private async show(): Promise<void> {
    if (this.inactive || this.open) return;
    this.open = true;

    // The calendar is rendered fresh on each opening — on the chosen day,
    // in its day view — and takes focus once it is there.
    await this.updateComplete;
    this.calendar?.focus();
  }

  private close(returnFocus: boolean): void {
    if (!this.open) return;
    this.open = false;
    if (returnFocus) this.focus();
  }

  private toggle(): void {
    if (this.open) this.close(true);
    else void this.show();
  }

  /** A click in the text opens the calendar, leaving the focus to type. */
  private openForTyping(): void {
    if (this.inactive || this.open) return;
    this.open = true;
  }

  // --- Choosing ---

  private onCalendarChange(event: CustomEvent<{ value: string }>): void {
    // The calendar's own event stops here; the picker reports its value.
    event.stopPropagation();
    this.editing = false;
    this.typedError = '';
    this.value = event.detail.value;
    this.close(true);
    emit(this, 'kt-change', { value: this.value });
  }

  private clear(): void {
    this.editing = false;
    this.typedError = '';
    this.value = null;
    emit(this, 'kt-change', { value: null });
    this.focus();
  }

  // --- Typing ---

  private onInput(event: Event): void {
    this.text = (event.target as HTMLInputElement).value;
    this.editing = true;
  }

  /**
   * Reads what was typed into the value. Text that is not a date, or is a date
   * outside min and max, is flagged and the value kept; an empty field empties
   * the value.
   */
  private commitTyped(): void {
    if (!this.editing) return;
    this.editing = false;
    const typed = this.text.trim();

    if (!typed) {
      this.typedError = '';
      if (this.value !== null) {
        this.value = null;
        emit(this, 'kt-change', { value: null });
      }
      return;
    }

    const locale = this.resolvedLocale;
    const now = today();
    const read = this.range
      ? parseTypedRange(typed, locale, now)
      : (() => {
          const date = parseTypedDate(typed, locale, now);
          return date && { start: date, end: date };
        })();
    if (!read) {
      this.text = typed;
      this.editing = true;
      this.typedError = strings().dateInvalid(exampleDate(locale, now));
      return;
    }

    const min = parseDate(this.min);
    const max = parseDate(this.max);
    if ((min && compareDates(read.start, min) < 0) || (max && compareDates(read.end, max) > 0)) {
      this.text = typed;
      this.editing = true;
      this.typedError = strings().dateOutOfRange;
      return;
    }

    this.typedError = '';
    const value = this.range ? formatRange(read.start, read.end) : formatDate(read.start);
    if (value !== this.value) {
      this.value = value;
      emit(this, 'kt-change', { value });
    }
  }

  // --- Keyboard ---

  private onInputKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        this.commitTyped();
        if (!this.typedError) this.close(false);
        return;
      case 'Escape':
        // Puts the text back, and closes the calendar if it was open.
        if (!this.editing && !this.open) return;
        event.preventDefault();
        event.stopPropagation();
        this.editing = false;
        this.typedError = '';
        this.close(false);
        return;
      case 'ArrowDown':
        event.preventDefault();
        void this.show();
    }
  }

  private onPanelKeyDown(event: KeyboardEvent): void {
    // The calendar keeps Escape for itself while it shows months and years.
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.close(true);
    }
  }

  // --- Rendering ---

  override render(): TemplateResult {
    const s = strings();
    const shown = this.display();
    const placeholder = this.placeholder ?? (this.range ? s.selectPeriod : s.selectDate);
    const error = this.error || this.typedError;
    const showClear =
      this.clearable && this.value !== null && !this.inactive && !this.editing && !error;

    return html`${
        error ? html`<span id="error-message" class="visually-hidden">${error}</span>` : nothing
      }
      <div
        class=${classMap({ open: this.open, error: Boolean(error) })}
        @focusout=${this.onFocusOut}
      >
        <div part="field" class="field">
          <button
            part="trigger"
            type="button"
            class="trigger"
            tabindex="-1"
            aria-label=${s.openCalendar}
            aria-haspopup="dialog"
            aria-expanded=${this.open ? 'true' : 'false'}
            aria-controls=${this.panelId}
            ?disabled=${this.inactive}
            @click=${this.toggle}
          >
            <kt-icon name="calendar" size="18"></kt-icon>
          </button>
          <input
            part="input"
            .value=${live(this.editing ? this.text : (shown ?? ''))}
            placeholder=${placeholder}
            autocomplete="off"
            aria-label=${this.label || placeholder}
            aria-invalid=${error ? 'true' : nothing}
            aria-describedby=${error ? 'error-message' : nothing}
            ?disabled=${this.inactive}
            @input=${this.onInput}
            @change=${this.commitTyped}
            @keydown=${this.onInputKeyDown}
            @click=${this.openForTyping}
            @focus=${() => {
              this.focused = true;
            }}
            @blur=${() => {
              this.focused = false;
            }}
          />
          ${
            error
              ? html`<kt-tooltip class="error-icon" text=${error} ?open=${this.focused}>
                  <kt-icon name="circle-alert" size="18"></kt-icon>
                </kt-tooltip>`
              : nothing
          }
          ${
            showClear
              ? html`<button type="button" class="clear" aria-label=${s.clear} @click=${this.clear}>
                  <kt-icon name="x" size="18"></kt-icon>
                </button>`
              : nothing
          }
        </div>

        <div
          part="panel"
          id=${this.panelId}
          popover="manual"
          class=${classMap({
            panel: true,
            floating: true,
            open: this.open,
            top: this.placement === 'top',
          })}
          role="dialog"
          aria-modal="false"
          aria-label=${this.range ? s.selectPeriod : s.selectDate}
          @keydown=${this.onPanelKeyDown}
        >
          ${
            this.open
              ? html`<kt-calendar
                  part="calendar"
                  .value=${this.value}
                  ?range=${this.range}
                  min=${this.min}
                  max=${this.max}
                  locale=${this.locale}
                  label=${this.label}
                  @kt-change=${this.onCalendarChange}
                ></kt-calendar>`
              : nothing
          }
        </div>
      </div>`;
  }
}

defineElement('kt-date-picker', KtDatePicker);

declare global {
  interface HTMLElementTagNameMap {
    'kt-date-picker': KtDatePicker;
  }
}
