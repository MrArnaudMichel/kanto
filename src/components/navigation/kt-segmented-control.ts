import { css, html, nothing, type TemplateResult } from 'lit';
import { property, queryAll } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { KtElement, defineElement } from '../../internal/kt-element.js';
import { emit } from '../../internal/events.js';
import '../core/kt-icon.js';

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
 *   { value: 'day', label: 'Jour' },
 *   { value: 'week', label: 'Semaine' },
 *   { value: 'month', label: 'Mois' },
 * ];
 * control.value = 'week';
 * ```
 */
export class KtSegmentedControl extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: inline-block;
      }

      .track {
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

      :host([disabled]) .track {
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

      .option.selected {
        color: var(--text-body);
        background-color: var(--surface-raised);
      }
      .option.selected:hover:not(:disabled) {
        background-color: var(--surface-hover);
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

  /** Accessible name for the group. */
  @property({ type: String })
  label = '';

  private get selectedIndex(): number {
    return this.options.findIndex((option) => option.value === this.value);
  }

  private choose(option: KtSegmentedOption): void {
    if (option.disabled || this.value === option.value) return;
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
      aria-disabled=${this.disabled ? 'true' : nothing}
      @keydown=${this.onKeyDown}
    >
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
          ?disabled=${option.disabled}
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
