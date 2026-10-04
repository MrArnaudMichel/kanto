import { css, html, nothing, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { blockHead, blockId, blockStyles } from '#internal/block';
import { hasAssignedContent } from '#internal/slots';
import '../../overlays/kt-accordion/kt-accordion.js';
import '../../overlays/kt-collapsible/kt-collapsible.js';

export interface KtFaqItem {
  readonly question: string;
  readonly answer: string;
}

export type KtFaqLayout = 'stacked' | 'split';

/**
 * The questions people ask before they sign up, answered: an accordion under a
 * heading, one answer open at a time.
 *
 * The questions are data: `faq.items = [{ question, answer }]`. `multiple`
 * lets each open on its own; `open-first` opens the first. `stacked` puts the
 * head over the questions; `split` beside them, where the block is wide
 * enough.
 *
 * @element kt-faq
 *
 * @slot note - Under the head: where to ask what is not answered.
 *
 * @csspart base - The section.
 *
 * @example
 * ```html
 * <kt-faq heading="Questions" layout="split">
 *   <span slot="note">Something else? <a href="/contact">Ask us</a>.</span>
 * </kt-faq>
 * <script>
 *   faq.items = [{ question: 'Can I cancel any time?', answer: 'Yes, from Settings.' }];
 * </script>
 * ```
 */
export class KtFaq extends KtElement {
  static override styles = [
    KtElement.styles,
    blockStyles,
    css`
      .head {
        display: grid;
        gap: var(--gap-card);
        align-content: start;
      }
      :host([align='center']) .head {
        justify-items: center;
        text-align: center;
      }
      .note {
        color: var(--text-muted);
        font: var(--font-normal-regular);
      }
      .note.empty {
        display: none;
      }
      .questions {
        width: 100%;
        max-width: 760px;
        margin-inline: auto;
        text-align: start;
      }

      /* Split: the head at the start, held while the questions scroll. */
      @container (min-width: 880px) {
        :host([layout='split']) .block {
          grid-template-columns: minmax(0, 1fr) minmax(0, 1.6fr);
          align-items: start;
          gap: calc(var(--gap-card) * 3);
        }
        :host([layout='split']) .head {
          position: sticky;
          top: var(--kt-faq-sticky-top, 24px);
          justify-items: start;
          text-align: start;
        }
        :host([layout='split']) .block-head {
          justify-items: start;
          margin-inline: 0;
          text-align: start;
        }
        :host([layout='split']) .questions {
          max-width: none;
        }
      }
    `,
  ];

  @property({ type: String })
  heading = '';

  @property({ type: String })
  lead = '';

  /** `center` or `start`: the head, when stacked. */
  @property({ type: String, reflect: true })
  align: 'center' | 'start' = 'center';

  /** The questions and their answers, in order. */
  @property({ attribute: false })
  items: readonly KtFaqItem[] = [];

  /** Each answer opens and closes on its own, rather than one at a time. */
  @property({ type: Boolean, reflect: true })
  multiple = false;

  /** Opens the first answer. */
  @property({ type: Boolean, attribute: 'open-first' })
  openFirst = false;

  /** `stacked`: the head over the questions. `split`: beside them, where there is room. */
  @property({ type: String, reflect: true })
  layout: KtFaqLayout = 'stacked';

  /** The heading's level. */
  @property({ type: Number, attribute: 'heading-level' })
  headingLevel = 2;

  @state() private hasNote = false;

  private readonly headingId = blockId('kt-faq');

  override firstUpdated(): void {
    this.readNote();
  }

  private readNote(): void {
    this.hasNote = hasAssignedContent(this.shadowRoot?.querySelector('slot[name="note"]'));
  }

  override render(): TemplateResult {
    return html`<section
      part="base"
      class="block"
      aria-labelledby=${this.heading ? this.headingId : nothing}
    >
      <div class="head">
        ${blockHead({ title: this.heading, lead: this.lead, level: this.headingLevel, id: this.headingId })}
        <div class=${this.hasNote ? 'note' : 'note empty'}>
          <slot name="note" @slotchange=${this.readNote}></slot>
        </div>
      </div>
      <kt-accordion class="questions" ?multiple=${this.multiple}>
        ${this.items.map(
          (item, index) =>
            html`<kt-collapsible heading=${item.question} ?open=${this.openFirst && index === 0}
              >${item.answer}</kt-collapsible
            >`,
        )}
      </kt-accordion>
    </section>`;
  }
}

defineElement('kt-faq', KtFaq);

declare global {
  interface HTMLElementTagNameMap {
    'kt-faq': KtFaq;
  }
}
