import { css, html, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { emit } from '#internal/events';
import '../kt-icon/kt-icon.js';

export type KtBadgeVariant = 'tag' | 'code' | 'category' | 'count';
export type KtBadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
export type KtBadgeSize = 'small' | 'medium';

/**
 * A compact label: a pill `tag`, a monospaced `code` token, a `category`
 * tinted with a colour of your choosing, or a `count`.
 *
 * Two independent axes, because they answer different questions. `variant` is
 * the **shape** — what kind of thing this is. `tone` is the **colour** — what
 * it means. A tag can be neutral or dangerous; so can a count. Folding them
 * into one list would give you nine variants and no way to say "a tag, but
 * this one is a warning".
 *
 * `count` is the exception that carries no border, because a number pinned to
 * a nav item is not a label with an outline — it is a mark on the thing it
 * counts.
 *
 * @element kt-badge
 *
 * @slot - The text. Falls back to the `label` attribute.
 *
 * @csspart base - The container.
 * @csspart remove - The remove button, when `removable`.
 *
 * @cssproperty --kt-badge-color - Category hue. The fill is this colour at 20%.
 *
 * @fires kt-badge-click - A `clickable` badge was activated. Cancelable.
 * @fires kt-remove - The remove button was pressed. Cancelable: cancel it and
 *   remove the badge yourself once the server agrees.
 *
 * @example
 * ```html
 * <kt-badge>Design systems</kt-badge>
 * <kt-badge tone="success">Active</kt-badge>
 * <kt-badge variant="code">--surface-card</kt-badge>
 * <kt-badge variant="category" color="#3987e5">Infrastructure</kt-badge>
 * <kt-badge variant="count" tone="danger" max="99">128</kt-badge>
 * <kt-badge icon="user" removable>Assigned to me</kt-badge>
 * ```
 */
export class KtBadge extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: inline-flex;
        vertical-align: middle;
        --kt-badge-color: var(--color-primary-hover);
      }

      .badge {
        display: inline-flex;
        align-items: center;
        gap: var(--gap-element);
        width: fit-content;
        margin: 0;
        padding: var(--padding-chip);
        color: var(--text-body);
        font: var(--font-normal-regular);
        background-color: var(--color-dark-20);
        border: var(--border-width) solid var(--color-text-600);
        border-radius: var(--radius-input);
        white-space: normal;
      }

      .small {
        padding: 2px 8px;
        font: var(--font-normal-small);
      }

      /* === TAG === */
      .tag {
        border-radius: var(--radius-pill);
      }

      /* === CODE ===
         Uses the semantic code surface rather than a ramp step: --color-dark-8
         is the darkest surface in the dark theme and pure white in the light
         one, which made this badge white-on-white. */
      .code {
        color: var(--text-code);
        font: var(--font-code-regular);
        background-color: var(--surface-code);
        border-color: var(--border-code);
      }

      /* === CATEGORY ===
         color-mix keeps the 20% fill honest for any colour notation the host
         hands us; concatenating a "33" onto a hex string produces garbage
         for rgb() and named colours. */
      .category {
        color: var(--kt-badge-color);
        background-color: color-mix(in srgb, var(--kt-badge-color) 20%, transparent);
        border-color: var(--kt-badge-color);
      }

      /* === COUNT ===
         No border: a number pinned to a nav item is a mark on the thing it
         counts, not a label with an outline of its own. */
      .count {
        min-width: 20px;
        padding: 2px 6px;
        justify-content: center;
        color: var(--text-muted);
        font: var(--font-normal-small);
        font-variant-numeric: tabular-nums;
        line-height: 1.4;
        white-space: nowrap;
        background: var(--surface-raised);
        border: none;
        border-radius: var(--radius-pill);
      }

      /* === TONES ===
         The system's tinted pair everywhere: the colour at 12% behind, the
         colour itself as the ink. The border follows on the bordered shapes
         and is simply absent on the count shape. */
      .primary {
        color: var(--color-primary-base);
        background-color: var(--color-primary-soft);
        border-color: var(--color-primary-base);
      }
      .success {
        color: var(--color-success-base);
        background-color: var(--color-success-soft);
        border-color: var(--color-success-base);
      }
      .warning {
        color: var(--color-warning-base);
        background-color: var(--color-warning-soft);
        border-color: var(--color-warning-base);
      }
      .danger {
        color: var(--color-danger-base);
        background-color: var(--color-danger-soft);
        border-color: var(--color-danger-base);
      }
      .info {
        color: var(--color-info-base);
        background-color: var(--color-info-soft);
        border-color: var(--color-info-base);
      }

      .count.primary,
      .count.success,
      .count.warning,
      .count.danger,
      .count.info {
        border: none;
      }

      /* === CLICKABLE === */
      .clickable {
        cursor: pointer;
      }
      .clickable:hover {
        outline: var(--outline-width) solid var(--text-muted);
      }
      .clickable:active {
        color: var(--color-white);
        background-color: var(--color-primary-base);
        border-color: transparent;
      }
      .clickable:focus-visible {
        outline: var(--outline-width) solid var(--color-primary-base);
        outline-offset: 2px;
      }

      .remove {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-right: -4px;
        padding: 0;
        color: inherit;
        background: none;
        border: none;
        border-radius: var(--radius-pill);
        cursor: pointer;
        opacity: 0.65;
      }

      .remove:hover {
        opacity: 1;
      }

      .remove:focus-visible {
        outline: var(--outline-width) solid var(--color-primary-base);
        outline-offset: 1px;
      }

      kt-icon {
        flex: none;
      }
    `,
  ];

  /** The shape: what kind of thing this is. */
  @property({ type: String, reflect: true })
  variant: KtBadgeVariant = 'tag';

  /** The colour: what it means. Independent of `variant`. */
  @property({ type: String, reflect: true })
  tone: KtBadgeTone = 'neutral';

  @property({ type: String, reflect: true })
  size: KtBadgeSize = 'medium';

  /** Badge text. The default slot wins when both are present. */
  @property({ type: String })
  label = '';

  /** Category hue: any CSS colour. The fill is this colour at 20%. */
  @property({ type: String })
  color = '';

  /** Lucide icon name, before the text. */
  @property({ type: String })
  icon = '';

  @property({ type: Boolean, reflect: true })
  clickable = false;

  /** Adds a remove button. Fires a cancelable `kt-remove`. */
  @property({ type: Boolean, reflect: true })
  removable = false;

  /**
   * Caps a numeric label: `max="99"` shows `99+`.
   * Ignored when the content is not a number.
   */
  @property({ type: Number })
  max?: number;

  /** Shorthand for `tone="danger"`, kept from the field components. */
  @property({ type: Boolean, reflect: true })
  error = false;

  private get display(): string {
    const raw = this.label || (this.textContent ?? '').trim();
    if (this.max === undefined) return raw;

    const n = Number(raw);
    return Number.isFinite(n) && n > this.max ? `${this.max}+` : raw;
  }

  private activate(): void {
    if (this.clickable) emit(this, 'kt-badge-click');
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (!this.clickable) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    this.activate();
  }

  private onRemove(event: Event): void {
    // Otherwise a removable clickable badge reports both at once.
    event.stopPropagation();
    emit(this, 'kt-remove');
  }

  override render(): TemplateResult {
    const tone = this.error ? 'danger' : this.tone;

    return html`<span
      part="base"
      class=${classMap({
        badge: true,
        [this.variant]: true,
        [tone]: tone !== 'neutral',
        small: this.size === 'small',
        clickable: this.clickable,
      })}
      style=${styleMap(this.color ? { '--kt-badge-color': this.color } : {})}
      role=${this.clickable ? 'button' : nothing}
      tabindex=${this.clickable ? 0 : nothing}
      @click=${this.activate}
      @keydown=${this.onKeyDown}
    >
      ${this.icon ? html`<kt-icon name=${this.icon} size="14"></kt-icon>` : nothing}
      ${this.max === undefined ? html`<slot>${this.label}</slot>` : this.display}
      ${
        this.removable
          ? html`<button
              part="remove"
              type="button"
              class="remove"
              aria-label=${`Remove ${this.display || 'this'}`}
              @click=${this.onRemove}
            >
              <kt-icon name="x" size="12"></kt-icon>
            </button>`
          : nothing
      }
    </span>`;
  }
}

defineElement('kt-badge', KtBadge);

declare global {
  interface HTMLElementTagNameMap {
    'kt-badge': KtBadge;
  }
}
