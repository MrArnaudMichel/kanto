/** The overview: the numbers, the trend, the latest orders and what happened lately. */
import { toaster, type KtChart, type KtSelect, type KtTable } from 'kanto-ds';
import { orderCell } from '../cells';
import { getOverview, type Grain, type Overview } from '../data/api';
import { PERSON } from '../data/fixtures';
import { button, el, icon, pageHeader, screen, sectionHeader, tile } from '../dom';
import { formatMoney } from '../format';
import { hrefFor } from '../nav';

let grain: Grain = 'daily';

const ORDER_COLUMNS = [
  { key: 'ref', label: 'ID', sortable: true, width: '110px' },
  { key: 'updated', label: 'Date' },
  { key: 'status', label: 'Status', width: '130px' },
  { key: 'owner', label: 'Customer', sortable: true },
  { key: 'amount', label: 'Amount', sortable: true, align: 'right' as const },
];

export function home(outlet: HTMLElement): () => void {
  let live = true;
  let overview: Overview | undefined;

  // The period, its grain, and a refresh.
  const select = el<KtSelect>('kt-select', { class: 'grain', label: 'Grain' });
  select.clearable = false;
  select.options = [
    { id: 'daily', label: 'Daily' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
  ];
  select.value = grain;
  select.addEventListener('kt-change', (event) => {
    grain = (event as CustomEvent<{ value: Grain }>).detail.value;
    void load();
  });
  const refresh = button('Refresh', { variant: 'dark', icon: 'refresh-cw' }, () => void load());

  const tiles = el('div', { class: 'tile-row' });
  const figure = el('div', { class: 'revenue-figure' });
  const caption = el('div', { class: 'muted small' });
  const chartSlot = el('div');
  const orders = el<KtTable>('kt-table', { label: 'Latest orders', compact: true });
  orders.columns = ORDER_COLUMNS;
  orders.renderCell = orderCell;
  const activity = el('kt-timeline', { compact: true });
  const integrations = el('ul', { class: 'mini-list' });
  const storage = el('kt-meter', { 'show-legend': true });
  const storageNote = el('p', { class: 'muted small' });

  const showTotal = (index = -1) => {
    if (!overview) return;
    const point = overview.revenue[index];
    figure.textContent = formatMoney(point ?? overview.total);
    caption.textContent =
      point === undefined
        ? 'Total for the period'
        : `${overview.labels[index]} · one point in the period`;
  };

  function draw(loading: boolean): void {
    refresh.toggleAttribute('disabled', loading);
    refresh.textContent = loading ? 'Refreshing…' : 'Refresh';
    tiles.replaceChildren(...(overview?.tiles ?? []).map((figure) => tile(figure, loading)));
    orders.loading = loading;
    if (loading || !overview) {
      chartSlot.replaceChildren(el('kt-skeleton', { variant: 'rect', height: '240px' }));
      return;
    }
    const chart = el<KtChart>('kt-chart', {
      type: 'area',
      height: 240,
      smooth: true,
      label: 'Revenue over the selected period',
    });
    chart.labels = [...overview.labels];
    chart.series = [{ name: 'Revenue', values: [...overview.revenue] }];
    chart.format = (n: number) => formatMoney(n);
    chart.addEventListener('kt-point-hover', (event) => {
      showTotal((event as CustomEvent<{ index: number }>).detail.index);
    });
    chartSlot.replaceChildren(chart);
    showTotal();

    orders.data = overview.orders;
    activity.replaceChildren(
      ...overview.activity.map((event) =>
        el(
          'kt-timeline-item',
          { heading: event.heading, time: event.time, icon: event.icon, variant: event.variant },
          [event.body],
        ),
      ),
    );
    integrations.replaceChildren(
      ...overview.integrations.map((entry) =>
        el('li', { class: 'mini-row' }, [
          el('span', { class: 'mini-icon' }, [icon(entry.icon)]),
          el('span', { class: 'mini-copy' }, [
            el('span', { class: 'mini-title' }, [entry.name]),
            el('span', { class: 'muted small' }, [entry.note]),
          ]),
          el('kt-badge', { tone: entry.connected ? 'success' : 'neutral' }, [
            entry.connected ? 'Connected' : 'Off',
          ]),
        ]),
      ),
    );
    Object.assign(storage, {
      max: overview.storage.total,
      segments: overview.storage.segments,
      format: (n: number) => `${n} GB`,
    });
    storageNote.textContent = `${overview.storage.used} GB of ${overview.storage.total} GB used. Backups are pruned after 90 days.`;
  }

  async function load(): Promise<void> {
    draw(true);
    const next = await getOverview(grain);
    if (!live) return;
    overview = next;
    draw(false);
  }

  const panel = (heading: string, link: { label: string; href: string }, body: Node[]) =>
    el('kt-card', {}, [
      el('div', { slot: 'header', class: 'card-head' }, [sectionHeader(heading, link)]),
      ...body,
    ]);

  outlet.append(
    screen('home', [
      pageHeader(
        'Dashboard',
        `Welcome back, ${PERSON.name.split(' ')[0]}`,
        'An overview of the workspace: revenue, recent orders, integrations and what changed.',
        [
          button('Export', { variant: 'dark', icon: 'download' }, () =>
            toaster.info('Export started: the file will be in Files.'),
          ),
          button('New order', { icon: 'plus' }, () =>
            toaster.info('Orders are created from a customer: open one in Customers.'),
          ),
        ],
      ),
      el('kt-card', { class: 'toolbar-card' }, [
        el('div', { class: 'toolbar' }, [
          el('span', { class: 'row muted' }, [icon('calendar'), 'Aug 12 – Sep 10, 2026']),
          select,
          el('span', { class: 'grow' }),
          refresh,
        ]),
      ]),
      tiles,
      el('kt-card', {}, [
        el('div', { slot: 'header' }, [
          el('div', { class: 'overline' }, ['Revenue']),
          figure,
          caption,
        ]),
        chartSlot,
      ]),
      el('section', { class: 'stack' }, [
        sectionHeader('Latest orders', { label: 'See all customers', href: hrefFor('/customers') }),
        el('kt-card', {}, [orders]),
      ]),
      el('div', { class: 'panel-row' }, [
        panel('Recent activity', { label: 'All activity', href: hrefFor('/activity') }, [activity]),
        panel('Integrations', { label: 'Manage', href: hrefFor('/integrations') }, [integrations]),
        panel('Storage', { label: 'Details', href: hrefFor('/files') }, [storage, storageNote]),
      ]),
    ]),
  );
  void load();
  return () => {
    live = false;
  };
}
