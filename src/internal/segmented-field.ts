import { css, html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { KtElement } from './kt-element.js';
import { emit, uniqueId } from './events.js';
import {
  attachFormInternals,
  setFormValue,
  setValidity,
  type UsableInternals,
} from './form-control.js';
import { resolveLocale } from './locale.js';
import { padSegment, stepSegment, typeDigit, type SegmentSpec } from './segments.js';

/** One part of a segmented field: a number typed digit by digit, or one of a few words. */
export interface Segment {
  readonly key: string;
  readonly label: string;
  /** What the segment shows while empty: "dd", "--". */
  readonly placeholder: string;
  /** A number, typed and stepped within these bounds… */
  readonly spec?: SegmentSpec;
  /** …stepped by this much with the arrows… */
  readonly step?: number;
  /** …or one of these words, picked by its first letter: AM, PM. */
  readonly choices?: readonly string[];
}

/** What a segmented field is made of: segments, and the characters between them. */
export type FieldItem = Segment | { readonly literal: string };

const isSegment = (item: FieldItem): item is Segment => 'key' in item;

/** Characters that move on to the next segment, as a typist expects. */
const SEPARATORS = new Set(['/', '.', '-', ':', ',', ' ']);

export type KtSegmentedFieldSize = 'small' | 'medium' | 'large';

/**
 * The common ground of `<kt-date-input>` and `<kt-time-input>`: a field of
 * segments — a day, a month, an hour — each its own spinbutton, typed digit by
 * digit, stepped with the arrows, the focus moving on as each fills.
 *
 * Each segment is `contenteditable`, so a phone shows its number pad, but the
 * text never changes behind the field's back: every keystroke and every input
 * event is turned into the segment's new value here. A subclass says what its
 * segments are, how they read into a value, and how a value fills them.
 */
export abstract class KtSegmentedField extends KtElement {
  static readonly formAssociated = true;

  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: block;
        --field-height: var(--button-height);
      }
      :host([size='small']) {
        --field-height: var(--button-height-small);
      }
      :host([size='large']) {
        --field-height: var(--button-height-large);
      }

      /* The field as kt-input draws one: a fill with a resting hairline, an
         outline on hover and focus that never reflows it. */
      .field {
        display: flex;
        align-items: center;
        gap: var(--gap-element);
        height: var(--field-height);
        /* Less the segment's own padding, so the digits line up with a
           kt-input's text. */
        padding: 0 10px 0 calc(var(--button-padding-x) - 2px);
        color: var(--text-body);
        font: var(--font-input);
        background-color: var(--surface-field);
        border: var(--border-width) solid var(--border-field);
        border-radius: var(--radius-input);
        outline: var(--outline-width) solid transparent;
        cursor: text;
        transition: outline-color var(--duration-instant);
      }
      .field:hover {
        outline: var(--outline-width) solid var(--color-text-700);
      }
      .field:focus-within,
      .field.open {
        outline: var(--outline-width) solid var(--color-primary-base);
      }
      .field.error,
      .field.error:hover,
      .field.error:focus-within {
        outline: var(--outline-width) solid var(--color-danger-base);
      }
      .field.disabled {
        color: var(--text-disabled);
        background-color: var(--color-dark-14);
        cursor: not-allowed;
      }

      .segments {
        display: flex;
        flex: 1;
        align-items: center;
        min-width: 0;
        font-variant-numeric: tabular-nums;
      }

      /* A segment takes a tint while it has focus, so it is plain which part
         a digit will go into; the caret itself would only flicker. */
      .segment {
        padding: 1px 2px;
        border-radius: calc(4px * var(--radius-scale, 1));
        outline: none;
        caret-color: transparent;
        white-space: nowrap;
      }
      .segment.empty {
        color: var(--text-muted);
      }
      .segment:focus {
        color: var(--color-primary-text);
        background: var(--color-primary-soft);
      }
      .error .segment:not(.empty) {
        color: var(--color-danger-text);
      }
      .literal {
        padding: 0 1px;
        color: var(--text-muted);
      }

      .error-icon {
        flex: none;
        color: var(--color-danger-text);
      }
    `,
  ];

  protected internals: UsableInternals | null = null;
  private defaultValue: string | null = null;
  /** Set while the field writes its own value, which should not refill it. */
  private committing = false;
  protected readonly errorId = uniqueId('kt-segmented-error');

  /** What each segment holds, by key: digits, or the index of a choice. */
  @state() protected texts: Record<string, string> = {};
  /** Why the segments do not make a value, when they are all filled. */
  @state() protected typedError = '';
  @state() private focusedKey: string | null = null;
  /** Disabled by an enclosing `<fieldset>`, which leaves `disabled` alone. */
  @state() private formDisabled = false;

  @property({ type: String, reflect: true })
  value: string | null = null;

  @property({ type: String })
  name = '';

  /** Accessible name of the field, when no `<kt-label-input>` wraps it. */
  @property({ type: String })
  label = '';

  /** BCP 47 locale for the order and names of the segments. Empty: page, then browser. */
  @property({ type: String })
  locale = '';

  @property({ type: String })
  min = '';

  @property({ type: String })
  max = '';

  @property({ type: String, reflect: true })
  size: KtSegmentedFieldSize = 'medium';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  /** Error message. A non-empty value puts the field in its error state. */
  @property({ type: String, reflect: true })
  error = '';

  // --- What a subclass says ---

  /** The segments, in order, with what goes between them. */
  protected abstract items(): FieldItem[];
  /** What each segment holds for a value. */
  protected abstract fill(value: string | null): Record<string, string>;
  /** The value the segments make — null until they all hold something — and why not, if not. */
  protected abstract read(texts: Record<string, string>): { value: string | null; error: string };
  /** The message of a required field left empty. */
  protected abstract requiredMessage(): string;
  /** Anything after the segments: a calendar button. */
  protected renderAfter(): TemplateResult | typeof nothing {
    return nothing;
  }
  /**
   * What a segment left half-typed becomes when the focus leaves it — a
   * two-digit year written out — or null to leave it as typed.
   */
  protected completeOnBlur(_segment: Segment, _text: string): string | null {
    return null;
  }
  /** Whether a popup belonging to the field is open, for the field's outline. */
  protected get expanded(): boolean {
    return false;
  }

  // --- Lifecycle ---

  override connectedCallback(): void {
    super.connectedCallback();
    this.internals ??= attachFormInternals(this);
    this.defaultValue = this.value;
    this.texts = this.fill(this.value);
  }

  override willUpdate(changed: PropertyValues<this>): void {
    // A value set from outside fills the segments; one the field wrote does not.
    if ((changed.has('value') || changed.has('locale')) && !this.committing) {
      this.texts = this.fill(this.value);
      this.typedError = '';
    }
    this.committing = false;

    if (
      changed.has('value') ||
      changed.has('required') ||
      changed.has('error') ||
      changed.has('typedError' as keyof KtSegmentedField) ||
      this.stringsChanged(changed)
    ) {
      setFormValue(this.internals, this.value);
      const missing = this.required && this.value === null && !this.typedError;
      setValidity(
        this.internals,
        {
          valueMissing: missing,
          badInput: Boolean(this.typedError),
          customError: Boolean(this.error),
        },
        this.error || this.typedError || (missing ? this.requiredMessage() : ''),
      );
    }
  }

  formResetCallback(): void {
    this.value = this.defaultValue;
    this.texts = this.fill(this.value);
    this.typedError = '';
  }

  /**
   * Called by the platform when the control's disabled state changes — its
   * own `disabled`, or an ancestor `<fieldset disabled>` it cannot see.
   */
  formDisabledCallback(disabled: boolean): void {
    this.formDisabled = disabled;
  }

  /** Called by the platform when the browser restores a session. */
  formStateRestoreCallback(state: string | null): void {
    this.value = state;
  }

  /** Focuses the first segment. */
  override focus(options?: FocusOptions): void {
    this.segmentElements()[0]?.focus(options);
  }

  protected get inactive(): boolean {
    return this.disabled || this.formDisabled;
  }

  protected get resolvedLocale(): string {
    return resolveLocale(this.locale);
  }

  // --- Values ---

  /** Sets a value chosen outside the segments — a day picked in a calendar. */
  protected commitValue(value: string | null): void {
    this.texts = this.fill(value);
    this.typedError = '';
    this.apply(value);
  }

  private setText(key: string, text: string): void {
    this.texts = { ...this.texts, [key]: text };
    const { value, error } = this.read(this.texts);
    this.typedError = error;
    this.apply(value);
  }

  private apply(value: string | null): void {
    if (value === this.value) return;
    this.committing = true;
    this.value = value;
    emit(this, 'kt-change', { value });
  }

  // --- Keyboard ---

  private segmentElements(): HTMLElement[] {
    return [...(this.shadowRoot?.querySelectorAll<HTMLElement>('[role="spinbutton"]') ?? [])];
  }

  private focusSegment(index: number): void {
    this.segmentElements()[index]?.focus();
  }

  /** One key's effect on a segment; true when the key was the field's to handle. */
  private applyKey(key: string, segment: Segment, index: number): boolean {
    const text = this.texts[segment.key] ?? '';

    if (/^\d$/.test(key) && segment.spec) {
      const typed = typeDigit(text, key, segment.spec);
      this.setText(segment.key, typed.text);
      if (typed.advance) this.focusSegment(index + 1);
      return true;
    }
    if (segment.choices && /^\p{L}$/u.test(key)) {
      const pick = segment.choices.findIndex((choice) =>
        choice.toLowerCase().startsWith(key.toLowerCase()),
      );
      if (pick >= 0) {
        this.setText(segment.key, String(pick));
        this.focusSegment(index + 1);
      }
      return true;
    }

    switch (key) {
      case 'ArrowUp':
      case 'ArrowDown': {
        const by = key === 'ArrowUp' ? 1 : -1;
        if (segment.spec) {
          const current = text === '' ? null : Number(text);
          const next = stepSegment(current, by * (segment.step ?? 1), segment.spec);
          this.setText(segment.key, padSegment(next, segment.spec));
        } else if (segment.choices) {
          const count = segment.choices.length;
          const current = text === '' ? (by > 0 ? -1 : 0) : Number(text);
          this.setText(segment.key, String((current + by + count) % count));
        }
        return true;
      }
      case 'Home':
      case 'End':
        if (segment.spec) {
          const bound = key === 'Home' ? segment.spec.min : segment.spec.max;
          this.setText(segment.key, padSegment(bound, segment.spec));
        }
        return true;
      case 'ArrowLeft':
        this.focusSegment(index - 1);
        return true;
      case 'ArrowRight':
        this.focusSegment(index + 1);
        return true;
      case 'Backspace':
      case 'Delete':
        // Erase a digit at a time; once empty, Backspace goes back a segment.
        if (text) this.setText(segment.key, segment.choices ? '' : text.slice(0, -1));
        else if (key === 'Backspace') this.focusSegment(index - 1);
        return true;
      default:
        if (SEPARATORS.has(key)) {
          if (text) this.focusSegment(index + 1);
          return true;
        }
        // Any other character would land in the contenteditable as text.
        return key.length === 1;
    }
  }

  private onKeyDown(event: KeyboardEvent, segment: Segment, index: number): void {
    if (this.inactive || event.metaKey || event.ctrlKey || event.altKey) return;
    if (this.applyKey(event.key, segment, index)) event.preventDefault();
  }

  /**
   * What a phone's keyboard sends: input events rather than key presses.
   * The text is never left to the browser; each character goes through the
   * same path as a key.
   */
  private onBeforeInput(event: InputEvent, segment: Segment, index: number): void {
    event.preventDefault();
    if (this.inactive) return;
    if (event.inputType.startsWith('delete')) {
      this.applyKey('Backspace', segment, index);
      return;
    }
    for (const character of event.data ?? '') this.applyKey(character, segment, index);
  }

  /** A click on the field's padding or separators lands in its first empty segment. */
  private onFieldClick(event: MouseEvent): void {
    if (this.inactive) return;
    if ((event.target as HTMLElement).closest('[role="spinbutton"], button, kt-tooltip')) return;
    const segments = this.items().filter(isSegment);
    const empty = segments.findIndex((segment) => !this.texts[segment.key]);
    this.focusSegment(empty >= 0 ? empty : segments.length - 1);
  }

  // --- Rendering ---

  private renderSegment(segment: Segment, index: number): TemplateResult {
    const text = this.texts[segment.key] ?? '';
    const focused = this.focusedKey === segment.key;
    let shown = segment.placeholder;
    let now: number | typeof nothing = nothing;
    if (text !== '') {
      now = Number(text);
      if (segment.choices) shown = segment.choices[Number(text)] ?? '';
      else if (segment.spec) shown = focused ? text : padSegment(Number(text), segment.spec);
    }

    return html`<span
      part="segment"
      role="spinbutton"
      class=${classMap({ segment: true, empty: text === '' })}
      data-key=${segment.key}
      tabindex=${this.inactive ? -1 : 0}
      contenteditable=${this.inactive ? 'false' : 'true'}
      inputmode=${segment.spec ? 'numeric' : 'text'}
      spellcheck="false"
      autocorrect="off"
      enterkeyhint="next"
      aria-label=${segment.label}
      aria-valuemin=${segment.spec ? segment.spec.min : nothing}
      aria-valuemax=${segment.spec ? segment.spec.max : nothing}
      aria-valuenow=${now}
      aria-valuetext=${text === '' ? segment.placeholder : shown}
      aria-disabled=${this.inactive ? 'true' : nothing}
      @keydown=${(event: KeyboardEvent) => this.onKeyDown(event, segment, index)}
      @beforeinput=${(event: InputEvent) => this.onBeforeInput(event, segment, index)}
      @focus=${() => {
        this.focusedKey = segment.key;
      }}
      @blur=${() => {
        this.focusedKey = null;
        const completed = this.completeOnBlur(segment, this.texts[segment.key] ?? '');
        if (completed !== null && completed !== this.texts[segment.key]) {
          this.setText(segment.key, completed);
        }
      }}
      >${shown}</span
    >`;
  }

  override render(): TemplateResult {
    const error = this.error || this.typedError;
    let index = -1;

    return html`${
        error ? html`<span id=${this.errorId} class="visually-hidden">${error}</span>` : nothing
      }
      <div
        part="field"
        class=${classMap({
          field: true,
          error: Boolean(error),
          disabled: this.inactive,
          open: this.expanded,
        })}
        role="group"
        aria-label=${this.label || nothing}
        aria-invalid=${error ? 'true' : nothing}
        aria-describedby=${error ? this.errorId : nothing}
        @click=${this.onFieldClick}
      >
        <div class="segments">
          ${this.items().map((item) => {
            if (!isSegment(item)) {
              return html`<span class="literal" aria-hidden="true">${item.literal}</span>`;
            }
            index += 1;
            return this.renderSegment(item, index);
          })}
        </div>
        ${
          error
            ? html`<kt-tooltip class="error-icon" text=${error} ?open=${this.focusedKey !== null}>
                <kt-icon name="circle-alert" size="18"></kt-icon>
              </kt-tooltip>`
            : nothing
        }
        ${this.renderAfter()}
      </div>`;
  }
}
