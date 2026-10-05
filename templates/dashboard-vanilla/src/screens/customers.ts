/** The customers: filter, sort, select, act on several, inspect one. */
import {
  toaster,
  type KtConfirmDialog,
  type KtInput,
  type KtMultiSelect,
  type KtSelect,
  type KtSidePanel,
  type KtTable,
} from 'kanto-ds';
import { customerCell } from '../cells';
import { deleteCustomers, listCustomers, type Entity } from '../data/api';
import { PLANS, REGIONS } from '../data/generate';
import { button, el, pageHeader, screen } from '../dom';
import { formatMoney } from '../format';
import { activeFilters, customerPage, NO_FILTERS, PAGE_SIZE, type CustomerQuery } from '../views';

const COLUMNS = [
  { key: 'owner', label: 'Customer', sortable: true },
  { key: 'ref', label: 'Account', sortable: true, width: '120px' },
  { key: 'region', label: 'Region', sortable: true },
  { key: 'plan', label: 'Plan', sortable: true, width: '120px' },
  { key: 'amount', label: 'MRR', sortable: true, align: 'right' as const },
  { key: 'status', label: 'Status', sortable: true, width: '120px' },
];

export function customers(outlet: HTMLElement): () => void {
  let live = true;
  let all: readonly Entity[] = [];
  let query: CustomerQuery = NO_FILTERS;
  let selected: number[] = [];

  const set = (patch: Partial<CustomerQuery>) => {
    query = { ...query, page: 1, ...patch };
    draw();
  };

  // === The filters ===

  const search = el<KtInput>('kt-input', {
    class: 'customer-search',
    placeholder: 'Search customers…',
    icon: 'search',
    label: 'Search customers',
  });
  search.addEventListener('kt-input', (event) => {
    set({ query: (event as CustomEvent<{ value: string }>).detail.value });
  });

  const plan = el<KtSelect>('kt-select', {
    class: 'customer-plan',
    placeholder: 'Any plan',
    label: 'Plan',
  });
  plan.options = PLANS.map((name) => ({ id: name, label: name }));
  plan.addEventListener('kt-change', (event) => {
    set({ plan: (event as CustomEvent<{ value: string | null }>).detail.value });
  });

  const regions = el<KtMultiSelect>('kt-multi-select', {
    class: 'customer-regions',
    label: 'Region',
    placeholder: 'Any region',
  });
  regions.options = REGIONS.map((name) => ({ id: name, label: name }));
  regions.addEventListener('kt-change', (event) => {
    set({ regions: (event as CustomEvent<{ value: string[] }>).detail.value });
  });

  const clear = button('', { variant: 'secondary-no-bg', size: 'small', icon: 'x' }, () => {
    search.value = '';
    plan.value = null;
    regions.value = [];
    set({ query: '', plan: null, regions: [] });
  });

  // === The list ===

  const bulk = el('div', { class: 'bulk-bar', hidden: true });
  const count = el('span', { class: 'muted small customer-count' });
  const table = el<KtTable>('kt-table', {
    label: 'Customers',
    selectable: true,
    manual: true,
    'page-size': PAGE_SIZE,
  });
  table.columns = COLUMNS;
  table.renderCell = customerCell;
  table.addEventListener('kt-sort-change', (event) => {
    const { key, direction } = (
      event as CustomEvent<{ key: string | null; direction: 'asc' | 'desc' | null }>
    ).detail;
    query = { ...query, sortKey: key, sortDirection: direction };
    draw();
  });
  table.addEventListener('kt-page-change', (event) => {
    query = { ...query, page: (event as CustomEvent<{ page: number }>).detail.page };
    draw();
  });
  table.addEventListener('kt-selection-change', (event) => {
    selected = [...(event as CustomEvent<{ selected: number[] }>).detail.selected];
    drawBulk();
  });
  table.addEventListener('kt-row-click', (event) => {
    inspect((event as CustomEvent<{ row: Entity }>).detail.row);
  });

  // === One customer, and deleting several ===

  const panel = el<KtSidePanel>('kt-side-panel', { eyebrow: 'Customer' });
  function inspect(customer: Entity): void {
    panel.heading = customer.owner;
    panel.replaceChildren(
      el('div', { class: 'stack' }, [
        el('div', { class: 'row' }, [
          el('kt-avatar', { name: customer.owner, size: 'large' }),
          el('div', { class: 'stack tight' }, [
            el('strong', {}, [customer.owner]),
            el('span', { class: 'muted small' }, [customer.ref]),
          ]),
        ]),
        ...[
          ['Region', customer.region],
          ['Plan', customer.plan],
          ['MRR', formatMoney(customer.amount)],
          ['Last activity', customer.updated],
        ].map(([label, value]) =>
          el('div', { class: 'detail-row' }, [
            el('span', { class: 'overline' }, [label!]),
            el('span', {}, [value!]),
          ]),
        ),
        el('kt-alert', { variant: 'info', description: 'This account renews in 14 days.' }),
      ]),
      button('Close', { slot: 'footer', variant: 'dark' }, () => {
        panel.open = false;
      }),
    );
    panel.open = true;
  }

  const confirm = el<KtConfirmDialog>('kt-confirm-dialog', {
    message: 'Their history goes with them. This cannot be undone.',
    'confirm-label': 'Delete',
    variant: 'danger',
  });
  confirm.addEventListener('kt-confirm', () => {
    const ids = selected;
    confirm.open = false;
    void deleteCustomers(ids).then(async () => {
      all = await listCustomers();
      if (!live) return;
      selected = [];
      draw();
      toaster.success(`${ids.length} customer${ids.length > 1 ? 's' : ''} deleted`);
    });
  });
  confirm.addEventListener('kt-cancel', () => {
    confirm.open = false;
  });

  function drawBulk(): void {
    bulk.hidden = selected.length === 0;
    table.selected = selected;
    const plural = selected.length > 1 ? 's' : '';
    confirm.heading = `Delete ${selected.length} customer${plural}?`;
    bulk.replaceChildren(
      el('span', {}, [el('strong', {}, [String(selected.length)]), ' selected']),
      el('div', { class: 'row' }, [
        button('Email', { size: 'small', variant: 'dark', icon: 'mail' }, () =>
          toaster.success(`Emailed ${selected.length} customer${plural}`),
        ),
        button('Delete', { size: 'small', variant: 'danger', icon: 'trash-2' }, () => {
          confirm.open = true;
        }),
      ]),
    );
  }

  function draw(): void {
    const shown = customerPage(all, query);
    table.data = shown.rows;
    table.page = shown.page;
    table.totalRows = shown.total;
    table.sortKey = query.sortKey;
    table.sortDirection = query.sortDirection;
    const filters = activeFilters(query);
    table.emptyText =
      filters > 0 || query.query ? 'No customer matches these filters.' : 'No customers yet.';
    count.textContent = `${shown.total} of ${all.length} customers`;
    clear.hidden = filters === 0 && !query.query;
    clear.textContent = `Clear ${filters + (query.query ? 1 : 0)}`;
    drawBulk();
  }

  outlet.append(
    screen('customers', [
      pageHeader(
        'Workspace',
        'Customers',
        'Every account this workspace bills, with the filters the support team uses.',
        [
          button('Export', { variant: 'dark', icon: 'download' }, () =>
            toaster.info(`Exporting ${customerPage(all, query).total} customers…`),
          ),
        ],
      ),
      el('kt-card', { class: 'toolbar-card' }, [
        el('div', { class: 'toolbar' }, [
          search,
          plan,
          regions,
          el('span', { class: 'grow' }),
          clear,
        ]),
      ]),
      bulk,
      el('kt-card', {}, [table, el('div', { slot: 'footer', class: 'table-footer' }, [count])]),
      panel,
      confirm,
    ]),
  );

  table.loading = true;
  void listCustomers().then((rows) => {
    if (!live) return;
    all = rows;
    table.loading = false;
    draw();
  });
  return () => {
    live = false;
  };
}
