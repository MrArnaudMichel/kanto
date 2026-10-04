import { css, html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { emit } from '#internal/events';
import { durationOf, play } from '#internal/motion';
import '../../core/kt-icon/kt-icon.js';

/**
 * A section that folds away.
 *
 * Built on `<details>`, which means it works before the JavaScript loads,
 * survives find-in-page — the browser opens a closed section to reveal a match —
 * and needs no ARIA of its own.
 *
 * Opening unfolds the content to its height and closing folds it away, in
 * every browser: the details stays open until the fold is done, and a click
 * half-way turns back from where it is. Not on the first render, and not
 * under reduced motion.
 *
 * @element kt-collapsible
 *
 * @slot - The contents.
 * @slot summary - Replaces the `heading` attribute.
 *
 * @csspart base - The `<details>`.
 * @csspart summary - The clickable row.
 * @csspart content - The revealed panel.
 *
 * @fires kt-toggle - Opened or closed. `detail: { open }`.
 *
 * @example
 * ```html
 * <kt-collapsible heading="Notifications" open>
 *   <kt-toggle checked>Email me about mentions</kt-toggle>
 * </kt-collapsible>
 * ```
 */
export class KtCollapsible extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: block;
      }

      details {
        border-bottom: var(--border-width) solid var(--border-subtle);
      }

      :host([plain]) details {
        border-bottom: none;
      }

      summary {
        display: flex;
        align-items: center;
        gap: var(--gap-button);
        padding: 12px 0;
        color: var(--text-body);
        font: var(--font-normal-medium);
        cursor: pointer;
        list-style: none;
      }

      /* The default marker is a triangle nobody asked for. */
      summary::-webkit-details-marker {
        display: none;
      }

      summary:hover {
        color: var(--text-body);
      }

      summary:focus-visible {
        outline: var(--outline-width) solid var(--color-primary-base);
        outline-offset: 2px;
        border-radius: calc(4px * var(--radius-scale, 1));
      }

      .chevron {
        display: inline-flex;
        flex: none;
        color: var(--text-muted);
        /* Turns with the fold, as long, overshooting a touch before it
           settles — so it reads as moving, not as swapped. */
        transition: transform var(--duration-normal) cubic-bezier(0.34, 1.4, 0.64, 1);
      }

      /* Follows what was asked, not the details, which stays open while
         the content folds: the chevron turns back at the click. */
      :host([open]) .chevron {
        transform: rotate(90deg);
      }

      .label {
        flex: 1;
        min-width: 0;
      }

      /* The fold animates .content, which has no padding of its own: the
         space sits inside it, so a height of nothing is nothing. */
      .content {
        color: var(--text-muted);
      }
      .inner {
        padding: 0 0 16px;
      }
    `,
  ];

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: String })
  heading = '';

  /** Drops the bottom rule, for a collapsible that is not part of a list. */
  @property({ type: Boolean, reflect: true })
  plain = false;

  /** Closing, with the details kept open until the content has folded away. */
  @state() private folding = false;
  private fold: Animation | null = null;

  /** The summary opens and closes it here, so a close can wait for the fold. */
  private onSummaryClick(event: MouseEvent): void {
    event.preventDefault();
    this.open = !this.open;
    emit(this, 'kt-toggle', { open: this.open });
  }

  override willUpdate(changed: PropertyValues<this>): void {
    // A close that will be animated keeps the details open meanwhile.
    if (
      changed.has('open') &&
      this.hasUpdated &&
      !this.open &&
      durationOf(this, '--duration-normal') > 0
    ) {
      this.folding = true;
    }
  }

  override updated(changed: PropertyValues<this>): void {
    if (changed.has('open') && changed.get('open') !== undefined) this.animateFold(this.open);
  }

  /** Moves the content's height to its own (opening) or to nothing (closing), from where it is. */
  private animateFold(opening: boolean): void {
    const content = this.renderRoot.querySelector<HTMLElement>('.content');
    if (!content) return;
    const running = this.fold;
    // Half-way through a fold, start from the height and fade it has reached.
    const height = running ? content.getBoundingClientRect().height : opening ? 0 : null;
    const opacity = running ? Number(getComputedStyle(content).opacity) : opening ? 0 : 1;
    running?.cancel();
    const natural = content.getBoundingClientRect().height;
    const from = height ?? natural;
    const to = opening ? natural : 0;

    const animation = play(
      content,
      [
        { height: `${from}px`, opacity, overflow: 'clip' },
        { height: `${to}px`, opacity: opening ? 1 : 0, overflow: 'clip' },
      ],
      '--duration-normal',
      'kt-collapsible-fold',
    );
    this.fold = animation;
    if (!animation) {
      this.folding = false;
      return;
    }
    void animation.finished.then(
      () => {
        if (this.fold !== animation) return;
        this.fold = null;
        if (!opening) this.folding = false;
      },
      () => undefined,
    );
  }

  private onToggle(event: Event): void {
    const details = event.target as HTMLDetailsElement;
    // The toggle of what this element drew — opened, or kept open to fold —
    // arrives a task late, maybe after another click; only a change the
    // browser made itself, such as find-in-page opening it, is news.
    if (details.open === (this.open || this.folding)) return;

    this.open = details.open;
    emit(this, 'kt-toggle', { open: this.open });
  }

  override render(): TemplateResult {
    return html`<details part="base" ?open=${this.open || this.folding} @toggle=${this.onToggle}>
      <summary part="summary" @click=${this.onSummaryClick}>
        <span class="chevron"><kt-icon name="chevron-right" size="16"></kt-icon></span>
        <span class="label"><slot name="summary">${this.heading || nothing}</slot></span>
      </summary>
      <div part="content" class="content">
        <div class="inner"><slot></slot></div>
      </div>
    </details>`;
  }
}

defineElement('kt-collapsible', KtCollapsible);

declare global {
  interface HTMLElementTagNameMap {
    'kt-collapsible': KtCollapsible;
  }
}
