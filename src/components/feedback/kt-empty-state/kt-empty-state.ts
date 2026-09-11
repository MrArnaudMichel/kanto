import { css, html, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { KtElement, defineElement } from 'kanto-ds/internal/kt-element';
import '../../core/kt-icon/kt-icon.js';

/**
 * What a screen shows when it has nothing to show.
 *
 * Worth a component because the empty case is where products are usually
 * thinnest, and where they most need to say what to do next. An icon, a
 * sentence and an action beat a blank panel every time.
 *
 * @element kt-empty-state
 *
 * @slot - Extra content between the description and the actions.
 * @slot actions - Buttons.
 *
 * @csspart base - The container.
 *
 * @example
 * ```html
 * <kt-empty-state icon="inbox" heading="Nothing here"
 *                 description="New messages will appear in this list.">
 *   <kt-button slot="actions" icon="plus">Compose</kt-button>
 * </kt-empty-state>
 * ```
 */
export class KtEmptyState extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: block;
      }

      .empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--gap-button);
        padding: 48px 24px;
        text-align: center;
      }

      :host([compact]) .empty {
        padding: 24px 16px;
      }

      .icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        margin-bottom: 4px;
        color: var(--text-muted);
        background: var(--surface-raised);
        border-radius: var(--radius-full);
      }

      .heading {
        color: var(--text-body);
        font: var(--font-title-h6);
      }

      .description {
        max-width: 42ch;
        color: var(--text-muted);
        font: var(--font-normal-regular);
        line-height: 1.6;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: var(--gap-button);
        margin-top: 8px;
      }

      .actions:not(:has(*)) {
        display: none;
      }
    `,
  ];

  /** Lucide icon name, kebab-case. */
  @property({ type: String })
  icon = 'inbox';

  @property({ type: String })
  heading = '';

  @property({ type: String })
  description = '';

  /** Tighter padding, for an empty state inside a card or a panel. */
  @property({ type: Boolean, reflect: true })
  compact = false;

  override render(): TemplateResult {
    return html`<div part="base" class="empty">
      ${
        this.icon
          ? html`<span class="icon"><kt-icon name=${this.icon} size="22"></kt-icon></span>`
          : nothing
      }
      ${this.heading ? html`<span class="heading">${this.heading}</span>` : nothing}
      ${this.description ? html`<p class="description">${this.description}</p>` : nothing}
      <slot></slot>
      <div class="actions"><slot name="actions"></slot></div>
    </div>`;
  }
}

defineElement('kt-empty-state', KtEmptyState);

declare global {
  interface HTMLElementTagNameMap {
    'kt-empty-state': KtEmptyState;
  }
}
