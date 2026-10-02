import { css, html, nothing, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { KtElement, defineElement } from '../../../internal/kt-element.js';
import { emit } from '../../../internal/events.js';
import '../kt-icon/kt-icon.js';

/**
 * A block of code on a recessed surface, with its language and a copy button.
 *
 * The element owns the chrome — surface, label, scrolling, copy — and nothing
 * else. **Highlighting is the caller's**: slot in whatever markup a highlighter
 * produced, or plain text for none. A design system that bundled a syntax
 * highlighter would be picking your bundle size and your language set for you.
 *
 * ```html
 * <kt-code language="js">const total = items.length;</kt-code>
 *
 * <kt-code language="ts" copy>
 *   <span class="hljs-keyword">const</span> total = items.length;
 * </kt-code>
 * ```
 *
 * For a token or an identifier inside a sentence, reach for
 * `<kt-badge variant="code">` instead — this is for blocks.
 *
 * @element kt-code
 *
 * @slot - The code. Plain text, or a highlighter's markup.
 *
 * @csspart base - The container.
 * @csspart header - The language row.
 * @csspart pre - The scrolling `<pre>`.
 *
 * @fires kt-copy - The copy button was pressed. `detail: { code }`.
 */
export class KtCode extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: block;
      }

      .base {
        overflow: hidden;
        background: var(--surface-code);
        border: var(--border-width) solid var(--border-code);
        border-radius: var(--border-radius);
      }

      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--gap-button);
        padding: 6px 8px 6px 14px;
        border-bottom: var(--border-width) solid var(--border-code);
      }

      .language {
        color: var(--color-text-500);
        font: var(--font-normal-small);
        letter-spacing: 1px;
        text-transform: uppercase;
      }

      .copy {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 8px;
        color: var(--text-muted);
        font: var(--font-normal-small);
        background: transparent;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        transition:
          color var(--duration-instant),
          background-color var(--duration-instant);
      }

      .copy:hover {
        color: var(--text-body);
        background: var(--surface-raised);
      }

      .copy:focus-visible {
        outline: var(--outline-width) solid var(--color-primary-base);
        outline-offset: 1px;
      }

      .copied {
        color: var(--color-success-base);
      }

      pre {
        margin: 0;
        padding: 14px;
        overflow-x: auto;
        scrollbar-width: thin;
      }

      code {
        font: var(--font-code-regular);
        color: var(--text-code);
      }

      /* A block with no header should not leave a stray rule behind. */
      .bare pre {
        padding-top: 14px;
      }
    `,
  ];

  /** How long the copy button stays in its confirmed state. */
  private static readonly COPIED_MS = 1600;

  private copiedTimer: ReturnType<typeof setTimeout> | undefined;

  @state()
  private copied = false;

  /** Language label, shown uppercase. Purely informative. */
  @property({ type: String })
  language = '';

  /** Shows the copy button. */
  @property({ type: Boolean })
  copy = false;

  /** Accessible name for the block, when the language alone is not enough. */
  @property({ type: String })
  label = '';

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.copiedTimer !== undefined) clearTimeout(this.copiedTimer);
  }

  /** The code as plain text, whatever markup it is wrapped in. */
  get code(): string {
    return (this.textContent ?? '').replace(/^\n+|\n+$/g, '');
  }

  private async copyToClipboard(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.code);
      this.copied = true;

      if (this.copiedTimer !== undefined) clearTimeout(this.copiedTimer);
      this.copiedTimer = setTimeout(() => {
        this.copied = false;
      }, KtCode.COPIED_MS);
    } catch {
      // Denied permission, or an insecure origin. Nothing useful to show, and
      // failing loudly over a convenience button helps no one.
    }
    emit(this, 'kt-copy', { code: this.code });
  }

  override render(): TemplateResult {
    const hasHeader = Boolean(this.language) || this.copy;

    return html`<div part="base" class=${hasHeader ? 'base' : 'base bare'}>
      ${
        hasHeader
          ? html`<div part="header" class="header">
              <span class="language">${this.language}</span>
              ${
                this.copy
                  ? html`<button
                      type="button"
                      class=${this.copied ? 'copy copied' : 'copy'}
                      aria-label=${this.copied ? 'Copied' : 'Copy code'}
                      @click=${this.copyToClipboard}
                    >
                      <kt-icon name=${this.copied ? 'check' : 'copy'} size="14"></kt-icon>
                      ${this.copied ? 'Copied' : 'Copy'}
                    </button>`
                  : nothing
              }
            </div>`
          : nothing
      }

      <pre
        part="pre"
        tabindex="0"
        aria-label=${this.label || nothing}
      ><code><slot></slot></code></pre>
    </div>`;
  }
}

defineElement('kt-code', KtCode);

declare global {
  interface HTMLElementTagNameMap {
    'kt-code': KtCode;
  }
}
