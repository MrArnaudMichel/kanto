import { css, html, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { KtElement, defineElement } from 'kanto/internal/kt-element';

export type KtSkeletonVariant = 'text' | 'rect' | 'circle';

/** Default height per variant, when none is given. */
const HEIGHT: Record<KtSkeletonVariant, string> = {
  text: '14px',
  rect: '80px',
  circle: '40px',
};

/**
 * A loading placeholder, pulsing between two steps of the surface ramp.
 *
 * With `count` above one, the last line is drawn short — the shape a paragraph
 * actually has, which is what makes a skeleton read as text rather than as
 * stacked bars.
 *
 * The whole thing is `aria-hidden`: it is a picture of content that is not
 * there yet. Announce loading state on the region that owns it, with
 * `aria-busy`.
 *
 * @element kt-skeleton
 *
 * @csspart line - One placeholder line.
 *
 * @example
 * ```html
 * <kt-skeleton count="3"></kt-skeleton>
 * <kt-skeleton variant="circle" width="48px" height="48px"></kt-skeleton>
 * ```
 */
export class KtSkeleton extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: block;
      }

      .group {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .line {
        display: block;
        background: var(--surface-raised);
        border-radius: var(--border-radius);
      }

      .text {
        border-radius: 4px;
      }

      .circle {
        border-radius: var(--radius-full);
      }

      .pulse {
        animation: kt-skeleton-pulse 1.4s var(--easing-standard) infinite;
      }

      @keyframes kt-skeleton-pulse {
        0%,
        100% {
          background: var(--surface-raised);
        }
        50% {
          background: var(--surface-hover);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .pulse {
          animation: none;
        }
      }
    `,
  ];

  @property({ type: String, reflect: true })
  variant: KtSkeletonVariant = 'text';

  /** Any CSS length. Defaults to the full width, or 40px for a circle. */
  @property({ type: String })
  width = '';

  /** Any CSS length. Defaults to the variant's natural height. */
  @property({ type: String })
  height = '';

  /** How many lines to draw. Above one, the last is shortened. */
  @property({ type: Number })
  count = 1;

  @property({ type: Boolean })
  animated = true;

  private line(index: number, last: boolean): TemplateResult {
    const shortened = last && this.count > 1 && this.variant === 'text';

    return html`<span
      part="line"
      class=${classMap({
        line: true,
        [this.variant]: true,
        pulse: this.animated,
      })}
      style=${styleMap({
        width: shortened ? '60%' : this.width || (this.variant === 'circle' ? '40px' : '100%'),
        height: this.height || HEIGHT[this.variant],
      })}
      data-index=${index}
    ></span>`;
  }

  override render(): TemplateResult {
    if (this.count <= 1) return this.line(0, false);

    return html`<span class="group">
      ${Array.from({ length: this.count }, (_, index) =>
        this.line(index, index === this.count - 1),
      )}
    </span>`;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // A skeleton is a picture of absent content: there is nothing here to
    // announce, and reading out a dozen empty boxes is worse than silence.
    this.setAttribute('aria-hidden', 'true');
  }
}

defineElement('kt-skeleton', KtSkeleton);

declare global {
  interface HTMLElementTagNameMap {
    'kt-skeleton': KtSkeleton;
  }
}
