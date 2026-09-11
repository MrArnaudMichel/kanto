import { css, html, nothing, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { KtElement, defineElement } from 'kanto-ds/internal/kt-element';
import { emit } from 'kanto-ds/internal/events';
import '../kt-pagination/kt-pagination.js';

export type KtSortDirection = 'asc' | 'desc' | null;
export type KtTableRow = Record<string, unknown>;

export interface KtTableColumn {
  /** Key into the row object. */
  readonly key: string;
  /** Header text. Falls back to `key`. */
  readonly label?: string;
  readonly sortable?: boolean;
  readonly align?: 'left' | 'center' | 'right';
  /** Any CSS width. */
  readonly width?: string;
}

export interface KtSortState {
  readonly key: string | null;
  readonly direction: KtSortDirection;
}

/** Renders a cell. Return `undefined` to fall back to the raw value. */
export type KtCellRenderer = (row: KtTableRow, column: KtTableColumn) => unknown;

/**
 * Sorts with a locale-aware collator, so "Ångström" files next to "Angstrom"
 * instead of after "Zeta". `numeric` also makes "Entity 2" precede
 * "Entity 10".
 */
const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

/**
 * A sortable string for any cell value.
 *
 * Objects get their JSON rather than "[object Object]", which at least sorts
 * consistently instead of collapsing every object in the column to one key.
 */
function sortableText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  try {
    return JSON.stringify(value) ?? '';
  } catch {
    return '';
  }
}

/** A row's identity: `id`, else `uid`, else the row itself. */
function rowKey(row: KtTableRow): unknown {
  return row['id'] ?? row['uid'] ?? row;
}

/**
 * A data table: tri-state sorting, single or multiple selection, paging.
 *
 * @element kt-table
 *
 * @csspart table - The `<table>`.
 * @csspart header-cell - A `<th>`.
 * @csspart row - A `<tr>`.
 * @csspart cell - A `<td>`.
 *
 * @fires kt-sort-change - Sorting changed. `detail: { key, direction }`.
 * @fires kt-selection-change - Selection changed. `detail: { selected, rows }`.
 * @fires kt-row-click - A row was clicked. `detail: { row, index }`.
 * @fires kt-page-change - The page changed. `detail: { page }`.
 *
 * @example
 * ```js
 * table.columns = [
 *   { key: 'name', label: 'Name', sortable: true },
 *   { key: 'amount', label: 'Amount', sortable: true, align: 'right' },
 * ];
 * table.data = rows;
 * ```
 */
export class KtTable extends KtElement {
  static override styles = [
    KtElement.styles,
    css`
      :host {
        display: block;
        width: 100%;
        color: var(--text-body);
        font: var(--font-normal-regular);
      }

      .scroller {
        overflow: auto;
        border-radius: var(--border-radius);
      }

      table {
        width: 100%;
        min-width: 600px;
        border-spacing: 0;
        border-collapse: separate;
      }

      thead {
        background: var(--surface-card);
        color: var(--text-muted);
      }

      th {
        padding: 16px 18px;
        font-size: 13px;
        font-weight: inherit;
        text-align: left;
        white-space: nowrap;
        vertical-align: middle;
        user-select: none;
      }

      /* Sortable headers are buttons, not clickable <th>s: a header you can
         only sort with a mouse is a table half the users cannot sort. */
      th button {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 0;
        color: inherit;
        font: inherit;
        text-align: inherit;
        background: none;
        border: none;
        cursor: pointer;
      }

      th button:focus-visible {
        outline: var(--outline-width) solid var(--color-primary-base);
        outline-offset: 2px;
      }

      .indicator {
        color: var(--color-primary-base);
        font-size: 10px;
      }

      tbody tr {
        transition: background-color 120ms linear;
      }

      tbody tr:hover {
        background: var(--color-dark-14);
      }

      tbody tr.selected {
        background: var(--color-primary-soft);
      }

      td {
        padding: 14px 18px;
        font-size: 14px;
        border-bottom: var(--border-width) solid var(--surface-hover);
      }

      :host([compact]) td {
        padding: 8px 12px;
      }
      :host([compact]) th {
        padding: 10px 12px;
      }

      .select-cell {
        width: 56px;
        text-align: center;
      }

      .placeholder {
        padding: 28px 0;
        color: var(--text-muted);
        text-align: center;
      }

      footer {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 12px;
        padding-top: 12px;
      }

      @media (max-width: 680px) {
        table {
          min-width: 100%;
        }
        td,
        th {
          padding: 10px 12px;
        }
      }
    `,
  ];

