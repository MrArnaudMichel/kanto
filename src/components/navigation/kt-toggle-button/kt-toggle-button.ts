import { css, html, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { KtElement, defineElement } from '../../../internal/kt-element.js';
import { emit } from '../../../internal/events.js';
import '../../core/kt-icon/kt-icon.js';

export type KtToggleButtonVariant = 'primary' | 'secondary' | 'outline';
export type KtToggleButtonSize = 'small' | 'medium' | 'large';

const ICON_SIZE: Record<KtToggleButtonSize, number> = { small: 16, medium: 20, large: 24 };

/**
 * A button that stays pressed.
 *
 * `aria-pressed` rather than `aria-checked`: this is a control that holds a
 * state, not one option among several. Put several in a
 * `<kt-toggle-button-group>` when they are.
 *
 * @element kt-toggle-button
 *
 * @slot - The button label.
 *
 * @csspart button - The native `<button>`.
 *
 * @fires kt-change - The state changed. `detail: { selected, value }`.
 */
export class KtToggleButton extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: inline-flex;
      }

      button {
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        width: 100%;
        height: var(--button-height);
        padding: 0 var(--button-padding-x);
        gap: var(--gap-button);
        font: var(--font-normal-regular);
        border: var(--border-width) solid transparent;
        /* Overridden by kt-toggle-button-group, which is the only thing that
           knows whether this button is first, last or in the middle. */
        border-radius: var(--kt-toggle-button-radius, var(--border-radius));
        cursor: pointer;
        transition:
          background-color var(--duration-normal) var(--easing-standard),
          border-color var(--duration-normal) var(--easing-standard),
          color var(--duration-normal) var(--easing-standard);
      }

      button:disabled {
        color: var(--text-disabled);
        background-color: var(--color-dark-14);
        border-color: transparent;
        pointer-events: none;
      }

      button:focus-visible {
        outline: var(--outline-width) solid var(--color-primary-base);
        outline-offset: 2px;
      }

      .small {
        height: var(--button-height-small);
        padding: 0 8px;
        font: var(--font-normal-small);
      }
      .large {
        height: var(--button-height-large);
        padding: 0 calc(var(--button-padding-x) + 8px);
        font: var(--font-normal-medium);
      }

      /* === PRIMARY === */
      .primary {
        color: var(--text-muted);
        background-color: var(--surface-raised);
      }
      .primary:hover:not(:disabled) {
        background-color: var(--surface-hover);
      }
      .primary.selected {
        color: var(--color-white);
        background-color: var(--color-primary-base);
        border-color: var(--color-primary-base);
      }
      .primary.selected:hover:not(:disabled) {
        background-color: var(--color-primary-hover);
      }

      /* === SECONDARY === */
      .secondary {
        color: var(--text-muted);
        background-color: var(--color-dark-14);
      }
      .secondary:hover:not(:disabled) {
        background-color: var(--color-secondary-hover);
      }
      .secondary.selected {
        color: var(--color-primary-base);
        background-color: var(--color-primary-soft);
      }

      /* === OUTLINE === */
      .outline {
        color: var(--text-muted);
        background-color: transparent;
        border-color: var(--color-text-600);
      }
      .outline:hover:not(:disabled) {
        background-color: var(--color-dark-14);
        border-color: var(--text-muted);
      }
      .outline.selected {
        color: var(--color-primary-base);
        background-color: var(--color-primary-soft);
        border-color: var(--color-primary-base);
      }

      .icon-only {
        width: var(--button-height);
        padding: 0;
      }
      .icon-only.small {
        width: var(--button-height-small);
      }
      .icon-only.large {
        width: var(--button-height-large);
      }

      .text {
        white-space: nowrap;
      }
    `,
  ];

  @property({ type: Boolean, reflect: true })
  selected = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: String, reflect: true })
  variant: KtToggleButtonVariant = 'primary';

  @property({ type: String, reflect: true })
  size: KtToggleButtonSize = 'medium';

  /** Identifies this button inside a `<kt-toggle-button-group>`. */
  @property({ type: String })
  value = '';

  @property({ type: String })
  icon = '';

  @property({ type: String, attribute: 'icon-position' })
  iconPosition: 'left' | 'right' = 'left';

  /** Accessible name. Required when the button is icon-only. */
  @property({ type: String })
  label = '';

  /**
   * Set by `<kt-toggle-button-group>` on the buttons it owns.
   *
   * A managed button is a display, not a control: it neither flips itself nor
   * emits. The group reads the click, decides what the selection now is, and
   * writes `selected` back. Without this the two both react to the same click
   * and consumers hear two different kt-change events for one press.
   */
  @property({ attribute: false })
  managed = false;

  override focus(options?: FocusOptions): void {
    this.shadowRoot?.querySelector('button')?.focus(options);
  }

  private toggle(): void {
    if (this.disabled || this.managed) return;
    this.selected = !this.selected;
    emit(this, 'kt-change', { selected: this.selected, value: this.value });
  }

  override render(): TemplateResult {
    const hasText = this.textContent !== null && this.textContent.trim().length > 0;
    const iconOnly = Boolean(this.icon) && !hasText;
    const icon = this.icon
      ? html`<kt-icon name=${this.icon} size=${ICON_SIZE[this.size]}></kt-icon>`
      : nothing;

    return html`<button
      part="button"
      type="button"
      class=${classMap({
        [this.variant]: true,
        [this.size]: true,
        selected: this.selected,
        'icon-only': iconOnly,
      })}
      aria-pressed=${this.selected ? 'true' : 'false'}
      aria-label=${this.label || nothing}
      ?disabled=${this.disabled}
      @click=${this.toggle}
    >
      ${this.iconPosition === 'left' ? icon : nothing}
      ${iconOnly ? nothing : html`<span class="text"><slot></slot></span>`}
      ${this.iconPosition === 'right' ? icon : nothing}
    </button>`;
  }
}

defineElement('kt-toggle-button', KtToggleButton);

declare global {
  interface HTMLElementTagNameMap {
    'kt-toggle-button': KtToggleButton;
  }
}
