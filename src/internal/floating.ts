import { css, type ReactiveController, type ReactiveControllerHost } from 'lit';
import { placeFloating, type Align, type Side } from './position.js';

/**
 * A panel that opens from a trigger — a select's list, a date picker's
 * calendar, a menu — drawn in the top layer and placed from the trigger.
 *
 * A panel positioned inside its element was cut off by any ancestor with
 * `overflow: hidden`: a table cell, a side panel, an app's scrolling main
 * area. In the top layer, nothing clips it. It opens on the side asked for, or
 * the other one when that has no room, and follows the trigger as the page
 * scrolls.
 */

export interface FloatingOptions {
  /** The panel, which carries `popover="manual"` and the `floating` class. */
  readonly panel: () => HTMLElement | null | undefined;
  /** What the panel opens from. */
  readonly anchor: () => Element | null | undefined;
  /** The side it prefers. */
  readonly side?: () => Side;
  /** Which edge of the anchor it lines up with; its start by default. */
  readonly align?: () => Align;
  /** Sizes the panel to the anchor's width — a list under its field. */
  readonly matchWidth?: boolean;
  /** Told the side it opened on, for the direction of its entrance. */
  readonly onPlace?: (side: Side) => void;
}

/**
 * The panel's own styles. Closed, it keeps the display and the hidden,
 * animatable state its element gives it, so it can fade out after it leaves
 * the top layer: `display` here only undoes the popover's `display: none`, and
 * a panel's own `display` still wins.
 *
 * Until it is first placed it sits top left. With auto insets a closed panel
 * sat where the flow put it — beside a right-hand trigger, past the edge of
 * the page, which then scrolled sideways.
 */
export const floatingStyles = css`
  .floating {
    position: fixed;
    inset: 0 auto auto 0;
    display: block;
    /* As wide as what it holds, wherever it is placed: a box sized from its
       position would change size when moved, and be moved again. */
    width: max-content;
    margin: 0;
    color: inherit;
    /* Set apart from the page by the theme: a lighter surface in the dark,
       an edge and a soft shadow in the light. */
    border: var(--border-width) solid var(--border-popover);
    box-shadow: var(--shadow-popover);
  }
`;

export class FloatingController implements ReactiveController {
  private open = false;
  private frame = 0;
  /** Places the panel again when its size changes — content drawn after it opened. */
  private resizeObserver: ResizeObserver | undefined;

  constructor(
    host: ReactiveControllerHost,
    private readonly options: FloatingOptions,
  ) {
    host.addController(this);
  }

  /**
   * Call from the host's `updated()` with whether the panel is open. While it
   * is, every update re-places it: its content — a filtered list — can change
   * its size.
   */
  sync(open: boolean): void {
    // First, and whatever the panel: one rendered only while open is already
    // gone when it closes, and its listeners must go with it.
    if (open !== this.open) {
      this.open = open;
      const method = open ? 'addEventListener' : 'removeEventListener';
      window[method]('scroll', this.follow, { capture: true, passive: true });
      window[method]('resize', this.follow);
    }

    const panel = this.options.panel();
    // Where popovers are missing — a test DOM — the panel stays where it is.
    if (!panel || typeof panel.showPopover !== 'function') return;

    if (open) {
      if (!panel.matches(':popover-open')) panel.showPopover();
      this.place();
      // A panel measured at opening may grow once what it holds has drawn —
      // a calendar is an element of its own — and must be placed again.
      if (!this.resizeObserver && typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(this.follow);
        this.resizeObserver.observe(panel);
      }
    } else {
      this.unobserve();
      if (panel.matches(':popover-open')) panel.hidePopover();
    }
  }

  private unobserve(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
  }

  hostDisconnected(): void {
    this.sync(false);
    this.unobserve();
    cancelAnimationFrame(this.frame);
  }

  private follow = (): void => {
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => this.place());
  };

  private place(): void {
    const panel = this.options.panel();
    const anchor = this.options.anchor()?.getBoundingClientRect();
    if (!panel || !anchor) return;

    if (this.options.matchWidth) panel.style.width = `${anchor.width}px`;
    // Untransformed size: the entrance animation scales and slides the panel.
    const { x, y, placement } = placeFloating(
      anchor,
      { width: panel.offsetWidth, height: panel.offsetHeight },
      { width: window.innerWidth, height: window.innerHeight },
      this.options.side?.() ?? 'bottom',
      this.options.align?.() ?? 'start',
    );
    panel.style.left = `${x}px`;
    panel.style.top = `${y}px`;
    this.options.onPlace?.(placement);
  }
}
