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
import { compareDates, parseDate, parseRange, toLocalDate, type PlainDate } from '#internal/date';
import '../kt-calendar/kt-calendar.js';
import type { KtCalendar } from '../kt-calendar/kt-calendar.js';
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
 * The popup is a `<kt-calendar>`, with its keyboard model and its month and
 * year views: the WAI-ARIA date picker dialog pattern, where Escape closes the
 * dialog and hands focus back to the field, and tabbing out closes it too.
 *
 * @element kt-date-picker
 *
 * @csspart trigger - The field.
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

      .panel kt-calendar {
        display: block;
      }
    `,
  ];

  @query('.trigger')
  private trigger?: HTMLButtonElement;

  @query('kt-calendar')
  private calendar?: KtCalendar;

  private internals: UsableInternals | null = null;
  private defaultValue: string | null = null;
  private readonly panelId = uniqueId('kt-date-picker-panel');

  @state() private open = false;
  @state() private placement: 'bottom' | 'top' = 'bottom';

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
    // Focus moving into the calendar's own shadow root is still inside.
    if (event.composedPath().includes(next)) return;
    if (this.calendar?.shadowRoot?.contains(next)) return;
    this.close(false);
  };

  private async show(): Promise<void> {
    if (this.disabled || this.open) return;
    const rect = this.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom;
    this.placement = below < PANEL_SPACE && rect.top > below ? 'top' : 'bottom';
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
    if (this.open) this.close(false);
    else void this.show();
  }

  // --- Choosing ---

  private onCalendarChange(event: CustomEvent<{ value: string }>): void {
    // The calendar's own event stops here; the picker reports its value.
    event.stopPropagation();
    this.value = event.detail.value;
    this.close(true);
    emit(this, 'kt-change', { value: this.value });
  }

  private clear(): void {
    this.value = null;
    emit(this, 'kt-change', { value: null });
    this.focus();
  }

  // --- Keyboard ---

  private onTriggerKeyDown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      void this.show();
    }
  }

  private onPanelKeyDown(event: KeyboardEvent): void {
    // The calendar keeps Escape for itself while it shows months or years.
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.close(true);
    }
  }

  // --- Rendering ---

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
