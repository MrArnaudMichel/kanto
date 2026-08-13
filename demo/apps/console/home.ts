import { html, type TemplateResult } from 'lit';
import { rerender } from '../../lib/render.js';
import {
  buildEntities,
  currency,
  currencyPrecise,
  STATUS_TONE,
  type Status,
} from '../../lib/data.js';
import { consoleShell } from '../shell.js';

/** The console's overview: the numbers, the trend, and the latest orders. */

type Grain = 'daily' | 'weekly' | 'monthly';

const state = {
  grain: 'daily' as Grain,
  range: '30d',
  hovered: -1,
  loading: false,
};

const ORDERS = buildEntities(6, 4242);

/** Points per grain, so switching it genuinely changes the resolution. */
const POINTS: Record<Grain, number> = { daily: 30, weekly: 12, monthly: 6 };

function seriesFor(grain: Grain): { labels: string[]; values: number[] } {
  const count = POINTS[grain];
  let seed = 20260910;
  const random = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;

  const values = Array.from({ length: count }, (_, i) => {
    const wave = Math.sin(i / (count / 6)) * 22 + Math.sin(i / 2.4) * 9;
    return Math.round(58 + wave + random() * 14);
  });

  const labels = Array.from({ length: count }, (_, i) => {
    if (grain === 'monthly') return ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'][i] ?? '';
    if (grain === 'weekly') return `W${i + 1}`;
    const day = 12 + i;
    return day <= 31 ? `${day} Aug` : `${day - 31} Sep`;
  });

  return { labels, values };
}

export function consoleHome(): TemplateResult {
  const { labels, values } = seriesFor(state.grain);
  // Scale so the headline matches the Revenue tile above it rather than
  // quoting a second, unexplained number.
  const scale = 292342 / values.reduce((sum, n) => sum + n, 0);
  const total = 292342;
  const hoveredValue = state.hovered >= 0 ? values[state.hovered] : undefined;

  const body = html`
    <kt-card class="toolbar-card">
      <div class="toolbar">
        <kt-button variant="dark" icon="calendar" icon-position="left">
          Aug 12 – Sep 10, 2026
        </kt-button>
        <kt-select
          style="width:150px"
          .clearable=${false}
          .value=${state.grain}
          .options=${[
            { id: 'daily', label: 'Daily' },
            { id: 'weekly', label: 'Weekly' },
            { id: 'monthly', label: 'Monthly' },
          ]}
          @kt-change=${(e: CustomEvent<{ value: Grain }>) => {
            state.grain = e.detail.value;
            state.hovered = -1;
            rerender();
          }}
        ></kt-select>
        <span style="flex:1"></span>
        <kt-button
          variant="dark"
          icon="refresh-cw"
          ?disabled=${state.loading}
          @click=${() => {
            state.loading = true;
            rerender();
            setTimeout(() => {
              state.loading = false;
              rerender();
            }, 900);
          }}
          >${state.loading ? 'Refreshing…' : 'Refresh'}</kt-button
        >
      </div>
    </kt-card>

    <div class="stat-row">
      ${[
        { label: 'Customers', value: '712', delta: '-2%', trend: 'down', icon: 'users' },
        { label: 'Conversions', value: '1,602', delta: '-8%', trend: 'down', icon: 'chart-pie' },
        {
          label: 'Revenue',
          value: currency.format(292342),
          delta: '-3%',
          trend: 'down',
          icon: 'dollar-sign',
        },
        { label: 'Orders', value: '178', delta: '+2%', trend: 'up', icon: 'shopping-cart' },
      ].map(
        (stat) =>
          html`<kt-stat
            label=${stat.label}
            value=${stat.value}
            delta=${stat.delta}
            trend=${stat.trend}
            icon=${stat.icon}
            ?loading=${state.loading}
          ></kt-stat>`,
      )}
    </div>

    <kt-card>
      <div slot="header">
        <div class="overline">Revenue</div>
        <div style="font:var(--font-title-h1);line-height:1.1">
          ${
            hoveredValue === undefined
              ? currency.format(total)
              : currency.format(hoveredValue * scale)
          }
        </div>
        <div class="muted" style="font:var(--font-normal-small)">
          ${
            hoveredValue === undefined
              ? 'Total for the period'
              : `${labels[state.hovered]} · point in the period`
          }
        </div>
      </div>

      ${
        state.loading
          ? html`<kt-skeleton variant="rect" height="260px"></kt-skeleton>`
          : html`<kt-chart
              type="area"
              height="260"
              smooth
              label="Revenue over the selected period"
              .labels=${labels}
              .series=${[{ name: 'Revenue', values }]}
              .format=${(n: number) => currency.format(n * scale)}
              @kt-point-hover=${(e: CustomEvent<{ index: number }>) => {
                state.hovered = e.detail.index;
                rerender();
              }}
            ></kt-chart>`
      }
    </kt-card>

    <kt-card>
      <h6 slot="header">Latest orders</h6>
      <kt-table
        label="Latest orders"
        compact
        .loading=${state.loading}
        .columns=${[
          { key: 'ref', label: 'ID', sortable: true, width: '110px' },
          { key: 'updated', label: 'Date' },
          { key: 'status', label: 'Status', width: '130px' },
          { key: 'owner', label: 'Customer', sortable: true },
          { key: 'amount', label: 'Amount', sortable: true, align: 'right' },
        ]}
        .data=${ORDERS}
        .renderCell=${(row: Record<string, unknown>, column: { key: string }) => {
          if (column.key === 'amount') return currencyPrecise.format(Number(row['amount']));
          if (column.key === 'status') {
            return html`<kt-chip variant="category" color=${STATUS_TONE[row['status'] as Status]}
              >${row['status']}</kt-chip
            >`;
          }
          if (column.key === 'ref') return html`<code>#${row['ref']}</code>`;
          return undefined;
        }}
      ></kt-table>
      <kt-button slot="footer" variant="text">View all orders</kt-button>
    </kt-card>
  `;

  return consoleShell('home', 'Home', body);
}
