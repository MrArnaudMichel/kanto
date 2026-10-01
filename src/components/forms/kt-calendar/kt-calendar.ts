import { css, html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { emit, uniqueId } from '#internal/events';
import { dateFormat, resolveLocale } from '#internal/locale';
import { strings } from '#internal/strings';
import {
  addDays,
  addMonths,
  compareDates,
  daysInMonth,
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

/** The grid of days, or the panel of years and months the title opens. */
export type KtCalendarView = 'day' | 'month';

/** How far the year list reaches without a min or max: birthdays to plans. */
const YEARS_BACK = 120;
const YEARS_AHEAD = 50;

/** Digits typed into the year list within this long make one year. */
const TYPING_PAUSE = 1000;

/**
 * A month calendar to pick a day or a period from, shown in the page.
 *
 * The same calendar `<kt-date-picker>` opens in its popup, for when the
 * calendar is the interface rather than a way to fill a field: a booking
 * page, a dashboard's date filter, a planning view.
 *
 * The title — "September 2026" — opens one panel: a scrolling list of years
 * beside the twelve months of the one chosen. A year is a click or four typed
 * digits away, then its month a second click, whatever the distance.
 *
 * Keyboard, in the day grid (the WAI-ARIA date grid pattern): arrows by day
 * and week, Home/End to the week's ends, Page Up/Down by month and with Shift
 * by year, Enter to choose. In the year list: arrows, Page Up/Down by ten,
 * Home/End, or type the year; Enter or Tab on to the months. In the months:
 * arrows, Enter to choose. Escape returns to the days.
 *
 * @element kt-calendar
 *
 * @csspart base - The calendar.
 * @csspart day - A day cell.
 *
 * @fires kt-change - A day, or a whole period, was chosen. `detail: { value }`.
 *
 * @example
 * ```html
 * <kt-calendar value="2026-09-25"></kt-calendar>
 * <kt-calendar range value="2026-09-01/2026-09-25" min="2026-01-01"></kt-calendar>
 * ```
 */
export class KtCalendar extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: inline-block;
        --day-size: 32px;
      }

      .calendar {
        display: flex;
        flex-direction: column;
        gap: var(--gap-element);
        width: calc(var(--day-size) * 7);
      }

      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--gap-element);
      }
      .navs {
        display: flex;
        gap: 2px;
      }

      .nav,
      .title {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: var(--day-size);
        padding: 0;
        color: var(--text-muted);
        background: none;
        border: none;
        border-radius: var(--radius-input);
        cursor: pointer;
      }
      .nav {
        width: var(--day-size);
      }
      /* The month and year as one control: it is one place in time. */
      .title {
        gap: 4px;
        padding: 0 6px 0 8px;
        color: var(--text-body);
        font: var(--font-normal-medium);
        text-transform: capitalize;
      }
      .title kt-icon {
        color: var(--text-muted);
        transition: transform var(--duration-fast) var(--easing-standard);
      }
      .title[aria-expanded='true'] kt-icon {
        transform: scaleY(-1);
      }
      .nav:hover,
      .title:hover {
        color: var(--text-body);
        background: var(--color-dark-22);
      }
      .nav:focus-visible,
      .title:focus-visible {
        outline: var(--outline-width) solid var(--color-primary-base);
      }

      /* One height for every view, so the calendar does not shrink under the
         pointer when it switches from days to months or years. */
      .body {
        height: calc(var(--day-size) * 7 + 16px);
      }
      table {
        width: 100%;
        table-layout: fixed;
        border-collapse: separate;
        border-spacing: 0 2px;
      }
      /* The months keep a cell's height and sit at the top, beside the
         years, rather than stretching into tall blocks. */
      table.wide {
        align-self: start;
        border-spacing: 2px;
      }
      th {
        padding-bottom: 4px;
        color: var(--text-muted);
        font: var(--font-normal-small);
        font-weight: 600;
      }
      th abbr {
        text-decoration: none;
      }

      .cell {
        position: relative;
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
      .cell:hover {
        background: var(--color-dark-22);
      }
      .cell:focus-visible {
        box-shadow: inset 0 0 0 var(--outline-width) var(--color-primary-base);
      }
      /* Months and years sit three to a row, sharing the height the days use. */
      .wide .cell {
        height: 40px;
        text-transform: capitalize;
      }
      .cell.outside {
        color: var(--text-muted);
      }
      /* Today: a dot under the number, which a selection's fill keeps. */
      .cell.current::after {
        content: '';
        position: absolute;
        bottom: 3px;
        left: 50%;
        width: 4px;
        height: 4px;
        margin-left: -2px;
        background: currentColor;
        border-radius: var(--radius-full);
      }

      /* A period reads as one band: the days between are tinted and squared
         off, and only its two ends are rounded. */
      .cell.in-range {
        background: var(--color-primary-soft);
        border-radius: 0;
      }
      .cell.range-start {
        border-radius: var(--radius-input) 0 0 var(--radius-input);
      }
      .cell.range-end {
        border-radius: 0 var(--radius-input) var(--radius-input) 0;
      }
      .cell.range-start.range-end {
        border-radius: var(--radius-input);
      }
      .cell.selected {
        color: var(--color-white);
        background: var(--color-primary-base);
      }

      /* The month and year panel: the years scroll beside the months. */
      .month-year {
        display: grid;
        grid-template-columns: 72px 1fr;
        gap: var(--gap-element);
        height: 100%;
      }
      .years {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding-right: 6px;
        overflow-y: auto;
        border-right: var(--border-width) solid var(--border-subtle);
        outline: none;
        scrollbar-width: thin;
      }
      .year {
        flex: none;
        display: flex;
        align-items: center;
        justify-content: center;
        height: var(--day-size);
        color: var(--text-body);
        font: var(--font-normal-regular);
        font-variant-numeric: tabular-nums;
        border-radius: var(--radius-input);
        outline: none;
        cursor: pointer;
      }
      .year:hover {
        background: var(--color-dark-22);
      }
      .year:focus-visible {
        box-shadow: inset 0 0 0 var(--outline-width) var(--color-primary-base);
      }
      /* Where the list is, not what is chosen: tinted, so the one solid
         fill in the panel stays the chosen month. */
      .year[aria-selected='true'] {
        color: var(--color-primary-text);
        font-weight: 600;
        background: var(--color-primary-soft);
      }

      .cell[aria-disabled='true'] {
        color: var(--text-disabled);
        background: none;
        text-decoration: line-through;
        cursor: not-allowed;
      }
    `,
  ];

  private readonly liveId = uniqueId('kt-calendar-live');
  private focusCell = false;
  /** Set when the year list should scroll its year into view, and focus it. */
  private focusYear = false;
  /** Digits typed into the year list, and when the last one came. */
  private typed = '';
  private typedAt = 0;
  /** Set while the calendar writes its own value, which should not move it. */
  private committing = false;

  @state() private view: KtCalendarView = 'day';
  /** First day of the month the day view shows. */
  @state() private month: PlainDate = { ...today(), day: 1 };
  /** The day, month or year holding the grid's one tab stop. */
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

  /**
   * BCP 47 language tag for names and the first day of the week. Empty: the
   * page's `lang`, then the browser's language.
   */
  @property({ type: String })
  locale = '';

  /** Accessible name of the calendar. Defaults to the strings registry. */
  @property({ type: String })
  label = '';

  override connectedCallback(): void {
    super.connectedCallback();
    // Open on the chosen day, or today, kept inside the bounds.
    this.jumpTo(this.clamp(this.selection.start ?? today()), false);
  }

  override willUpdate(changed: PropertyValues<this>): void {
    // A value set from outside — a "today" button, a reset — moves the
    // calendar to it. One the user just picked leaves it where it is.
    if (changed.has('value') && !this.committing && this.hasUpdated) {
      this.anchor = null;
      const start = this.selection.start;
      if (start) this.jumpTo(this.clamp(start), false);
    }
    this.committing = false;
  }

  override updated(): void {
    if (this.view === 'month') this.revealYear(this.focusYear);
    this.focusYear = false;
    if (!this.focusCell) return;
    this.focusCell = false;
    this.shadowRoot?.querySelector<HTMLElement>('.cell[tabindex="0"]')?.focus();
  }

  /**
   * Keeps the chosen year in sight in its list — centred when the panel
   * opens — and focuses it when asked. The list scrolls itself; the page
   * never does.
   */
  private revealYear(focus: boolean): void {
    const list = this.shadowRoot?.querySelector<HTMLElement>('.years');
    const option = list?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!list || !option) return;

    const top = option.offsetTop - list.offsetTop;
    if (focus) {
      list.scrollTop = top - (list.clientHeight - option.offsetHeight) / 2;
      option.focus({ preventScroll: true });
    } else if (top < list.scrollTop) {
      list.scrollTop = top;
    } else if (top + option.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = top + option.offsetHeight - list.clientHeight;
    }
  }

  /** Focuses the grid's current cell — the chosen day, or today. */
  override focus(): void {
    this.focusCell = true;
    this.requestUpdate();
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

  private get bounds(): { min: PlainDate | null; max: PlainDate | null } {
    return { min: parseDate(this.min), max: parseDate(this.max) };
  }

  private clamp(date: PlainDate): PlainDate {
    const { min, max } = this.bounds;
    if (min && compareDates(date, min) < 0) return min;
    if (max && compareDates(date, max) > 0) return max;
    return date;
  }

  private isOutOfBounds(date: PlainDate): boolean {
    const { min, max } = this.bounds;
    return (
      (min !== null && compareDates(date, min) < 0) || (max !== null && compareDates(date, max) > 0)
    );
  }

  /** A month or a year is unavailable only when every day of it is. */
  private isSpanOutOfBounds(first: PlainDate, last: PlainDate): boolean {
    const { min, max } = this.bounds;
    return (
      (max !== null && compareDates(first, max) > 0) ||
      (min !== null && compareDates(last, min) < 0)
    );
  }

  private format(options: Intl.DateTimeFormatOptions, date: PlainDate): string {
    return dateFormat(this.resolvedLocale, options).format(toLocalDate(date));
  }

  // --- Moving ---

  /** Moves the tab stop, and the day view with it when it leaves the month. */
  private jumpTo(date: PlainDate, focus = true): void {
    this.focused = date;
    if (date.year !== this.month.year || date.month !== this.month.month) {
      this.month = { year: date.year, month: date.month, day: 1 };
    }
    this.focusCell = focus;
  }

  private setView(view: KtCalendarView): void {
    this.view = view;
    if (view === 'month') {
      // Open on the month on screen, and on its year in the list.
      this.focused = { ...this.month, day: this.focused.day };
      this.focusYear = true;
    } else {
      this.focusCell = true;
    }
  }

  /** The years the list offers: the bounds, or a span around today. */
  private get yearRange(): { first: number; last: number } {
    const { min, max } = this.bounds;
    const now = today().year;
    return { first: min?.year ?? now - YEARS_BACK, last: max?.year ?? now + YEARS_AHEAD };
  }

  // --- Choosing ---

  private chooseDay(date: PlainDate): void {
    if (this.isOutOfBounds(date)) return;
    this.focused = date;

    if (!this.range) {
      this.commit(formatDate(date));
      return;
    }
    if (!this.anchor) {
      this.anchor = date;
      return;
    }
    const [start, end] =
      compareDates(this.anchor, date) <= 0 ? [this.anchor, date] : [date, this.anchor];
    this.anchor = null;
    this.commit(formatRange(start, end));
  }

  private commit(value: string): void {
    this.committing = true;
    this.value = value;
    emit(this, 'kt-change', { value });
  }

  private chooseMonth(month: number): void {
    const day = Math.min(this.focused.day, daysInMonth(this.focused.year, month));
    this.jumpTo(this.clamp({ year: this.focused.year, month, day }));
    this.setView('day');
  }

  /** Shows a year's months, staying in the panel. */
  private chooseYear(year: number, focus = true): void {
    const { first, last } = this.yearRange;
    const target = Math.min(Math.max(year, first), last);
    const day = Math.min(this.focused.day, daysInMonth(target, this.focused.month));
    this.focused = { year: target, month: this.focused.month, day };
    this.focusYear = focus;
  }

  private onYearKeyDown(event: KeyboardEvent): void {
    const { year } = this.focused;
    const { first, last } = this.yearRange;

    if (/^\d$/.test(event.key)) {
      // Four digits in a row make a year: type 1987, land on 1987.
      const now = Date.now();
      this.typed = now - this.typedAt > TYPING_PAUSE ? event.key : this.typed + event.key;
      this.typedAt = now;
      if (this.typed.length === 4) {
        this.chooseYear(Number(this.typed));
        this.typed = '';
      }
      event.preventDefault();
      return;
    }

    switch (event.key) {
      case 'ArrowUp':
        this.chooseYear(year - 1);
        break;
      case 'ArrowDown':
        this.chooseYear(year + 1);
        break;
      case 'PageUp':
        this.chooseYear(year - 10);
        break;
      case 'PageDown':
        this.chooseYear(year + 10);
        break;
      case 'Home':
        this.chooseYear(first);
        break;
      case 'End':
        this.chooseYear(last);
        break;
      case 'Enter':
      case ' ':
        // On to the months of the year.
        this.focusCell = true;
        this.requestUpdate();
        break;
      case 'Escape':
        // Back to the days, not out of whatever holds the calendar.
        event.stopPropagation();
        this.setView('day');
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  // --- Keyboard ---

  private onDayKeyDown(event: KeyboardEvent): void {
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
        this.chooseDay(from);
        return;
      default:
        return;
    }
    event.preventDefault();
    this.jumpTo(next);
  }

  /** The months, three to a row; crossing a year end moves the year list too. */
  private onPickerKeyDown(event: KeyboardEvent): void {
    const step = (by: number) => addMonths(this.focused, by);

    let next: PlainDate;
    switch (event.key) {
      case 'ArrowLeft':
        next = step(-1);
        break;
      case 'ArrowRight':
        next = step(1);
        break;
      case 'ArrowUp':
        next = step(-3);
        break;
      case 'ArrowDown':
        next = step(3);
        break;
      case 'PageUp':
        next = step(-12);
        break;
      case 'PageDown':
        next = step(12);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.chooseMonth(this.focused.month);
        return;
      case 'Escape':
        // Back to the days, not out of whatever holds the calendar.
        event.preventDefault();
        event.stopPropagation();
        this.setView('day');
        return;
      default:
        return;
    }
    event.preventDefault();
    this.focused = next;
    this.focusCell = true;
  }

  // --- Rendering ---

  private renderHeader(): TemplateResult {
    const s = strings();
    const open = this.view === 'month';
    const shown = open ? this.focused : this.month;

    return html`<div class="header">
      <button
        type="button"
        class="title"
        aria-expanded=${open ? 'true' : 'false'}
        @click=${() => this.setView(open ? 'day' : 'month')}
      >
        ${this.format({ month: 'long', year: 'numeric' }, shown)}
        <kt-icon name="chevron-down" size="16"></kt-icon>
      </button>
      ${
        open
          ? nothing
          : html`<div class="navs">
              <button
                type="button"
                class="nav"
                aria-label=${s.previousMonth}
                @click=${() => this.jumpTo(addMonths(this.focused, -1), false)}
              >
                <kt-icon name="chevron-left" size="18"></kt-icon>
              </button>
              <button
                type="button"
                class="nav"
                aria-label=${s.nextMonth}
                @click=${() => this.jumpTo(addMonths(this.focused, 1), false)}
              >
                <kt-icon name="chevron-right" size="18"></kt-icon>
              </button>
            </div>`
      }
    </div>`;
  }

  private renderDay(date: PlainDate): TemplateResult {
    const { start, end } = this.selection;
    const rangeStart = this.anchor ?? start;
    const rangeEnd = this.anchor ? this.focused : end;
    const [low, high] =
      rangeStart && rangeEnd && compareDates(rangeStart, rangeEnd) > 0
        ? [rangeEnd, rangeStart]
        : [rangeStart, rangeEnd];

    const selected = this.range
      ? isSameDay(date, low) || isSameDay(date, high)
      : isSameDay(date, start);
    const inRange = this.range && low !== null && high !== null && isBetween(date, low, high);
    const isToday = isSameDay(date, today());

    return html`<td
      part="day"
      role="gridcell"
      class=${classMap({
        cell: true,
        outside: date.month !== this.month.month,
        current: isToday,
        selected,
        'in-range': inRange,
        'range-start': inRange && isSameDay(date, low),
        'range-end': inRange && isSameDay(date, high),
      })}
      data-date=${formatDate(date)}
      tabindex=${isSameDay(date, this.focused) ? 0 : -1}
      aria-selected=${selected ? 'true' : 'false'}
      aria-disabled=${this.isOutOfBounds(date) ? 'true' : nothing}
      aria-current=${isToday ? 'date' : nothing}
      aria-label=${this.format({ dateStyle: 'full' }, date)}
      @click=${() => this.chooseDay(date)}
      @pointerenter=${() => {
        if (this.anchor) this.focused = date;
      }}
    >
      ${date.day}
    </td>`;
  }

  private renderDays(): TemplateResult {
    const weeks = monthGrid(this.month.year, this.month.month, firstDayOfWeek(this.resolvedLocale));
    return html`<table role="grid" aria-labelledby=${this.liveId} @keydown=${this.onDayKeyDown}>
      <thead>
        <tr>
          ${weeks[0]!.map(
            (day) =>
              html`<th scope="col">
                <abbr title=${this.format({ weekday: 'long' }, day)}
                  >${this.format({ weekday: 'short' }, day)}</abbr
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

  /** The panel the title opens: the years, and the twelve months of one. */
  private renderPicker(): TemplateResult {
    const s = strings();
    const { year } = this.focused;
    const now = today();
    const { first, last } = this.yearRange;
    const years = Array.from({ length: last - first + 1 }, (_, index) => first + index);

    const months = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const firstDay = { year, month, day: 1 };
      return {
        month,
        label: this.format({ month: 'short' }, firstDay),
        fullLabel: this.format({ month: 'long', year: 'numeric' }, firstDay),
        selected: month === this.month.month && year === this.month.year,
        current: month === now.month && year === now.year,
        disabled: this.isSpanOutOfBounds(firstDay, {
          year,
          month,
          day: daysInMonth(year, month),
        }),
      };
    });
    const rows = [0, 3, 6, 9].map((start) => months.slice(start, start + 3));

    return html`<div class="month-year">
      <div class="years" role="listbox" aria-label=${s.chooseYear} @keydown=${this.onYearKeyDown}>
        ${years.map(
          (candidate) =>
            html`<div
              class="year"
              role="option"
              data-year=${candidate}
              aria-selected=${candidate === year ? 'true' : 'false'}
              tabindex=${candidate === year ? 0 : -1}
              @click=${() => this.chooseYear(candidate)}
            >
              ${candidate}
            </div>`,
        )}
      </div>

      <table role="grid" class="wide" aria-label=${s.chooseMonth} @keydown=${this.onPickerKeyDown}>
        <tbody>
          ${rows.map(
            (row) =>
              html`<tr>
                ${row.map(
                  (cell) =>
                    html`<td
                      role="gridcell"
                      class=${classMap({
                        cell: true,
                        selected: cell.selected,
                        current: cell.current,
                      })}
                      data-key=${`${year}-${cell.month}`}
                      tabindex=${cell.month === this.focused.month ? 0 : -1}
                      aria-selected=${cell.selected ? 'true' : 'false'}
                      aria-disabled=${cell.disabled ? 'true' : nothing}
                      aria-label=${cell.fullLabel}
                      @click=${() => {
                        if (!cell.disabled) this.chooseMonth(cell.month);
                      }}
                    >
                      ${cell.label}
                    </td>`,
                )}
              </tr>`,
          )}
        </tbody>
      </table>
    </div>`;
  }

  override render(): TemplateResult {
    const s = strings();
    const announced =
      this.view === 'day'
        ? this.format({ month: 'long', year: 'numeric' }, this.month)
        : String(this.focused.year);

    return html`<div
      part="base"
      class="calendar"
      role="group"
      aria-label=${this.label || (this.range ? s.selectPeriod : s.selectDate)}
    >
      <span id=${this.liveId} class="visually-hidden" aria-live="polite">${announced}</span>
      ${this.renderHeader()}
      <div class="body">${this.view === 'day' ? this.renderDays() : this.renderPicker()}</div>
    </div>`;
  }
}

defineElement('kt-calendar', KtCalendar);

declare global {
  interface HTMLElementTagNameMap {
    'kt-calendar': KtCalendar;
  }
}
