import { css, html, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { KtElement, defineElement } from '#internal/kt-element';
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
    `,
  ];

  @property({ type: String, reflect: true })
  position: KtToastPosition = 'bottom-right';

  /** Oldest toasts are dropped once the stack reaches this many. */
  @property({ type: Number })
  limit = 5;

  /** The toasts currently on screen, oldest first. */
  get toasts(): KtToast[] {
    return [...this.querySelectorAll('kt-toast')];
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
    return toast;
  }

  /** Removes one toast. */
  dismiss(toast: KtToast): void {
    toast.remove();
  }

  /** Removes every toast. */
  clear(): void {
    for (const toast of this.toasts) toast.remove();
  }

  private enforceLimit(): void {
    if (this.limit <= 0) return;

    const toasts = this.toasts;
    const excess = toasts.length - this.limit;
    const oldestFirst = this.position.startsWith('top') ? [...toasts].reverse() : toasts;

    for (let index = 0; index < excess; index += 1) oldestFirst[index]?.remove();
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
