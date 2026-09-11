import { css, html, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { KtElement, defineElement } from '#internal/kt-element';
import '../../core/kt-icon/kt-icon.js';
import '../../core/kt-badge/kt-badge.js';
import '../../feedback/kt-skeleton/kt-skeleton.js';

export type KtStatTrend = 'up' | 'down' | 'flat';

/**
 * One headline figure: a label, a value, and how it moved.
 *
 * Worth its own element because every dashboard rebuilds this tile, and every
 * rebuild makes the same two mistakes — the delta coloured by sign rather than
 * by meaning, and the label competing with the number.
 *
 * **The colour comes from `trend`, not from the sign.** Falling costs are good
 * news; rising churn is not. Pass `trend` to say which, and `inverted` when
 * down is the direction you want.
 *
 * @element kt-stat
 *
 * @slot - Extra content under the value — a sparkline, a caption.
 *
 * @csspart base - The tile.
 * @csspart value - The figure.
 *
 * @example
 * ```html
 * <kt-stat label="Revenue" value="$292,342" delta="-3%" trend="down"></kt-stat>
 * <kt-stat label="Customers" value="712" delta="+12%" trend="up" icon="users"></kt-stat>
 * ```
 */
export class KtStat extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: block;
      }

      .stat {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: var(--padding-card);
      }

      .head {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      /* A tinted disc rather than a bare glyph: at this size an icon on its
         own reads as noise beside the figure. */
      .icon {
        display: inline-flex;
        flex: none;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        color: var(--color-primary-base);
        background: var(--color-primary-soft);
        border-radius: var(--radius-full);
      }

      .label {
        color: var(--color-text-500);
        font: var(--font-title-overline);
        letter-spacing: var(--letter-spacing-overline);
        text-transform: uppercase;
      }

      .figure {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
      }

      .value {
        color: var(--text-body);
        font: var(--font-title-h1);
        font-variant-numeric: tabular-nums;
        line-height: 1.1;
      }

      :host([size='small']) .value {
        font: var(--font-title-h4);
      }

      .caption {
        color: var(--text-muted);
        font: var(--font-normal-small);
      }
    `,
  ];

  @property({ type: String })
  label = '';

  @property({ type: String })
  value = '';

  /** The movement, shown as a badge: `+12%`, `-3%`, `+2`. */
  @property({ type: String })
  delta = '';

  /**
   * What the movement means. Drives the badge colour.
   * `flat` — and the default — stay neutral.
   */
  @property({ type: String, reflect: true })
  trend: KtStatTrend = 'flat';

  /**
   * Down is the good direction here — churn, cost, latency.
   * Swaps which trend reads as success.
   */
  @property({ type: Boolean })
  inverted = false;

  /** Lucide icon name, kebab-case. */
  @property({ type: String })
  icon = '';

  /** Small print under the figure — "vs last month". */
  @property({ type: String })
  caption = '';

  @property({ type: String, reflect: true })
  size: 'small' | 'medium' = 'medium';

  @property({ type: Boolean, reflect: true })
  loading = false;

  private get deltaVariant(): 'success' | 'danger' | 'neutral' {
    if (this.trend === 'flat') return 'neutral';
    const good = this.inverted ? 'down' : 'up';
    return this.trend === good ? 'success' : 'danger';
  }

  override render(): TemplateResult {
    return html`<div part="base" class="stat">
      <div class="head">
        ${
          this.icon
            ? html`<span class="icon"><kt-icon name=${this.icon} size="18"></kt-icon></span>`
            : nothing
        }
        <span class="label">${this.label}</span>
      </div>

      ${
        this.loading
          ? html`<kt-skeleton variant="rect" height="38px" width="60%"></kt-skeleton>`
          : html`<div class="figure">
              <span part="value" class="value">${this.value}</span>
              ${
                this.delta
                  ? html`<kt-badge variant="count" tone=${this.deltaVariant}
                      >${this.delta}</kt-badge
                    >`
                  : nothing
              }
            </div>`
      }
      ${this.caption ? html`<span class="caption">${this.caption}</span>` : nothing}
      <slot></slot>
    </div>`;
  }
}

defineElement('kt-stat', KtStat);

declare global {
  interface HTMLElementTagNameMap {
    'kt-stat': KtStat;
  }
}
