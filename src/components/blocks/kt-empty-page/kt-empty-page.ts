import { css, html, nothing, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { blockHead, blockId, blockStyles } from '#internal/block';
import { emit } from '#internal/events';
import { heading } from '#internal/heading';
import { hasAssignedContent } from '#internal/slots';
import '../../core/kt-button/kt-button.js';
import '../../core/kt-icon/kt-icon.js';
import '../../feedback/kt-progress-bar/kt-progress-bar.js';

export interface KtFirstStep {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  /** The button's words: what doing the step starts. */
  readonly action?: string;
  /** Makes the action a link. Without it, the action fires `kt-step`. */
  readonly href?: string;
  readonly done?: boolean;
}

/** Every word the page says, in English until given others. */
export interface KtEmptyPageTexts {
  readonly progress: (done: number, total: number) => string;
  /** Read before a done step's title, for assistive tech. */
  readonly done: string;
  readonly start: string;
}

const TEXTS: KtEmptyPageTexts = {
  progress: (done, total) => `${done} of ${total} done`,
  done: 'Done:',
  start: 'Start',
};

/**
 * The page a new account lands on, before there is anything in it: a welcome,
 * and the first steps that fill it — what is done, what is next, and the way
 * to each.
 *
 * The steps are data: `page.steps = [{ id, title, description, action, href,
 * done }]`, numbered in order, with how far along it is over them. A step's
 * action fires `kt-step`, or is a link with an `href`. For a list or a panel
 * that is empty, `kt-empty-state`.
 *
 * @element kt-empty-page
 *
 * @slot media - Over the heading: an illustration, a logo.
 * @slot actions - Under the steps: Skip for now, a link to the docs.
 *
 * @csspart base - The section.
 * @csspart step - One step.
 *
 * @fires kt-step - A step's action was pressed. `detail: { id }`.
 *
 * @example
 * ```html
 * <kt-empty-page heading="Welcome, Ada" lead="Three steps and you are sending invoices."></kt-empty-page>
 * <script>
 *   page.steps = [
 *     { id: 'company', title: 'Add your company', done: true },
 *     { id: 'invoice', title: 'Send your first invoice', action: 'New invoice', href: '/invoices/new' },
 *   ];
 * </script>
 * ```
 */
export class KtEmptyPage extends KtElement {
  static override styles = [
    KtElement.styles,
    blockStyles,
    css`
      .block {
        justify-items: center;
        max-width: 720px;
        margin-inline: auto;
      }
      .block-head {
        justify-items: center;
        text-align: center;
      }
      .block-heading {
        font: 600 clamp(28px, 5cqi, 40px) / 1.1 var(--font-family-display);
        letter-spacing: -0.03em;
      }
      .media,
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--gap-button);
        justify-content: center;
      }
      .empty {
        display: none;
      }

      .progress {
        display: grid;
        gap: 8px;
        width: 100%;
      }
      .progress-label {
        color: var(--text-muted);
        font: var(--font-normal-small);
      }

      .steps {
        display: grid;
        width: 100%;
        margin: 0;
        padding: 0;
        list-style: none;
        border: var(--border-width) solid var(--border-subtle);
        border-radius: var(--border-radius-card);
      }
      .step {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        gap: var(--gap-card);
        align-items: center;
        padding: var(--padding-card);
        text-align: start;
      }
      .step + .step {
        border-top: var(--border-width) solid var(--border-subtle);
      }
      @container (max-width: 520px) {
        .step {
          grid-template-columns: auto minmax(0, 1fr);
        }
        .step .act {
          grid-column: 2;
          justify-self: start;
        }
      }

      .marker {
        display: grid;
        place-items: center;
        width: 32px;
        height: 32px;
        color: var(--text-muted);
        font: var(--font-normal-medium);
        font-variant-numeric: tabular-nums;
        border: var(--border-width) solid var(--border-subtle);
        border-radius: 50%;
      }
      .done .marker {
        color: var(--color-white);
        background-color: var(--color-primary-base);
        border-color: var(--color-primary-base);
      }

      .step-text {
        display: grid;
        gap: 2px;
        min-width: 0;
      }
      .step-title {
        margin: 0;
        color: var(--text-body);
        font: var(--font-normal-medium);
      }
      .done .step-title {
        color: var(--text-muted);
        text-decoration: line-through;
        text-decoration-color: var(--border-subtle);
      }
      .step-description {
        margin: 0;
        color: var(--text-muted);
        font: var(--font-normal-small);
        line-height: 1.5;
      }

      a.action {
        display: inline-flex;
        align-items: center;
        height: var(--button-height);
        padding: 0 var(--button-padding-x);
        color: var(--color-primary-text);
        font: var(--font-normal-regular);
        white-space: nowrap;
        text-decoration: none;
        background-color: var(--color-primary-soft);
        border-radius: var(--border-radius);
        transition: background-color var(--duration-instant);
      }
      a.action:hover {
        background-color: var(--color-secondary-hover);
      }
      a.action:focus-visible {
        outline: var(--outline-width) solid var(--color-primary-base);
        outline-offset: 2px;
      }
      /* The next step is the one to take: its action is the primary one. */
      .next a.action {
        color: var(--color-white);
        background-color: var(--color-primary-base);
      }
      .next a.action:hover {
        background-color: var(--color-primary-hover);
      }

      .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }
    `,
  ];

  @property({ type: String })
  heading = '';

  @property({ type: String })
  lead = '';

  /** The first steps, in the order to take them. */
  @property({ attribute: false })
  steps: readonly KtFirstStep[] = [];

  /** The heading's level: 1, since it is the page; the steps' titles sit one under. */
  @property({ type: Number, attribute: 'heading-level' })
  headingLevel = 1;

  /** The words, English until given others. */
  @property({ attribute: false })
  texts: Partial<KtEmptyPageTexts> = {};

  @state() private filled = new Set<string>();

  private readonly headingId = blockId('kt-empty-page');

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

  private step(
    step: KtFirstStep,
    index: number,
    next: boolean,
    t: KtEmptyPageTexts,
  ): TemplateResult {
    const label = step.action || t.start;
    const action = step.done
      ? nothing
      : step.href
        ? html`<a class="action" href=${step.href}>${label}</a>`
        : html`<kt-button
            variant=${next ? 'primary' : 'secondary'}
            @click=${() => emit(this, 'kt-step', { id: step.id })}
            >${label}</kt-button
          >`;
    const title = step.done
      ? html`<span class="visually-hidden">${t.done}</span> ${step.title}`
      : html`${step.title}`;
    const classes = ['step', step.done ? 'done' : '', next ? 'next' : ''].filter(Boolean).join(' ');
    return html`<li part="step" class=${classes}>
      <span class="marker" aria-hidden="true"
        >${step.done ? html`<kt-icon name="check" size="16"></kt-icon>` : index + 1}</span
      >
      <div class="step-text">
        ${heading(this.headingLevel + 1, title, 'step-title', 2)}
        ${step.description ? html`<p class="step-description">${step.description}</p>` : nothing}
      </div>
      ${step.done ? nothing : html`<div class="act">${action}</div>`}
    </li>`;
  }

  override render(): TemplateResult {
    const t = { ...TEXTS, ...this.texts };
    const done = this.steps.filter((step) => step.done).length;
    const next = this.steps.findIndex((step) => !step.done);
    const progress = t.progress(done, this.steps.length);
    return html`<section part="base" class="block" aria-labelledby=${this.headingId}>
      <div class=${this.filled.has('media') ? 'media' : 'media empty'}>
        <slot name="media" @slotchange=${this.readSlots}></slot>
      </div>
      ${blockHead({ title: this.heading, lead: this.lead, level: this.headingLevel, id: this.headingId })}
      ${
        this.steps.length
          ? html`<div class="progress">
                <span class="progress-label" aria-hidden="true">${progress}</span>
                <kt-progress-bar
                  value=${done}
                  max=${this.steps.length}
                  size="small"
                  label=${progress}
                ></kt-progress-bar>
              </div>
              <ol class="steps" role="list">
                ${this.steps.map((step, index) => this.step(step, index, index === next, t))}
              </ol>`
          : nothing
      }
      <div class=${this.filled.has('actions') ? 'actions' : 'actions empty'}>
        <slot name="actions" @slotchange=${this.readSlots}></slot>
      </div>
    </section>`;
  }
}

defineElement('kt-empty-page', KtEmptyPage);

declare global {
  interface HTMLElementTagNameMap {
    'kt-empty-page': KtEmptyPage;
  }
}
