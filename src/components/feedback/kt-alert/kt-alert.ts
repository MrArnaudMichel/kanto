import { css, html, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { KtElement, defineElement } from '../../../internal/kt-element.js';
import { emit } from '../../../internal/events.js';
import '../../core/kt-icon/kt-icon.js';

export type KtAlertVariant = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

const ICONS: Record<KtAlertVariant, string> = {
  info: 'info',
  success: 'circle-check',
  warning: 'triangle-alert',
  danger: 'circle-alert',
  neutral: 'info',
};

/**
 * A message that stays on the page.
 *
 * Against a toast: a toast is transient and interrupts; an alert sits in the
 * layout and waits. Use an alert when the message belongs to the page — a form
 * that failed to save, a trial about to expire, a consent notice — and a toast
 * when it belongs to the moment.
 *
 * @element kt-alert
 *
 * @slot - Body text, when `description` is not used.
 * @slot actions - Buttons, at the end.
 *
 * @csspart base - The alert.
 * @csspart close - The dismiss button.
 *
 * @fires kt-close - The dismiss button was pressed.
 *
 * @example
 * ```html
 * <kt-alert variant="warning" heading="Storage almost full"
 *           description="You are using 88% of your quota."></kt-alert>
 * ```
 */
export class KtAlert extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: block;
      }

      .alert {
        display: flex;
        align-items: flex-start;
        gap: var(--gap-form);
        padding: var(--padding-form);
        color: var(--text-body);
        background: var(--surface-card);
        border: var(--border-width) solid var(--border-subtle);
        border-radius: var(--border-radius);
      }

      /* A tinted fill plus a matching border, rather than a coloured bar: the
         whole block should read as the message's temperature. */
      :host([variant='info']) .alert {
        background: var(--color-info-soft);
        border-color: var(--color-info-base);
      }
      :host([variant='success']) .alert {
        background: var(--color-success-soft);
        border-color: var(--color-success-base);
      }
      :host([variant='warning']) .alert {
        background: var(--color-warning-soft);
        border-color: var(--color-warning-base);
      }
      :host([variant='danger']) .alert {
        background: var(--color-danger-soft);
        border-color: var(--color-danger-base);
      }

      .icon {
        display: flex;
        flex: none;
        padding-top: 1px;
      }

      :host([variant='info']) .icon {
        color: var(--color-info-base);
      }
      :host([variant='success']) .icon {
        color: var(--color-success-base);
      }
      :host([variant='warning']) .icon {
        color: var(--color-warning-base);
      }
      :host([variant='danger']) .icon {
        color: var(--color-danger-base);
      }
      :host([variant='neutral']) .icon {
        color: var(--text-muted);
      }

      .content {
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: var(--gap-element);
        min-width: 0;
      }

      .heading {
        font: var(--font-normal-medium);
      }

      .description {
        color: var(--text-muted);
        font: var(--font-normal-regular);
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--gap-button);
        margin-top: 4px;
      }

      .actions:not(:has(*)) {
        display: none;
      }

      .close {
        display: flex;
        flex: none;
        align-items: center;
        padding: 2px;
        color: currentcolor;
        background: none;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        opacity: 0.7;
      }

      .close:hover {
        opacity: 1;
      }

      .close:focus-visible {
        outline: var(--outline-width) solid var(--color-primary-base);
      }
    `,
  ];

  @property({ type: String, reflect: true })
  variant: KtAlertVariant = 'info';

  @property({ type: String })
  heading = '';

  @property({ type: String })
  description = '';

  /** Adds a dismiss button. Removing the alert is the caller's job. */
  @property({ type: Boolean })
  dismissible = false;

  /** Hides the leading icon. */
  @property({ type: Boolean, attribute: 'no-icon' })
  noIcon = false;

  /** Overrides the icon the variant would pick. */
  @property({ type: String })
  icon = '';

  override render(): TemplateResult {
    // Danger interrupts; the rest wait their turn.
    const live = this.variant === 'danger' ? 'assertive' : 'polite';

    return html`<div part="base" class="alert" role="alert" aria-live=${live}>
      ${
        this.noIcon
          ? nothing
          : html`<span class="icon">
              <kt-icon name=${this.icon || ICONS[this.variant]} size="20"></kt-icon>
            </span>`
      }

      <div class="content">
        ${this.heading ? html`<span class="heading">${this.heading}</span>` : nothing}
        ${this.description ? html`<span class="description">${this.description}</span>` : nothing}
        <slot></slot>
        <div class="actions"><slot name="actions"></slot></div>
      </div>

      ${
        this.dismissible
          ? html`<button
              part="close"
              class="close"
              aria-label="Dismiss"
              @click=${() => emit(this, 'kt-close')}
            >
              <kt-icon name="x" size="16"></kt-icon>
            </button>`
          : nothing
      }
    </div>`;
  }
}

defineElement('kt-alert', KtAlert);

declare global {
  interface HTMLElementTagNameMap {
    'kt-alert': KtAlert;
  }
}
