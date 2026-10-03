/**
 * The home page's stage: one product screen, whole and live — a sidebar,
 * the week's figures, a chart, a form that sends, a table — under a row of
 * colours that re-themes it alone. It is the first thing a visitor sees, so
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

/** Back to the site's accent and the stage's first state, for the next visit. */
export function resetStage(): void {
  accent = null;
  period = 'month';
  invoices = [];
  sentHere = 0;
}

const NAV = [
  { icon: 'layout-dashboard', label: 'Overview', current: true },
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
];

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
  const figures = PERIODS[period];

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
        <kt-input class="stage-search" size="small" placeholder="Search invoices"></kt-input>
        <kt-avatar name="Dana Whitfield" size="small"></kt-avatar>
      </div>
      <div class="stage-body">
        <nav class="stage-nav" aria-label="Northwind">
          ${NAV.map(
            (item) =>
              html`<a
                href="#/"
                @click=${(event: Event) => event.preventDefault()}
                aria-current=${item.current ? 'page' : 'false'}
                ><kt-icon name=${item.icon} size="16"></kt-icon>${item.label}</a
              >`,
          )}
        </nav>
        <div class="stage-main">
          <div class="stage-head">
            <h2 class="stage-title">Overview</h2>
            <kt-segmented-control
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
            ></kt-segmented-control>
          </div>
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
            <kt-stat
              label="Overdue"
              value=${figures.overdue}
              delta="-2"
              trend="down"
              inverted
            ></kt-stat>
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
            <kt-table
              .columns=${COLUMNS}
              .data=${invoices}
              .renderCell=${statusBadge}
              label="Recent invoices"
            ></kt-table>
          </section>
        </div>
      </div>
    </div>`;
}
