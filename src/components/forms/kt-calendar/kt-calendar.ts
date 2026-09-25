import { css, html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { emit, uniqueId } from '#internal/events';
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

export type KtCalendarView = 'day' | 'month' | 'year';

/** Years per page of the year view: four rows of three. */
const YEARS_PER_PAGE = 12;

/**
 * A month calendar to pick a day or a period from, shown in the page.
 *
 * The same calendar `<kt-date-picker>` opens in its popup, for when the
 * calendar is the interface rather than a way to fill a field: a booking
 * page, a dashboard's date filter, a planning view.
 *
 * The header's month and year are buttons. The month opens a grid of the
 * twelve months, the year a grid of twelve years, so reaching a date years
 * away takes three clicks rather than paging month by month.
 *
 * Keyboard, in the day grid (the WAI-ARIA date grid pattern): arrows by day
 * and week, Home/End to the week's ends, Page Up/Down by month and with Shift
 * by year, Enter to choose. In the month and year grids: arrows, Page Up/Down
 * by year or by twelve years, Enter to choose, Escape back to the days.
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
        --day-size: 36px;
      }

      .calendar {
        display: flex;
        flex-direction: column;
        gap: var(--gap-element);
        width: calc(var(--day-size) * 7);
      }

      .header {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
      }
      .title {
        display: flex;
        justify-content: center;
        gap: 2px;
      }

      .nav,
      .heading {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: var(--day-size);
        padding: 0;
        color: var(--text-muted);
        font: var(--font-normal-medium);
        background: none;
        border: none;
        border-radius: var(--radius-input);
        cursor: pointer;
      }
      .nav {
        width: var(--day-size);
      }
      .heading {
        padding: 0 8px;
        color: var(--text-body);
        text-transform: capitalize;
      }
      .heading kt-icon {
        margin-left: 2px;
        color: var(--text-muted);
      }
      .heading.static {
        cursor: default;
      }
      .nav:hover,
      .heading:not(.static):hover {
        color: var(--text-body);
        background: var(--color-dark-22);
      }
      .nav:focus-visible,
      .heading:focus-visible {
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
      table.wide {
        height: 100%;
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
        height: auto;
        text-transform: capitalize;
      }
      .cell.outside {
        color: var(--text-muted);
      }
      .cell.current {
        font-weight: 700;
        text-decoration: underline;
        text-decoration-thickness: 2px;
        text-underline-offset: 4px;
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
    if (!this.focusCell) return;
    this.focusCell = false;
    this.shadowRoot?.querySelector<HTMLElement>('.cell[tabindex="0"]')?.focus();
  }

  /** Focuses the grid's current cell — the chosen day, or today. */
  override focus(): void {
    this.focusCell = true;
    this.requestUpdate();
  }

  // --- Reading the value ---

  private get resolvedLocale(): string {
    return this.locale || document.documentElement.lang || navigator.language || 'en';
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
    return new Intl.DateTimeFormat(this.resolvedLocale, options).format(toLocalDate(date));
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
    this.focusCell = true;
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

  private chooseYear(year: number): void {
    const day = Math.min(this.focused.day, daysInMonth(year, this.focused.month));
    this.focused = { year, month: this.focused.month, day };
    this.setView('month');
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

  /** Months and years share one model: a list of cells, three to a row. */
  private onPickerKeyDown(event: KeyboardEvent): void {
    const inMonths = this.view === 'month';
    const step = (by: number) =>
      inMonths ? addMonths(this.focused, by) : addMonths(this.focused, by * 12);

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
        next = step(inMonths ? -12 : -YEARS_PER_PAGE);
        break;
      case 'PageDown':
        next = step(inMonths ? 12 : YEARS_PER_PAGE);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (inMonths) this.chooseMonth(this.focused.month);
        else this.chooseYear(this.focused.year);
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
    const { year } = this.focused;
    const s = strings();

    if (this.view === 'day') {
      return html`<div class="header">
        <button
          type="button"
          class="nav"
          aria-label=${s.previousMonth}
          @click=${() => this.jumpTo(addMonths(this.focused, -1), false)}
        >
          <kt-icon name="chevron-left" size="18"></kt-icon>
        </button>
        <div class="title">
          <button
            type="button"
            class="heading"
            aria-label=${`${s.chooseMonth}, ${this.format({ month: 'long' }, this.month)}`}
            @click=${() => this.setView('month')}
          >
            ${this.format({ month: 'long' }, this.month)}
          </button>
          <button
            type="button"
            class="heading"
            aria-label=${`${s.chooseYear}, ${this.month.year}`}
            @click=${() => this.setView('year')}
          >
            ${this.format({ year: 'numeric' }, this.month)}
            <kt-icon name="chevron-down" size="14"></kt-icon>
          </button>
        </div>
        <button
          type="button"
          class="nav"
          aria-label=${s.nextMonth}
          @click=${() => this.jumpTo(addMonths(this.focused, 1), false)}
        >
          <kt-icon name="chevron-right" size="18"></kt-icon>
        </button>
      </div>`;
    }

    const inMonths = this.view === 'month';
    const pageStart = year - (((year % YEARS_PER_PAGE) + YEARS_PER_PAGE) % YEARS_PER_PAGE);
    const by = inMonths ? 12 : YEARS_PER_PAGE * 12;

    return html`<div class="header">
      <button
        type="button"
        class="nav"
        aria-label=${inMonths ? s.previousYear : s.previousYears}
        @click=${() => {
          this.focused = addMonths(this.focused, -by);
        }}
      >
        <kt-icon name="chevron-left" size="18"></kt-icon>
      </button>
      <div class="title">
        ${
          inMonths
            ? html`<button
                type="button"
                class="heading"
                aria-label=${`${s.chooseYear}, ${year}`}
                @click=${() => this.setView('year')}
              >
                ${year}
              </button>`
            : html`<span class="heading static"
                >${pageStart} – ${pageStart + YEARS_PER_PAGE - 1}</span
              >`
        }
      </div>
      <button
        type="button"
        class="nav"
        aria-label=${inMonths ? s.nextYear : s.nextYears}
        @click=${() => {
          this.focused = addMonths(this.focused, by);
        }}
      >
        <kt-icon name="chevron-right" size="18"></kt-icon>
      </button>
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

  /** The month or year grid: twelve cells, three to a row. */
  private renderPicker(): TemplateResult {
    const inMonths = this.view === 'month';
    const { year } = this.focused;
    const now = today();
    const pageStart = year - (((year % YEARS_PER_PAGE) + YEARS_PER_PAGE) % YEARS_PER_PAGE);

    const cells = Array.from({ length: 12 }, (_, index) => {
      if (inMonths) {
        const month = index + 1;
        const first = { year, month, day: 1 };
        return {
          key: `${year}-${month}`,
          label: this.format({ month: 'short' }, first),
          fullLabel: this.format({ month: 'long', year: 'numeric' }, first),
          focused: month === this.focused.month,
          selected: month === this.month.month && year === this.month.year,
          current: month === now.month && year === now.year,
          disabled: this.isSpanOutOfBounds(first, { year, month, day: daysInMonth(year, month) }),
          choose: () => this.chooseMonth(month),
        };
      }
      const candidate = pageStart + index;
      return {
        key: String(candidate),
        label: String(candidate),
        fullLabel: String(candidate),
        focused: candidate === year,
        selected: candidate === this.month.year,
        current: candidate === now.year,
        disabled: this.isSpanOutOfBounds(
          { year: candidate, month: 1, day: 1 },
          { year: candidate, month: 12, day: 31 },
        ),
        choose: () => this.chooseYear(candidate),
      };
    });

    const rows = [0, 3, 6, 9].map((start) => cells.slice(start, start + 3));

    return html`<table
      role="grid"
      class="wide"
      aria-labelledby=${this.liveId}
      @keydown=${this.onPickerKeyDown}
    >
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
                    data-key=${cell.key}
                    tabindex=${cell.focused ? 0 : -1}
                    aria-selected=${cell.selected ? 'true' : 'false'}
                    aria-disabled=${cell.disabled ? 'true' : nothing}
                    aria-label=${cell.fullLabel}
                    @click=${() => {
                      if (!cell.disabled) cell.choose();
                    }}
                  >
                    ${cell.label}
                  </td>`,
              )}
            </tr>`,
        )}
      </tbody>
    </table>`;
  }

  override render(): TemplateResult {
    const s = strings();
    const announced =
      this.view === 'day'
        ? this.format({ month: 'long', year: 'numeric' }, this.month)
        : this.view === 'month'
          ? String(this.focused.year)
          : s.chooseYear;

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
