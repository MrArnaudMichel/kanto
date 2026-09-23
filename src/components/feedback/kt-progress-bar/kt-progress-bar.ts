import { css, html, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { KtElement, defineElement } from '#internal/kt-element';

export type KtProgressVariant = 'primary' | 'info' | 'success' | 'warning' | 'danger' | 'neutral';
export type KtProgressSize = 'small' | 'medium' | 'large';

/**
 * A determinate progress bar.
 *
 * Reaching `max` switches the fill to the success colour, so "done" reads at a
 * glance without the caller having to swap the variant.
 *
 * @element kt-progress-bar
 *
 * @csspart track - The groove.
 * @csspart fill - The filled portion.
 * @csspart base - The container.
 * @csspart caption - The row above the bar.
 * @csspart value - The percentage, when `show-value` is set.
 *
 * @example
 * ```html
 * <kt-progress-bar value="64" show-value></kt-progress-bar>
 * <kt-progress-bar value="90" variant="warning" striped animated></kt-progress-bar>
 * ```
 */
export class KtProgressBar extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: block;
        width: 100%;
      }

      .bar {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      /* The caption sits above the track, not inside it. A label centred over
         an 8px bar is half on the fill and half off it, so it is unreadable at
         one end of the range whatever colour it is given — and at size="small"
         the track is 4px and clips it outright. Above the bar it reads in every
         theme, at every size, at every value. */
      .caption {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
      }

      .caption-label {
        overflow: hidden;
        color: var(--text-body);
        font: var(--font-normal-regular);
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      .caption-value {
        flex: none;
        color: var(--text-muted);
        font: var(--font-normal-small);
        font-variant-numeric: tabular-nums;
      }

      .complete .caption-value {
        color: var(--color-success-text);
      }

      .track {
        position: relative;
        height: 8px;
        overflow: hidden;
        background: var(--surface-raised);
        border-radius: var(--border-radius);
      }

      :host([size='small']) .track {
        height: 4px;
      }
      :host([size='large']) .track {
        height: 12px;
      }

      .fill {
        width: 0;
        height: 100%;
        background: var(--color-primary-base);
        transition: width 0.4s var(--easing-standard);
      }

      :host([variant='info']) .fill {
        background: var(--color-info-base);
      }
      :host([variant='success']) .fill {
        background: var(--color-success-base);
      }
      :host([variant='warning']) .fill {
        background: var(--color-warning-base);
      }
      :host([variant='danger']) .fill {
        background: var(--color-danger-base);
      }
      :host([variant='neutral']) .fill {
        background: var(--color-text-500);
      }

      /* Completion reads as success whatever the variant was. */
      .fill.complete {
        background: var(--color-success-base);
      }

      /* The one decorative animation in Kanto, and it earns its place: a
         striped bar is how an operation says it is still working. */
      .fill.striped {
        background-image: linear-gradient(
          45deg,
          rgba(255, 255, 255, 0.07) 25%,
          transparent 25%,
          transparent 50%,
          rgba(255, 255, 255, 0.07) 50%,
          rgba(255, 255, 255, 0.07) 75%,
          transparent 75%,
          transparent
        );
        background-size: 1rem 1rem;
      }

      .fill.striped.animated {
        animation: kt-progress-stripes 1s linear infinite;
      }

      @keyframes kt-progress-stripes {
        from {
          background-position: 0 0;
        }
        to {
          background-position: 1rem 0;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .fill {
          transition: none;
        }
        .fill.striped.animated {
          animation: none;
        }
      }
    `,
  ];

  @property({ type: Number })
  value = 0;

  @property({ type: Number })
  max = 100;

  @property({ type: String, reflect: true })
  size: KtProgressSize = 'medium';

  @property({ type: String, reflect: true })
  variant: KtProgressVariant = 'primary';

  /** Draws the percentage in a caption above the bar. */
  @property({ type: Boolean, attribute: 'show-value' })
  showValue = false;

  /**
   * Shows `label` above the bar as visible text, beside the value.
   *
   * `label` alone is the accessible name and stays invisible, which is right
   * when the surrounding copy already says what is progressing.
   */
  @property({ type: Boolean, attribute: 'show-label' })
  showLabel = false;

  @property({ type: Boolean, reflect: true })
  striped = false;

  /** Animates the stripes. Requires `striped`. */
  @property({ type: Boolean, reflect: true })
  animated = false;

  /** Accessible name — what is progressing. */
  @property({ type: String })
  label = '';

  /** The value as a whole percentage, clamped to 0–100. */
  get percent(): number {
    const max = this.max > 0 ? this.max : 100;
    const clamped = Math.min(Math.max(this.value, 0), max);
    return Math.round((clamped / max) * 100);
  }

  override render(): TemplateResult {
    const percent = this.percent;
    const complete = this.value >= (this.max > 0 ? this.max : 100);

    const caption = (this.showLabel && this.label) || this.showValue;

    return html`<div part="base" class=${classMap({ bar: true, complete })}>
      ${
        caption
          ? html`<div part="caption" class="caption">
              ${
                this.showLabel && this.label
                  ? html`<span class="caption-label">${this.label}</span>`
                  : html`<span></span>`
              }
              ${
                this.showValue
                  ? html`<span part="value" class="caption-value">${percent}%</span>`
                  : nothing
              }
            </div>`
          : nothing
      }

      <div
        part="track"
        class="track"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax=${this.max}
        aria-valuenow=${this.value}
        aria-valuetext=${`${percent}%`}
        aria-label=${this.label || nothing}
      >
        <div
          part="fill"
          class=${classMap({
            fill: true,
            complete,
            striped: this.striped,
            animated: this.animated,
          })}
          style=${styleMap({ width: `${percent}%` })}
        ></div>
      </div>
    </div>`;
  }
}

defineElement('kt-progress-bar', KtProgressBar);

declare global {
  interface HTMLElementTagNameMap {
    'kt-progress-bar': KtProgressBar;
  }
}
