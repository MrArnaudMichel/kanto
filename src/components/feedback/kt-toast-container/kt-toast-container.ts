import { css, html, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { durationOf, easingOf } from '#internal/motion';
import type { KtToast, KtToastVariant } from '../kt-toast/kt-toast.js';
import '../kt-toast/kt-toast.js';

export type KtToastPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface KtToastOptions {
  readonly variant?: KtToastVariant;
  readonly heading?: string;
  readonly description?: string;
  readonly dismissible?: boolean;
  /** Milliseconds before it dismisses itself. Zero keeps it until closed. */
  readonly duration?: number;
}

/**
 * A fixed stack that owns the toasts on screen.
 *
 * Toasts are appended and removed by the container, not by the code that
 * raised them — a toast that removes itself from a list it does not own is how
 * you end up with two of them and neither disappearing.
 *
 * @element kt-toast-container
 *
 * @slot - The toasts. Usually filled by `show()` rather than by hand.
 *
 * @example
 * ```js
 * document.querySelector('kt-toast-container').show({
 *   variant: 'success',
 *   heading: 'Entity created',
 *   duration: 4000,
 *   dismissible: true,
 * });
 * ```
 */
export class KtToastContainer extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        position: fixed;
        z-index: var(--z-toast);
        display: flex;
        flex-direction: column;
        gap: 12px;
        /* The stack only intercepts pointer events over the toasts
           themselves; the rest of the corner stays clickable. */
        pointer-events: none;
      }

      :host([position='bottom-right']) {
        right: 24px;
        bottom: 24px;
        align-items: flex-end;
      }
      :host([position='top-right']) {
        top: 24px;
        right: 24px;
        align-items: flex-end;
      }
      :host([position='bottom-left']) {
        bottom: 24px;
        left: 24px;
      }
      :host([position='top-left']) {
        top: 24px;
        left: 24px;
      }

      ::slotted(kt-toast) {
        pointer-events: auto;
      }
      /* On its way out: already gone, as far as a pointer is concerned. */
      ::slotted(kt-toast[leaving]) {
        pointer-events: none;
      }
    `,
  ];

  @property({ type: String, reflect: true })
  position: KtToastPosition = 'bottom-right';

  /** Oldest toasts are dropped once the stack reaches this many. */
  @property({ type: Number })
  limit = 5;

  /** The toasts currently on screen, oldest first. */
  get toasts(): KtToast[] {
    return [...this.querySelectorAll<KtToast>('kt-toast:not([leaving])')];
  }

  /** Raises a toast and returns it, so a caller can close it early. */
  show(options: KtToastOptions = {}): KtToast {
    const toast = document.createElement('kt-toast');
    toast.variant = options.variant ?? 'information';
    toast.heading = options.heading ?? '';
    toast.description = options.description ?? '';
    toast.dismissible = options.dismissible ?? true;
    toast.duration = options.duration ?? 0;

    toast.addEventListener('kt-toast-close', () => this.dismiss(toast), { once: true });

    // Toasts stack towards the screen edge: newest nearest it, which for a
    // bottom-anchored stack means appending and for a top-anchored one means
    // prepending.
    if (this.position.startsWith('top')) this.prepend(toast);
    else this.append(toast);

    this.enforceLimit();
    void toast.updateComplete.then(() => {
      if (toast.isConnected && !toast.hasAttribute('leaving')) this.move(toast, 'in');
    });
    return toast;
  }

  /** Removes one toast: it fades and folds away, then leaves the page. */
  dismiss(toast: KtToast): void {
    if (toast.hasAttribute('leaving')) return;
    toast.setAttribute('leaving', '');
    toast.setAttribute('aria-hidden', 'true');
    const animation = this.move(toast, 'out');
    if (!animation) toast.remove();
    else
      void animation.finished.then(
        () => toast.remove(),
        () => toast.remove(),
      );
  }

  /** Removes every toast. */
  clear(): void {
    for (const toast of this.toasts) this.dismiss(toast);
  }

  /**
   * Slides a toast in from the screen edge, or out towards it, while its
   * height opens or folds — so the rest of the stack moves smoothly rather
   * than jumping. Null when the theme gives no time to move in: reduced
   * motion, or no theme at all.
   */
  private move(toast: KtToast, way: 'in' | 'out'): Animation | null {
    const duration = durationOf(this, way === 'in' ? '--duration-normal' : '--duration-fast');
    if (duration <= 0 || typeof toast.animate !== 'function') return null;
    for (const running of toast.getAnimations()) running.cancel();

    const height = `${toast.getBoundingClientRect().height}px`;
    const gap = `-${getComputedStyle(this).rowGap}`;
    // The gap beside it folds with it: the one before it, or after it when first.
    const margin = toast.previousElementSibling ? 'marginTop' : 'marginBottom';
    const away =
      way === 'in'
        ? `translateY(${this.position.startsWith('top') ? -8 : 8}px)`
        : `translateX(${this.position.endsWith('left') ? -16 : 16}px)`;
    const shown: Keyframe = { opacity: 1, height, transform: 'none', [margin]: '0px' };
    const hidden: Keyframe = { opacity: 0, height: '0px', transform: away, [margin]: gap };

    toast.style.overflow = 'clip';
    const animation = toast.animate(way === 'in' ? [hidden, shown] : [shown, hidden], {
      duration,
      easing: easingOf(this),
      fill: way === 'out' ? 'forwards' : 'none',
    });
    animation.id = `kt-toast-${way}`;
    const done = () => {
      if (way === 'in') toast.style.removeProperty('overflow');
    };
    void animation.finished.then(done, done);
    return animation;
  }

  private enforceLimit(): void {
    if (this.limit <= 0) return;

    const toasts = this.toasts;
    const excess = toasts.length - this.limit;
    const oldestFirst = this.position.startsWith('top') ? [...toasts].reverse() : toasts;

    for (let index = 0; index < excess; index += 1) {
      const oldest = oldestFirst[index];
      if (oldest) this.dismiss(oldest);
    }
  }

  /** Hovering the stack freezes every countdown; leaving it resumes them. */
  private pauseAll = (): void => {
    for (const toast of this.toasts) toast.pause();
  };

  private resumeAll = (): void => {
    for (const toast of this.toasts) toast.resume();
  };

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('pointerenter', this.pauseAll);
    this.addEventListener('pointerleave', this.resumeAll);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('pointerenter', this.pauseAll);
    this.removeEventListener('pointerleave', this.resumeAll);
  }

  override render(): TemplateResult {
    return html`<slot></slot>`;
  }
}

defineElement('kt-toast-container', KtToastContainer);

declare global {
  interface HTMLElementTagNameMap {
    'kt-toast-container': KtToastContainer;
  }
}
