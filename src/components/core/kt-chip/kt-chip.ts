import { css, html, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { KtElement, defineElement } from '../../../internal/kt-element.js';
import { emit } from '../../../internal/events.js';

export type KtChipVariant = 'tag' | 'code' | 'category';

/**
 * A compact label: a pill `tag`, a monospaced `code` token, or a `category`
 * badge tinted with a colour of your choosing.
 *
 * @element kt-chip
 *
 * @slot - The chip text. Falls back to the `label` attribute.
 *
 * @csspart base - The chip container.
 *
 * @cssproperty --kt-chip-color - Category hue. The fill is this colour at 20%.
 *
 * @fires kt-chip-click - A `clickable` chip was activated. Cancelable.
 */
export class KtChip extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: inline-flex;
        vertical-align: middle;
        --kt-chip-color: var(--color-primary-hover);
      }

      .chip {
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

      /* === TAG === */
      .tag {
        border-radius: var(--radius-pill);
      }

      /* === CODE === */
      .code {
        color: var(--color-white);
        font: var(--font-code-regular);
        background-color: var(--color-dark-8);
        border: none;
      }

      /* === CATEGORY ===
         color-mix keeps the 20% fill honest for any colour notation the host
         hands us; the old build concatenated a "33" onto a hex string and
         produced garbage for rgb() and named colours. */
      .category {
        color: var(--kt-chip-color);
        background-color: color-mix(in srgb, var(--kt-chip-color) 20%, transparent);
        border-color: var(--kt-chip-color);
      }

      /* === ERROR === */
      .error {
        color: var(--color-danger-base);
        background-color: var(--color-danger-soft);
        border-color: var(--color-danger-base);
        outline: none;
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
    `,
  ];

  @property({ type: String, reflect: true })
  variant: KtChipVariant = 'tag';

  /** Chip text. The default slot wins when both are present. */
  @property({ type: String })
  label = '';

  /** Category hue: any CSS colour. The fill is this colour at 20%. */
  @property({ type: String })
  color = '';

  @property({ type: Boolean, reflect: true })
  clickable = false;

  /** Switches the chip to the danger palette, whatever the variant. */
  @property({ type: Boolean, reflect: true })
  error = false;

  private activate(): void {
    if (this.clickable) emit(this, 'kt-chip-click');
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (!this.clickable) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    this.activate();
  }

  override render(): TemplateResult {
    return html`<span
      part="base"
      class=${classMap({
        chip: true,
        [this.variant]: true,
        clickable: this.clickable,
        error: this.error,
      })}
      style=${styleMap(this.color ? { '--kt-chip-color': this.color } : {})}
      role=${this.clickable ? 'button' : nothing}
      tabindex=${this.clickable ? 0 : nothing}
      @click=${this.activate}
      @keydown=${this.onKeyDown}
    >
      <slot>${this.label}</slot>
    </span>`;
  }
}

defineElement('kt-chip', KtChip);

declare global {
  interface HTMLElementTagNameMap {
    'kt-chip': KtChip;
  }
}
