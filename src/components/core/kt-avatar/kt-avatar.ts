import { css, html, nothing, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { KtElement, defineElement } from '../../../internal/kt-element.js';
import '../kt-icon/kt-icon.js';

export type KtAvatarSize = 'small' | 'medium' | 'large';
export type KtAvatarStatus = 'online' | 'away' | 'busy' | 'offline';

/** Deterministic hue per name, so a person keeps their colour everywhere. */
const HUES = [
  'var(--color-primary-base)',
  'var(--color-info-base)',
  'var(--color-success-base)',
  'var(--color-warning-base)',
  'var(--color-danger-base)',
];

/** "Benjamin Canac" → "BC", "emma.davis@example.com" → "ED". */
export function initialsOf(name: string): string {
  const cleaned = name.includes('@') ? (name.split('@')[0] ?? '') : name;
  const parts = cleaned.split(/[\s._-]+/).filter(Boolean);

  if (parts.length === 0) return '';
  if (parts.length === 1) return (parts[0] ?? '').slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

/**
 * A person or an organisation, as a picture or as their initials.
 *
 * The fallback is not decoration: most rows in most products have no photo, so
 * the initials path is the one that renders. It picks a colour from the name,
 * which means the same person is the same colour on every screen and the eye
 * can use it.
 *
 * @element kt-avatar
 *
 * @csspart base - The avatar circle.
 * @csspart image - The `<img>`, when `src` is set and loads.
 *
 * @example
 * ```html
 * <kt-avatar name="Benjamin Canac"></kt-avatar>
 * <kt-avatar name="Emma Davis" src="/emma.jpg" status="online"></kt-avatar>
 * ```
 */
export class KtAvatar extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: inline-flex;
        --kt-avatar-size: 32px;
      }

      :host([size='small']) {
        --kt-avatar-size: 24px;
      }
      :host([size='large']) {
        --kt-avatar-size: 48px;
      }

      .avatar {
        position: relative;
        display: inline-flex;
        flex: none;
        align-items: center;
        justify-content: center;
        width: var(--kt-avatar-size);
        height: var(--kt-avatar-size);
        overflow: hidden;
        color: var(--color-white);
        font: 600 calc(var(--kt-avatar-size) * 0.38) / 1 var(--font-family-body);
        background: var(--surface-raised);
        border-radius: var(--radius-full);
        user-select: none;
      }

      :host([square]) .avatar {
        border-radius: var(--border-radius);
      }

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      /* The dot sits outside the clipped circle, so it needs its own box. */
      .status {
        position: absolute;
        right: 0;
        bottom: 0;
        width: calc(var(--kt-avatar-size) * 0.3);
        height: calc(var(--kt-avatar-size) * 0.3);
        border: 2px solid var(--surface-page);
        border-radius: var(--radius-full);
      }

      .online {
        background: var(--color-success-base);
      }
      .away {
        background: var(--color-warning-base);
      }
      .busy {
        background: var(--color-danger-base);
      }
      .offline {
        background: var(--color-text-500);
      }
    `,
  ];

  @state()
  private failed = false;

  /** The person's name. Drives the initials, the colour and the label. */
  @property({ type: String })
  name = '';

  /** Photo. Falls back to initials if it is missing or fails to load. */
  @property({ type: String })
  src = '';

  @property({ type: String, reflect: true })
  size: KtAvatarSize = 'medium';

  /** Rounds to the card radius instead of a circle — for organisations. */
  @property({ type: Boolean, reflect: true })
  square = false;

  /** Presence dot. Omit for none. */
  @property({ type: String, reflect: true })
  status?: KtAvatarStatus;

  /** Overrides the colour picked from the name. */
  @property({ type: String })
  color = '';

  override willUpdate(changed: Map<string, unknown>): void {
    // A new source deserves a fresh attempt; without this a single failure
    // would stick for the element's lifetime.
    if (changed.has('src')) this.failed = false;
  }

  private get hue(): string {
    if (this.color) return this.color;

    let sum = 0;
    for (const char of this.name) sum += char.charCodeAt(0);
    return HUES[sum % HUES.length]!;
  }

  override render(): TemplateResult {
    const initials = initialsOf(this.name);
    const showImage = Boolean(this.src) && !this.failed;

    return html`<span
      part="base"
      class="avatar"
      style=${showImage ? '' : `background:${this.hue}`}
      role="img"
      aria-label=${this.name || 'Avatar'}
    >
      ${
        showImage
          ? html`<img
              part="image"
              src=${this.src}
              alt=""
              @error=${() => {
                this.failed = true;
              }}
            />`
          : initials || html`<kt-icon name="user" size="16"></kt-icon>`
      }
      ${
        this.status
          ? html`<span class=${classMap({ status: true, [this.status]: true })}></span>`
          : nothing
      }
    </span>`;
  }
}

defineElement('kt-avatar', KtAvatar);

declare global {
  interface HTMLElementTagNameMap {
    'kt-avatar': KtAvatar;
  }
}
