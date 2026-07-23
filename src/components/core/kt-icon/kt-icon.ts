import { css, html, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { KtElement, defineElement } from '../../../internal/kt-element.js';
import { getIcon, type IconNode } from '../../../icons/registry.js';
import '../../../icons/defaults.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Names already reported as missing, so the console gets one line per icon. */
const warned = new Set<string>();

/** Builds one SVG child from a Lucide `[tag, attrs]` pair. */
function toSvgChild([tag, attrs]: IconNode[number]): SVGElement {
  const element = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (value !== undefined) element.setAttribute(name, String(value));
  }
  return element;
}

/**
 * A Lucide icon, resolved from the registry by name.
 *
 * The icon inherits `currentColor`, so it is coloured by setting `color` on
 * the element or on any ancestor — there is no colour attribute to keep in
 * sync with the surrounding text.
 *
 * Unknown names render nothing but still occupy their box, so a typo shifts no
 * layout while you find it in the console.
 *
 * @element kt-icon
 *
 * @csspart svg - The `<svg>` root.
 *
 * @example
 * ```html
 * <kt-icon name="search"></kt-icon>
 * <kt-icon name="trash-2" size="16" label="Delete"></kt-icon>
 * ```
 */
export class KtIcon extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: none;
        vertical-align: middle;
        color: inherit;
      }

      svg {
        display: block;
      }
    `,
  ];

  /** Icon name, kebab-case: `chevron-down`, `circle-alert`. */
  @property({ type: String, reflect: true })
  name = '';

  /** Width and height in pixels. */
  @property({ type: Number, reflect: true })
  size = 24;

  /** Stroke width passed to the SVG. */
  @property({ type: Number, attribute: 'stroke-width' })
  strokeWidth = 2;

  /**
   * Accessible name. Set it when the icon carries meaning on its own; leave it
   * off — the default — when adjacent text already says what this is, and the
   * icon is hidden from assistive technology.
   */
  @property({ type: String })
  label = '';

  override render(): TemplateResult | typeof nothing {
    const node = getIcon(this.name);

    if (!node) {
      if (this.name && !warned.has(this.name)) {
        warned.add(this.name);
        console.warn(
          `<kt-icon>: no icon registered as "${this.name}". ` +
            `Register it with registerIcons({ ... }) from "kanto-ds/icons".`,
        );
      }
      return html`<svg
        part="svg"
        width=${this.size}
        height=${this.size}
        viewBox="0 0 24 24"
        aria-hidden="true"
      ></svg>`;
    }

    return html`<svg
      part="svg"
      xmlns=${SVG_NS}
      width=${this.size}
      height=${this.size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width=${this.strokeWidth}
      stroke-linecap="round"
      stroke-linejoin="round"
      role=${this.label ? 'img' : nothing}
      aria-label=${this.label || nothing}
      aria-hidden=${this.label ? nothing : 'true'}
    >
      ${node.map(toSvgChild)}
    </svg>`;
  }
}

defineElement('kt-icon', KtIcon);

declare global {
  interface HTMLElementTagNameMap {
    'kt-icon': KtIcon;
  }
}
