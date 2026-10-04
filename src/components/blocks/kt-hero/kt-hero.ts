import { css, html, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { blockHead, blockId, blockStyles } from '#internal/block';
import { hasAssignedContent } from '#internal/slots';

export type KtHeroLayout = 'stacked' | 'split';

/**
 * The top of a page: what the product is, in a heading and a line, and the
 * way in.
 *
 * `stacked`, the default, puts the media under the words — a screenshot, a
 * live demo; `split` sets it beside them once the hero is wide enough.
 * `align` centres the words or keeps them at the start.
 *
 * @element kt-hero
 *
 * @slot announcement - Above the heading: what is new, as a link.
 * @slot actions - Under the lead: the buttons.
 * @slot note - Under the actions: what it costs, what it needs.
 * @slot media - A screenshot, an illustration, a live demo.
 *
 * @csspart base - The section.
 * @csspart media - The media's box.
 *
 * @example
 * ```html
 * <kt-hero heading="Invoices that pay themselves" lead="Send, chase and reconcile, in one place.">
 *   <kt-button slot="actions" size="large">Start free</kt-button>
 *   <img slot="media" src="/screenshot.png" alt="The invoices screen" />
 * </kt-hero>
 * ```
 */
export class KtHero extends KtElement {
  static override styles = [
    KtElement.styles,
    blockStyles,
    css`
      .hero {
        display: grid;
        gap: calc(var(--gap-card) * 2.5);
        padding-block: var(--kt-block-padding, calc(var(--padding-card) * 4));
      }

      .words {
        display: grid;
        gap: var(--gap-card);
      }
      :host([align='center']) .words {
        justify-items: center;
        text-align: center;
      }
      .block-head {
        max-width: 820px;
      }
      .block-heading {
        font: 600 clamp(36px, 6cqi, 72px) / 1.04 var(--font-family-display);
        letter-spacing: -0.035em;
      }
      .block-lead {
        font-size: calc(19px * var(--text-scale, 1));
      }

      .actions,
      .announcement {
        display: flex;
        flex-wrap: wrap;
        gap: var(--gap-button);
        align-items: center;
      }
      :host([align='center']) .actions {
        justify-content: center;
      }
      .note {
        color: var(--text-muted);
        font: var(--font-normal-regular);
      }
      .empty {
        display: none;
      }

      .media {
        min-width: 0;
      }
      .media ::slotted(img) {
        display: block;
        max-width: 100%;
        height: auto;
        border-radius: var(--border-radius-card);
      }

      /* Split: the words and the media side by side, where they fit. */
      @container (min-width: 880px) {
        :host([layout='split']) .hero {
          grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
          align-items: center;
        }
        :host([layout='split']) .words {
          justify-items: start;
          text-align: start;
        }
        :host([layout='split']) .actions {
          justify-content: flex-start;
        }
      }
    `,
  ];

  @property({ type: String })
  heading = '';

  @property({ type: String })
  lead = '';

  /** `center` or `start`. */
  @property({ type: String, reflect: true })
  align: 'center' | 'start' = 'center';

  /** `stacked`: the media under the words. `split`: beside them, where there is room. */
  @property({ type: String, reflect: true })
  layout: KtHeroLayout = 'stacked';

  /** The heading's level: 1, since a hero opens its page. */
  @property({ type: Number, attribute: 'heading-level' })
  headingLevel = 1;

  @state() private filled = new Set<string>();

  private readonly headingId = blockId('kt-hero');

  override firstUpdated(): void {
    this.readSlots();
  }

  private readSlots = (): void => {
    const filled = new Set<string>();
    for (const slot of this.shadowRoot?.querySelectorAll('slot') ?? []) {
      if (hasAssignedContent(slot)) filled.add(slot.name);
    }
    this.filled = filled;
  };

  private region(name: string, className = name): TemplateResult {
    return html`<div class=${this.filled.has(name) ? className : `${className} empty`}>
      <slot name=${name} @slotchange=${this.readSlots}></slot>
    </div>`;
  }

  override render(): TemplateResult {
    return html`<section part="base" class="hero" aria-labelledby=${this.headingId}>
      <div class="words">
        ${this.region('announcement')}
        ${blockHead({ title: this.heading, lead: this.lead, level: this.headingLevel, id: this.headingId })}
        ${this.region('actions')} ${this.region('note')}
      </div>
      <div part="media" class=${this.filled.has('media') ? 'media' : 'media empty'}>
        <slot name="media" @slotchange=${this.readSlots}></slot>
      </div>
    </section>`;
  }
}

defineElement('kt-hero', KtHero);

declare global {
  interface HTMLElementTagNameMap {
    'kt-hero': KtHero;
  }
}
