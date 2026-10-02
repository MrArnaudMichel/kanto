import { html, type TemplateResult } from 'lit';
import { rerender } from '../../lib/render.js';
import {
  buildEntities,
  currency,
  currencyPrecise,
  STATUS_TONE,
  type Status,
} from '../../lib/data.js';
import { appHref, consoleShell } from '../shell.js';

/** The console's overview: the numbers, the trend, and what happened lately. */

type Grain = 'daily' | 'weekly' | 'monthly';

const state = {
  grain: 'daily' as Grain,
  hovered: -1,
  loading: false,
};

const ORDERS = buildEntities(5, 4242);

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

/**
 * The four figures across the top.
 *
 * `tone` is the icon chip's colour and carries nothing on its own — it is a
 * label the eye can find a tile by, not a status. The delta beside the value is
 * what says whether the news is good, and it says so in words as well as hue.
 */
const TILES = [
  { label: 'Customers', value: '712', delta: '+4.6%', trend: 'up', icon: 'users', tone: 'blue' },
  {
    label: 'Conversions',
    value: '1,602',
    delta: '-8%',
    trend: 'down',
    icon: 'chart-pie',
    tone: 'violet',
  },
  {
    label: 'Revenue',
    value: currency.format(292342),
    delta: '-3%',
    trend: 'down',
    icon: 'dollar-sign',
    tone: 'green',
  },
  {
    label: 'Open tickets',
    value: '18',
    delta: '-11%',
    trend: 'down',
    inverted: true,
    icon: 'life-buoy',
    tone: 'amber',
  },
] as const;

const ACTIVITY = [
  {
    heading: 'Invoice #4820 settled',
    time: '11 min ago',
    icon: 'check',
    variant: 'success' as const,
    body: 'Meridian Freight paid in full, two days early.',
  },
  {
    heading: 'Sync agent quiet',
    time: '2 h ago',
    icon: 'triangle-alert',
    variant: 'warning' as const,
    body: 'No word from the eu-west-1 agent since 07:12.',
  },
  {
    heading: 'Three seats added',
    time: 'Yesterday',
    icon: 'user-plus',
    variant: 'info' as const,
    body: 'Requested by Dana Whitfield, applied at the next renewal.',
  },
  {
    heading: 'Retention policy changed',
    time: 'Monday',
    icon: 'shield',
    variant: 'neutral' as const,
    body: 'Audit logs now kept for 400 days.',
  },
];

const INTEGRATIONS = [
  { name: 'Stripe', note: 'Billing and invoices', icon: 'credit-card', connected: true },
  { name: 'Postgres', note: 'Primary datastore', icon: 'database', connected: true },
  { name: 'Slack', note: 'Alerts to #ops', icon: 'message-circle', connected: false },
];

export function consoleHome(): TemplateResult {
  const { labels, values } = seriesFor(state.grain);
  // Scale so the headline matches the Revenue tile above it rather than
  // quoting a second, unexplained number.
  const scale = 292342 / values.reduce((sum, n) => sum + n, 0);
  const hoveredValue = state.hovered >= 0 ? values[state.hovered] : undefined;

  const body = html`
    <kt-page-header
      eyebrow="Dashboard"
      heading="Good evening, Dana"
      description="An overview of the workspace: revenue, recent orders, integrations and what changed."
    >
      <kt-button slot="actions" variant="dark" icon="download">Export</kt-button>
      <kt-button slot="actions" icon="plus">New order</kt-button>
    </kt-page-header>

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

    <div class="tile-row">
      ${TILES.map(
        (tile) => html`
          <kt-card class="tile">
            <span class=${`tile-icon ${tile.tone}`}>
              <kt-icon name=${tile.icon} size="18"></kt-icon>
            </span>
            <kt-stat
              label=${tile.label}
              value=${tile.value}
              delta=${tile.delta}
              trend=${tile.trend}
              ?inverted=${'inverted' in tile}
              ?loading=${state.loading}
            ></kt-stat>
          </kt-card>
        `,
      )}
    </div>

    <kt-card>
      <div slot="header">
        <div class="overline">Revenue</div>
        <div style="font:var(--font-title-h1);line-height:1.1">
          ${
            hoveredValue === undefined
              ? currency.format(292342)
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
          ? html`<kt-skeleton variant="rect" height="240px"></kt-skeleton>`
          : html`<kt-chart
              type="area"
              height="240"
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

    <section>
      <kt-page-header level="section" heading="Latest orders">
        <a slot="actions" href=${appHref('customers')}>See all customers</a>
      </kt-page-header>
      <kt-card style="margin-top:12px">
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
              return html`<kt-badge variant="category" color=${STATUS_TONE[row['status'] as Status]}
                >${row['status']}</kt-badge
              >`;
            }
            if (column.key === 'ref') return html`<code>#${row['ref']}</code>`;
            return undefined;
          }}
        ></kt-table>
      </kt-card>
    </section>

    <div class="panel-row">
      <kt-card>
        <div slot="header" style="width:100%">
          <kt-page-header level="section" heading="Recent activity">
            <a slot="actions" href=${appHref('activity')}>All activity</a>
          </kt-page-header>
        </div>
        <kt-timeline compact>
          ${ACTIVITY.slice(0, 3).map(
            (event) => html`
              <kt-timeline-item
                heading=${event.heading}
                time=${event.time}
                icon=${event.icon}
                variant=${event.variant}
                >${event.body}</kt-timeline-item
              >
            `,
          )}
        </kt-timeline>
      </kt-card>

      <kt-card>
        <div slot="header" style="width:100%">
          <kt-page-header level="section" heading="Integrations">
            <a slot="actions" href=${appHref('integrations')}>Manage</a>
          </kt-page-header>
        </div>
        <ul class="mini-list">
          ${INTEGRATIONS.map(
            (integration) => html`
              <li class="mini-row">
                <span class="mini-icon">
                  <kt-icon name=${integration.icon} size="16"></kt-icon>
                </span>
                <span class="mini-copy">
                  <span class="mini-title">${integration.name}</span>
                  <span class="muted" style="font:var(--font-normal-small)"
                    >${integration.note}</span
                  >
                </span>
                <kt-badge tone=${integration.connected ? 'success' : 'neutral'}
                  >${integration.connected ? 'Connected' : 'Off'}</kt-badge
                >
              </li>
            `,
          )}
        </ul>
      </kt-card>

      <kt-card>
        <div slot="header" style="width:100%">
          <kt-page-header level="section" heading="Storage">
            <a slot="actions" href=${appHref('files')}>Details</a>
          </kt-page-header>
        </div>
        <kt-meter
          show-legend
          max=${120}
          .format=${(n: number) => `${n} GB`}
          .segments=${[
            { label: 'Documents', value: 11.2 },
            { label: 'Exports', value: 7.4 },
            { label: 'Backups', value: 5.1 },
            { label: 'Other', value: 2.1 },
          ]}
        ></kt-meter>
        <p class="muted" style="margin:12px 0 0;font:var(--font-normal-small)">
          25.8 GB of 120 GB used. Backups are pruned after 90 days.
        </p>
      </kt-card>
    </div>
  `;

  return consoleShell('home', body);
}
