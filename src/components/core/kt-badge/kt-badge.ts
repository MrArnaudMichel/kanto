import { css, html, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { KtElement, defineElement } from '../../../internal/kt-element.js';

export type KtBadgeVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

/**
 * A small count or delta.
 *
 * Against `<kt-chip>`: a chip labels a thing — a status, a category, a tag —
 * and can be a control. A badge is a *number* attached to something else: the
 * four unread in a mailbox, the −2% under a figure. It is never interactive and
 * never the only place that information appears.
 *
 * @element kt-badge
 *
 * @slot - The content. Falls back to `value`.
 *
 * @csspart base - The badge.
 *
 * @example
 * ```html
 * <kt-badge>4</kt-badge>
 * <kt-badge variant="danger">-2%</kt-badge>
 * <kt-badge variant="success" value="+12%"></kt-badge>
 * ```
 */
export class KtBadge extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: inline-flex;
        vertical-align: middle;
      }

      .badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 20px;
        padding: 2px 6px;
        color: var(--text-muted);
        font: var(--font-normal-small);
        font-variant-numeric: tabular-nums;
        line-height: 1.4;
        white-space: nowrap;
        background: var(--surface-raised);
        border-radius: 5px;
      }

      :host([pill]) .badge {
        border-radius: var(--radius-full);
      }

      .primary {
        color: var(--color-primary-base);
        background: var(--color-primary-soft);
      }
      .success {
        color: var(--color-success-base);
        background: var(--color-success-soft);
      }
      .warning {
        color: var(--color-warning-base);
        background: var(--color-warning-soft);
      }
      .danger {
        color: var(--color-danger-base);
        background: var(--color-danger-soft);
      }
      .info {
        color: var(--color-info-base);
        background: var(--color-info-soft);
      }
    `,
  ];

  @property({ type: String, reflect: true })
  variant: KtBadgeVariant = 'neutral';

  /** Content, when nothing is slotted. */
  @property({ type: String })
  value = '';

  /** Fully rounded, for counts. */
  @property({ type: Boolean, reflect: true })
  pill = false;

  /**
   * Caps the displayed number: `max="99"` shows `99+`.
   * Ignored when the content is not a number.
   */
  @property({ type: Number })
  max?: number;

  private get display(): string {
    const raw = this.value || (this.textContent ?? '').trim();
    if (this.max === undefined) return raw;

    const n = Number(raw);
    return Number.isFinite(n) && n > this.max ? `${this.max}+` : raw;
  }

  override render(): TemplateResult {
    return html`<span part="base" class=${classMap({ badge: true, [this.variant]: true })}>
      ${this.max === undefined ? html`<slot>${this.value}</slot>` : this.display}
    </span>`;
  }
}

defineElement('kt-badge', KtBadge);

declare global {
  interface HTMLElementTagNameMap {
    'kt-badge': KtBadge;
  }
}
