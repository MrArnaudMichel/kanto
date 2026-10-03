import { css, html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property, queryAll, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { IndicatorController } from '#internal/indicator';
import { emit } from '#internal/events';
import {
  attachFormInternals,
  setFormValue,
  setValidity,
  type UsableInternals,
} from '#internal/form-control';
import { strings } from '#internal/strings';
import '../../core/kt-icon/kt-icon.js';

export type KtSegmentedSize = 'small' | 'medium' | 'large';

export interface KtSegmentedOption {
  readonly value: string | number;
  readonly label?: string;
  readonly icon?: string;
  readonly disabled?: boolean;
}

const ICON_SIZE: Record<KtSegmentedSize, number> = { small: 16, medium: 20, large: 24 };

/**
 * A small set of mutually exclusive choices, shown as one inset track with the
 * selected segment raised out of it.
 *
 * Use it for two to five options that all fit on screen — a view switch, a date
 * range. Past that, `<kt-select>`.
 *
 * Implemented as a radio group: one tab stop for the whole control, arrows to
 * move between segments. That is what a keyboard user expects here, and it
 * keeps a five-option control from adding five tab stops to the page.
 *
 * @element kt-segmented-control
 *
 * @csspart base - The track.
 * @csspart option - A segment.
 *
 * @fires kt-change - A segment was chosen. `detail: { value, option }`.
 *
 * @example
 * ```js
 * control.options = [
 *   { value: 'day', label: 'Day' },
 *   { value: 'week', label: 'Week' },
 *   { value: 'month', label: 'Month' },
 * ];
 * control.value = 'week';
 * ```
 */
export class KtSegmentedControl extends KtElement {
  static readonly formAssociated = true;
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: inline-block;
      }

      .track {
        position: relative;
        display: inline-flex;
        box-sizing: border-box;
        gap: 4px;
        padding: 4px;
        background-color: var(--color-dark-14);
        border-radius: var(--border-radius);
      }

      .track.small {
        gap: 3px;
        padding: 3px;
      }
      .track.large {
        gap: 5px;
        padding: 5px;
      }

      .track.vertical {
        flex-direction: column;
        width: fit-content;
      }

      :host(:disabled) .track {
        opacity: 0.5;
        pointer-events: none;
      }

      .option {
        display: flex;
        flex: 1;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        gap: var(--gap-button);
        height: var(--button-height-small);
        padding: 0 12px;
        color: var(--text-muted);
        font: var(--font-normal-regular);
        /* Segments share the width equally from a basis of zero, so in a
           container that shrinks to fit they would split a label over two
           lines of a fixed-height button. */
        white-space: nowrap;
        background-color: transparent;
        border: none;
        border-radius: calc(var(--border-radius) - 4px);
        cursor: pointer;
        transition:
          background-color var(--duration-normal) var(--easing-standard),
          color var(--duration-normal) var(--easing-standard);
      }

      .option:hover:not(:disabled) {
        background-color: var(--color-dark-18);
      }
      .option:active:not(:disabled) {
        background-color: var(--surface-card);
      }

      /* Its surface is the thumb below, not its own background. */
      .option.selected,
      .option.selected:hover:not(:disabled) {
        color: var(--text-body);
        background-color: transparent;
      }

      /* One surface that slides from segment to segment, placed by
         IndicatorController before the first paint. The segments sit above
         it. */
      .thumb {
        position: absolute;
        top: 0;
        left: 0;
        display: none;
        width: var(--kt-indicator-width);
        height: var(--kt-indicator-height);
        background-color: var(--surface-raised);
        border-radius: calc(var(--border-radius) - 4px);
        translate: var(--kt-indicator-x) var(--kt-indicator-y);
        pointer-events: none;
      }
      .track[data-indicator] .thumb {
        display: block;
      }
      .option {
        position: relative;
      }
      .track:has(.option.selected:hover:not(:disabled)) .thumb {
        background-color: var(--surface-hover);
      }
      .track[data-indicator='ready'] .thumb {
        transition:
          translate var(--duration-normal) var(--easing-standard),
          width var(--duration-normal) var(--easing-standard),
          height var(--duration-normal) var(--easing-standard),
          background-color var(--duration-normal) var(--easing-standard);
      }

      .option:disabled {
        color: var(--text-disabled);
        background-color: transparent;
        pointer-events: none;
      }

      .option:focus-visible {
        outline: var(--outline-width) solid var(--color-primary-base);
        outline-offset: -2px;
      }

      .option.small {
        height: 24px;
        gap: 6px;
        padding: 0 8px;
        font: var(--font-normal-small);
      }
      .option.large {
        height: var(--button-height);
        padding: 0 16px;
        font: var(--font-normal-medium);
      }

      .option.icon-only {
        width: var(--button-height-small);
        padding: 0;
      }
      .option.icon-only.small {
        width: 24px;
      }
      .option.icon-only.large {
        width: var(--button-height);
      }

      .text {
        flex: 1;
        text-align: center;
      }
    `,
  ];

  @queryAll('.option')
  private segments!: NodeListOf<HTMLButtonElement>;

  constructor() {
    super();
    new IndicatorController(this, {
      container: () => this.renderRoot.querySelector<HTMLElement>('.track'),
      selected: () => this.renderRoot.querySelector<HTMLElement>('.option.selected'),
    });
  }

  private internals: UsableInternals | null = null;
  private defaultValue: string | number | null = null;

  @property({ attribute: false })
  options: readonly KtSegmentedOption[] = [];

  @property({ type: String })
  value: string | number | null = null;

  @property({ type: String, reflect: true })
  size: KtSegmentedSize = 'medium';

  @property({ type: String, reflect: true })
  orientation: 'horizontal' | 'vertical' = 'horizontal';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  /** Disabled by an enclosing `<fieldset>`, which leaves `disabled` alone. */
  @state()
  private formDisabled = false;

  /** Whether the control is off, by its own `disabled` or by its form. */
  private get inactive(): boolean {
    return this.disabled || this.formDisabled;
  }

  /** Accessible name for the group. */
  @property({ type: String })
  label = '';

  @property({ type: String })
  name = '';

  @property({ type: Boolean, reflect: true })
  required = false;

  override connectedCallback(): void {
    super.connectedCallback();
    this.internals ??= attachFormInternals(this);
    this.defaultValue = this.value;
  }

  override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has('value') || changed.has('required') || this.stringsChanged(changed)) {
      setFormValue(this.internals, this.value === null ? null : String(this.value));

      const missing = this.required && this.value === null;
      setValidity(this.internals, { valueMissing: missing }, missing ? strings().selectOption : '');
    }
  }

  formResetCallback(): void {
    this.value = this.defaultValue;
  }

  /**
   * Called by the platform when the control's disabled state changes — its
   * own `disabled`, or an ancestor `<fieldset disabled>` it cannot see.
   */
  formDisabledCallback(disabled: boolean): void {
    this.formDisabled = disabled;
  }

  formStateRestoreCallback(state: string): void {
    // The form stores a string; hand back the option's own value, which may be
    // a number.
    this.value = this.options.find((option) => String(option.value) === state)?.value ?? state;
  }

  private get selectedIndex(): number {
    return this.options.findIndex((option) => option.value === this.value);
  }

  private choose(option: KtSegmentedOption): void {
    if (this.inactive || option.disabled || this.value === option.value) return;
    this.value = option.value;
    emit(this, 'kt-change', { value: option.value, option });
  }

  /**
   * Radio-group semantics: the arrows move *and* select, wrapping at the ends
   * and skipping disabled segments.
   */
  private onKeyDown(event: KeyboardEvent): void {
    const forward = this.orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';
    const back = this.orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';

    let target: number | undefined;
    if (event.key === forward) target = this.step(1);
    else if (event.key === back) target = this.step(-1);
    else if (event.key === 'Home') target = this.options.findIndex((o) => !o.disabled);
    else if (event.key === 'End')
      target = this.options.length - 1 - [...this.options].reverse().findIndex((o) => !o.disabled);
    else return;

    event.preventDefault();
    if (target === undefined || target < 0) return;

    const option = this.options[target];
    if (!option) return;

    const index = target;
    this.choose(option);
    void this.updateComplete.then(() => this.segments[index]?.focus());
  }

  private step(direction: 1 | -1): number | undefined {
    const count = this.options.length;
    if (count === 0) return undefined;

    const from = this.selectedIndex < 0 ? (direction === 1 ? -1 : 0) : this.selectedIndex;
    for (let offset = 1; offset <= count; offset += 1) {
      const index = (((from + direction * offset) % count) + count) % count;
      if (!this.options[index]?.disabled) return index;
    }
    return undefined;
  }

  override render(): TemplateResult {
    const selectedIndex = this.selectedIndex;
    // One tab stop for the whole group: the selected segment holds it, or the
    // first selectable one when nothing is chosen yet.
    const tabStop = selectedIndex >= 0 ? selectedIndex : this.options.findIndex((o) => !o.disabled);

    return html`<div
      part="base"
      class=${classMap({
        track: true,
        [this.size]: true,
        vertical: this.orientation === 'vertical',
      })}
      role="radiogroup"
      aria-label=${this.label || nothing}
      aria-orientation=${this.orientation}
      aria-disabled=${this.inactive ? 'true' : nothing}
      @keydown=${this.onKeyDown}
    >
      <span class="thumb" aria-hidden="true"></span>
      ${this.options.map((option, index) => {
        const selected = option.value === this.value;
        const text = option.label ?? '';
        const iconOnly = Boolean(option.icon) && text === '';

        return html`<button
          part="option"
          type="button"
          role="radio"
          class=${classMap({
            option: true,
            [this.size]: true,
            selected,
            'icon-only': iconOnly,
          })}
          aria-checked=${selected ? 'true' : 'false'}
          aria-label=${iconOnly ? (option.icon ?? '') : nothing}
          tabindex=${index === tabStop ? 0 : -1}
          ?disabled=${this.inactive || option.disabled}
          @click=${() => this.choose(option)}
        >
          ${
            option.icon
              ? html`<kt-icon name=${option.icon} size=${ICON_SIZE[this.size]}></kt-icon>`
              : nothing
          }
          ${iconOnly ? nothing : html`<span class="text">${text}</span>`}
        </button>`;
      })}
    </div>`;
  }
}

defineElement('kt-segmented-control', KtSegmentedControl);

declare global {
  interface HTMLElementTagNameMap {
    'kt-segmented-control': KtSegmentedControl;
  }
}