  @state()
  private page = 1;

  @property({ attribute: false })
  columns: readonly KtTableColumn[] = [];

  @property({ attribute: false })
  data: readonly KtTableRow[] = [];

  @property({ type: Boolean, reflect: true })
  selectable = false;

  @property({ type: String, attribute: 'selection-mode' })
  selectionMode: 'single' | 'multiple' = 'multiple';

  /** The identities of the selected rows. */
  @property({ attribute: false })
  selected: readonly unknown[] = [];

  /** Rows per page. Zero shows everything and hides the footer. */
  @property({ type: Number, attribute: 'page-size' })
  pageSize = 0;

  @property({ type: Boolean, reflect: true })
  loading = false;

  @property({ type: Boolean, reflect: true })
  compact = false;

  @property({ type: String, attribute: 'sort-key' })
  sortKey: string | null = null;

  @property({ type: String, attribute: 'sort-direction' })
  sortDirection: KtSortDirection = null;

  /** Renders a cell. Return `undefined` to fall back to the raw value. */
  @property({ attribute: false })
  renderCell: KtCellRenderer | undefined;

  @property({ type: String, attribute: 'empty-text' })
  emptyText = 'No data to display';

  @property({ type: String, attribute: 'loading-text' })
  loadingText = 'Loading…';

  /** Accessible name for the table. */
  @property({ type: String })
  label = '';

  /** The rows after sorting, before paging. */
  get sortedRows(): readonly KtTableRow[] {
    if (!this.sortKey || !this.sortDirection) return this.data;

    const key = this.sortKey;
    const sign = this.sortDirection === 'asc' ? 1 : -1;

    return [...this.data].sort((a, b) => {
      const left = a[key];
      const right = b[key];

      // Empty values sort to the end whichever way the column points, so a
      // descending sort does not open with a screen of blanks.
      const leftEmpty = left === null || left === undefined;
      const rightEmpty = right === null || right === undefined;
      if (leftEmpty && rightEmpty) return 0;
      if (leftEmpty) return 1;
      if (rightEmpty) return -1;

      if (typeof left === 'number' && typeof right === 'number') return (left - right) * sign;
      return collator.compare(sortableText(left), sortableText(right)) * sign;
    });
  }

  get totalPages(): number {
    if (this.pageSize <= 0) return 1;
    return Math.max(1, Math.ceil(this.data.length / this.pageSize));
  }

  /** The rows actually on screen. */
  get visibleRows(): readonly KtTableRow[] {
    const rows = this.sortedRows;
    if (this.pageSize <= 0) return rows;

    const page = Math.min(this.page, this.totalPages);
    return rows.slice((page - 1) * this.pageSize, page * this.pageSize);
  }

  /**
   * Cycles a column: unsorted → ascending → descending → unsorted. The third
   * press restoring the original order is what makes sorting undoable.
   */
  private toggleSort(column: KtTableColumn): void {
    if (!column.sortable) return;

    if (this.sortKey !== column.key) {
      this.sortKey = column.key;
      this.sortDirection = 'asc';
    } else if (this.sortDirection === 'asc') {
      this.sortDirection = 'desc';
    } else {
      this.sortKey = null;
      this.sortDirection = null;
    }

    emit(this, 'kt-sort-change', { key: this.sortKey, direction: this.sortDirection });
  }

  private isSelected(row: KtTableRow): boolean {
    return this.selected.includes(rowKey(row));
  }

  private toggleSelection(row: KtTableRow): void {
    const key = rowKey(row);

    if (this.selectionMode === 'single') {
      this.selected = this.isSelected(row) ? [] : [key];
    } else {
      this.selected = this.isSelected(row)
        ? this.selected.filter((candidate) => candidate !== key)
        : [...this.selected, key];
    }

    emit(this, 'kt-selection-change', { selected: this.selected, rows: this.selectedRows });
  }

  /** Selects or clears every row on the current page. */
  private toggleAll(): void {
    const rows = this.visibleRows;
    const keys = rows.map(rowKey);
    const allSelected = keys.every((key) => this.selected.includes(key));

    this.selected = allSelected
      ? this.selected.filter((key) => !keys.includes(key))
      : [...new Set([...this.selected, ...keys])];

    emit(this, 'kt-selection-change', { selected: this.selected, rows: this.selectedRows });
  }

