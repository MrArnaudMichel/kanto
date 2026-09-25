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
import { strings } from '#internal/strings';
import {
  addDays,
  addMonths,
  compareDates,
  firstDayOfWeek,
  formatDate,
  formatRange,
  isBetween,
  isSameDay,
  monthGrid,
  parseDate,
  parseRange,
  startOfWeek,
  toLocalDate,
  today,
  type PlainDate,
} from '#internal/date';
import '../../core/kt-icon/kt-icon.js';

export type KtDatePickerSize = 'small' | 'medium' | 'large';

/** Room the calendar needs below the field before it opens upwards instead. */
const PANEL_SPACE = 380;

/**
 * A date field with a calendar, for one day or a period.
 *
 * The value is ISO 8601 text, the format a server and a `<input type="date">`
 * already speak: `2026-09-25`, or `2026-09-01/2026-09-25` for a period. What
 * the field shows is the same date formatted for the reader's language, and
 * the calendar starts its weeks on the day their region does.
 *
 * The calendar follows the WAI-ARIA date picker dialog pattern: a grid of
 * days with one tab stop, arrows by day and week, Page Up/Down by month (and
 * by year with Shift), Home/End to the week's ends, Enter to choose, Escape to
 * close. Dates outside `min`/`max` can be reached but not chosen.
 *
 * @element kt-date-picker
 *
 * @csspart trigger - The field.
 * @csspart panel - The calendar popup.
 * @csspart day - A day cell.
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
    css`
      :host {
        position: relative;
        display: block;
        --field-height: var(--button-height);
        --day-size: 36px;
      }
      :host([size='small']) {
        --field-height: var(--button-height-small);
      }
      :host([size='large']) {
        --field-height: var(--button-height-large);
      }

      .field {
        position: relative;
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
        border: var(--border-width) solid var(--border-field);
        border-radius: var(--radius-input);
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
      :host([disabled]) .trigger {
        color: var(--text-disabled);
        background-color: var(--color-dark-14);
        cursor: not-allowed;
      }

      .value {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
      .placeholder {
        color: var(--text-muted);
      }

      .icons {
        display: inline-flex;
        align-items: center;
        gap: var(--gap-element);
        color: var(--text-muted);
      }
      /* Room for the clear button, which sits over the field, not inside the
         trigger: a button inside a button is not a thing assistive
         technology can operate. */
      .clearable .icons {
        padding-left: calc(18px + var(--gap-element));
      }
      .clear {
        position: absolute;
        top: 50%;
        /* Just left of the calendar icon, in the room .icons keeps for it. */
        right: calc(var(--button-padding-x) + 18px + var(--gap-element));
        display: inline-flex;
        padding: 0;
        color: var(--text-muted);
        background: none;
        border: none;
        border-radius: var(--radius-sub-menu);
        cursor: pointer;
        transform: translateY(-50%);
      }
      .clear:hover {
        color: var(--text-body);
      }
      .clear:focus-visible {
        outline: var(--outline-width) solid var(--color-primary-base);
      }

      .panel {
        position: absolute;
        top: calc(var(--field-height) + 6px);
        left: 0;
        z-index: var(--z-dropdown);
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
      .panel.top {
        top: auto;
        bottom: calc(var(--field-height) + 6px);
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

      .header {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        margin-bottom: var(--gap-element);
      }
      .title {
        margin: 0;
        color: var(--text-body);
        font: var(--font-normal-medium);
        text-align: center;
        text-transform: capitalize;
      }
      .nav {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: var(--day-size);
        height: var(--day-size);
        padding: 0;
        color: var(--text-muted);
        background: none;
        border: none;
        border-radius: var(--radius-input);
        cursor: pointer;
      }
      .nav:hover {
        color: var(--text-body);
        background: var(--color-dark-22);
      }
      .nav:focus-visible {
        outline: var(--outline-width) solid var(--color-primary-base);
      }

      table {
        border-collapse: separate;
        border-spacing: 0 2px;
      }
      th {
        width: var(--day-size);
        padding-bottom: 4px;
        color: var(--text-muted);
        font: var(--font-normal-small);
        font-weight: 600;
      }
      th abbr {
        text-decoration: none;
      }

      .day {
        width: var(--day-size);
        height: var(--day-size);
        padding: 0;
        color: var(--text-body);
        font: var(--font-normal-regular);
        font-variant-numeric: tabular-nums;
        text-align: center;
        border-radius: var(--radius-input);
        outline: none;
        cursor: pointer;
      }
      .day:hover {
        background: var(--color-dark-22);
      }
      .day:focus-visible {
        box-shadow: inset 0 0 0 var(--outline-width) var(--color-primary-base);
      }
      .day.outside {
        color: var(--text-muted);
      }
      .day.today {
        font-weight: 700;
        text-decoration: underline;
        text-decoration-thickness: 2px;
        text-underline-offset: 4px;
      }

      /* A period reads as one band: the days between are tinted and squared
         off, and only its two ends are rounded. */
      .day.in-range {
        background: var(--color-primary-soft);
        border-radius: 0;
      }
      .day.range-start {
        border-radius: var(--radius-input) 0 0 var(--radius-input);
      }
      .day.range-end {
        border-radius: 0 var(--radius-input) var(--radius-input) 0;
      }
      .day.range-start.range-end {
        border-radius: var(--radius-input);
      }
      .day.selected {
        color: var(--color-white);
        background: var(--color-primary-base);
      }

      .day[aria-disabled='true'] {
        color: var(--text-disabled);
        background: none;
        text-decoration: line-through;
        cursor: not-allowed;
      }
    `,
  ];

  @query('.trigger')
  private trigger?: HTMLButtonElement;

  private internals: UsableInternals | null = null;
  private defaultValue: string | null = null;
  private readonly panelId = uniqueId('kt-date-picker-panel');
  private readonly titleId = uniqueId('kt-date-picker-title');
  private focusCell = false;

  @state() private open = false;
  @state() private placement: 'bottom' | 'top' = 'bottom';
  /** First day of the month on show. */
  @state() private view: PlainDate = { ...today(), day: 1 };
  /** The day holding the grid's one tab stop. */
  @state() private focused: PlainDate = today();
  /** In a period: the first end chosen, while the second is pending. */
  @state() private anchor: PlainDate | null = null;

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
    document.addEventListener('pointerdown', this.onDocumentPointerDown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('pointerdown', this.onDocumentPointerDown);
  }

  override willUpdate(changed: PropertyValues<this>): void {
    if (
      changed.has('value') ||
      changed.has('range') ||
      changed.has('required') ||
      changed.has('error') ||
      this.stringsChanged(changed)
    ) {
      const complete = this.isComplete();
      setFormValue(this.internals, complete ? this.value : null);

      const missing = this.required && !complete;
      setValidity(
        this.internals,
        { valueMissing: missing, customError: Boolean(this.error) },
        this.error || (missing ? strings().dateRequired : ''),
      );
    }
  }

  override updated(): void {
    if (!this.focusCell) return;
    this.focusCell = false;
    this.shadowRoot
      ?.querySelector<HTMLElement>(`[data-date="${formatDate(this.focused)}"]`)
      ?.focus();
  }

  formResetCallback(): void {
    this.value = this.defaultValue;
    this.close(false);
  }

  formStateRestoreCallback(state: string | null): void {
    this.value = state;
  }

  override focus(options?: FocusOptions): void {
    this.trigger?.focus(options);
  }

  // --- Reading the value ---

  private get resolvedLocale(): string {
    return this.locale || document.documentElement.lang || navigator.language || 'en';
  }

  /** The chosen day, or the two ends of the chosen period. */
  private get selection(): { start: PlainDate | null; end: PlainDate | null } {
    return this.range
      ? parseRange(this.value)
      : { start: parseDate(this.value), end: parseDate(this.value) };
  }

  private isComplete(): boolean {
    const { start, end } = this.selection;
    return start !== null && end !== null;
  }

  private isOutOfBounds(date: PlainDate): boolean {
    const min = parseDate(this.min);
    const max = parseDate(this.max);
    return (
      (min !== null && compareDates(date, min) < 0) || (max !== null && compareDates(date, max) > 0)
    );
  }

  private display(): string | null {
    const { start, end } = this.selection;
    if (!start || !end) return null;
    const format = new Intl.DateTimeFormat(this.resolvedLocale, { dateStyle: 'medium' });
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
    this.close(false);
  };

  private show(): void {
    if (this.disabled || this.open) return;
    const { start } = this.selection;
    let target = start ?? today();
    const min = parseDate(this.min);
    const max = parseDate(this.max);
    if (min && compareDates(target, min) < 0) target = min;
    if (max && compareDates(target, max) > 0) target = max;

    const rect = this.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom;
    this.placement = below < PANEL_SPACE && rect.top > below ? 'top' : 'bottom';

    this.anchor = null;
    this.moveTo(target);
    this.open = true;
  }

  private close(returnFocus: boolean): void {
    if (!this.open) return;
    this.open = false;
    this.anchor = null;
    if (returnFocus) this.focus();
  }

  private toggle(): void {
    if (this.open) this.close(false);
    else this.show();
  }

  // --- Choosing ---

  private moveTo(date: PlainDate): void {
    this.focused = date;
    if (date.year !== this.view.year || date.month !== this.view.month) {
      this.view = { year: date.year, month: date.month, day: 1 };
    }
    this.focusCell = true;
  }

  private choose(date: PlainDate): void {
    if (this.isOutOfBounds(date)) return;

    if (!this.range) {
      this.commit(formatDate(date));
      return;
    }
    if (!this.anchor) {
      // First end of the period: stay open for the second.
      this.anchor = date;
      this.focused = date;
      return;
    }
    const [start, end] =
      compareDates(this.anchor, date) <= 0 ? [this.anchor, date] : [date, this.anchor];
    this.commit(formatRange(start, end));
  }

  private commit(value: string): void {
    this.value = value;
    this.close(true);
    emit(this, 'kt-change', { value });
  }

  private clear(): void {
    this.value = null;
    this.anchor = null;
    emit(this, 'kt-change', { value: null });
    this.focus();
  }

  // --- Keyboard ---

  private onTriggerKeyDown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.show();
    }
  }

  private onPanelKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.close(true);
    }
  }

  private onGridKeyDown(event: KeyboardEvent): void {
    const firstDay = firstDayOfWeek(this.resolvedLocale);
    const from = this.focused;
    let next: PlainDate;

    switch (event.key) {
      case 'ArrowLeft':
        next = addDays(from, -1);
        break;
      case 'ArrowRight':
        next = addDays(from, 1);
        break;
      case 'ArrowUp':
        next = addDays(from, -7);
        break;
      case 'ArrowDown':
        next = addDays(from, 7);
        break;
      case 'Home':
        next = startOfWeek(from, firstDay);
        break;
      case 'End':
        next = addDays(startOfWeek(from, firstDay), 6);
        break;
      case 'PageUp':
        next = addMonths(from, event.shiftKey ? -12 : -1);
        break;
      case 'PageDown':
        next = addMonths(from, event.shiftKey ? 12 : 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.choose(from);
        return;
      default:
        return;
    }
    event.preventDefault();
    this.moveTo(next);
  }

  private stepMonth(months: number): void {
    this.view = addMonths(this.view, months);
    this.focused = addMonths(this.focused, months);
  }

  // --- Rendering ---

  private renderDay(date: PlainDate): TemplateResult {
    const { start, end } = this.selection;
    const pendingEnd = this.anchor ? this.focused : null;
    const rangeStart = this.anchor ?? start;
    const rangeEnd = this.anchor ? pendingEnd : end;

    const [low, high] =
      rangeStart && rangeEnd && compareDates(rangeStart, rangeEnd) > 0
        ? [rangeEnd, rangeStart]
        : [rangeStart, rangeEnd];

    const selected = this.range
      ? isSameDay(date, low) || isSameDay(date, high)
      : isSameDay(date, start);
    const inRange = this.range && low !== null && high !== null && isBetween(date, low, high);
    const disabled = this.isOutOfBounds(date);
    const iso = formatDate(date);

    return html`<td
      part="day"
      role="gridcell"
      class=${classMap({
        day: true,
        outside: date.month !== this.view.month,
        today: isSameDay(date, today()),
        selected,
        'in-range': inRange,
        'range-start': inRange && isSameDay(date, low),
        'range-end': inRange && isSameDay(date, high),
      })}
      data-date=${iso}
      tabindex=${isSameDay(date, this.focused) ? 0 : -1}
      aria-selected=${selected ? 'true' : 'false'}
      aria-disabled=${disabled ? 'true' : nothing}
      aria-current=${isSameDay(date, today()) ? 'date' : nothing}
      aria-label=${new Intl.DateTimeFormat(this.resolvedLocale, { dateStyle: 'full' }).format(
        toLocalDate(date),
      )}
      @click=${() => {
        this.focused = date;
        this.choose(date);
      }}
      @pointerenter=${() => {
        if (this.anchor) this.focused = date;
      }}
    >
      ${date.day}
    </td>`;
  }

  private renderCalendar(): TemplateResult {
    const locale = this.resolvedLocale;
    const firstDay = firstDayOfWeek(locale);
    const weeks = monthGrid(this.view.year, this.view.month, firstDay);
    const title = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
      toLocalDate(this.view),
    );
    const short = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    const long = new Intl.DateTimeFormat(locale, { weekday: 'long' });

    return html`<div class="header">
        <button
          type="button"
          class="nav"
          aria-label=${strings().previousMonth}
          @click=${() => this.stepMonth(-1)}
        >
          <kt-icon name="chevron-left" size="18"></kt-icon>
        </button>
        <h2 id=${this.titleId} class="title" aria-live="polite">${title}</h2>
        <button
          type="button"
          class="nav"
          aria-label=${strings().nextMonth}
          @click=${() => this.stepMonth(1)}
        >
          <kt-icon name="chevron-right" size="18"></kt-icon>
        </button>
      </div>
      <table role="grid" aria-labelledby=${this.titleId} @keydown=${this.onGridKeyDown}>
        <thead>
          <tr>
            ${weeks[0]!.map(
              (day) =>
                html`<th scope="col">
                  <abbr title=${long.format(toLocalDate(day))}
                    >${short.format(toLocalDate(day))}</abbr
                  >
                </th>`,
            )}
          </tr>
        </thead>
        <tbody>
          ${weeks.map(
            (week) =>
              html`<tr>
                ${week.map((day) => this.renderDay(day))}
              </tr>`,
          )}
        </tbody>
      </table>`;
  }

  override render(): TemplateResult {
    const shown = this.display();
    const placeholder =
      this.placeholder ?? (this.range ? strings().selectPeriod : strings().selectDate);
    const showClear = this.clearable && this.value !== null && !this.disabled;

    return html`${
        this.error
          ? html`<span id="error-message" class="visually-hidden">${this.error}</span>`
          : nothing
      }
      <div
        class=${classMap({
          field: true,
          open: this.open,
          error: Boolean(this.error),
          clearable: showClear,
        })}
        @focusout=${this.onFocusOut}
      >
        <button
          part="trigger"
          type="button"
          class="trigger"
          aria-haspopup="dialog"
          aria-expanded=${this.open ? 'true' : 'false'}
          aria-controls=${this.panelId}
          aria-label=${this.label ? `${this.label}${shown ? `, ${shown}` : ''}` : nothing}
          aria-invalid=${this.error ? 'true' : nothing}
          aria-describedby=${this.error ? 'error-message' : nothing}
          ?disabled=${this.disabled}
          @click=${this.toggle}
          @keydown=${this.onTriggerKeyDown}
        >
          <span class=${classMap({ value: true, placeholder: !shown })}>
            ${shown ?? placeholder}
          </span>
          <span class="icons"><kt-icon name="calendar" size="18"></kt-icon></span>
        </button>
        ${
          showClear
            ? html`<button
                type="button"
                class="clear"
                aria-label=${strings().clear}
                @click=${this.clear}
              >
                <kt-icon name="x" size="18"></kt-icon>
              </button>`
            : nothing
        }

        <div
          part="panel"
          id=${this.panelId}
          class=${classMap({ panel: true, open: this.open, top: this.placement === 'top' })}
          role="dialog"
          aria-modal="false"
          aria-label=${this.range ? strings().selectPeriod : strings().selectDate}
          @keydown=${this.onPanelKeyDown}
        >
          ${this.open ? this.renderCalendar() : nothing}
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
