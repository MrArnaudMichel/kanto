import { css, html, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { KtElement, defineElement } from 'kanto/internal/kt-element';
import '../../core/kt-icon/kt-icon.js';

export type KtTimelineVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

/**
 * An ordered run of events on a rail.
 *
 * The same shape keeps reappearing — an activity feed, an audit log, a
 * changelog, the stages of a delivery, a résumé — and every time it gets
 * rebuilt out of a list, a pseudo-element line and a hand-placed dot. The
 * fiddly part is the rail: it must start at the first dot and stop at the
 * last, which a border on the list cannot do. Here each item draws its own
 * segment and the last one is told to stop.
 *
 * `<kt-timeline>` is the semantic list; `<kt-timeline-item>` is one event.
 *
 * @element kt-timeline
 *
 * @slot - The `<kt-timeline-item>` children.
 *
 * @csspart base - The list.
 *
 * @example
 * ```html
 * <kt-timeline>
 *   <kt-timeline-item heading="Deployed" time="09:24" variant="success" icon="rocket">
 *     Build 4210 went to production.
 *   </kt-timeline-item>
 *   <kt-timeline-item heading="Review requested" time="09:02" icon="eye"></kt-timeline-item>
 * </kt-timeline>
 * ```
 */
export class KtTimeline extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: block;
      }

      .timeline {
        display: flex;
        flex-direction: column;
      }
    `,
  ];

  /** Tighter rhythm, for a feed in a side panel. */
  @property({ type: Boolean, reflect: true })
  compact = false;

  override render(): TemplateResult {
    return html`<div part="base" class="timeline" role="list">
      <slot @slotchange=${this.#markLast}></slot>
    </div>`;
  }

  /**
   * The first `slotchange` is a microtask that can land after `updateComplete`,
   * so a caller that awaits the element would read stale items. Sync once the
   * shadow root exists as well as on every later change.
   */
  override firstUpdated(): void {
    this.#markLast();
  }

  override updated(changed: Map<string, unknown>): void {
    if (changed.has('compact')) this.#markLast();
  }

  /**
   * The rail has to stop at the last dot rather than run past it, and CSS
   * cannot select "last slotted element" from inside the shadow root —
   * `:last-child` matches in the light tree, which the item's own styles
   * cannot see. So the parent tells it.
   */
  #markLast = (): void => {
    const slot = this.shadowRoot?.querySelector('slot');
    if (!slot) return;

    const items = slot
      .assignedElements({ flatten: true })
      .filter((el): el is KtTimelineItem => el instanceof KtTimelineItem);

    items.forEach((item, index) => {
      item.last = index === items.length - 1;
      item.compact = this.compact;
    });
  };
}

/**
 * One event on a `<kt-timeline>`.
 *
 * @element kt-timeline-item
 *
 * @slot - The body of the event.
 * @slot actions - Trailing controls, aligned with the heading.
 *
 * @csspart base - The row.
 * @csspart marker - The dot or icon.
 */
export class KtTimelineItem extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: block;
      }

      .item {
        display: grid;
        grid-template-columns: 26px 1fr;
        gap: 12px;
        padding-bottom: 20px;
      }

      :host([compact]) .item {
        padding-bottom: 12px;
      }

      :host([last]) .item {
        padding-bottom: 0;
      }

      /* The rail. It hangs below the marker, so the last item drops it. */
      .rail {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
      }

      .rail::after {
        flex: 1;
        width: 1px;
        min-height: 8px;
        background: var(--border-subtle);
        content: '';
      }

      :host([last]) .rail::after {
        content: none;
      }

      /* Hairline, wash, ink — the same three parts a chip and a badge wear, so
         a marker beside them reads as the same system. A soft fill with no
         border is a different one's idea of a timeline. */
      .marker {
        display: flex;
        flex-shrink: 0;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        width: 26px;
        height: 26px;
        color: var(--marker-ink, var(--text-muted));
        background: var(--marker-wash, var(--surface-raised));
        border: var(--border-width) solid var(--marker-line, var(--border-subtle));
        border-radius: var(--radius-full);
      }

      /* Without an icon the marker is a dot, not an empty ring — but it keeps
         the ring, so the rail reads as one line of marks rather than two. */
      .marker.dot {
        width: 11px;
        height: 11px;
        margin-top: 7px;
        background: var(--marker-ink, var(--text-disabled));
        border-color: color-mix(
          in srgb,
          var(--marker-ink, var(--text-disabled)) 45%,
          var(--surface-page)
        );
      }

      .marker.primary {
        --marker-ink: var(--color-primary-base);
        --marker-wash: var(--color-primary-soft);
        --marker-line: color-mix(in srgb, var(--color-primary-base) 45%, transparent);
      }
      .marker.success {
        --marker-ink: var(--color-success-base);
        --marker-wash: var(--color-success-soft);
        --marker-line: color-mix(in srgb, var(--color-success-base) 45%, transparent);
      }
      .marker.warning {
        --marker-ink: var(--color-warning-base);
        --marker-wash: var(--color-warning-soft);
        --marker-line: color-mix(in srgb, var(--color-warning-base) 45%, transparent);
      }
      .marker.danger {
        --marker-ink: var(--color-danger-base);
        --marker-wash: var(--color-danger-soft);
        --marker-line: color-mix(in srgb, var(--color-danger-base) 45%, transparent);
      }
      .marker.info {
        --marker-ink: var(--color-info-base);
        --marker-wash: var(--color-info-soft);
        --marker-line: color-mix(in srgb, var(--color-info-base) 45%, transparent);
      }

      .content {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
        padding-top: 2px;
      }

      .top {
        display: flex;
        align-items: baseline;
        gap: 8px;
      }

      .heading {
        color: var(--text-body);
        font: var(--font-medium-regular);
      }

      .time {
        margin-left: auto;
        color: var(--text-muted);
        font: var(--font-normal-small);
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }

      .body {
        color: var(--text-muted);
        font: var(--font-normal-regular);
        line-height: 1.6;
      }

      ::slotted(*) {
        margin: 0;
      }
    `,
  ];

  @property({ type: String })
  heading = '';

  /** Shown right-aligned on the heading row. Any string — "09:24", "2 days ago". */
  @property({ type: String })
  time = '';

  /** Lucide icon name. Without one the marker is a plain dot. */
  @property({ type: String })
  icon = '';

  @property({ type: String, reflect: true })
  variant: KtTimelineVariant = 'neutral';

  /** Set by the parent `<kt-timeline>`: drops the trailing rail segment. */
  @property({ type: Boolean, reflect: true })
  last = false;

  /** Set by the parent `<kt-timeline>`. */
  @property({ type: Boolean, reflect: true })
  compact = false;

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('role', 'listitem');
  }

  override render(): TemplateResult {
    const marker = classMap({
      marker: true,
      dot: !this.icon,
      [this.variant]: true,
    });

    return html`<div part="base" class="item">
      <div class="rail">
        <span part="marker" class=${marker}>
          ${this.icon ? html`<kt-icon name=${this.icon} size="14"></kt-icon>` : nothing}
        </span>
      </div>

      <div class="content">
        ${
          this.heading || this.time
            ? html`<div class="top">
                ${this.heading ? html`<span class="heading">${this.heading}</span>` : nothing}
                <slot name="actions"></slot>
                ${this.time ? html`<span class="time">${this.time}</span>` : nothing}
              </div>`
            : nothing
        }
        <div class="body"><slot></slot></div>
      </div>
    </div>`;
  }
}

defineElement('kt-timeline', KtTimeline);
defineElement('kt-timeline-item', KtTimelineItem);

declare global {
  interface HTMLElementTagNameMap {
    'kt-timeline': KtTimeline;
    'kt-timeline-item': KtTimelineItem;
  }
}
