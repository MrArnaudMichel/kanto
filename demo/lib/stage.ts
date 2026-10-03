/**
 * The home page's stage: one small product, whole and live — an overview
 * with its figures, a chart, a form that sends and the latest invoices, and
 * behind the sidebar its invoices, customers, reports and settings — under a
 * row of colours that re-themes it alone. It is the first thing a visitor sees, so
 * it shows what Kanto is for rather than how it is written.
 */
import { html, type TemplateResult } from 'lit';
import { ref } from 'lit/directives/ref.js';
import {
  KT_ACCENTS,
  setAppearance,
  type KtButton,
  type KtTableColumn,
  type KtTableRow,
} from 'kanto-ds';
import { arrows } from './appearance.js';

let accent: string | null = null;

type Period = 'week' | 'month' | 'year';

/** What each period shows: the three figures and the chart under them. */
const PERIODS: Record<
  Period,
  { revenue: [string, string]; overdue: string; labels: string[]; values: number[] }
> = {
  week: {
    revenue: ['$12,480', '+4%'],
    overdue: '3',
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    values: [1.4, 2.1, 1.8, 2.6, 2.3, 0.9, 1.3],
  },
  month: {
    revenue: ['$48,210', '+12%'],
    overdue: '3',
    labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
    values: [31, 36, 33, 41, 44, 48],
  },
  year: {
    revenue: ['$512,940', '+31%'],
    overdue: '11',
    labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
    values: [29, 34, 41, 27, 30, 38, 31, 36, 33, 41, 44, 48],
  },
};
/** Invoices sent before the visit, per period; the ones sent on the page add to each. */
const SENT: Record<Period, number> = { week: 52, month: 214, year: 2418 };

type Invoice = { id: string; customer: string; amount: string; status: string };

let period: Period = 'month';
let invoices: Invoice[] = [];
let sentHere = 0;
/** What the stage's search holds: it narrows the table to matching invoices. */
let query = '';

type View = 'Overview' | 'Invoices' | 'Customers' | 'Reports' | 'Settings';
let view: View = 'Overview';
let statusFilter = 'All';

/** Back to the site's accent and the stage's first state, for the next visit. */
export function resetStage(): void {
  accent = null;
  period = 'month';
  invoices = [];
  sentHere = 0;
  query = '';
  view = 'Overview';
  statusFilter = 'All';
}

const NAV: readonly { icon: string; label: View }[] = [
  { icon: 'layout-dashboard', label: 'Overview' },
  { icon: 'file-text', label: 'Invoices' },
  { icon: 'users', label: 'Customers' },
  { icon: 'chart-pie', label: 'Reports' },
  { icon: 'settings', label: 'Settings' },
];

const INVOICES: readonly Invoice[] = [
  { id: 'INV-2041', customer: 'Acme Corp', amount: '$1,200', status: 'Paid' },
  { id: 'INV-2040', customer: 'Globex', amount: '$860', status: 'Pending' },
  { id: 'INV-2039', customer: 'Initech', amount: '$2,450', status: 'Paid' },
  { id: 'INV-2038', customer: 'Umbrella', amount: '$320', status: 'Overdue' },
  { id: 'INV-2037', customer: 'Hooli', amount: '$4,100', status: 'Paid' },
  { id: 'INV-2036', customer: 'Stark Industries', amount: '$980', status: 'Overdue' },
  { id: 'INV-2035', customer: 'Wayne Enterprises', amount: '$2,760', status: 'Pending' },
  { id: 'INV-2034', customer: 'Globex', amount: '$1,540', status: 'Paid' },
];

const CLIENTS = [
  { name: 'Acme Corp', contact: 'Dana Whitfield', invoices: 18, revenue: '$21,600', plan: 'Team' },
  { name: 'Globex', contact: 'Hank Scorpio', invoices: 11, revenue: '$9,460', plan: 'Starter' },
  { name: 'Initech', contact: 'Bill Lumbergh', invoices: 9, revenue: '$22,050', plan: 'Team' },
  { name: 'Hooli', contact: 'Gavin Belson', invoices: 6, revenue: '$24,600', plan: 'Enterprise' },
  { name: 'Umbrella', contact: 'Alice Abernathy', invoices: 4, revenue: '$1,280', plan: 'Starter' },
];
const PLANS: Record<string, string> = { Starter: 'neutral', Team: 'primary', Enterprise: 'info' };

