import { css, html, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { KtElement, defineElement } from '#internal/kt-element';

/**
 * Symbols people actually recognise, per platform.
 *
 * `mod` is the one to reach for: it means "the primary shortcut modifier",
 * which is Command on a Mac and Control everywhere else. `meta` stays honest —
 * on Windows the Meta key really is the Windows key, and printing "Ctrl" for it
 * would send the reader to the wrong key.
 */
const MAC: Record<string, string> = {
  mod: '⌘',
  meta: '⌘',
  cmd: '⌘',
  ctrl: '⌃',
  alt: '⌥',
  option: '⌥',
  shift: '⇧',
  enter: '↵',
  escape: 'esc',
  backspace: '⌫',
};

const OTHER: Record<string, string> = {
  mod: 'Ctrl',
  meta: 'Win',
  cmd: 'Ctrl',
  ctrl: 'Ctrl',
  alt: 'Alt',
  option: 'Alt',
  shift: 'Shift',
  enter: 'Enter',
  escape: 'Esc',
  backspace: 'Backspace',
};

/**
 * A keyboard shortcut.
 *
 * Renders per platform: `⌘ K` on a Mac, `Ctrl K` elsewhere. A shortcut printed
 * with the wrong modifier is worse than none — the reader tries it, it does not
 * work, and they stop trusting the hints.
 *
 * @element kt-kbd
 *
 * @slot - The key, when `keys` is not used.
 *
 * @csspart base - The wrapper.
 * @csspart key - One key.
 *
 * @example
 * ```html
 * <kt-kbd keys="meta k"></kt-kbd>
 * <kt-kbd>/</kt-kbd>
 * ```
 */
export class KtKbd extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        vertical-align: middle;
      }

      kbd {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 20px;
        height: 20px;
        padding: 0 5px;
        color: var(--color-text-500);
        font: var(--font-normal-small);
        font-family: var(--font-family-body);
        background: var(--surface-card);
        border: var(--border-width) solid var(--border-subtle);
        border-radius: 5px;
      }
    `,
  ];

  /** Space-separated keys: `meta k`, `ctrl shift p`. */
  @property({ type: String })
  keys = '';

  /** Forces a platform instead of sniffing the current one. */
  @property({ type: String })
  platform: 'auto' | 'mac' | 'other' = 'auto';

  private get isMac(): boolean {
    if (this.platform !== 'auto') return this.platform === 'mac';
    if (typeof navigator === 'undefined') return false;
    return /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent);
  }

  /** The keys as they will be shown. Exposed so tests and docs can read them. */
  get labels(): string[] {
    const table = this.isMac ? MAC : OTHER;
    return this.keys
      .split(/\s+/)
      .filter(Boolean)
      .map((key) => table[key.toLowerCase()] ?? key.toUpperCase());
  }

  override render(): TemplateResult {
    const labels = this.labels;

    return html`<span part="base" style="display:contents">
      ${
        labels.length > 0
          ? labels.map((label) => html`<kbd part="key">${label}</kbd>`)
          : html`<kbd part="key"><slot></slot></kbd>`
      }
    </span>`;
  }
}

defineElement('kt-kbd', KtKbd);

declare global {
  interface HTMLElementTagNameMap {
    'kt-kbd': KtKbd;
  }
}
