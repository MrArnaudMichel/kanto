import { css, html, type PropertyValues, type TemplateResult } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { uniqueId } from '#internal/events';
import { placeFloating } from '#internal/position';

export type KtTooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

/** Marks the description node so it is never assigned to the default slot. */
const DESCRIPTION_SLOT = 'kt-tooltip-description';

/**
 * A short label that appears on hover or focus.
 *
 * Wrap the thing it describes:
 *
 * ```html
 * <kt-tooltip text="Refresh the data">
 *   <kt-button icon="refresh-cw" label="Refresh"></kt-button>
 * </kt-tooltip>
 * ```
 *
 * A tooltip is a *description*, never the only name of a control. If the
 * trigger has no visible text, give it its own `label` too — a tooltip that has
 * to be hovered to be read leaves touch and screen-reader users with nothing.
 *
 * @element kt-tooltip
 *
 * @slot - The trigger.
 *
 * @csspart bubble - The tooltip bubble.
 */
export class KtTooltip extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      /* A popover in the top layer, placed in viewport coordinates from
         the trigger: no ancestor's overflow can clip it, and it takes no
         room in the page — a bubble by the right edge used to widen the
         document. */
      .bubble {
        position: fixed;
        inset: auto;
        z-index: var(--z-tooltip);
        max-width: 260px;
        margin: 0;
        padding: var(--padding-chip);
        overflow: visible;
        /* Inverted against the page, so the bubble reads as floating in
           both themes — the raw ramp step this used to name is pure white
           under data-theme="light". */
        color: var(--text-inverted);
        font: var(--font-code-regular);
        /* As wide as a short label, and wrapped at max-width for a sentence:
           a positioned box beside a small trigger would otherwise shrink to
           one word per line. */
        width: max-content;
        overflow-wrap: anywhere;
        background: var(--surface-inverted);
        border: none;
        border-radius: var(--radius-input);
        display: none;
        opacity: 0;
        pointer-events: none;
        /* The discrete display and overlay transitions keep the fade-out
           once the popover closes. */
        transition:
          opacity var(--duration-fast) var(--easing-standard),
          display var(--duration-fast) allow-discrete,
          overlay var(--duration-fast) allow-discrete;
      }

      .bubble:popover-open {
        display: block;
      }

      .bubble.visible {
        opacity: 1;
      }

      @starting-style {
        .bubble.visible {
          opacity: 0;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .bubble {
          transition: none;
        }
      }
    `,
  ];

  private readonly descriptionId = uniqueId('kt-tooltip');
  private description: HTMLElement | undefined;

  @state()
  private visible = false;

  @query('.bubble')
  private bubble!: HTMLElement;

  @property({ type: String })
  text = '';

  /**
   * The side the bubble prefers. It takes the opposite one when this one has
   * no room — "top" on a trigger at the top of the page shows below it.
   */
  @property({ type: String, reflect: true })
  placement: KtTooltipPlacement = 'top';

  /** Suppresses the tooltip without removing it from the markup. */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('pointerenter', this.show);
    this.addEventListener('pointerleave', this.hide);
    this.addEventListener('focusin', this.show);
    this.addEventListener('focusout', this.hide);
    this.addEventListener('keydown', this.onKeyDown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('pointerenter', this.show);
    this.removeEventListener('pointerleave', this.hide);
    this.removeEventListener('focusin', this.show);
    this.removeEventListener('focusout', this.hide);
    this.removeEventListener('keydown', this.onKeyDown);
    this.description?.remove();
    this.visible = false;
    this.close();
  }

  override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has('text')) this.syncDescription();
  }

  // Untyped: `visible` is private, so not among the keys PropertyValues<this> knows.
  override updated(changed: PropertyValues): void {
    if (!changed.has('visible')) return;
    if (this.visible) this.open();
    else this.close();
  }

  /**
   * Opens the bubble in the top layer, then places it: it has to be open to be
   * measured. Where popovers are missing — a test DOM — it stays in place.
   */
  private open(): void {
    const bubble = this.bubble;
    if (typeof bubble.showPopover !== 'function') return;
    if (!bubble.matches(':popover-open')) bubble.showPopover();

    const anchor = this.getBoundingClientRect();
    const { x, y } = placeFloating(
      anchor,
      bubble.getBoundingClientRect(),
      { width: window.innerWidth, height: window.innerHeight },
      this.placement,
    );
    bubble.style.left = `${x}px`;
    bubble.style.top = `${y}px`;
    // Fixed to the viewport, the bubble would drift from its trigger.
    window.addEventListener('scroll', this.hide, { capture: true, passive: true });
    window.addEventListener('resize', this.hide);
  }

  private close(): void {
    window.removeEventListener('scroll', this.hide, { capture: true });
    window.removeEventListener('resize', this.hide);
    const bubble = this.bubble;
    if (typeof bubble?.hidePopover === 'function' && bubble.matches(':popover-open')) {
      bubble.hidePopover();
    }
  }

  /**
   * `aria-describedby` cannot reach across a shadow boundary: an id inside this
   * element's shadow root is invisible to a trigger sitting in the light DOM.
   *
   * So the description also exists as a light-DOM node, addressed to a slot
   * that does not exist — which keeps it out of the rendered output while
   * leaving it referenceable, since an explicit aria-describedby target is read
   * even when it is not displayed.
   */
  private syncDescription(): void {
    if (!this.text) {
      this.description?.remove();
      this.description = undefined;
      return;
    }

    if (!this.description) {
      this.description = document.createElement('span');
      this.description.id = this.descriptionId;
      this.description.slot = DESCRIPTION_SLOT;
      this.append(this.description);
    }
    this.description.textContent = this.text;

    for (const trigger of this.children) {
      if (trigger !== this.description)
        trigger.setAttribute('aria-describedby', this.descriptionId);
    }
  }

  private show = (): void => {
    if (!this.disabled && this.text) this.visible = true;
  };

  private hide = (): void => {
    this.visible = false;
  };

  /** WCAG 1.4.13: a pointer-triggered overlay must be dismissible from the keyboard. */
  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.visible) {
      event.stopPropagation();
      this.visible = false;
    }
  };

  override render(): TemplateResult {
    return html`<slot @slotchange=${this.syncDescription}></slot>
      <span
        part="bubble"
        popover="manual"
        class=${classMap({ bubble: true, visible: this.visible })}
        role="tooltip"
        aria-hidden=${this.visible ? 'false' : 'true'}
        >${this.text}</span
      >`;
  }
}

defineElement('kt-tooltip', KtTooltip);

declare global {
  interface HTMLElementTagNameMap {
    'kt-tooltip': KtTooltip;
  }
}
