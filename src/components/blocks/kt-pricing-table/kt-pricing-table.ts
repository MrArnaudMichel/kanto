import { css, html, nothing, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { blockHead, blockId, blockStyles } from '#internal/block';
import { emit } from '#internal/events';
import { heading } from '#internal/heading';
import { hasAssignedContent } from '#internal/slots';
import '../../core/kt-badge/kt-badge.js';
import '../../core/kt-button/kt-button.js';
import '../../core/kt-icon/kt-icon.js';
import '../../navigation/kt-segmented-control/kt-segmented-control.js';

export type KtBilling = 'monthly' | 'yearly';

/** A number is formatted in `currency`; a string, "Custom", is shown as written. */
export type KtPlanPrice = number | string;

export interface KtPlan {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  /** One price, or one per billing period — which shows the switch. */
  readonly price: KtPlanPrice | { readonly monthly: KtPlanPrice; readonly yearly: KtPlanPrice };
  /** What the plan includes, a line each. */
  readonly features: readonly string[];
  /** The button's words. Get started until given others. */
  readonly action?: string;
  /** Makes the button a link. Without it, the button fires `kt-plan`. */
  readonly href?: string;
  /** The plan to pick: raised, and badged. */
  readonly featured?: boolean;
}

/** Every word the table says, in English until given others. */
export interface KtPricingTableTexts {
  readonly monthly: string;
  readonly yearly: string;
  readonly billing: string;
  readonly perMonth: string;
  readonly perYear: string;
  readonly featured: string;
  readonly action: string;
}

const TEXTS: KtPricingTableTexts = {
  monthly: 'Monthly',
  yearly: 'Yearly',
  billing: 'Billing period',
  perMonth: '/month',
  perYear: '/year',
  featured: 'Most popular',
  action: 'Get started',
};

/**
 * The plans, side by side: what each costs, what it includes, and the way in —
 * with a switch between monthly and yearly prices when the plans have both.
 *
 * The plans are data: `table.plans = [{ id, name, price, features }]`. A price
 * that is a number is formatted in `currency`; a string is shown as written. A
 * plan's button fires `kt-plan`, or is a link with an `href`.
 *
 * @element kt-pricing-table
 *
 * @slot note - Under the plans: taxes, a link to compare every feature.
 *
 * @csspart base - The section.
 * @csspart plan - One plan.
 *
 * @fires kt-billing - The billing period changed. `detail: { billing }`.
 * @fires kt-plan - A plan's button was pressed. `detail: { id, billing }`.
 *
 * @example
 * ```html
 * <kt-pricing-table heading="Pricing" currency="EUR" yearly-note="2 months free"></kt-pricing-table>
 * <script>
 *   table.plans = [
 *     { id: 'team', name: 'Team', price: { monthly: 29, yearly: 290 }, features: ['Unlimited invoices'] },
 *   ];
 * </script>
 * ```
 */
export class KtPricingTable extends KtElement {
  static override styles = [
    KtElement.styles,
    blockStyles,
    css`
      .switch {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: center;
      }
      :host([align='center']) .switch {
        justify-content: center;
      }
      .saving {
        color: var(--color-primary-text);
        font: var(--font-normal-small);
      }

      .plans {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
        gap: var(--gap-card);
        align-items: stretch;
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .plan {
        display: flex;
        flex-direction: column;
        gap: var(--gap-card);
        min-width: 0;
        text-align: start;
        padding: calc(var(--padding-card) * 1.25);
        border: var(--border-width) solid var(--border-subtle);
        border-radius: var(--border-radius-card);
      }
      .plan.featured {
        border-color: var(--color-primary-base);
        box-shadow: 0 0 0 1px var(--color-primary-base);
      }

      .plan-head {
        display: grid;
        gap: 6px;
      }
      .name-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        justify-content: space-between;
        min-height: 28px;
      }
      .plan-name {
        margin: 0;
        color: var(--text-body);
        font: var(--font-title-h6);
      }
      .plan-description {
        margin: 0;
        color: var(--text-muted);
        font: var(--font-normal-regular);
      }

      .price {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        align-items: baseline;
        margin: 0;
      }
      .amount {
        color: var(--text-body);
        font: 600 40px / 1.1 var(--font-family-display);
        font-variant-numeric: tabular-nums;
        letter-spacing: -0.03em;
      }
      .period {
        color: var(--text-muted);
        font: var(--font-normal-regular);
      }

      .action {
        width: 100%;
      }
      a.action {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: var(--button-height);
        padding: 0 var(--button-padding-x);
        color: var(--color-primary-text);
        font: var(--font-normal-regular);
        text-decoration: none;
        background-color: var(--color-primary-soft);
        border-radius: var(--border-radius);
        transition: background-color var(--duration-instant);
      }
      a.action:hover {
        background-color: var(--color-secondary-hover);
      }
      .featured a.action {
        color: var(--color-white);
        background-color: var(--color-primary-base);
      }
      .featured a.action:hover {
        background-color: var(--color-primary-hover);
      }
      a.action:focus-visible {
        outline: var(--outline-width) solid var(--color-primary-base);
        outline-offset: 2px;
      }

      .features {
        display: grid;
        gap: 10px;
        margin: 0;
        padding: var(--gap-card) 0 0;
        color: var(--text-body);
        font: var(--font-normal-regular);
        list-style: none;
        border-top: var(--border-width) solid var(--border-subtle);
      }
      .features li {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 10px;
        align-items: start;
      }
      .features kt-icon {
        margin-top: 2px;
        color: var(--color-primary-text);
      }

      .note {
        color: var(--text-muted);
        font: var(--font-normal-small);
      }
      :host([align='center']) .note {
        text-align: center;
      }
      .note.empty {
        display: none;
      }
    `,
  ];

  @property({ type: String })
  heading = '';

  @property({ type: String })
  lead = '';

  /** `center` or `start`: the head and the switch. */
  @property({ type: String, reflect: true })
  align: 'center' | 'start' = 'center';

  /** The plans, in order. */
  @property({ attribute: false })
  plans: readonly KtPlan[] = [];

  /** The prices shown: `monthly` or `yearly`. */
  @property({ type: String, reflect: true })
  billing: KtBilling = 'monthly';

  /** The currency numeric prices are in: an ISO code, USD until given another. */
  @property({ type: String })
  currency = 'USD';

  /** The locale prices are formatted in; the page's language when empty. */
  @property({ type: String })
  locale = '';

  /** Beside the switch: what paying yearly saves — "2 months free". */
  @property({ type: String, attribute: 'yearly-note' })
  yearlyNote = '';

  /** The heading's level; the plans' names sit one under. */
  @property({ type: Number, attribute: 'heading-level' })
  headingLevel = 2;

  /** The words, English until given others. */
  @property({ attribute: false })
  texts: Partial<KtPricingTableTexts> = {};

  @state() private hasNote = false;

  private readonly headingId = blockId('kt-pricing-table');

  override firstUpdated(): void {
    this.readNote();
  }

  private readNote(): void {
    this.hasNote = hasAssignedContent(this.shadowRoot?.querySelector('slot[name="note"]'));
  }

  private get words(): KtPricingTableTexts {
    return { ...TEXTS, ...this.texts };
  }

  private format(price: KtPlanPrice): string {
    if (typeof price === 'string') return price;
    const whole = Number.isInteger(price);
    return new Intl.NumberFormat(this.locale || document.documentElement.lang || undefined, {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: whole ? 0 : 2,
    }).format(price);
  }

  private choose(plan: KtPlan): void {
    emit(this, 'kt-plan', { id: plan.id, billing: this.billing });
  }

  private onBilling(event: CustomEvent<{ value: string }>): void {
    event.stopPropagation();
    const billing: KtBilling = event.detail.value === 'yearly' ? 'yearly' : 'monthly';
    if (billing === this.billing) return;
    this.billing = billing;
    emit(this, 'kt-billing', { billing });
  }

  private price(plan: KtPlan): TemplateResult {
    const t = this.words;
    const both = typeof plan.price === 'object';
    const price = typeof plan.price === 'object' ? plan.price[this.billing] : plan.price;
    const period =
      typeof price === 'number' ? (both && this.billing === 'yearly' ? t.perYear : t.perMonth) : '';
    return html`<p class="price">
      <span class="amount">${this.format(price)}</span>
      ${period ? html`<span class="period">${period}</span>` : nothing}
    </p>`;
  }

  private plan(plan: KtPlan): TemplateResult {
    const t = this.words;
    const label = plan.action || t.action;
    return html`<li part="plan" class=${plan.featured ? 'plan featured' : 'plan'}>
      <div class="plan-head">
        <div class="name-row">
          ${heading(this.headingLevel + 1, plan.name, 'plan-name', 3)}
          ${
            plan.featured
              ? html`<kt-badge class="badge" tone="primary" size="small">${t.featured}</kt-badge>`
              : nothing
          }
        </div>
        ${plan.description ? html`<p class="plan-description">${plan.description}</p>` : nothing}
      </div>
      ${this.price(plan)}
      ${
        plan.href
          ? html`<a class="action" href=${plan.href}>${label}</a>`
          : html`<kt-button
              class="action"
              variant=${plan.featured ? 'primary' : 'secondary'}
              @click=${() => this.choose(plan)}
              >${label}</kt-button
            >`
      }
      ${
        plan.features.length
          ? html`<ul class="features" role="list">
              ${plan.features.map(
                (feature) =>
                  html`<li>
                    <kt-icon name="check" size="16" aria-hidden="true"></kt-icon
                    ><span>${feature}</span>
                  </li>`,
              )}
            </ul>`
          : nothing
      }
    </li>`;
  }

  override render(): TemplateResult {
    const t = this.words;
    const both = this.plans.some((plan) => typeof plan.price === 'object');
    return html`<section
      part="base"
      class="block"
      aria-labelledby=${this.heading ? this.headingId : nothing}
    >
      ${blockHead({ title: this.heading, lead: this.lead, level: this.headingLevel, id: this.headingId })}
      ${
        both
          ? html`<div class="switch">
              <kt-segmented-control
                label=${t.billing}
                .options=${[
                  { value: 'monthly', label: t.monthly },
                  { value: 'yearly', label: t.yearly },
                ]}
                .value=${this.billing}
                @kt-change=${this.onBilling}
              ></kt-segmented-control>
              ${this.yearlyNote ? html`<span class="saving">${this.yearlyNote}</span>` : nothing}
            </div>`
          : nothing
      }
      <ul class="plans" role="list">
        ${this.plans.map((plan) => this.plan(plan))}
      </ul>
      <div class=${this.hasNote ? 'note' : 'note empty'}>
        <slot name="note" @slotchange=${this.readNote}></slot>
      </div>
    </section>`;
  }
}

defineElement('kt-pricing-table', KtPricingTable);

declare global {
  interface HTMLElementTagNameMap {
    'kt-pricing-table': KtPricingTable;
  }
}