const STATUSES = ['All', 'Paid', 'Pending', 'Overdue'];

const COLUMNS = [
  { key: 'id', label: 'Invoice' },
  { key: 'customer', label: 'Customer', sortable: true },
  { key: 'amount', label: 'Amount', sortable: true, align: 'right' as const },
  { key: 'status', label: 'Status' },
];

const CUSTOMERS = [
  { id: 'acme', label: 'Acme Corp' },
  { id: 'globex', label: 'Globex' },
  { id: 'initech', label: 'Initech' },
];

const TONES: Record<string, string> = { Paid: 'success', Pending: 'warning', Overdue: 'danger' };

/** The status column as a badge in its tone; every other cell as it is. */
function statusBadge(row: KtTableRow, column: KtTableColumn): unknown {
  if (column.key !== 'status') return undefined;
  const status = String(row['status']);
  return html`<kt-badge tone=${TONES[status] ?? 'neutral'}>${status}</kt-badge>`;
}

/** The row of colours over the stage. */
function swatches(current: string, onPick: (id: string) => void): TemplateResult {
  const ids = KT_ACCENTS.map((choice) => choice.id);
  const onKeyDown = arrows(ids, 'data-accent-id', onPick);
  return html`<div class="stage-colours">
    <span class="stage-colours-label" id="stage-colours-label">Try a colour</span>
    <div class="stage-swatches" role="radiogroup" aria-labelledby="stage-colours-label">
      ${KT_ACCENTS.map(
        (choice, index) =>
          html`<button
            type="button"
            class="accent-swatch"
            role="radio"
            data-accent-id=${choice.id}
            aria-label=${choice.label}
            aria-checked=${choice.id === current ? 'true' : 'false'}
            tabindex=${choice.id === current ? 0 : -1}
            style=${`--swatch: ${choice.color}`}
            @click=${() => onPick(choice.id)}
            @keydown=${(event: KeyboardEvent) => onKeyDown(event, index)}
          ></button>`,
      )}
    </div>
  </div>`;
}

/** The invoices whose number or customer holds the query, ignoring case. */
function matching(list: readonly Invoice[], text: string): Invoice[] {
  const wanted = text.trim().toLowerCase();
  return wanted
    ? list.filter((invoice) => `${invoice.id} ${invoice.customer}`.toLowerCase().includes(wanted))
    : [...list];
}

/** Adds the invoice the form holds to the top of the table, and counts it. */
function record(form: Element): void {
  const select = form.querySelector<HTMLElement & { value: string | null }>('kt-select');
  const amount = form.querySelector<HTMLElement & { value: number | null }>('kt-number-input');
  const customer = CUSTOMERS.find((choice) => choice.id === select?.value)?.label ?? 'Acme Corp';
  const last = Number(invoices[0]?.id.replace(/\D/g, '') ?? 2041);
  invoices = [
    {
      id: `INV-${last + 1}`,
      customer,
      amount: `$${(amount?.value ?? 0).toLocaleString('en-US')}`,
      status: 'Pending',
    },
    ...invoices,
  ];
  sentHere += 1;
}

/** A page's title, with what it can be narrowed by beside it. */
const head = (title: View, control: TemplateResult | string = '') =>
  html`<div class="stage-head">
    <h2 class="stage-title">${title}</h2>
    ${control}
  </div>`;

const invoiceTable = (rows: Invoice[], label: string) =>
  html`<kt-table
    .columns=${COLUMNS}
    .data=${rows}
    .renderCell=${statusBadge}
    label=${label}
  ></kt-table>`;

