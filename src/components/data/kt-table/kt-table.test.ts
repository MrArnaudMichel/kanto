import { beforeEach, describe, expect, it, vi } from 'vitest';
import { html } from 'lit';
import { fixture, settle } from '#test/fixture';
import './kt-table.js';
import type { KtTable, KtTableColumn, KtTableRow } from 'kanto-ds';

const COLUMNS: KtTableColumn[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'amount', label: 'Amount', sortable: true, align: 'right' },
  { key: 'status', label: 'Status' },
];

const DATA: KtTableRow[] = [
  { id: 1, name: 'Zeta', amount: 30, status: 'active' },
  { id: 2, name: 'Ångström', amount: 10, status: 'active' },
  { id: 3, name: 'Alpaca', amount: null, status: 'archived' },
  { id: 4, name: 'Ångström 10', amount: 20, status: 'active' },
];

const headerButtons = (el: KtTable) => [
  ...el.shadowRoot!.querySelectorAll<HTMLButtonElement>('th button'),
];
const headers = (el: KtTable) => [...el.shadowRoot!.querySelectorAll('th')];
const bodyRows = (el: KtTable) => [...el.shadowRoot!.querySelectorAll('tbody tr')];
const cellText = (el: KtTable, column = 0) =>
  bodyRows(el).map((row) => row.querySelectorAll('td')[column]!.textContent!.trim());

