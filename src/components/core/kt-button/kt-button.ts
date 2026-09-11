import { css, html, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { KtElement, defineElement } from 'kanto-ds/internal/kt-element';
import '../kt-icon/kt-icon.js';

export type KtButtonVariant =
  | 'primary'
  | 'secondary'
  | 'secondary-no-bg'
  | 'dark'
  | 'danger'
  | 'delete'
  | 'warning'
  | 'info'
  | 'success'
  | 'text';

export type KtButtonSize = 'small' | 'medium' | 'large';
export type KtButtonType = 'button' | 'submit' | 'reset';

/** Icon size per button size, so the glyph stays optically balanced. */
const ICON_SIZE: Record<KtButtonSize, number> = { small: 16, medium: 20, large: 24 };

/**
 * The Kanto action button.
 *
 * Ten variants; `primary` for the one action a screen is about, `secondary`
 * (a soft indigo tint) for everything supporting it. The semantic variants —
 * `danger`, `warning`, `info`, `success` — are tinted fills with coloured
 * text; `delete` is the only solid red, reserved for irreversible actions.
 *
 * Setting `icon` with no slotted text produces a square icon-only button,
 * which then requires a `label`.
 *
 * @element kt-button
 *
 * @slot - The button label.
 *
 * @csspart button - The native `<button>`.
 * @csspart icon - The icon, when `icon` is set.
 *
 * @example
 * ```html
 * <kt-button icon="plus">New entity</kt-button>
 * <kt-button variant="secondary" icon="refresh-cw">Refresh</kt-button>
 * <kt-button variant="danger">Delete</kt-button>
 * ```
 */
export class KtButton extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: inline-flex;
        vertical-align: middle;
      }

      :host([full-width]) {
        display: flex;
        width: 100%;
      }

      button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: var(--button-height);
        padding: 0 var(--button-padding-x);
        gap: var(--gap-button);
        border: none;
        border-radius: var(--border-radius);
        font: var(--font-normal-regular);
        cursor: pointer;
        transition:
          background-color var(--duration-instant),
          color var(--duration-instant);
      }

      /* === SIZES === */
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

      /* === VARIANTS ===
         Press returns to the base colour; Kanto has no scale or shrink. */
      .primary {
        color: var(--color-white);
        background-color: var(--color-primary-base);
      }
      .primary:hover {
        background-color: var(--color-primary-hover);
      }
      .primary:active {
        background-color: var(--color-primary-base);
      }

      .secondary {
        color: var(--color-primary-base);
        background-color: var(--color-primary-soft);
      }
      .secondary:hover {
        background-color: var(--color-secondary-hover);
      }
      .secondary:active {
        background-color: var(--color-primary-soft);
      }

      .secondary-no-bg {
        color: var(--color-primary-base);
        background: none;
      }
      .secondary-no-bg:hover {
        background-color: var(--color-secondary-hover);
      }
      .secondary-no-bg:active {
        background-color: var(--color-dark-14);
      }

      .dark {
        color: var(--color-text-400);
        background-color: var(--color-dark-20);
      }
      .dark:hover {
        background-color: var(--color-dark-22);
      }
      .dark:active {
        background-color: var(--color-dark-20);
      }

      .danger {
        color: var(--color-danger-base);
        background-color: var(--color-danger-soft);
      }
      .danger:hover {
        background-color: var(--color-danger-hover);
      }
      .danger:active {
        background-color: var(--color-danger-soft);
      }

      .delete {
        color: var(--color-white);
        background-color: var(--color-navigation-icon-close);
      }
      .delete:hover {
        background-color: var(--color-danger-base);
      }

      .warning {
        color: var(--color-warning-base);
        background-color: var(--color-warning-soft);
      }
      .warning:hover {
        background-color: var(--color-warning-hover);
      }

      .info {
        color: var(--color-info-base);
        background-color: var(--color-info-soft);
      }
      .info:hover {
        background-color: var(--color-info-hover);
      }

      .success {
        color: var(--color-success-base);
        background-color: var(--color-success-soft);
      }
      .success:hover {
        background-color: var(--color-success-hover);
      }

      .text {
        height: auto;
        padding: 0;
        color: var(--color-primary-base);
        background: none;
      }
      .text:active {
        background-color: var(--color-dark-14);
      }

      /* === ICON-ONLY === */
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

      /* === DISABLED === */
      button:disabled {
        color: var(--text-disabled);
        background-color: var(--color-dark-14);
        cursor: not-allowed;
      }
      button:disabled:hover {
        background-color: var(--color-dark-14);
      }

      button:focus-visible {
        outline: var(--outline-width) solid var(--color-primary-base);
        outline-offset: 2px;
      }
    `,
  ];

  /** Visual variant. */
  @property({ type: String, reflect: true })
  variant: KtButtonVariant = 'primary';

  /** Height: 32 / 40 / 48px at the desktop scale. */
  @property({ type: String, reflect: true })
  size: KtButtonSize = 'medium';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  /** Native button behaviour. `submit` and `reset` act on the enclosing form. */
  @property({ type: String })
  type: KtButtonType = 'button';

  /** Lucide icon name, kebab-case. */
  @property({ type: String })
  icon = '';

  /** Which side of the label the icon sits on. */
  @property({ type: String, attribute: 'icon-position' })
  iconPosition: 'left' | 'right' = 'left';

  /** Accessible name. Required for an icon-only button. */
  @property({ type: String })
  label = '';

  /** Stretches the button to the width of its container. */
  @property({ type: Boolean, reflect: true, attribute: 'full-width' })
  fullWidth = false;

  /** Submitted with the form, as on a native button. */
  @property({ type: String })
  name = '';

  /** @see name */
  @property({ type: String })
  value = '';

  /** Moves focus to the button. */
  override focus(options?: FocusOptions): void {
    this.shadowRoot?.querySelector('button')?.focus(options);
  }

  override blur(): void {
    this.shadowRoot?.querySelector('button')?.blur();
  }

  private get hasLabelText(): boolean {
    return this.textContent !== null && this.textContent.trim().length > 0;
  }

  /**
   * A button inside a shadow root is invisible to the enclosing form, so
   * `type="submit"` would do nothing. Click a throwaway native button instead:
   * that runs constraint validation, fires a real `submit` event, and carries
   * `name`/`value` into the submission the way an author expects.
   */
  private submitEnclosingForm(): void {
    const form = this.closest('form');
    if (!form) return;

    const proxy = document.createElement('button');
    proxy.type = this.type;
    proxy.hidden = true;
    if (this.name) proxy.name = this.name;
    if (this.value) proxy.value = this.value;

    form.append(proxy);
    proxy.click();
    proxy.remove();
  }

  private onClick(event: MouseEvent): void {
    if (this.disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (this.type !== 'button') this.submitEnclosingForm();
  }

  override render(): TemplateResult {
    const iconOnly = Boolean(this.icon) && !this.hasLabelText;
    const icon = this.icon
      ? html`<kt-icon part="icon" name=${this.icon} size=${ICON_SIZE[this.size]}></kt-icon>`
      : nothing;

    return html`<button
      part="button"
      class=${classMap({
        [this.variant]: true,
        [this.size]: true,
        'icon-only': iconOnly,
      })}
      type=${this.type}
      ?disabled=${this.disabled}
      aria-label=${this.label || nothing}
      @click=${this.onClick}
    >
      ${this.iconPosition === 'left' ? icon : nothing}
      <slot></slot>
      ${this.iconPosition === 'right' ? icon : nothing}
    </button>`;
  }
}

defineElement('kt-button', KtButton);

declare global {
  interface HTMLElementTagNameMap {
    'kt-button': KtButton;
  }
}
