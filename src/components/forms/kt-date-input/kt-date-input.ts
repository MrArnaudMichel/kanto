import { css, html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { defineElement } from '#internal/kt-element';
import { toggleListener, uniqueId } from '#internal/events';
import { FloatingController, floatingStyles } from '#internal/floating';
import { KtSegmentedField, type FieldItem, type Segment } from '#internal/segmented-field';
import { compareDates, daysInMonth, formatDate, parseDate, today } from '#internal/date';
import { dateLayout, exampleDate, typedYear } from '#internal/typed-date';
import { strings } from '#internal/strings';
import '../kt-calendar/kt-calendar.js';
import type { KtCalendar } from '../kt-calendar/kt-calendar.js';
import '../../core/kt-icon/kt-icon.js';
import '../../feedback/kt-tooltip/kt-tooltip.js';

/**
 * A date typed into its parts: day, month and year, each its own segment.
 *
 * The segments come in the order the reader's language writes a date —
 * `25/09/2026` in London, `09/25/2026` in New York, `25.09.2026` in Berlin —
 * and the focus moves on as each fills, so a date is eight keystrokes. The
 * arrows step a segment, a day never past its month's end. The value is ISO
 * 8601, `2026-09-25`, and `null` until the date is complete.
 *
 * With `calendar`, a button at the end opens a `<kt-calendar>` to pick from.
 *
 * @element kt-date-input
 *
 * @csspart field - The field.
 * @csspart segment - A day, month or year segment.
 * @csspart trigger - The calendar button, with `calendar`.
 * @csspart panel - The calendar popup, with `calendar`.
 *
 * @fires kt-change - The date became complete, changed, or stopped being one.
 *   `detail: { value }` — the ISO date or `null`.
 *
 * @example
 * ```html
 * <kt-date-input label="Date of birth" name="born" max="2026-12-31"></kt-date-input>
 * <kt-date-input label="Due date" calendar value="2026-09-25"></kt-date-input>
 * ```
 */
export class KtDateInput extends KtSegmentedField {
  static override styles = [
    KtSegmentedField.styles,
    floatingStyles,
    css`
      :host {
        position: relative;
      }

      .trigger {
        display: inline-flex;
        flex: none;
        align-items: center;
        justify-content: center;
        width: calc(var(--field-height) - 12px);
        height: calc(var(--field-height) - 12px);
        margin-right: -4px;
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
      .trigger:hover:not(:disabled),
      .trigger[aria-expanded='true'] {
        color: var(--text-body);
        background: var(--color-dark-22);
      }
      .trigger:disabled {
        color: var(--text-disabled);
        cursor: not-allowed;
      }
      .trigger:focus-visible {
        outline: var(--outline-width) solid var(--color-primary-base);
      }

      /* Placed from the field by FloatingController. */
      .panel {
        box-sizing: border-box;
        padding: var(--padding-expand);
        background: var(--surface-popover);
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
    `,
  ];

  /** Adds a button that opens a calendar to pick the date from. */
  @property({ type: Boolean, reflect: true })
  calendar = false;

  @state() private open = false;
  @state() private placement: 'bottom' | 'top' = 'bottom';

  @query('kt-calendar')
  private calendarElement?: KtCalendar;

  private readonly panelId = uniqueId('kt-date-input-panel');

  private floating = new FloatingController(this, {
    panel: () => this.shadowRoot?.querySelector<HTMLElement>('.panel'),
    anchor: () => this.shadowRoot?.querySelector('.field'),
    onPlace: (side) => {
      this.placement = side === 'top' ? 'top' : 'bottom';
    },
  });

  // --- Segments ---

  protected override items(): FieldItem[] {
    const s = strings();
    const { order, separator } = dateLayout(this.resolvedLocale);
    const month = Number(this.texts['month']) || 0;
    const year = this.texts['year']?.length === 4 ? Number(this.texts['year']) : 2000;
    // A day stops at its month's end once the month is known; a leap year
    // until the year is.
    const lastDay = month >= 1 && month <= 12 ? daysInMonth(year, month) : 31;

    const segments = {
      day: {
        key: 'day',
        label: s.segmentDay,
        placeholder: s.placeholderDay,
        spec: { min: 1, max: lastDay, length: 2 },
      },
      month: {
        key: 'month',
        label: s.segmentMonth,
        placeholder: s.placeholderMonth,
        spec: { min: 1, max: 12, length: 2 },
      },
      year: {
        key: 'year',
        label: s.segmentYear,
        placeholder: s.placeholderYear,
        spec: { min: 1, max: 9999, length: 4 },
      },
    };

    const items: FieldItem[] = [];
    order.forEach((part, index) => {
      if (index > 0) items.push({ literal: separator });
      items.push(segments[part]);
    });
    return items;
  }

  protected override fill(value: string | null): Record<string, string> {
    const date = parseDate(value);
    if (!date) return { day: '', month: '', year: '' };
    return {
      day: String(date.day).padStart(2, '0'),
      month: String(date.month).padStart(2, '0'),
      year: String(date.year).padStart(4, '0'),
    };
  }

  protected override read(texts: Record<string, string>): { value: string | null; error: string } {
    const { day = '', month = '', year = '' } = texts;
    // A year still being typed is not a year yet: four digits, or two written
    // out when the focus leaves them.
    if (!day || !month || year.length < 4) return { value: null, error: '' };

    const now = today();
    const invalid = {
      value: null,
      error: strings().dateInvalid(exampleDate(this.resolvedLocale, now)),
    };
    const date = { year: Number(year), month: Number(month), day: Number(day) };
    if (date.month < 1 || date.month > 12 || date.day < 1) return invalid;
    if (date.day > daysInMonth(date.year, date.month)) return invalid;

    const min = parseDate(this.min);
    const max = parseDate(this.max);
    if ((min && compareDates(date, min) < 0) || (max && compareDates(date, max) > 0)) {
      return { value: null, error: strings().dateOutOfRange };
    }
    return { value: formatDate(date), error: '' };
  }

  /** A year left at two digits is written out: 98 is 1998, 30 is 2030. */
  protected override completeOnBlur(segment: Segment, text: string): string | null {
    if (segment.key !== 'year' || text.length === 0 || text.length > 2) return null;
    const year = typedYear(text, today().year);
    return year === null ? null : String(year).padStart(4, '0');
  }

  protected override requiredMessage(): string {
    return strings().dateRequired;
  }

  protected override get expanded(): boolean {
    return this.open;
  }

  // --- The calendar ---

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('pointerdown', this.onDocumentPointerDown);
  }

  // Untyped: `open` is private, so not among the keys PropertyValues<this> knows.
  override updated(changed: PropertyValues): void {
    if (changed.has('open')) {
      toggleListener(this.open, document, 'pointerdown', this.onDocumentPointerDown);
    }
    this.floating.sync(this.open);
  }

  private onDocumentPointerDown = (event: Event): void => {
    if (!event.composedPath().includes(this)) this.close(false);
  };

  private async toggleCalendar(): Promise<void> {
    if (this.open) {
      this.close(true);
      return;
    }
    if (this.inactive) return;
    this.open = true;
    await this.updateComplete;
    this.calendarElement?.focus();
  }

  private close(returnFocus: boolean): void {
    if (!this.open) return;
    this.open = false;
    if (returnFocus) this.focus();
  }

  private onCalendarChange(event: CustomEvent<{ value: string }>): void {
    // The calendar's own event stops here; the field reports its value.
    event.stopPropagation();
    this.commitValue(event.detail.value);
    this.close(true);
  }

  private onPanelKeyDown(event: KeyboardEvent): void {
    // The calendar keeps Escape while it shows its year and month panel.
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.close(true);
    }
  }

  protected override renderAfter(): TemplateResult | typeof nothing {
    if (!this.calendar) return nothing;
    const s = strings();
    return html`<button
        part="trigger"
        type="button"
        class="trigger"
        aria-label=${s.openCalendar}
        aria-haspopup="dialog"
        aria-expanded=${this.open ? 'true' : 'false'}
        aria-controls=${this.panelId}
        ?disabled=${this.inactive}
        @click=${() => void this.toggleCalendar()}
      >
        <kt-icon name="calendar" size="18"></kt-icon>
      </button>
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
        aria-label=${s.selectDate}
        @keydown=${this.onPanelKeyDown}
      >
        ${
          this.open
            ? html`<kt-calendar
                .value=${this.value}
                min=${this.min}
                max=${this.max}
                locale=${this.locale}
                label=${this.label}
                @kt-change=${this.onCalendarChange}
              ></kt-calendar>`
            : nothing
        }
      </div>`;
  }
}

defineElement('kt-date-input', KtDateInput);

declare global {
  interface HTMLElementTagNameMap {
    'kt-date-input': KtDateInput;
  }
}
