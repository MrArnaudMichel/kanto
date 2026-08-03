import { css, html, nothing, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { KtElement, defineElement } from '../../../internal/kt-element.js';
import { emit } from '../../../internal/events.js';
import { hasAssignedContent } from '../../../internal/slots.js';

export type KtCardImagePosition = 'left' | 'right' | 'top' | 'bottom';

/**
 * A surface for a block of related content: 12px radius, a 1px border, 24px of
 * padding and a 20px internal gap.
 *
 * Set `clickable` to turn the whole card into a control. Unlike the div-with-a
 * -click-handler this replaces, a clickable card is reachable by keyboard,
 * announces itself as a button, and responds to Enter and Space.
 *
 * @element kt-card
 *
 * @slot - The card body.
 * @slot header - Above the body.
 * @slot footer - Below the body.
 * @slot media - Replaces the `image` attribute for anything that is not a
 *   plain `<img>` — a chart, a map, a video.
 *
 * @csspart base - The card container.
 * @csspart media - The image or media well.
 * @csspart body - The header/content/footer column.
 *
 * @fires kt-card-click - The card was activated, by pointer or keyboard.
 *   Only fired when `clickable` is set.
 */
export class KtCard extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: block;
        height: 100%;
      }

      .card {
        display: flex;
        flex-direction: column;
        height: 100%;
        padding: var(--padding-card);
        gap: var(--gap-card);
        color: var(--text-body);
        background-color: transparent;
        border: var(--border-width) solid var(--border-subtle);
        border-radius: var(--border-radius-card);
        /* Same reason as the fields: an outline-color with nothing to start
           from animates out of the text colour. */
        outline: var(--border-width) solid transparent;
        transition:
          background-color var(--duration-instant),
          border-color var(--duration-instant),
          outline-color var(--duration-instant);
      }

      .clickable {
        cursor: pointer;
      }
      .clickable:hover {
        background-color: var(--color-dark-14);
        border-color: var(--color-dark-24);
        outline: var(--border-width) solid var(--color-dark-24);
      }
      .clickable:active {
        background-color: var(--color-dark-15);
        border-color: var(--color-primary-base);
        outline: var(--border-width) solid var(--color-primary-base);
      }
      .clickable:focus-visible {
        outline: var(--outline-width) solid var(--color-primary-base);
        outline-offset: 2px;
      }

      .body {
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: var(--gap-card);
        min-width: 0;
      }

      .content {
        flex: 1;
      }

      .media {
        display: flex;
        flex: 0 0 auto;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }

      /* --media-size is set inline from the imageSize property; which axis it
         lands on is the position class's business, not the template's. */
      .image-left .media,
      .image-right .media {
        width: var(--media-size);
      }
      .image-top .media,
      .image-bottom .media {
        height: var(--media-size);
      }

      .media ::slotted(*),
      .media img {
        display: block;
        width: 100%;
        height: auto;
        object-fit: cover;
        border-radius: var(--border-radius);
      }

      /* Image position drives the flex direction of the card itself. */
      .image-left {
        flex-direction: row;
      }
      .image-right {
        flex-direction: row-reverse;
      }
      .image-top {
        flex-direction: column;
      }
      .image-bottom {
        flex-direction: column-reverse;
      }
      .image-top .media,
      .image-bottom .media {
        width: 100%;
      }

      /* Collapsed from JS, not from :has(): a wrapper around a <slot> always
         has one element child — the slot — so :has(*) matches even when
         nothing was assigned, and the rule never fired. */
      .header.empty,
      .footer.empty {
        display: none;
      }
    `,
  ];

  @state()
  private hasHeader = false;

  @state()
  private hasFooter = false;

  /** Makes the card a keyboard-reachable control. */
  @property({ type: Boolean, reflect: true })
  clickable = false;

  /** Convenience image. For anything richer, use the `media` slot. */
  @property({ type: String })
  image = '';

  /** Alternative text for `image`. Empty means decorative. */
  @property({ type: String, attribute: 'image-alt' })
  imageAlt = '';

  @property({ type: String, attribute: 'image-position' })
  imagePosition: KtCardImagePosition = 'left';

  /** Width (left/right) or height (top/bottom) of the media well. */
  @property({ type: String, attribute: 'image-size' })
  imageSize = '120px';

  /**
   * The initial `slotchange` is queued as a microtask and can land after the
   * first render has settled, so read the slots once directly as well.
   */
  override firstUpdated(): void {
    this.readSlots();
  }

  private readSlots(): void {
    const root = this.shadowRoot;
    this.hasHeader = hasAssignedContent(root?.querySelector('slot[name="header"]'));
    this.hasFooter = hasAssignedContent(root?.querySelector('slot[name="footer"]'));
  }

  private onSlotChange(): void {
    this.readSlots();
  }

  private activate(): void {
    if (this.clickable) emit(this, 'kt-card-click');
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (!this.clickable) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    // Space scrolls the page unless we claim it.
    event.preventDefault();
    this.activate();
  }

  override render(): TemplateResult {
    const hasMedia = Boolean(this.image) || this.querySelector('[slot="media"]') !== null;

    return html`<div
      part="base"
      class=${classMap({
        card: true,
        clickable: this.clickable,
        [`image-${this.imagePosition}`]: hasMedia,
      })}
      role=${this.clickable ? 'button' : nothing}
      tabindex=${this.clickable ? 0 : nothing}
      @click=${this.activate}
      @keydown=${this.onKeyDown}
    >
      ${
        hasMedia
          ? html`<div
              part="media"
              class="media"
              style=${styleMap({ '--media-size': this.imageSize })}
            >
              <slot name="media">
                ${this.image ? html`<img src=${this.image} alt=${this.imageAlt} />` : nothing}
              </slot>
            </div>`
          : nothing
      }
      <div part="body" class="body">
        <div class=${classMap({ header: true, empty: !this.hasHeader })}>
          <slot name="header" @slotchange=${this.onSlotChange}></slot>
        </div>
        <div class="content"><slot></slot></div>
        <div class=${classMap({ footer: true, empty: !this.hasFooter })}>
          <slot name="footer" @slotchange=${this.onSlotChange}></slot>
        </div>
      </div>
    </div>`;
  }
}

defineElement('kt-card', KtCard);

declare global {
  interface HTMLElementTagNameMap {
    'kt-card': KtCard;
  }
}
