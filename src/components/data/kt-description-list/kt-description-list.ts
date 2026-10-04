import { css, html, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { KtElement, defineElement } from '#internal/kt-element';

export interface KtDescriptionItem {
  readonly term: string;
  /** The value. Empty shows a dash, so a missing value reads as missing, not as forgotten. */
  readonly detail: string;
}

export type KtDescriptionListLayout = 'horizontal' | 'stacked';

/**
 * Terms and their details — an invoice's number, customer and amount; a
 * person's email and role — the body of a detail page.
 *
 * The items are data: `list.items = [{ term, detail }]`, drawn as a real
 * `<dl>`. `horizontal`, the default, sets each term beside its detail, and
 * stacks them once the list itself is too narrow for that; `stacked` puts
 * each term over its detail, in `columns` when there is room.
 *
 * @element kt-description-list
 *
 * @csspart list - The `<dl>`.
 * @csspart item - One term and its detail.
 * @csspart term - The `<dt>`.
 * @csspart detail - The `<dd>`.
 *
 * @cssproperty --kt-description-term-width - The terms' column, horizontal. 180px.
 *
 * @example
 * ```html
 * <kt-description-list label="Invoice" bordered></kt-description-list>
 * <script>
 *   list.items = [
 *     { term: 'Invoice', detail: 'INV-2041' },
 *     { term: 'Customer', detail: 'Acme Corp' },
 *   ];
 * </script>
 * ```
 */
export class KtDescriptionList extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: block;
        container-type: inline-size;
        --kt-description-term-width: 180px;
      }

      dl {
        display: grid;
        gap: var(--gap-form);
        margin: 0;
      }
      :host([layout='stacked']) dl {
        grid-template-columns: repeat(var(--kt-description-columns, 1), minmax(0, 1fr));
        gap: var(--gap-card);
      }
      :host([columns='2']) {
        --kt-description-columns: 2;
      }
      :host([columns='3']) {
        --kt-description-columns: 3;
      }
      :host([columns='4']) {
        --kt-description-columns: 4;
      }
      /* Columns only where they fit: a narrow list is one column. */
      @container (max-width: 480px) {
        :host([layout='stacked']) dl {
          grid-template-columns: minmax(0, 1fr);
        }
      }

      .item {
        display: grid;
        gap: 2px;
        min-width: 0;
      }
      /* Beside each other once the list is wide enough for a term column. */
      @container (min-width: 480px) {
        :host([layout='horizontal']) .item {
          grid-template-columns: var(--kt-description-term-width) minmax(0, 1fr);
          gap: var(--gap-card);
          align-items: baseline;
        }
      }

      :host([bordered]) dl {
        gap: 0;
      }
      :host([bordered]) .item {
        padding: var(--padding-expand) 0;
        border-bottom: var(--border-width) solid var(--border-subtle);
      }
      :host([bordered][layout='stacked']) dl {
        column-gap: var(--gap-card);
      }

      dt {
        color: var(--text-muted);
        font: var(--font-normal-regular);
      }
      dd {
        min-width: 0;
        margin: 0;
        color: var(--text-body);
        font: var(--font-normal-medium);
        overflow-wrap: anywhere;
      }
      dd.empty {
        color: var(--text-muted);
      }
    `,
  ];

  /** The terms and their details. Set as a property: `list.items = [...]`. */
  @property({ attribute: false })
  items: readonly KtDescriptionItem[] = [];

  /** `horizontal`: each term beside its detail. `stacked`: over it. */
  @property({ type: String, reflect: true })
  layout: KtDescriptionListLayout = 'horizontal';

  /** Stacked: how many columns, 1 to 4, where there is room. */
  @property({ type: Number, reflect: true })
  columns = 1;

  /** A rule under each item. */
  @property({ type: Boolean, reflect: true })
  bordered = false;

  /** Accessible name for the list. */
  @property({ type: String })
  label = '';

  override render(): TemplateResult {
    return html`<dl part="list" aria-label=${this.label || nothing}>
      ${this.items.map(
        (item) =>
          html`<div part="item" class="item">
            <dt part="term">${item.term}</dt>
            ${
              item.detail
                ? html`<dd part="detail">${item.detail}</dd>`
                : html`<dd part="detail" class="empty">—</dd>`
            }
          </div>`,
      )}
    </dl>`;
  }
}

defineElement('kt-description-list', KtDescriptionList);

declare global {
  interface HTMLElementTagNameMap {
    'kt-description-list': KtDescriptionList;
  }
}
