import { css, html, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { blockHead, blockId, blockStyles } from '#internal/block';
import { hasAssignedContent } from '#internal/slots';

export type KtCtaVariant = 'panel' | 'plain';
export type KtCtaLayout = 'stacked' | 'inline';

/**
 * The ask at the end of a page: a heading, a line and the button that acts on
 * them.
 *
 * `panel`, the default, sets it on a tinted panel so it reads as the page's
 * last word; `plain` leaves it on the page. `stacked` puts the actions under
 * the words; `inline` beside them once the block is wide enough.
 *
 * @element kt-cta
 *
 * @slot actions - The buttons.
 * @slot note - Under the actions: what it costs, what it needs.
 *
 * @csspart base - The section.
 * @csspart panel - The panel.
 *
 * @example
 * ```html
 * <kt-cta heading="Start sending invoices" lead="Free for three months. No card needed.">
 *   <kt-button slot="actions" size="large">Start free</kt-button>
 * </kt-cta>
 * ```
 */
export class KtCta extends KtElement {
  static override styles = [
    KtElement.styles,
    blockStyles,
    css`
      .panel {
        display: grid;
        gap: calc(var(--gap-card) * 1.5);
        justify-items: start;
      }
      :host([align='center']) .panel {
        justify-items: center;
        text-align: center;
      }
      :host([variant='panel']) .panel {
        padding: calc(var(--padding-card) * 2);
        background-color: var(--color-primary-soft);
        border: var(--border-width) solid var(--border-subtle);
        border-radius: var(--border-radius-card);
      }
      .block-heading {
        font: 600 clamp(28px, 4cqi, 44px) / 1.1 var(--font-family-display);
        letter-spacing: -0.03em;
      }

      .tail {
        display: grid;
        gap: 12px;
        justify-items: inherit;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--gap-button);
        align-items: center;
      }
      .note {
        color: var(--text-muted);
        font: var(--font-normal-small);
      }
      .empty {
        display: none;
      }

      /* Inline: the words at the start, the actions at the end, where they fit. */
      @container (min-width: 720px) {
        :host([layout='inline']) .panel {
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          justify-items: stretch;
          text-align: start;
        }
        :host([layout='inline']) .block-head {
          justify-items: start;
          margin-inline: 0;
          text-align: start;
        }
        :host([layout='inline']) .tail {
          justify-items: end;
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

  /** `panel`: on a tinted panel. `plain`: on the page. */
  @property({ type: String, reflect: true })
  variant: KtCtaVariant = 'panel';

  /** `stacked`: the actions under the words. `inline`: beside them, where there is room. */
  @property({ type: String, reflect: true })
  layout: KtCtaLayout = 'stacked';

  /** The heading's level. */
  @property({ type: Number, attribute: 'heading-level' })
  headingLevel = 2;

  @state() private filled = new Set<string>();

  private readonly headingId = blockId('kt-cta');

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

  private region(name: string): TemplateResult {
    return html`<div class=${this.filled.has(name) ? name : `${name} empty`}>
      <slot name=${name} @slotchange=${this.readSlots}></slot>
    </div>`;
  }

  override render(): TemplateResult {
    return html`<section part="base" class="block" aria-labelledby=${this.headingId}>
      <div part="panel" class="panel">
        ${blockHead({ title: this.heading, lead: this.lead, level: this.headingLevel, id: this.headingId })}
        <div class="tail">${this.region('actions')} ${this.region('note')}</div>
      </div>
    </section>`;
  }
}

defineElement('kt-cta', KtCta);

declare global {
  interface HTMLElementTagNameMap {
    'kt-cta': KtCta;
  }
}
