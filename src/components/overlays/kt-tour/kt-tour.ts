import { css, html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { emit, toggleListener, uniqueId } from '#internal/events';
import { FloatingController, floatingStyles } from '#internal/floating';
import { strings } from '#internal/strings';
import '../../core/kt-button/kt-button.js';

export interface KtTourStep {
  /** What the step points at: a CSS selector, or the element. None centres the card. */
  readonly target?: string | Element;
  readonly title: string;
  readonly body?: string;
}

/**
 * A guided tour: a few steps, each pointing at a part of the page with a word
 * about it — a product's first run, a new feature.
 *
 * Each step lights its target, dimming the rest of the page, scrolls it into
 * view and sets a card beside it: the step's title and words, where the tour
 * is ("Step 2 of 4"), and the way on — Previous, Next, then Done. Escape or the
 * close button end it. The card takes the focus at each step; the page stays
 * usable, since a tour points at things rather than taking them away.
 *
 * @element kt-tour
 *
 * @csspart spotlight - The light around the target.
 * @csspart card - The step's card.
 *
 * @fires kt-step - A step showed. `detail: { index }`.
 * @fires kt-finish - The last step's Done was pressed.
 * @fires kt-close - The tour was closed before its end.
 *
 * @example
 * ```html
 * <kt-tour></kt-tour>
 * <script>
 *   tour.steps = [
 *     { target: '#search', title: 'Search everything', body: 'Find any invoice or customer.' },
 *     { target: '#invite', title: 'Invite your team', body: 'Work on invoices together.' },
 *   ];
 *   tour.start();
 * </script>
 * ```
 */
export class KtTour extends KtElement {
  static override styles = [
    KtElement.styles,
    floatingStyles,
    css`
      :host {
        display: contents;
      }

      /* The target, lit: the page dimmed around a rounded hole. */
      .spotlight {
        position: fixed;
        inset: auto;
        margin: 0;
        padding: 0;
        background: transparent;
        border: none;
        border-radius: var(--radius-input);
        box-shadow: 0 0 0 100vmax var(--color-backdrop);
        pointer-events: none;
        transition:
          top var(--duration-normal) var(--easing-standard),
          left var(--duration-normal) var(--easing-standard),
          width var(--duration-normal) var(--easing-standard),
          height var(--duration-normal) var(--easing-standard);
      }

      .card {
        box-sizing: border-box;
        width: min(320px, calc(100vw - 32px));
        padding: var(--padding-card);
        background: var(--surface-popover);
        border-radius: var(--radius-modal);
        outline: none;
      }
      .card.centred {
        inset: 50% auto auto 50%;
        translate: -50% -50%;
      }

      .head {
        display: flex;
        gap: var(--gap-form);
        align-items: flex-start;
        justify-content: space-between;
      }
      h2 {
        margin: 0;
        color: var(--text-body);
        font: var(--font-title-h6);
      }
      p {
        margin: var(--gap-element) 0 0;
        color: var(--text-muted);
        font: var(--font-normal-regular);
        line-height: 1.6;
      }

      .foot {
        display: flex;
        gap: var(--gap-button);
        align-items: center;
        margin-top: var(--gap-card);
      }
      .place {
        margin-inline-end: auto;
        color: var(--text-muted);
        font: var(--font-normal-small);
      }
    `,
  ];

  /** The steps. Set as a property: `tour.steps = [...]`. */
  @property({ attribute: false })
  steps: readonly KtTourStep[] = [];

  /** Whether the tour is showing. */
  @state() open = false;

  /** The step showing, from 0. */
  @state() index = 0;

  @state() private lit: DOMRect | null = null;

  private readonly titleId = uniqueId('kt-tour-title');
  private frame = 0;
  private readonly floating = new FloatingController(this, {
    panel: () => this.shadowRoot?.querySelector<HTMLElement>('.card:not(.centred)'),
    anchor: () => this.target,
  });

  /** Starts the tour, on its first step or on `index`. */
  start(index = 0): void {
    if (!this.steps.length) return;
    this.index = Math.max(0, Math.min(this.steps.length - 1, index));
    this.open = true;
  }

  /** Ends the tour before its last step. */
  close(): void {
    if (!this.open) return;
    this.open = false;
    emit(this, 'kt-close');
  }

  /** The next step, or the end after the last. */
  next(): void {
    if (this.index >= this.steps.length - 1) {
      this.open = false;
      emit(this, 'kt-finish');
      return;
    }
    this.index += 1;
  }

  /** The step before. */
  previous(): void {
    if (this.index > 0) this.index -= 1;
  }

  private get step(): KtTourStep | undefined {
    return this.steps[this.index];
  }

  /** The element the current step points at, if it is on the page. */
  private get target(): Element | null {
    const target = this.step?.target;
    if (!target) return null;
    return typeof target === 'string' ? document.querySelector(target) : target;
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.listen(false);
  }

  private listen(on: boolean): void {
    toggleListener(on, document, 'keydown', this.onKeyDown as EventListener);
    toggleListener(on, window, 'resize', this.follow);
    toggleListener(on, window, 'scroll', this.follow, { capture: true, passive: true });
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') this.close();
  };

  private follow = (): void => {
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => this.measure());
  };

  private measure(): void {
    this.lit = this.target?.getBoundingClientRect() ?? null;
  }

  // `open` and `index` are states, so the map is read untyped.
  override willUpdate(changed: PropertyValues): void {
    if ((changed.has('open') || changed.has('index')) && this.open) {
      this.target?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
      this.measure();
    }
  }

  override updated(changed: PropertyValues): void {
    if (changed.has('open')) this.listen(this.open);
    const spotlight = this.shadowRoot?.querySelector<HTMLElement>('.spotlight');
    const card = this.shadowRoot?.querySelector<HTMLElement>('.card');
    // Into the top layer, the light under the card.
    for (const layer of [spotlight, card]) {
      if (layer && typeof layer.showPopover === 'function' && !layer.matches(':popover-open')) {
        layer.showPopover();
      }
    }
    this.floating.sync(this.open && Boolean(this.target));
    if ((changed.has('open') || changed.has('index')) && this.open) {
      emit(this, 'kt-step', { index: this.index });
      void this.updateComplete.then(() => card?.focus());
    }
  }

  override render(): TemplateResult {
    const step = this.step;
    if (!this.open || !step) return html``;
    const s = strings();
    const last = this.index === this.steps.length - 1;
    const pad = 6;
    const lit = this.lit;
    return html`${
        lit
          ? html`<div
              part="spotlight"
              class="spotlight"
              popover="manual"
              aria-hidden="true"
              style=${`top:${lit.top - pad}px;left:${lit.left - pad}px;width:${lit.width + pad * 2}px;height:${lit.height + pad * 2}px`}
            ></div>`
          : nothing
      }
      <div
        part="card"
        class=${lit ? 'card floating' : 'card floating centred'}
        popover="manual"
        role="dialog"
        aria-labelledby=${this.titleId}
        tabindex="-1"
      >
        <div class="head">
          <h2 id=${this.titleId}>${step.title}</h2>
          <kt-button
            size="small"
            variant="secondary-no-bg"
            icon="x"
            label=${s.close}
            @click=${() => this.close()}
          ></kt-button>
        </div>
        ${step.body ? html`<p>${step.body}</p>` : nothing}
        <div class="foot">
          <span class="place">${s.stepOf(this.index + 1, this.steps.length)}</span>
          ${
            this.index > 0
              ? html`<kt-button size="small" variant="secondary" @click=${() => this.previous()}
                  >${s.previous}</kt-button
                >`
              : nothing
          }
          <kt-button size="small" @click=${() => this.next()}>${last ? s.done : s.next}</kt-button>
        </div>
      </div>`;
  }
}

defineElement('kt-tour', KtTour);

declare global {
  interface HTMLElementTagNameMap {
    'kt-tour': KtTour;
  }
}