  /** The selected rows themselves, not just their identities. */
  get selectedRows(): readonly KtTableRow[] {
    return this.data.filter((row) => this.selected.includes(rowKey(row)));
  }

  private onPageChange(event: Event): void {
    event.stopPropagation();
    this.page = (event as CustomEvent<{ page: number }>).detail.page;
    emit(this, 'kt-page-change', { page: this.page });
  }

  /**
   * The aria-sort value for a column.
   *
   * Not named ariaSort: HTMLElement reflects that ARIA attribute as a string
   * property, and shadowing it with a method breaks the element's own typing.
   */
  private sortStateFor(column: KtTableColumn): 'ascending' | 'descending' | 'none' {
    if (this.sortKey !== column.key || !this.sortDirection) return 'none';
    return this.sortDirection === 'asc' ? 'ascending' : 'descending';
  }

  private renderHeaderCell(column: KtTableColumn): TemplateResult {
    const title = column.label ?? column.key;
    const active = this.sortKey === column.key && this.sortDirection !== null;

    return html`<th
      part="header-cell"
      scope="col"
      style=${styleMap(column.width ? { width: column.width } : {})}
      aria-sort=${this.sortStateFor(column)}
    >
      ${
        column.sortable
          ? html`<button type="button" @click=${() => this.toggleSort(column)}>
              <span>${title}</span>
              <span class="indicator" aria-hidden="true"
                >${active ? (this.sortDirection === 'asc' ? '▲' : '▼') : ''}</span
              >
            </button>`
          : html`<span>${title}</span>`
      }
    </th>`;
  }

  private renderBody(): TemplateResult {
    const rows = this.visibleRows;
    const columnCount = this.columns.length + (this.selectable ? 1 : 0);

    if (rows.length === 0) {
      return html`<tr>
        <td colspan=${columnCount}>
          <div class="placeholder">${this.emptyText}</div>
        </td>
      </tr>`;
    }

    return html`${rows.map((row, index) => {
      const selected = this.isSelected(row);

      return html`<tr
        part="row"
        class=${classMap({ selected })}
        aria-selected=${this.selectable ? String(selected) : nothing}
        @click=${() => emit(this, 'kt-row-click', { row, index })}
      >
        ${
          this.selectable
            ? html`<td class="select-cell">
                <input
                  type=${this.selectionMode === 'single' ? 'radio' : 'checkbox'}
                  name=${this.selectionMode === 'single' ? 'kt-table-selection' : nothing}
                  .checked=${selected}
                  aria-label="Select row"
                  @click=${(event: Event) => event.stopPropagation()}
                  @change=${() => this.toggleSelection(row)}
                />
              </td>`
            : nothing
        }
        ${this.columns.map((column) => {
          const rendered = this.renderCell?.(row, column);
          return html`<td part="cell" style=${styleMap({ textAlign: column.align ?? 'left' })}>
            ${rendered === undefined ? row[column.key] : rendered}
          </td>`;
        })}
      </tr>`;
    })}`;
  }

  override render(): TemplateResult {
    if (this.loading) {
      return html`<div class="placeholder" role="status" aria-live="polite">
        ${this.loadingText}
      </div>`;
    }

    const rows = this.visibleRows;
    const allSelected = rows.length > 0 && rows.every((row) => this.isSelected(row));
    const someSelected = rows.some((row) => this.isSelected(row));

    return html`<div class="scroller">
        <table part="table" aria-label=${this.label || nothing}>
          <thead>
            <tr>
              ${
                this.selectable
                  ? html`<th class="select-cell" scope="col">
                      ${
                        this.selectionMode === 'multiple'
                          ? html`<input
                              type="checkbox"
                              .checked=${allSelected}
                              .indeterminate=${someSelected && !allSelected}
                              aria-label="Select all"
                              @change=${this.toggleAll}
                            />`
                          : nothing
                      }
                    </th>`
                  : nothing
              }
              ${this.columns.map((column) => this.renderHeaderCell(column))}
            </tr>
          </thead>
          <tbody>
            ${this.renderBody()}
          </tbody>
        </table>
      </div>

      ${
        this.pageSize > 0
          ? html`<footer>
              <kt-pagination
                .page=${Math.min(this.page, this.totalPages)}
                .totalPages=${this.totalPages}
                @kt-page-change=${this.onPageChange}
              ></kt-pagination>
            </footer>`
          : nothing
      }`;
  }
}

defineElement('kt-table', KtTable);

declare global {
  interface HTMLElementTagNameMap {
    'kt-table': KtTable;
  }
}
