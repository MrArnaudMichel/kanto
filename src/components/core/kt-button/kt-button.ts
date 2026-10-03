import { css, html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { durationOf, play } from '#internal/motion';
import { ARRIVE, SHAKE, flightOf } from './flights.js';
import { FOLD, PLANE, PLANE_START, POINTS, circle, mix, pathOf, resample } from './morph.js';
import '../kt-icon/kt-icon.js';

export type KtButtonVariant =
  | 'primary'
  | 'secondary'
  | 'secondary-no-bg'
  | 'dark'
  | 'danger'
  | 'delete'
  | 'warning'
  | 'info'
  | 'success'
  | 'text';

export type KtButtonSize = 'small' | 'medium' | 'large';
export type KtButtonType = 'button' | 'submit' | 'reset';

/** Where `run()` is: at rest, running, its icon flying off, done, or failed. */
type Phase = 'idle' | 'busy' | 'leaving' | 'done' | 'failed';

/** Icon size per button size, so the glyph stays optically balanced. */
const ICON_SIZE: Record<KtButtonSize, number> = { small: 16, medium: 20, large: 24 };

/** The plane and the spinner's ring, as the same 64 points. */
const PLANE_POINTS = resample(PLANE, POINTS);
const RING_POINTS = circle(POINTS, PLANE_START);
/** The spinner's opening, as a share of the ring. */
const GAP = 0.28;
/** One lap of the spinner's arc, in milliseconds. */
const LAP_MS = 1000;

const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

/**
 * The Kanto action button.
 *
 * Ten variants; `primary` for the one action a screen is about, `secondary`
 * (a soft indigo tint) for everything supporting it. The semantic variants —
 * `danger`, `warning`, `info`, `success` — are tinted fills with coloured
 * text; `delete` is the only solid red, reserved for irreversible actions.
 *
 * Setting `icon` with no slotted text produces a square icon-only button,
 * which then requires a `label`.
 *
 * `run(action)` runs an async action and shows how it went: busy while it
 * runs, then a tick — and `done-label`, if given — or, if it throws, a shake,
 * an alert and `failed-label`; back to rest two seconds later. Some icons
 * leave in their own way: a `send` plane flies off to the top right.
 *
 * @element kt-button
 *
 * @slot - The button label.
 *
 * @csspart button - The native `<button>`.
 * @csspart icon - The icon, when `icon` is set.
 *
 * @example
 * ```html
 * <kt-button icon="plus">New entity</kt-button>
 * <kt-button variant="secondary" icon="refresh-cw">Refresh</kt-button>
 * <kt-button variant="danger">Delete</kt-button>
 * <kt-button icon="send" done-label="Sent">Send</kt-button>
 * <script>
 *   send.addEventListener('click', () => send.run(() => api.send(message)));
 * </script>
 * ```
 */
export class KtButton extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: inline-flex;
        vertical-align: middle;
      }

      :host([full-width]) {
        display: flex;
        width: 100%;
      }

      button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: var(--button-height);
        padding: 0 var(--button-padding-x);
        gap: var(--gap-button);
        border: none;
        border-radius: var(--border-radius);
        font: var(--font-normal-regular);
        /* One line, always: the height is fixed, and a label that wrapped —
           while run() moves the width to a new one — stood on end. */
        white-space: nowrap;
        cursor: pointer;
        transition:
          background-color var(--duration-instant),
          color var(--duration-instant);
      }

      /* === SIZES === */
      .small {
        height: var(--button-height-small);
        padding: 0 8px;
        font: var(--font-normal-small);
      }

      .large {
        height: var(--button-height-large);
        padding: 0 calc(var(--button-padding-x) + 8px);
        font: var(--font-normal-medium);
      }

      /* === VARIANTS ===
         Press returns to the base colour; Kanto has no scale or shrink. */
      .primary {
        color: var(--color-white);
        background-color: var(--color-primary-base);
      }
      .primary:hover {
        background-color: var(--color-primary-hover);
      }
      .primary:active {
        background-color: var(--color-primary-base);
      }

      .secondary {
        color: var(--color-primary-text);
        background-color: var(--color-primary-soft);
      }
      .secondary:hover {
        background-color: var(--color-secondary-hover);
      }
      .secondary:active {
        background-color: var(--color-primary-soft);
      }

      .secondary-no-bg {
        color: var(--color-primary-text);
        background: none;
      }
      .secondary-no-bg:hover {
        background-color: var(--color-secondary-hover);
      }
      .secondary-no-bg:active {
        background-color: var(--color-dark-14);
      }

      .dark {
        color: var(--color-text-400);
        background-color: var(--color-dark-20);
      }
      .dark:hover {
        background-color: var(--color-dark-22);
      }
      .dark:active {
        background-color: var(--color-dark-20);
      }

      .danger {
        color: var(--color-danger-text);
        background-color: var(--color-danger-soft);
      }
      .danger:hover {
        background-color: var(--color-danger-hover);
      }
      .danger:active {
        background-color: var(--color-danger-soft);
      }

      .delete {
        color: var(--color-white);
        background-color: var(--color-danger-solid);
      }
      .delete:hover {
        background-color: var(--color-danger-solid-hover);
      }

      .warning {
        color: var(--color-warning-text);
        background-color: var(--color-warning-soft);
      }
      .warning:hover {
        background-color: var(--color-warning-hover);
      }

      .info {
        color: var(--color-info-text);
        background-color: var(--color-info-soft);
      }
      .info:hover {
        background-color: var(--color-info-hover);
      }

      .success {
        color: var(--color-success-text);
        background-color: var(--color-success-soft);
      }
      .success:hover {
        background-color: var(--color-success-hover);
      }

      .text {
        height: auto;
        padding: 0;
        color: var(--color-primary-text);
        background: none;
      }
      .text:active {
        background-color: var(--color-dark-14);
      }

      /* === ICON-ONLY === */
      .icon-only {
        width: var(--button-height);
        padding: 0;
      }
      .icon-only.small {
        width: var(--button-height-small);
      }
      .icon-only.large {
        width: var(--button-height-large);
      }

      /* === DISABLED === */
      button:disabled {
        color: var(--text-disabled);
        background-color: var(--color-dark-14);
        cursor: not-allowed;
      }
      button:disabled:hover {
        background-color: var(--color-dark-14);
      }

      button:focus-visible {
        outline: var(--outline-width) solid var(--color-primary-base);
        outline-offset: 2px;
      }

      /* === RUN ===
         Busy is shown, not disabled: the button keeps its colour and the
         focus, and ignores clicks. */
      button[aria-busy='true'] {
        cursor: progress;
      }
      .spin {
        animation: kt-button-spin calc(var(--duration-slow) * 2) linear infinite;
      }
      @keyframes kt-button-spin {
        to {
          rotate: 1turn;
        }
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

  /** Visual variant. */
  @property({ type: String, reflect: true })
  variant: KtButtonVariant = 'primary';

  /** Height: 32 / 40 / 48px at the desktop scale. */
  @property({ type: String, reflect: true })
  size: KtButtonSize = 'medium';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  /** Native button behaviour. `submit` and `reset` act on the enclosing form. */
  @property({ type: String })
  type: KtButtonType = 'button';

  /** Lucide icon name, kebab-case. */
  @property({ type: String })
  icon = '';

  /** Which side of the label the icon sits on. */
  @property({ type: String, attribute: 'icon-position' })
  iconPosition: 'left' | 'right' = 'left';

  /** Accessible name. Required for an icon-only button. */
  @property({ type: String })
  label = '';

  /**
   * The kind of popup this button opens, as `aria-haspopup` on the inner
   * button. Set by `<kt-dropdown>` on its trigger; rarely by hand.
   */
  @property({ attribute: false })
  popup: 'menu' | 'listbox' | 'dialog' | undefined = undefined;

  /** Whether the popup or region this button controls is open, as `aria-expanded`. */
  @property({ attribute: false })
  expanded: boolean | undefined = undefined;

  /** Stretches the button to the width of its container. */
  @property({ type: Boolean, reflect: true, attribute: 'full-width' })
  fullWidth = false;

  /** Submitted with the form, as on a native button. */
  @property({ type: String })
  name = '';

  /** @see name */
  @property({ type: String })
  value = '';

  /** Shown in place of the label once `run()` succeeds. Empty keeps the label. */
  @property({ type: String, attribute: 'done-label' })
  doneLabel = '';

  /** Shown in place of the label when `run()` fails. Empty keeps the label. */
  @property({ type: String, attribute: 'failed-label' })
  failedLabel = '';

  /** How long the done or failed state stays before the button rests again. */
  static DONE_MS = 2000;

  @state() private phase: Phase = 'idle';
  private running: Promise<unknown> | null = null;
  private restTimer: ReturnType<typeof setTimeout> | undefined;
  /** The button's width before a label change, to move from. */
  private widthBefore = 0;

  /** Whether this run turns its icon into the spinner and back. */
  private morphing = false;
  /**
   * The morph, driven frame by frame: `m` from icon (0) to ring (1), moving
   * towards `target`; `offset` walks the arc round the ring. One state, so a
   * change of mind half-way goes back from where it is, never from an end.
   */
  private shape = {
    m: 0,
    target: 0,
    offset: 0,
    frame: 0,
    last: 0,
    span: 1,
    settled: null as (() => void) | null,
  };

  /**
   * Runs `action` and shows how it went. A second call while it runs gets the
   * same promise rather than a second run. Resolves with what the action
   * resolved with; rejects with what it threw, after showing it failed.
   */
  run<T>(action: () => Promise<T>): Promise<T> {
    if (this.running) return this.running as Promise<T>;
    clearTimeout(this.restTimer);
    this.morphing = Boolean(flightOf(this.icon).morphs) && durationOf(this, '--duration-slow') > 0;
    this.phase = 'busy';
    const running = (async () => {
      try {
        const result = await action();
        await this.finish('done');
        return result;
      } catch (error) {
        await this.finish('failed');
        throw error;
      } finally {
        this.running = null;
      }
    })();
    this.running = running;
    return running;
  }

  private async finish(phase: 'done' | 'failed'): Promise<void> {
    // The spinner becomes the icon again before anything else happens.
    if (this.morphing) await this.morphTo(0);
    if (phase === 'done') {
      // The icon leaves first, in its own way; then the tick comes in.
      const icon = this.renderRoot.querySelector('[part="icon"]');
      this.phase = 'leaving';
      await this.updateComplete;
      const flight = flightOf(this.icon);
      const leaving = icon
        ? play(icon, flight.leave, '--duration-slow', 'kt-button-leave', {
            easing: 'linear',
            scale: flight.leaveScale ?? 1,
          })
        : null;
      await leaving?.finished.catch(() => undefined);
    }
    this.widthBefore = this.getBoundingClientRect().width;
    this.morphing = false;
    this.phase = phase;
    this.restTimer = setTimeout(() => {
      this.widthBefore = this.getBoundingClientRect().width;
      this.phase = 'idle';
    }, KtButton.DONE_MS);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    clearTimeout(this.restTimer);
    cancelAnimationFrame(this.shape.frame);
    this.shape.frame = 0;
    this.shape.settled?.();
    if (!this.running) this.phase = 'idle';
  }

  /** Moves the morph towards the ring (1) or the icon (0); resolves on arrival at the icon. */
  private morphTo(target: 0 | 1): Promise<void> {
    const shape = this.shape;
    shape.target = target;
    shape.span = durationOf(this, '--duration-slow');
    const arrived = new Promise<void>((resolve) => {
      if (target === 0 && shape.m === 0 && !shape.frame) resolve();
      else if (target === 0) shape.settled = resolve;
      else resolve();
    });
    if (!shape.frame) {
      shape.last = 0;
      shape.frame = requestAnimationFrame(this.step);
    }
    return arrived;
  }

  private step = (now: number): void => {
    const shape = this.shape;
    const elapsed = shape.last ? now - shape.last : 0;
    shape.last = now;
    const move = elapsed / shape.span;
    shape.m =
      shape.target > shape.m
        ? Math.min(shape.target, shape.m + move)
        : Math.max(shape.target, shape.m - move);
    shape.offset = (shape.offset - elapsed / LAP_MS) % 1;
    this.drawShape();
    if (shape.target === 0 && shape.m === 0) {
      shape.frame = 0;
      shape.settled?.();
      shape.settled = null;
      return;
    }
    shape.frame = requestAnimationFrame(this.step);
  };

  /** Draws the morph where it stands: the outline, its opening, the fold. */
  private drawShape(): void {
    const svg = this.renderRoot.querySelector('svg.morph');
    if (!svg) return;
    const t = easeInOut(this.shape.m);
    const outline = svg.querySelector('.outline')!;
    outline.setAttribute('d', pathOf(mix(PLANE_POINTS, RING_POINTS, t)));
    const gap = GAP * t;
    outline.setAttribute('stroke-dasharray', `${1 - gap} ${gap}`);
    outline.setAttribute('stroke-dashoffset', String(this.shape.offset));
    svg.querySelector<SVGElement>('.fold')!.style.opacity = String(Math.max(0, 1 - t * 2.5));
  }

  // `phase` is private, so the map is read untyped.
  override updated(changed: PropertyValues): void {
    super.updated(changed);
    const was = changed.get('phase') as Phase | undefined;
    if (was === undefined || !changed.has('phase')) return;
    if (this.phase === 'busy' && this.morphing) {
      // Drawn as the icon before the first paint, then on its way to the ring.
      this.drawShape();
      void this.morphTo(1);
    }
    const icon = this.renderRoot.querySelector('[part="icon"]');
    const button = this.renderRoot.querySelector('button')!;

    if (this.phase === 'done' || this.phase === 'failed') {
      if (icon) play(icon, ARRIVE, '--duration-normal', 'kt-button-arrive');
      if (this.phase === 'failed') play(button, SHAKE, '--duration-slow', 'kt-button-shake');
    }
    if (this.phase === 'idle' && (was === 'done' || was === 'failed') && icon) {
      play(icon, flightOf(this.icon).back, '--duration-normal', 'kt-button-back');
    }
    const before = this.widthBefore;
    this.widthBefore = 0;
    if (before) void this.followWidth(before, icon);
  }

  /**
   * A label that changed length: the width follows instead of jumping. A new
   * icon draws in its own update, after this one, so it is waited for — the
   * button measured before it would be an icon short, and shrink to that
   * before snapping back. The wait ends before the frame is painted.
   */
  private async followWidth(before: number, icon: Element | null): Promise<void> {
    if (icon instanceof KtElement) await icon.updateComplete;
    const width = this.getBoundingClientRect().width;
    if (Math.abs(width - before) <= 0.5) return;
    play(
      this,
      [
        // Clipped while it moves: a label wider than the button so far is
        // cut at its edge, not spilled past it.
        { width: `${before}px`, overflow: 'clip' },
        { width: `${width}px`, overflow: 'clip' },
      ],
      '--duration-normal',
      'kt-button-resize',
    );
  }

  /** Moves focus to the button. */
  override focus(options?: FocusOptions): void {
    this.shadowRoot?.querySelector('button')?.focus(options);
  }

  override blur(): void {
    this.shadowRoot?.querySelector('button')?.blur();
  }

  private get hasLabelText(): boolean {
    return this.textContent !== null && this.textContent.trim().length > 0;
  }

  /**
   * A button inside a shadow root is invisible to the enclosing form, so
   * `type="submit"` would do nothing. Click a throwaway native button instead:
   * that runs constraint validation, fires a real `submit` event, and carries
   * `name`/`value` into the submission the way an author expects.
   */
  private submitEnclosingForm(): void {
    const form = this.closest('form');
    if (!form) return;

    const proxy = document.createElement('button');
    proxy.type = this.type;
    proxy.hidden = true;
    if (this.name) proxy.name = this.name;
    if (this.value) proxy.value = this.value;

    form.append(proxy);
    proxy.click();
    proxy.remove();
  }

  private onClick(event: MouseEvent): void {
    if (this.disabled || this.phase !== 'idle') {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (this.type !== 'button') this.submitEnclosingForm();
  }

  /** The icon for where `run()` is, and how it moves while busy. */
  private get shownIcon(): { name: string; motion: string } | null {
    const flight = flightOf(this.icon);
    switch (this.phase) {
      case 'busy':
        // An icon with a flight of its own waits still, ready to go.
        // An icon that becomes the spinner itself, or that keeps still
        // when there is no time to move, is kept rather than swapped.
        return this.icon && flight.morphs
          ? { name: this.icon, motion: '' }
          : { name: 'loader-circle', motion: 'spin' };
      case 'done':
        return { name: 'check', motion: '' };
      case 'failed':
        return { name: 'circle-alert', motion: '' };
      default:
        return this.icon ? { name: this.icon, motion: '' } : null;
    }
  }

  override render(): TemplateResult {
    const iconOnly = Boolean(this.icon) && !this.hasLabelText;
    const shown = this.shownIcon;
    const busy = this.phase === 'busy' || this.phase === 'leaving';
    // While it morphs, the icon is drawn here, point by point; see drawShape().
    const icon =
      busy && this.morphing
        ? html`<svg
            part="icon"
            class="morph"
            viewBox="0 0 24 24"
            width=${ICON_SIZE[this.size]}
            height=${ICON_SIZE[this.size]}
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path class="outline" pathLength="1"></path>
            <path class="fold" d=${FOLD}></path>
          </svg>`
        : shown
          ? html`<kt-icon
              part="icon"
              class=${shown.motion || nothing}
              name=${shown.name}
              size=${ICON_SIZE[this.size]}
            ></kt-icon>`
          : nothing;
    const replaced =
      this.phase === 'done' ? this.doneLabel : this.phase === 'failed' ? this.failedLabel : '';

    return html`<button
        part="button"
        class=${classMap({
          [this.variant]: true,
          [this.size]: true,
          'icon-only': iconOnly,
        })}
        type=${this.type}
        ?disabled=${this.disabled}
        aria-label=${this.label || nothing}
        aria-haspopup=${this.popup ?? nothing}
        aria-expanded=${this.expanded === undefined ? nothing : String(this.expanded)}
        aria-busy=${busy ? 'true' : nothing}
        aria-disabled=${this.phase === 'idle' ? nothing : 'true'}
        @click=${this.onClick}
      >
        ${this.iconPosition === 'left' ? icon : nothing}
        ${replaced && !iconOnly ? html`<span>${replaced}</span>` : nothing}
        <slot ?hidden=${Boolean(replaced) && !iconOnly}></slot>
        ${this.iconPosition === 'right' ? icon : nothing}
      </button>
      <span class="visually-hidden" role="status">${replaced}</span>`;
  }
}

defineElement('kt-button', KtButton);

declare global {
  interface HTMLElementTagNameMap {
    'kt-button': KtButton;
  }
}
