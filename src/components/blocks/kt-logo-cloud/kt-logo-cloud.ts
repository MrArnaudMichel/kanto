import { css, html, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { blockId, blockStyles } from '#internal/block';
import { heading } from '#internal/heading';

/**
 * Who uses it, in their logos: a line of marks under a caption — "Trusted by
 * finance teams at".
 *
 * The logos are the default slot: images or inline SVGs, each with its
 * company's name as `alt` or `aria-label`. They are drawn at one height, grey
 * until hovered, so no brand shouts over another; `colour` keeps their
 * colours.
 *
 * @element kt-logo-cloud
 *
 * @slot - The logos.
 *
 * @csspart base - The section.
 * @csspart logos - The row of logos.
 *
 * @cssproperty --kt-logo-height - The logos' height. 28px.
 *
 * @example
 * ```html
 * <kt-logo-cloud heading="Trusted by finance teams at">
 *   <img src="/logos/northwind.svg" alt="Northwind" />
 *   <img src="/logos/kiln.svg" alt="Kiln" />
 * </kt-logo-cloud>
 * ```
 */
export class KtLogoCloud extends KtElement {
  static override styles = [
    KtElement.styles,
    blockStyles,
    css`
      :host {
        --kt-logo-height: 28px;
      }
      .block {
        gap: calc(var(--gap-card) * 1.5);
      }

      .caption {
        margin: 0;
        color: var(--text-muted);
        font: var(--font-normal-regular);
        text-align: center;
        text-wrap: balance;
      }
      :host([align='start']) .caption {
        text-align: start;
      }

      .logos {
        display: flex;
        flex-wrap: wrap;
        gap: calc(var(--gap-card) * 1.5) calc(var(--gap-card) * 3);
        align-items: center;
        justify-content: center;
      }
      :host([align='start']) .logos {
        justify-content: flex-start;
      }
      ::slotted(*) {
        display: block;
        width: auto;
        max-width: 160px;
        height: var(--kt-logo-height);
        color: var(--text-muted);
        filter: grayscale(1);
        opacity: 0.72;
        transition:
          filter var(--duration-instant),
          opacity var(--duration-instant);
      }
      ::slotted(*:hover) {
        filter: none;
        opacity: 1;
      }
      :host([colour]) ::slotted(*) {
        filter: none;
        opacity: 1;
      }
    `,
  ];

  /** The caption over the logos: "Trusted by finance teams at". */
  @property({ type: String })
  heading = '';

  /** `center` or `start`. */
  @property({ type: String, reflect: true })
  align: 'center' | 'start' = 'center';

  /** Keeps the logos' colours, rather than grey until hovered. */
  @property({ type: Boolean, reflect: true })
  colour = false;

  /** The caption's level: a heading, set small. */
  @property({ type: Number, attribute: 'heading-level' })
  headingLevel = 2;

  private readonly headingId = blockId('kt-logo-cloud');

  override render(): TemplateResult {
    return html`<section
      part="base"
      class="block"
      aria-labelledby=${this.heading ? this.headingId : nothing}
    >
      ${
        this.heading
          ? html`<div id=${this.headingId}>
              ${heading(this.headingLevel, this.heading, 'caption', 2)}
            </div>`
          : nothing
      }
      <div part="logos" class="logos"><slot></slot></div>
    </section>`;
  }
}

defineElement('kt-logo-cloud', KtLogoCloud);

declare global {
  interface HTMLElementTagNameMap {
    'kt-logo-cloud': KtLogoCloud;
  }
}
