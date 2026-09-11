import { css, html, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { KtElement, defineElement } from 'kanto-ds/internal/kt-element';
import { emit } from 'kanto-ds/internal/events';
import '../../core/kt-button/kt-button.js';

/**
 * Previous / next paging, with the position between them.
 *
 * Extracted from the table footer so a card list or a gallery can page the same
 * way a table does.
 *
 * The two controls are `<kt-button variant="dark">`, not buttons of its own:
 * a paging control that invents its own colours, hover and disabled states is
 * how a design system ends up with two kinds of button on one screen.
 *
 * @element kt-pagination
 *
 * @csspart previous - The previous button.
 * @csspart next - The next button.
 * @csspart info - The "Page 2 / 7" text.
 *
 * @fires kt-page-change - A page was requested. `detail: { page }`.
 */
export class KtPagination extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: block;
      }

      nav {
        display: flex;
        align-items: center;
        gap: var(--gap-button);
      }

      .info {
        padding: 0 4px;
        color: var(--text-muted);
        font: var(--font-normal-small);
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }
    `,
  ];

  /** The current page, 1-based. */
  @property({ type: Number })
  page = 1;

  @property({ type: Number, attribute: 'total-pages' })
  totalPages = 1;

  @property({ type: String })
  label = 'Pagination';

  private go(target: number): void {
    const next = Math.min(Math.max(target, 1), Math.max(this.totalPages, 1));
    if (next === this.page) return;

    this.page = next;
    emit(this, 'kt-page-change', { page: next });
  }

  override render(): TemplateResult {
    const first = this.page <= 1;
    const last = this.page >= this.totalPages;

    return html`<nav aria-label=${this.label}>
      <kt-button
        part="previous"
        variant="secondary"
        size="small"
        icon="chevron-left"
        ?disabled=${first}
        @click=${() => this.go(this.page - 1)}
        >Previous</kt-button
      >

      <!-- polite, so a page change is announced without interrupting whatever
           the reader is already working through -->
      <span part="info" class="info" aria-live="polite">
        Page ${this.page} / ${this.totalPages}
      </span>

      <kt-button
        part="next"
        variant="secondary"
        size="small"
        icon="chevron-right"
        icon-position="right"
        ?disabled=${last}
        @click=${() => this.go(this.page + 1)}
        >Next</kt-button
      >
    </nav>`;
  }
}

defineElement('kt-pagination', KtPagination);

declare global {
  interface HTMLElementTagNameMap {
    'kt-pagination': KtPagination;
  }
}
