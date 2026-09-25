import { css, html, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { KtElement, defineElement } from '../../../internal/kt-element.js';
import { emit } from '../../../internal/events.js';
import '../../core/kt-icon/kt-icon.js';

/**
 * Previous / next paging, with the position between them.
 *
 * Extracted from the table footer so a card list or a gallery can page the same
 * way a table does.
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
        gap: 12px;
      }

      button {
        padding: 6px 10px;
        color: var(--text-body);
        font: var(--font-normal-small);
        background: transparent;
        border: var(--border-width) solid var(--border-subtle);
        border-radius: 6px;
        cursor: pointer;
      }

      button:hover:not(:disabled) {
        background: var(--color-dark-14);
      }

      button:disabled {
        color: var(--text-disabled);
        cursor: not-allowed;
      }

      button:focus-visible {
        outline: var(--outline-width) solid var(--color-primary-base);
        outline-offset: 1px;
      }

      .info {
        color: var(--text-muted);
        font: var(--font-normal-small);
        font-variant-numeric: tabular-nums;
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
      <button
        part="previous"
        type="button"
        ?disabled=${first}
        aria-label="Previous page"
        @click=${() => this.go(this.page - 1)}
      >
        <kt-icon name="chevron-left" size="16"></kt-icon>
        Previous
      </button>

      <!-- polite, so a page change is announced without interrupting whatever
           the reader is already working through -->
      <span part="info" class="info" aria-live="polite">
        Page ${this.page} / ${this.totalPages}
      </span>

      <button
        part="next"
        type="button"
        ?disabled=${last}
        aria-label="Next page"
        @click=${() => this.go(this.page + 1)}
      >
        Next
        <kt-icon name="chevron-right" size="16"></kt-icon>
      </button>
    </nav>`;
  }
}

defineElement('kt-pagination', KtPagination);

declare global {
  interface HTMLElementTagNameMap {
    'kt-pagination': KtPagination;
  }
}
