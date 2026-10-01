import { type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { defineElement } from '#internal/kt-element';
import { KtSegmentedField, type FieldItem, type Segment } from '#internal/segmented-field';
import { dateFormat } from '#internal/locale';
import { strings } from '#internal/strings';

export type KtHourCycle = 'h12' | 'h23';

/** How the language writes a time on a clock: what goes between the numbers, and where AM/PM sits. */
function timeLayout(
  locale: string,
  twelve: boolean,
): { separator: string; periodFirst: boolean; periods: [string, string] } {
  const format = dateFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: twelve ? 'h12' : 'h23',
  });
  const parts = format.formatToParts(new Date(2026, 0, 1, 1, 5));
  const types = parts.map((part) => part.type);
  const separator = parts.find((part) => part.type === 'literal')?.value.trim() || ':';
  const period = (hour: number) =>
    format.formatToParts(new Date(2026, 0, 1, hour)).find((part) => part.type === 'dayPeriod')
      ?.value ?? (hour < 12 ? 'AM' : 'PM');
  return {
    separator: separator === '.' ? '.' : ':',
    periodFirst:
      types.indexOf('dayPeriod') >= 0 && types.indexOf('dayPeriod') < types.indexOf('hour'),
    periods: [period(1), period(13)],
  };
}

/** `HH:MM` or `HH:MM:SS` as seconds since midnight, or null when it is not one. */
function secondsOf(time: string): number | null {
  const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(time);
  if (!match) return null;
  const [hours, minutes, seconds = 0] = match.slice(1).map((part) => Number(part ?? 0));
  if (hours! > 23 || minutes! > 59 || seconds > 59) return null;
  return hours! * 3600 + minutes! * 60 + seconds;
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * A time of day typed into its parts: hours, minutes and, if asked, seconds.
 *
 * The clock is the reader's — `14:30` in London, `2:30 PM` in New York — or
 * the one `hour-cycle` names. Whatever the clock shows, the value is the
 * 24-hour time HTML uses, `14:30` or `14:30:00`, and `null` until complete.
 * The arrows step a segment, the minutes by `step`.
 *
 * @element kt-time-input
 *
 * @csspart field - The field.
 * @csspart segment - An hour, minute, second or AM/PM segment.
 *
 * @fires kt-change - The time became complete, changed, or stopped being one.
 *   `detail: { value }` — `HH:MM`, `HH:MM:SS` or `null`.
 *
 * @example
 * ```html
 * <kt-time-input label="Starts at" name="start" step="15" min="08:00" max="20:00"></kt-time-input>
 * ```
 */
export class KtTimeInput extends KtSegmentedField {
  /** Shows a seconds segment, and puts seconds in the value. */
  @property({ type: Boolean, reflect: true })
  seconds = false;

  /** The clock to show: `h12` with AM/PM, `h23` without. Empty: the language's. */
  @property({ type: String, attribute: 'hour-cycle' })
  hourCycle: KtHourCycle | '' = '';

  /** How many minutes the arrows step by. */
  @property({ type: Number })
  step = 1;

  private get twelve(): boolean {
    if (this.hourCycle) return this.hourCycle === 'h12';
    const cycle = dateFormat(this.resolvedLocale, { hour: 'numeric' }).resolvedOptions().hourCycle;
    return cycle === 'h11' || cycle === 'h12';
  }

  override willUpdate(changed: PropertyValues<this>): void {
    // Another clock shows the same value in other segments.
    if (changed.has('hourCycle') || changed.has('seconds')) this.texts = this.fill(this.value);
    super.willUpdate(changed);
  }

  // --- Segments ---

  protected override items(): FieldItem[] {
    const s = strings();
    const twelve = this.twelve;
    const { separator, periodFirst, periods } = timeLayout(this.resolvedLocale, twelve);
    const number = (key: string, label: string, min: number, max: number, step = 1): Segment => ({
      key,
      label,
      placeholder: s.placeholderTime,
      spec: { min, max, length: 2 },
      step,
    });

    const items: FieldItem[] = [
      twelve ? number('hour', s.segmentHour, 1, 12) : number('hour', s.segmentHour, 0, 23),
      { literal: separator },
      number('minute', s.segmentMinute, 0, 59, Math.max(1, Math.round(this.step) || 1)),
    ];
    if (this.seconds) items.push({ literal: separator }, number('second', s.segmentSecond, 0, 59));
    if (twelve) {
      const period: Segment = {
        key: 'period',
        label: s.segmentDayPeriod,
        placeholder: s.placeholderTime,
        choices: periods,
      };
      if (periodFirst) items.unshift(period, { literal: ' ' });
      else items.push({ literal: ' ' }, period);
    }
    return items;
  }

  protected override fill(value: string | null): Record<string, string> {
    const total = value === null ? null : secondsOf(value);
    if (total === null) return { hour: '', minute: '', second: '', period: '' };
    const hours = Math.floor(total / 3600);
    return {
      hour: pad(this.twelve ? hours % 12 || 12 : hours),
      minute: pad(Math.floor(total / 60) % 60),
      second: pad(total % 60),
      period: hours < 12 ? '0' : '1',
    };
  }

  protected override read(texts: Record<string, string>): { value: string | null; error: string } {
    const { hour = '', minute = '', second = '', period = '' } = texts;
    const twelve = this.twelve;
    // A segment still being typed is not a number yet: two digits, or one
    // written out when the focus leaves it.
    const incomplete =
      hour.length < 2 ||
      minute.length < 2 ||
      (this.seconds && second.length < 2) ||
      (twelve && period === '');
    if (incomplete) return { value: null, error: '' };

    let hours = Number(hour);
    if (twelve) {
      if (hours < 1 || hours > 12) return { value: null, error: '' };
      hours = (hours % 12) + (period === '1' ? 12 : 0);
    }
    const time = `${pad(hours)}:${minute}${this.seconds ? `:${second}` : ''}`;
    const total = secondsOf(time);
    if (total === null) return { value: null, error: '' };

    const min = secondsOf(this.min);
    const max = secondsOf(this.max);
    if ((min !== null && total < min) || (max !== null && total > max)) {
      return { value: null, error: strings().timeOutOfRange };
    }
    return { value: time, error: '' };
  }

  /** A number left at one digit is written out: 9 is 09. */
  protected override completeOnBlur(segment: Segment, text: string): string | null {
    if (!segment.spec || text.length !== 1) return null;
    const value = Number(text);
    return value < segment.spec.min ? null : pad(value);
  }

  protected override requiredMessage(): string {
    return strings().timeRequired;
  }
}

defineElement('kt-time-input', KtTimeInput);

declare global {
  interface HTMLElementTagNameMap {
    'kt-time-input': KtTimeInput;
  }
}