function overview(rerender: () => void): TemplateResult {
  const figures = PERIODS[period];
  return html`${head(
      'Overview',
      html`<kt-segmented-control
        size="small"
        label="Period"
        .options=${[
          { value: 'week', label: 'Week' },
          { value: 'month', label: 'Month' },
          { value: 'year', label: 'Year' },
        ]}
        .value=${period}
        @kt-change=${(event: CustomEvent<{ value: Period }>) => {
          period = event.detail.value;
          rerender();
        }}
      ></kt-segmented-control>`,
    )}
    <div class="stage-stats">
      <kt-stat
        label="Revenue"
        value=${figures.revenue[0]}
        delta=${figures.revenue[1]}
        trend="up"
      ></kt-stat>
      <kt-stat
        label="Invoices sent"
        value=${(SENT[period] + sentHere).toLocaleString('en-US')}
        delta="+8%"
        trend="up"
      ></kt-stat>
      <kt-stat label="Overdue" value=${figures.overdue} delta="-2" trend="down" inverted></kt-stat>
    </div>
    <div class="stage-grid">
      <section class="stage-panel">
        <h3>Revenue by ${period === 'week' ? 'day' : 'month'}</h3>
        <kt-chart
          type="bar"
          label=${`Revenue by ${period === 'week' ? 'day' : 'month'}, in thousands`}
          height="196"
          .labels=${figures.labels}
          .series=${[{ name: 'Revenue', values: figures.values }]}
        ></kt-chart>
      </section>
      <section class="stage-panel stage-send">
        <h3>New invoice</h3>
        <kt-label-input label="Customer">
          <kt-select .options=${CUSTOMERS} value="acme"></kt-select>
        </kt-label-input>
        <kt-label-input label="Amount">
          <kt-number-input
            value="1200"
            min="0"
            step="50"
            .formatOptions=${{ style: 'currency', currency: 'USD' }}
          ></kt-number-input>
        </kt-label-input>
        <kt-button
          icon="send"
          done-label="Sent"
          full-width
          @click=${(event: Event) => {
            const button = event.currentTarget as KtButton;
            void button
              .run(() => new Promise((done) => setTimeout(done, 1400)))
              .then(() => {
                record(button.closest('.stage-send')!);
                rerender();
              });
          }}
          >Send invoice</kt-button
        >
      </section>
    </div>
    <section class="stage-panel stage-table">
      <h3>Recent invoices</h3>
      ${invoiceTable(matching(invoices, query).slice(0, 4), 'Recent invoices')}
    </section>`;
}

function invoicesPage(rerender: () => void): TemplateResult {
  const rows = matching(invoices, query).filter(
    (invoice) => statusFilter === 'All' || invoice.status === statusFilter,
  );
  return html`${head(
      'Invoices',
      html`<kt-segmented-control
        size="small"
        label="Status"
        .options=${STATUSES.map((status) => ({ value: status, label: status }))}
        .value=${statusFilter}
        @kt-change=${(event: CustomEvent<{ value: string }>) => {
          statusFilter = event.detail.value;
          rerender();
        }}
      ></kt-segmented-control>`,
    )}
    <section class="stage-panel">
      ${
        rows.length
          ? invoiceTable(rows, 'Invoices')
          : html`<kt-empty-state
              icon="file-text"
              heading="No invoices match"
              description="Try another status, or clear the search."
            ></kt-empty-state>`
      }
    </section>`;
}

function customersPage(): TemplateResult {
  return html`${head('Customers', html`<kt-button size="small" icon="plus">Add customer</kt-button>`)}
    <ul class="stage-list">
      ${CLIENTS.map(
        (client) =>
          html`<li class="stage-panel">
            <kt-avatar name=${client.contact}></kt-avatar>
            <span class="stage-list-who">
              <strong>${client.name}</strong>
              <span>${client.contact}</span>
            </span>
            <kt-badge tone=${PLANS[client.plan] ?? 'neutral'}>${client.plan}</kt-badge>
            <span class="stage-list-figure">${client.invoices} invoices</span>
            <span class="stage-list-figure">${client.revenue}</span>
          </li>`,
      )}
    </ul>`;
}

