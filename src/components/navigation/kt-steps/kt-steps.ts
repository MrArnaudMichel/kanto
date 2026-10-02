import { css, html, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { emit } from '#internal/events';
import { strings } from '#internal/strings';
import '../../core/kt-icon/kt-icon.js';

export interface KtStep {
  readonly id: string;
  readonly label: string;
  /** A line under the label. */
  readonly description?: string;
  /** Something on this step needs fixing — a field it holds failed. */
  readonly error?: boolean;
}

export type KtStepsOrientation = 'horizontal' | 'vertical';

type StepState = 'complete' | 'current' | 'upcoming' | 'error';

/**
 * The steps of a flow — sign-up, checkout, onboarding — and where the reader
 * is in it.
 *
 * Steps before `current` are complete, `current` is current, the rest are to
 * come; a step with `error` shows as needing attention wherever it is. With
 * `navigable`, a completed step is a button that goes back to it; going
 * forward is the flow's job, not the stepper's.
 *
 * An ordered list: the number is the step's place, `aria-current="step"`
 * marks the current one, and each state is said in words, not only shown.
 *
 * @element kt-steps
 *
 * @csspart list - The `<ol>`.
 * @csspart step - A step.
 * @csspart marker - A step's number, tick or alert.
 *
 * @fires kt-change - A completed step was picked, with `navigable`. `detail: { id }`.
 *
 * @example
 * ```html
 * <kt-steps label="Sign-up" current="billing"></kt-steps>
 * <script>
 *   steps.steps = [
 *     { id: 'account', label: 'Account' },
 *     { id: 'billing', label: 'Billing', description: 'Card or invoice' },
 *     { id: 'team', label: 'Team' },
 *   ];
 * </script>
 * ```
 */
export class KtSteps extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: block;
        --kt-steps-marker: calc(28px * var(--density-scale, 1));
      }

      ol {
        display: flex;
        gap: 12px;
        margin: 0;
        padding: 0;
        list-style: none;
      }
      :host([orientation='vertical']) ol {
        flex-direction: column;
        gap: 0;
      }

      li {
        position: relative;
        display: flex;
        flex: 1 1 0;
        gap: 10px;
        align-items: flex-start;
        min-width: 0;
      }
      /* The connector to the next step: after the label across, down the
         marker's middle when vertical. */
      li:not(:last-child)::after {
        flex: 1 1 24px;
        align-self: center;
        height: 2px;
        min-width: 16px;
        background: var(--color-dark-22);
        border-radius: var(--radius-full);
        content: '';
      }
      li[data-state='complete']:not(:last-child)::after {
        background: var(--color-primary-base);
      }
      :host([orientation='vertical']) li {
        flex: none;
        padding-bottom: 20px;
      }
      :host([orientation='vertical']) li:not(:last-child)::after {
        position: absolute;
        top: calc(var(--kt-steps-marker) + 4px);
        left: calc(var(--kt-steps-marker) / 2 - 1px);
        flex: none;
        width: 2px;
        /* Explicit: a flex item keeps its flex sizing even out of the flow. */
        height: calc(100% - var(--kt-steps-marker) - 8px);
        min-width: 0;
      }

      .marker {
        display: inline-grid;
        flex: none;
        place-items: center;
        width: var(--kt-steps-marker);
        height: var(--kt-steps-marker);
        color: var(--text-muted);
        font: 600 calc(12px * var(--text-scale, 1)) / 1 var(--font-family-body);
        background: var(--surface-card);
        border: 2px solid var(--color-dark-24);
        border-radius: 50%;
      }
      li[data-state='complete'] .marker {
        color: var(--color-white);
        background: var(--color-primary-base);
        border-color: var(--color-primary-base);
      }
      li[data-state='current'] .marker {
        color: var(--color-primary-text);
        border-color: var(--color-primary-base);
        box-shadow: 0 0 0 4px var(--color-primary-soft);
      }
      li[data-state='error'] .marker {
        color: var(--color-danger-text);
        background: var(--color-danger-soft);
        border-color: var(--color-danger-base);
      }

      .text {
        display: grid;
        gap: 2px;
        min-width: 0;
        padding-top: calc((var(--kt-steps-marker) - 1.4em) / 2);
      }
      .label {
        color: var(--text-muted);
        font: var(--font-normal-medium);
        white-space: nowrap;
      }
      li[data-state='current'] .label,
      li[data-state='complete'] .label {
        color: var(--text-body);
      }
      li[data-state='error'] .label {
        color: var(--color-danger-text);
      }
      .description {
        color: var(--text-muted);
        font: var(--font-normal-small);
      }

      button {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        margin: -4px;
        padding: 4px;
        color: inherit;
        font: inherit;
        text-align: start;
        background: none;
        border: none;
        border-radius: var(--radius-input);
        cursor: pointer;
      }
      button:hover .label {
        color: var(--color-primary-text);
      }
      button:focus-visible {
        outline: var(--outline-width) solid var(--color-primary-base);
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

  /** The steps, in order. Set as a property. */
  @property({ attribute: false })
  steps: readonly KtStep[] = [];

  /** The id of the step the reader is on. */
  @property({ type: String, reflect: true })
  current = '';

  /** Accessible name of the list: what the flow is. */
  @property({ type: String })
  label = '';

  @property({ type: String, reflect: true })
  orientation: KtStepsOrientation = 'horizontal';

  /** Completed steps become buttons that go back to them. */
  @property({ type: Boolean, reflect: true })
  navigable = false;

  private stateOf(step: KtStep, index: number, currentIndex: number): StepState {
    if (step.error) return 'error';
    if (index < currentIndex) return 'complete';
    return index === currentIndex ? 'current' : 'upcoming';
  }

  private goTo(step: KtStep): void {
    this.current = step.id;
    emit(this, 'kt-change', { id: step.id });
  }

  override render(): TemplateResult {
    const s = strings();
    const currentIndex = this.steps.findIndex((step) => step.id === this.current);
    const said: Record<StepState, string> = {
      complete: s.stepComplete,
      current: s.stepCurrent,
      upcoming: s.stepUpcoming,
      error: s.stepError,
    };

    return html`<ol part="list" aria-label=${this.label || nothing}>
      ${this.steps.map((step, index) => {
        const state = this.stateOf(step, index, currentIndex);
        const marker =
          state === 'complete'
            ? html`<kt-icon name="check" size="14"></kt-icon>`
            : state === 'error'
              ? html`<kt-icon name="circle-alert" size="14"></kt-icon>`
              : html`${index + 1}`;
        const body = html`<span part="marker" class="marker" aria-hidden="true">${marker}</span>
          <span class="text">
            <span class="label">${step.label}</span>
            ${step.description ? html`<span class="description">${step.description}</span>` : nothing}
            <span class="visually-hidden">${said[state]}</span>
          </span>`;
        const back = this.navigable && index < currentIndex;

        return html`<li
          part="step"
          data-state=${state}
          aria-current=${index === currentIndex ? 'step' : nothing}
        >
          ${back ? html`<button type="button" @click=${() => this.goTo(step)}>${body}</button>` : body}
        </li>`;
      })}
    </ol>`;
  }
}

defineElement('kt-steps', KtSteps);

declare global {
  interface HTMLElementTagNameMap {
    'kt-steps': KtSteps;
  }
}
