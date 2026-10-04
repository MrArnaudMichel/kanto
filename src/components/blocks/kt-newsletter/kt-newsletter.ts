import { css, html, nothing, type TemplateResult } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { blockHead, blockId, blockStyles } from '#internal/block';
import { emit } from '#internal/events';
import { hasAssignedContent } from '#internal/slots';
import '../../core/kt-button/kt-button.js';
import '../../core/kt-icon/kt-icon.js';
import '../../forms/kt-input/kt-input.js';
import type { KtButton } from '../../core/kt-button/kt-button.js';

export type KtNewsletterVariant = 'panel' | 'plain';
export type KtNewsletterLayout = 'stacked' | 'inline';

/** What `kt-subscribe` carries: the address, and a way to wait for the sending. */
export interface KtSubscribeDetail {
  readonly email: string;
  /** Hand it the request: the button runs it; if it rejects, its message shows on the field. */
  readonly wait: (sending: Promise<unknown>) => void;
}

/** Every word the block says, in English until given others. */
export interface KtNewsletterTexts {
  readonly email: string;
  readonly placeholder: string;
  readonly subscribe: string;
  readonly invalid: string;
  readonly failed: string;
  readonly done: string;
}

const TEXTS: KtNewsletterTexts = {
  email: 'Email address',
  placeholder: 'you@example.com',
  subscribe: 'Subscribe',
  invalid: 'Enter an email address, like name@example.com.',
  failed: 'That did not go through. Try again in a moment.',
  done: 'You are in. Check your inbox to confirm.',
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Field = HTMLElement & { value: string; error: string };

/**
 * A way to hear from you again: a heading, a line, an email field and the
 * button that subscribes it.
 *
 * It checks the address before sending, then fires `kt-subscribe` with it and
 * `wait(promise)`: the button runs the request, and the block thanks the
 * reader once it resolves — or shows why not on the field. Without a wait it
 * thanks at once.
 *
 * @element kt-newsletter
 *
 * @slot note - Under the field: how often, and that unsubscribing is one click.
 *
 * @csspart base - The section.
 * @csspart panel - The panel.
 *
 * @fires kt-subscribe - An address was sent. `detail: { email, wait(promise) }`.
 *
 * @example
 * ```html
 * <kt-newsletter heading="Notes, monthly" lead="What we shipped, and what we learned.">
 *   <span slot="note">One email a month. Unsubscribe in one click.</span>
 * </kt-newsletter>
 * <script>
 *   letter.addEventListener('kt-subscribe', (e) => e.detail.wait(api.subscribe(e.detail.email)));
 * </script>
 * ```
 */
export class KtNewsletter extends KtElement {
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
        font: var(--font-title-h4);
        letter-spacing: -0.01em;
      }
      .block-lead {
        font-size: calc(16px * var(--text-scale, 1));
      }

      .tail {
        display: grid;
        gap: 10px;
        width: 100%;
        max-width: 460px;
        justify-items: inherit;
      }
      form {
        display: flex;
        gap: var(--gap-button);
        align-items: flex-start;
        width: 100%;
        text-align: start;
      }
      form kt-input {
        flex: 1;
        min-width: 0;
      }
      @container (max-width: 400px) {
        form {
          flex-direction: column;
          align-items: stretch;
        }
      }

      .done {
        display: flex;
        gap: 8px;
        align-items: center;
        color: var(--text-body);
        font: var(--font-normal-medium);
      }
      .done:empty {
        display: none;
      }
      .done kt-icon {
        color: var(--color-success-text);
      }

      .note {
        color: var(--text-muted);
        font: var(--font-normal-small);
      }
      .empty,
      [hidden] {
        display: none;
      }

      /* Inline: the words at the start, the field at the end, where they fit. */
      @container (min-width: 760px) {
        :host([layout='inline']) .panel {
          grid-template-columns: minmax(0, 1fr) minmax(0, 420px);
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
          justify-items: start;
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
  variant: KtNewsletterVariant = 'panel';

  /** `stacked`: the field under the words. `inline`: beside them, where there is room. */
  @property({ type: String, reflect: true })
  layout: KtNewsletterLayout = 'stacked';

  /** The address went through: the field gives way to the thanks. */
  @property({ type: Boolean, reflect: true })
  subscribed = false;

  /** The heading's level. */
  @property({ type: Number, attribute: 'heading-level' })
  headingLevel = 2;

  /** The words, English until given others. */
  @property({ attribute: false })
  texts: Partial<KtNewsletterTexts> = {};

  @state() private hasNote = false;

  @query('kt-input') private field!: Field;
  @query('kt-button') private button!: KtButton;

  private readonly headingId = blockId('kt-newsletter');

  private get t(): KtNewsletterTexts {
    return { ...TEXTS, ...this.texts };
  }

  override firstUpdated(): void {
    this.readNote();
  }

  private readNote(): void {
    this.hasNote = hasAssignedContent(this.shadowRoot?.querySelector('slot[name="note"]'));
  }

  /** Sends the address, as the button does, once it is one. */
  subscribe(): void {
    const email = (this.field.value ?? '').trim();
    if (!EMAIL.test(email)) {
      this.field.error = this.t.invalid;
      this.field.focus();
      return;
    }
    this.field.error = '';
    let sending: Promise<unknown> | null = null;
    emit<KtSubscribeDetail>(this, 'kt-subscribe', {
      email,
      wait: (promise) => {
        sending = promise;
      },
    });
    if (!sending) {
      this.subscribed = true;
      return;
    }
    const waited: Promise<unknown> = sending;
    void this.button
      .run(() => waited)
      .then(
        () => {
          this.subscribed = true;
        },
        (reason: unknown) => {
          this.field.error =
            reason instanceof Error && reason.message ? reason.message : this.t.failed;
        },
      );
  }

  private onSubmit(event: Event): void {
    event.preventDefault();
    this.subscribe();
  }

  /** Enter in the field sends, as in any form: the native field is inside the kt-input. */
  private onKeyDown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.isComposing) return;
    if ((event.composedPath()[0] as Element).localName !== 'input') return;
    event.preventDefault();
    this.subscribe();
  }

  override render(): TemplateResult {
    const t = this.t;
    return html`<section
      part="base"
      class="block"
      aria-labelledby=${this.heading ? this.headingId : nothing}
    >
      <div part="panel" class="panel">
        ${blockHead({ title: this.heading, lead: this.lead, level: this.headingLevel, id: this.headingId })}
        <div class="tail">
          <form
            novalidate
            ?hidden=${this.subscribed}
            @submit=${this.onSubmit}
            @keydown=${this.onKeyDown}
          >
            <kt-input
              name="email"
              type="email"
              autocomplete="email"
              label=${t.email}
              placeholder=${t.placeholder}
              @kt-input=${() => (this.field.error = '')}
            ></kt-input>
            <kt-button @click=${() => this.subscribe()}>${t.subscribe}</kt-button>
          </form>
          <p class="done" role="status">
            ${
              this.subscribed
                ? html`<kt-icon name="circle-check" size="18" aria-hidden="true"></kt-icon
                    >${t.done}`
                : nothing
            }
          </p>
          <div class=${this.hasNote ? 'note' : 'note empty'}>
            <slot name="note" @slotchange=${this.readNote}></slot>
          </div>
        </div>
      </div>
    </section>`;
  }
}

defineElement('kt-newsletter', KtNewsletter);

declare global {
  interface HTMLElementTagNameMap {
    'kt-newsletter': KtNewsletter;
  }
}