function reportsPage(): TemplateResult {
  return html`${head('Reports')}
    <div class="stage-grid">
      <section class="stage-panel">
        <h3>Invoices by status</h3>
        <kt-chart
          type="doughnut"
          label="Invoices by status"
          height="196"
          .labels=${['Paid', 'Pending', 'Overdue']}
          .series=${[{ name: 'Invoices', values: [168, 35, 11] }]}
        ></kt-chart>
      </section>
      <section class="stage-panel stage-goals">
        <h3>This quarter</h3>
        <kt-meter label="Revenue goal" value="72" used="$144,600" total="of $200,000"></kt-meter>
        <kt-meter label="Paid on time" value="86" used="86%" total="of invoices"></kt-meter>
        <kt-meter label="New customers" value="40" used="12" total="of 30"></kt-meter>
      </section>
    </div>
    <section class="stage-panel">
      <h3>Revenue, this year against last</h3>
      <kt-chart
        type="line"
        label="Revenue, this year against last, in thousands"
        height="180"
        .labels=${PERIODS.year.labels}
        .series=${[
          { name: 'This year', values: PERIODS.year.values },
          { name: 'Last year', values: [22, 25, 30, 24, 26, 29, 27, 30, 28, 31, 33, 35] },
        ]}
      ></kt-chart>
    </section>`;
}

function settingsPage(): TemplateResult {
  return html`${head('Settings')}
    <section class="stage-panel stage-settings">
      <div class="stage-settings-pair">
        <kt-label-input label="Company name">
          <kt-input value="Northwind Trading"></kt-input>
        </kt-label-input>
        <kt-label-input label="Currency">
          <kt-select
            .options=${[
              { id: 'usd', label: 'US dollar' },
              { id: 'eur', label: 'Euro' },
              { id: 'gbp', label: 'Pound sterling' },
            ]}
            value="usd"
          ></kt-select>
        </kt-label-input>
      </div>
      <kt-slider
        label="Payment terms, in days"
        min="0"
        max="90"
        step="15"
        value="30"
        show-value
      ></kt-slider>
      <kt-toggle checked>Remind customers before an invoice is due</kt-toggle>
      <kt-toggle>Send me a weekly summary</kt-toggle>
      <div class="stage-settings-save">
        <kt-button variant="secondary">Discard</kt-button>
        <kt-button
          icon="check"
          done-label="Saved"
          @click=${(event: Event) =>
            void (event.currentTarget as KtButton).run(
              () => new Promise((done) => setTimeout(done, 900)),
            )}
          >Save changes</kt-button
        >
      </div>
    </section>`;
}

const VIEWS: Record<View, (rerender: () => void) => TemplateResult> = {
  Overview: overview,
  Invoices: invoicesPage,
  Customers: customersPage,
  Reports: reportsPage,
  Settings: settingsPage,
};

export function stage({
  siteAccent,
  rerender,
}: {
  /** The site's own accent, which the stage starts in. */
  siteAccent: string;
  rerender: () => void;
}): TemplateResult {
  const shown =
    accent ?? (KT_ACCENTS.some((choice) => choice.id === siteAccent) ? siteAccent : 'violet');
  if (invoices.length === 0) invoices = [...INVOICES];

  return html`${swatches(shown, (id) => {
      accent = id;
      rerender();
    })}
    <div
      class="stage"
      ${ref((element) => {
        // The accent on the stage alone; the rest of the page keeps the site's.
        if (element instanceof HTMLElement) setAppearance({ accent: shown }, element);
      })}
    >
      <div class="stage-bar">
        <span class="stage-brand"><kt-icon name="layers" size="18"></kt-icon>Northwind</span>
        <kt-input
          class="stage-search"
          size="small"
          placeholder="Search invoices"
          label="Search invoices"
          icon="search"
          clearable
          .value=${query}
          @kt-input=${(event: CustomEvent<{ value: string }>) => {
            query = event.detail.value;
            rerender();
          }}
          @kt-clear=${() => {
            query = '';
            rerender();
          }}
        ></kt-input>
        <kt-avatar name="Dana Whitfield" size="small"></kt-avatar>
      </div>
      <div class="stage-body">
        <nav class="stage-nav" aria-label="Northwind">
          ${NAV.map(
            (item) =>
              html`<a
                href="#/"
                @click=${(event: Event) => {
                  event.preventDefault();
                  view = item.label;
                  rerender();
                }}
                aria-current=${item.label === view ? 'page' : 'false'}
                ><kt-icon name=${item.icon} size="16"></kt-icon>${item.label}</a
              >`,
          )}
        </nav>
        <div class="stage-main">${VIEWS[view](rerender)}</div>
      </div>
    </div>`;
}
