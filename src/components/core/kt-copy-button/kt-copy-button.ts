import { css, html, nothing, type TemplateResult } from 'lit';
import { property, query } from 'lit/decorators.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { emit } from '#internal/events';
import { strings } from '#internal/strings';
import '../kt-button/kt-button.js';
import type { KtButton, KtButtonSize, KtButtonVariant } from '../kt-button/kt-button.js';

/**
 * Copies a value to the clipboard and says it did: an API key, an install
 * command, a share link.
 *
 * Built on `kt-button`'s `run()`: on success the tick comes in and the label
 * reads "Copied" for two seconds — announced, as the button announces it — and
 * if the browser refuses the clipboard, the button shakes and nothing is said
 * to have been copied.
 *
 * @element kt-copy-button
 *
 * @csspart button - The `kt-button`.
 *
 * @fires kt-copy - The value was copied. `detail: { value }`.
 *
 * @example
 * ```html
 * <kt-copy-button value="npm install kanto-ds"></kt-copy-button>
 * <kt-copy-button value="sk_live_51H…" icon-only label="Copy the API key"></kt-copy-button>
 * ```
 */
export class KtCopyButton extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: inline-flex;
        vertical-align: middle;
      }
    `,
  ];

  /** What is copied. */
  @property({ type: String })
  value = '';

  /** The button's words. Defaults to the translated "Copy". */
  @property({ type: String })
  label = '';

  /** Said once it has copied. Defaults to the translated "Copied". */
  @property({ type: String, attribute: 'copied-label' })
  copiedLabel = '';

  /** The icon alone, named by `label`. */
  @property({ type: Boolean, attribute: 'icon-only' })
  iconOnly = false;

  @property({ type: String })
  variant: KtButtonVariant = 'secondary';

  @property({ type: String })
  size: KtButtonSize = 'medium';

  @query('kt-button') private button!: KtButton;

  /** Copies `value`, as a click does. Resolves once copied; rejects if the browser refused. */
  async copy(): Promise<void> {
    const value = this.value;
    await this.button.run(() => navigator.clipboard.writeText(value));
    emit(this, 'kt-copy', { value });
  }

  override render(): TemplateResult {
    const s = strings();
    const label = this.label || s.copy;
    return html`<kt-button
      part="button"
      icon="copy"
      variant=${this.variant}
      size=${this.size}
      label=${this.iconOnly ? label : nothing}
      done-label=${this.copiedLabel || s.copied}
      @click=${() => void this.copy().catch(() => undefined)}
      >${this.iconOnly ? nothing : label}</kt-button
    >`;
  }
}

defineElement('kt-copy-button', KtCopyButton);

declare global {
  interface HTMLElementTagNameMap {
    'kt-copy-button': KtCopyButton;
  }
}
