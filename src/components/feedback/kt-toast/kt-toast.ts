import { css, html, nothing, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { KtElement, defineElement } from 'kanto/internal/kt-element';
import { emit } from 'kanto/internal/events';
import '../../core/kt-icon/kt-icon.js';
import '../kt-progress-bar/kt-progress-bar.js';

export type KtToastVariant = 'success' | 'information' | 'warning' | 'error';

interface VariantMeta {
  readonly icon: string;
  readonly progress: 'success' | 'info' | 'warning' | 'danger';
}

const META: Record<KtToastVariant, VariantMeta> = {
  success: { icon: 'circle-check', progress: 'success' },
  information: { icon: 'info', progress: 'info' },
  warning: { icon: 'triangle-alert', progress: 'warning' },
  error: { icon: 'circle-alert', progress: 'danger' },
};

/** Countdown refresh interval. 50ms is smooth without being a busy loop. */
const TICK_MS = 50;

/**
 * A transient notification.
 *
 * The only element in Kanto with a real shadow, and the only one that blurs
 * what is behind it: a toast floats above the page, so it has to say so.
 *
 * @element kt-toast
 *
 * @csspart base - The toast surface.
 * @csspart close - The dismiss button.
 *
 * @fires kt-toast-close - The toast asked to be removed, by timeout or by the
 *   dismiss button. `<kt-toast-container>` listens for this.
 */
export class KtToast extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: block;
      }

      .toast {
        position: relative;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--gap-form);
        max-width: 480px;
        padding: var(--padding-form);
        overflow: hidden;
        color: var(--text-body);
        background: var(--surface-card);
        border: var(--border-width) solid rgba(255, 255, 255, 0.1);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-toast);
        backdrop-filter: blur(10px);
      }

      /* A wash of the variant's hue over the card surface, rather than a
         solid fill: the text stays on a neutral background and keeps its
         contrast. */
      :host([variant='success']) .toast {
        background:
          linear-gradient(135deg, rgba(53, 221, 131, 0.25), rgba(53, 221, 131, 0.15)),
          var(--surface-card);
      }
      :host([variant='information']) .toast {
        background:
          linear-gradient(135deg, rgba(53, 175, 243, 0.25), rgba(53, 175, 243, 0.15)),
          var(--surface-card);
      }
      :host([variant='warning']) .toast {
        background:
          linear-gradient(135deg, rgba(245, 171, 61, 0.25), rgba(245, 171, 61, 0.15)),
          var(--surface-card);
      }
      :host([variant='error']) .toast {
        background:
          linear-gradient(135deg, rgba(245, 61, 92, 0.25), rgba(245, 61, 92, 0.15)),
          var(--surface-card);
      }

      :host([variant='success']) .heading {
        color: var(--color-success-base);
      }
      :host([variant='information']) .heading {
        color: var(--color-info-base);
      }
      :host([variant='warning']) .heading {
        color: var(--color-warning-base);
      }
      :host([variant='error']) .heading {
        color: var(--color-danger-base);
      }

      :host([variant='success']) .icon {
        color: var(--color-success-base);
      }
      :host([variant='information']) .icon {
        color: var(--color-info-base);
      }
      :host([variant='warning']) .icon {
        color: var(--color-warning-base);
      }
      :host([variant='error']) .icon {
        color: var(--color-danger-base);
      }

      .body {
        display: flex;
        align-items: center;
        gap: var(--gap-form);
      }

      .icon {
        display: flex;
        align-items: center;
      }

      .content {
        display: flex;
        flex: 1 1 auto;
        flex-direction: column;
        gap: var(--gap-element);
      }

      .heading {
        font: var(--font-normal-medium);
      }

      .description {
        font: var(--font-normal-regular);
      }

      .close {
        display: flex;
        align-items: center;
        padding: 4px;
        color: currentcolor;
        background: transparent;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
      .close:focus-visible {
        outline: var(--outline-width) solid var(--color-primary-base);
      }

      .countdown {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
      }
    `,
  ];

  private timer: ReturnType<typeof setInterval> | undefined;

  @state()
  private remaining = 0;

  @property({ type: String, reflect: true })
  variant: KtToastVariant = 'information';

  /**
   * The toast's title.
   *
   * Named `heading` because every element already has a `title`, and shadowing
   * it would turn the toast into its own tooltip.
   */
  @property({ type: String })
  heading = '';

  @property({ type: String })
  description = '';

  @property({ type: Boolean })
  dismissible = false;

  /**
   * Auto-dismiss after this many milliseconds, with a countdown bar. Zero
   * keeps the toast until something removes it.
   */
  @property({ type: Number })
  duration = 0;

  override connectedCallback(): void {
    super.connectedCallback();
    this.startCountdown();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.stopCountdown();
  }

  private startCountdown(): void {
    this.stopCountdown();
    if (this.duration <= 0) return;

    this.remaining = this.duration;
    this.tick();
  }

  /** Runs the countdown from whatever `remaining` currently is. */
  private tick(): void {
    this.timer = setInterval(() => {
      this.remaining -= TICK_MS;
      if (this.remaining > 0) return;

      this.stopCountdown();
      this.close();
    }, TICK_MS);
  }

  private stopCountdown(): void {
    if (this.timer !== undefined) clearInterval(this.timer);
    this.timer = undefined;
  }

  /** Pauses the countdown. The container calls this while the pointer is over the stack. */
  pause(): void {
    if (this.timer !== undefined) this.stopCountdown();
  }

  /** Resumes a paused countdown from where it stopped. */
  resume(): void {
    if (this.duration <= 0 || this.timer !== undefined || this.remaining <= 0) return;
    this.tick();
  }

  /** Asks to be removed. The container is what actually removes it. */
  close(): void {
    this.stopCountdown();
    emit(this, 'kt-toast-close');
  }

  override render(): TemplateResult {
    const meta = META[this.variant];
    const showCountdown = this.duration > 0;

    return html`<div
      part="base"
      class="toast"
      role=${this.variant === 'error' ? 'alert' : 'status'}
      aria-live=${this.variant === 'error' ? 'assertive' : 'polite'}
    >
      <div class="body">
        <span class="icon"><kt-icon name=${meta.icon} size="24"></kt-icon></span>
        <div class="content">
          ${this.heading ? html`<div class="heading">${this.heading}</div>` : nothing}
          ${this.description ? html`<div class="description">${this.description}</div>` : nothing}
        </div>
      </div>

      ${
        this.dismissible
          ? html`<button part="close" class="close" aria-label="Close" @click=${this.close}>
              <kt-icon name="x" size="18"></kt-icon>
            </button>`
          : nothing
      }
      ${
        showCountdown
          ? html`<div class="countdown">
              <kt-progress-bar
                size="small"
                variant=${meta.progress}
                striped
                animated
                .value=${this.remaining}
                .max=${this.duration}
                label="Time remaining"
              ></kt-progress-bar>
            </div>`
          : nothing
      }
    </div>`;
  }
}

defineElement('kt-toast', KtToast);

declare global {
  interface HTMLElementTagNameMap {
    'kt-toast': KtToast;
  }
}