describe('kt-table', () => {
  let el: KtTable;

  beforeEach(async () => {
    el = await fixture<KtTable>('<kt-table></kt-table>');
    el.columns = COLUMNS;
    el.data = DATA;
    await settle(el);
  });

  it('renders a row per record', () => {
    expect(bodyRows(el)).toHaveLength(4);
    expect(headers(el)).toHaveLength(3);
  });

  it('shows the empty state with no data', async () => {
    el.data = [];
    await settle(el);
    expect(el.shadowRoot!.querySelector('.placeholder')!.textContent).toContain('No data');
  });

  it('shows only the loading state while loading', async () => {
    el.loading = true;
    await settle(el);
    expect(el.shadowRoot!.querySelector('table')).toBeNull();
    expect(el.shadowRoot!.querySelector('.placeholder')!.textContent).toContain('Loading');
  });

  it('makes sortable headers real buttons', () => {
    expect(headerButtons(el)).toHaveLength(2);
    expect(headers(el)[2]!.querySelector('button')).toBeNull();
  });

  it('cycles a column through asc, desc and back to unsorted', async () => {
    headerButtons(el)[0]!.click();
    await settle(el);
    expect(el.sortDirection).toBe('asc');
    expect(headers(el)[0]!.getAttribute('aria-sort')).toBe('ascending');

    headerButtons(el)[0]!.click();
    await settle(el);
    expect(el.sortDirection).toBe('desc');

    headerButtons(el)[0]!.click();
    await settle(el);
    expect(el.sortKey).toBeNull();
    expect(headers(el)[0]!.getAttribute('aria-sort')).toBe('none');
    expect(cellText(el)).toEqual(['Zeta', 'Ångström', 'Alpaca', 'Ångström 10']);
  });

  it('sorts text with a French collator, so accents file naturally', async () => {
    headerButtons(el)[0]!.click();
    await settle(el);
    expect(cellText(el)).toEqual(['Alpaca', 'Ångström', 'Ångström 10', 'Zeta']);
  });

  it('sorts numbers numerically, not as strings', async () => {
    headerButtons(el)[1]!.click();
    await settle(el);
    expect(cellText(el, 1)).toEqual(['10', '20', '30', '']);
  });

  it('sends empty values to the end whichever way the column points', async () => {
    headerButtons(el)[1]!.click();
    await settle(el);
    expect(cellText(el)[3]).toBe('Alpaca');

    headerButtons(el)[1]!.click();
    await settle(el);
    expect(cellText(el)[3]).toBe('Alpaca');
  });

  it('reports sort changes', async () => {
    const listener = vi.fn();
    el.addEventListener('kt-sort-change', listener);

    headerButtons(el)[0]!.click();
    await settle(el);

    expect(listener.mock.calls[0]![0].detail).toEqual({ key: 'name', direction: 'asc' });
  });

  it('reports row clicks', async () => {
    const listener = vi.fn();
    el.addEventListener('kt-row-click', listener);

    bodyRows(el)[1]!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(listener.mock.calls[0]![0].detail.row.name).toBe('Ångström');
    expect(listener.mock.calls[0]![0].detail.index).toBe(1);
  });

  describe('selection', () => {
    beforeEach(async () => {
      el.selectable = true;
      await settle(el);
    });

    it('accumulates in multiple mode', async () => {
      const listener = vi.fn();
      el.addEventListener('kt-selection-change', listener);

      const boxes = el.shadowRoot!.querySelectorAll<HTMLInputElement>('tbody input');
      boxes[0]!.dispatchEvent(new Event('change'));
      await settle(el);
      boxes[2]!.dispatchEvent(new Event('change'));
      await settle(el);

      expect(el.selected).toEqual([1, 3]);
      expect(el.selectedRows.map((r) => r['name'])).toEqual(['Zeta', 'Alpaca']);
      expect(listener).toHaveBeenCalledTimes(2);
    });

    it('replaces in single mode, and uses radios', async () => {
      el.selectionMode = 'single';
      await settle(el);

      const radios = el.shadowRoot!.querySelectorAll<HTMLInputElement>('tbody input');
      expect(radios[0]!.type).toBe('radio');

      radios[0]!.dispatchEvent(new Event('change'));
      await settle(el);
      radios[1]!.dispatchEvent(new Event('change'));
      await settle(el);

      expect(el.selected).toEqual([2]);
    });

    it('selects and clears every visible row from the header', async () => {
      const all = el.shadowRoot!.querySelector<HTMLInputElement>('thead input')!;

      all.dispatchEvent(new Event('change'));
      await settle(el);
      expect(el.selected).toEqual([1, 2, 3, 4]);

      all.dispatchEvent(new Event('change'));
      await settle(el);
      expect(el.selected).toEqual([]);
    });

    it('shows the header box as indeterminate on a partial selection', async () => {
      el.selected = [1];
      await settle(el);
      const all = el.shadowRoot!.querySelector<HTMLInputElement>('thead input')!;
      expect(all.indeterminate).toBe(true);
      expect(all.checked).toBe(false);
    });

    it('offers no select-all in single mode', async () => {
      el.selectionMode = 'single';
      await settle(el);
      expect(el.shadowRoot!.querySelector('thead input')).toBeNull();
    });
  });

  describe('paging', () => {
    beforeEach(async () => {
      el.pageSize = 2;
      await settle(el);
    });

    it('shows one page at a time', () => {
      expect(bodyRows(el)).toHaveLength(2);
      expect(el.totalPages).toBe(2);
    });

    it('moves through the pages', async () => {
      const listener = vi.fn();
      el.addEventListener('kt-page-change', listener);

      const next = el
        .shadowRoot!.querySelector('kt-pagination')!
        .shadowRoot!.querySelectorAll('kt-button')[1]!
        .shadowRoot!.querySelector<HTMLButtonElement>('button')!;
      next.click();
      await settle(el);

      expect(cellText(el)).toEqual(['Alpaca', 'Ångström 10']);
      expect(listener.mock.calls[0]![0].detail.page).toBe(2);
    });

    it('hides the footer with no page size', async () => {
      el.pageSize = 0;
      await settle(el);
      expect(el.shadowRoot!.querySelector('kt-pagination')).toBeNull();
    });
  });

  it('lets a renderer take over a cell, and falls back when it declines', async () => {
    el.renderCell = (row, column) =>
      column.key === 'status'
        ? html`<strong>${String(row['status']).toUpperCase()}</strong>`
        : undefined;
    await settle(el);

    expect(bodyRows(el)[0]!.querySelector('strong')!.textContent).toBe('ACTIVE');
    expect(cellText(el, 0)).toEqual(['Zeta', 'Ångström', 'Alpaca', 'Ångström 10']);
  });
});
