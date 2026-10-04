import { css, html, nothing, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { KtElement, defineElement } from '#internal/kt-element';
import { hasAssignedContent } from '#internal/slots';
import { heading } from '#internal/heading';
import '../../core/kt-icon/kt-icon.js';

export interface KtFooterLink {
  readonly label: string;
  readonly href: string;
  /** Leaves the site: marked with an icon, and given `rel="noopener"`. */
  readonly external?: boolean;
}

export interface KtFooterColumn {
  readonly heading: string;
  readonly links: readonly KtFooterLink[];
}

export type KtFooterVariant = 'columns' | 'simple';

/**
 * The site footer: a contentinfo landmark holding the brand and a word about
 * the product, columns of links, actions, and a legal line under them.
 *
 * The columns are data — `footer.columns = [{ heading, links }]` — so they are
 * laid out, named and marked alike; the brand, the actions and the legal line
 * are slots, for whatever a product puts there. It lays itself out from its
 * own width, not the viewport's: in a narrow panel it stacks as on a phone.
 *
 * `variant="simple"` is a single row — the brand, the links run together, the
 * actions — for a page that needs a footer rather than a site map.
 *
 * @element kt-footer
 *
 * @slot brand - Logo or wordmark.
 * @slot - A word under the brand: what the product is.
 * @slot actions - Buttons and links under it — social links, a newsletter form.
 * @slot legal - The bottom line: copyright, terms, privacy. Its row is left out while empty.
 *
 * @csspart base - The `<footer>`.
 * @csspart brand - The brand, its text and the actions.
 * @csspart columns - The navigation holding the columns.
 * @csspart column - One column.
 * @csspart bottom - The legal row.
 *
 * @cssproperty --kt-footer-max-width - How wide the content runs. None by default.
 * @cssproperty --kt-footer-padding-inline - The space at its sides. The card padding by default;
 *   zero lines it up with a page's content when the page already has its own.
 *
 * @example
 * ```html
 * <kt-footer label="Site">
 *   <a slot="brand" href="/">ACME</a>
 *   Invoicing for small teams.
 *   <span slot="legal">© 2026 Acme</span>
 * </kt-footer>
 * <script>
 *   footer.columns = [
 *     { heading: 'Product', links: [{ label: 'Pricing', href: '/pricing' }] },
 *     { heading: 'Company', links: [{ label: 'GitHub', href: 'https://github.com/acme', external: true }] },
 *   ];
 * </script>
 * ```
 */
export class KtFooter extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: block;
        container-type: inline-size;
        --kt-footer-max-width: none;
        --kt-footer-padding-inline: var(--padding-card);
      }

      footer {
        color: var(--text-muted);
        font: var(--font-normal-regular);
        background-color: var(--surface-page);
      }
      :host([bordered]) footer {
        border-top: var(--border-width) solid var(--border-subtle);
      }

      .inner {
        max-width: var(--kt-footer-max-width);
        margin: 0 auto;
        padding: calc(var(--padding-card) * 2) var(--kt-footer-padding-inline);
      }

      /* Stacked by default — a phone, a narrow panel — and side by side once
         the footer itself is wide enough. */
      .top {
        display: grid;
        gap: calc(var(--gap-card) * 2);
      }
      @container (min-width: 720px) {
        .top {
          grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
        }
      }

      .brand {
        display: grid;
        gap: var(--gap-form);
        align-content: start;
      }
      .brand-mark {
        display: flex;
        align-items: center;
        gap: var(--gap-button);
        color: var(--text-body);
        font: var(--font-title-h6);
        line-height: 1;
      }
      .about {
        max-width: 36ch;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--gap-button);
      }

      .columns {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: var(--gap-card);
      }
      .heading {
        margin: 0 0 var(--gap-form);
        color: var(--text-body);
        font: var(--font-normal-medium);
      }
      ul {
        display: grid;
        gap: var(--gap-button);
        margin: 0;
        padding: 0;
        list-style: none;
      }

      a {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: var(--text-muted);
        text-decoration: none;
        border-radius: var(--radius-sub-menu);
        transition: color var(--duration-instant);
      }
      a:hover {
        color: var(--text-body);
      }
      a:focus-visible {
        outline: var(--outline-width) solid var(--color-primary-base);
        outline-offset: 2px;
      }

      .bottom {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: var(--gap-button) var(--gap-card);
        margin-top: calc(var(--gap-card) * 2);
        padding-top: var(--padding-card);
        font: var(--font-normal-small);
        border-top: var(--border-width) solid var(--border-subtle);
      }
      .bottom[hidden] {
        display: none;
      }

      /* === Simple: one row, the links run together === */
      :host([variant='simple']) .top {
        grid-template-columns: none;
        align-items: center;
      }
      @container (min-width: 720px) {
        :host([variant='simple']) .top {
          grid-template-columns: auto minmax(0, 1fr);
        }
      }
      :host([variant='simple']) .about,
      :host([variant='simple']) .heading {
        display: none;
      }
      :host([variant='simple']) .columns,
      :host([variant='simple']) [part='column'],
      :host([variant='simple']) ul {
        display: flex;
        flex-wrap: wrap;
        gap: var(--gap-button) var(--gap-card);
      }
      @container (min-width: 720px) {
        :host([variant='simple']) .columns {
          justify-content: flex-end;
        }
      }
    `,
  ];

  /** The columns of links. Set as a property: `footer.columns = [...]`. */
  @property({ attribute: false })
  columns: readonly KtFooterColumn[] = [];

  /** `columns`: a heading over each list. `simple`: one row of links. */
  @property({ type: String, reflect: true })
  variant: KtFooterVariant = 'columns';

  /** A rule along the top. */
  @property({ type: Boolean, reflect: true })
  bordered = true;

  /** The level of the column headings, 2 to 6. */
  @property({ type: Number, attribute: 'heading-level' })
  headingLevel = 2;

  /** Accessible name for the footer and its navigation. */
  @property({ type: String })
  label = '';

  @state() private hasLegal = false;

  /** The first slotchange can land after the first render; read the slot once as well. */
  override firstUpdated(): void {
    this.readLegal();
  }

  private readLegal(): void {
    this.hasLegal = hasAssignedContent(this.shadowRoot?.querySelector('slot[name="legal"]'));
  }

  private link(link: KtFooterLink): TemplateResult {
    return html`<li>
      <a href=${link.href} rel=${link.external ? 'noopener' : nothing}
        >${link.label}${
          link.external
            ? html`<kt-icon name="external-link" size="14" aria-hidden="true"></kt-icon>`
            : nothing
        }</a
      >
    </li>`;
  }

  override render(): TemplateResult {
    const level = Math.max(2, this.headingLevel);
    return html`<footer part="base" role="contentinfo" aria-label=${this.label || nothing}>
      <div class="inner">
        <div class="top">
          <div part="brand" class="brand">
            <div class="brand-mark"><slot name="brand"></slot></div>
            <div class="about"><slot></slot></div>
            <div class="actions"><slot name="actions"></slot></div>
          </div>
          ${
            this.columns.length
              ? html`<nav part="columns" class="columns" aria-label=${this.label || nothing}>
                  ${this.columns.map(
                    (column) =>
                      html`<div part="column">
                        ${heading(level, column.heading, 'heading')}
                        <ul>
                          ${column.links.map((link) => this.link(link))}
                        </ul>
                      </div>`,
                  )}
                </nav>`
              : nothing
          }
        </div>
        <div part="bottom" class="bottom" ?hidden=${!this.hasLegal}>
          <slot name="legal" @slotchange=${this.readLegal}></slot>
        </div>
      </div>
    </footer>`;
  }
}

defineElement('kt-footer', KtFooter);

declare global {
  interface HTMLElementTagNameMap {
    'kt-footer': KtFooter;
  }
}
