import { css, html, type PropertyValues, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { KtElement, defineElement } from 'kanto/internal/kt-element';
import { uniqueId } from 'kanto/internal/events';

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

      .bubble {
        position: absolute;
        z-index: var(--z-tooltip);
        max-width: 260px;
        padding: var(--padding-chip);
        /* Inverted against the page, so the bubble reads as floating in
           both themes — the raw ramp step this used to name is pure white
           under data-theme="light". */
        color: var(--text-inverted);
        font: var(--font-code-regular);
        white-space: nowrap;
        background: var(--surface-inverted);
        border-radius: var(--radius-input);
        opacity: 0;
        pointer-events: none;
        transition: opacity 150ms var(--easing-standard);
      }

      .bubble.visible {
        opacity: 1;
      }

      .top {
        bottom: calc(100% + 6px);
        left: 50%;
        transform: translateX(-50%);
      }
      .bottom {
        top: calc(100% + 6px);
        left: 50%;
        transform: translateX(-50%);
      }
      .left {
        top: 50%;
        right: calc(100% + 6px);
        transform: translateY(-50%);
      }
      .right {
        top: 50%;
        left: calc(100% + 6px);
        transform: translateY(-50%);
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

  @property({ type: String })
  text = '';

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
  }

  override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has('text')) this.syncDescription();
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
        class=${classMap({ bubble: true, [this.placement]: true, visible: this.visible })}
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
