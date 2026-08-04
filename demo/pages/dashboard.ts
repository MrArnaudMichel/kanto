import { html, type TemplateResult } from 'lit';
import { toaster } from 'kanto-ds';
import { rerender } from '../lib/render.js';
import {
  buildEntities,
  currency,
  currencyPrecise,
  MONTHS,
  monthlyRevenue,
  STATUS_TONE,
  type Entity,
  type Status,
} from '../lib/data.js';

/**
 * A dashboard that reacts.
 *
 * The period switch redraws the chart and the headline figures, the stat cards
 * filter the table under them, refreshing shows the loading states, and a
 * transaction opens the panel. A dashboard of static numbers demonstrates
 * layout; this demonstrates the components.
 */

type Period = 'week' | 'month' | 'year';

interface State {
  period: Period;
  refreshing: boolean;
  focus: 'all' | Status;
  detail: Entity | null;
  hovered: number | null;
  seed: number;
}

const state: State = {
  period: 'month',
  refreshing: false,
  focus: 'all',
  detail: null,
  hovered: null,
  seed: 7,
};

const ENTITIES = buildEntities(24, 991);

/** The period changes the scale, so the same seed still tells a story. */
const SCALE: Record<Period, number> = { week: 0.24, month: 1, year: 11.4 };
const PERIOD_LABEL: Record<Period, string> = {
  week: 'vs last week',
  month: 'vs last month',
  year: 'vs last year',
};

function totals() {
  const scale = SCALE[state.period];
  const bars = monthlyRevenue(state.seed);
  const revenue = bars.reduce((sum, n) => sum + n, 0) * 220 * scale;

  return {
    bars,
    revenue,
    entities: Math.round(4812 * scale),
    pending: Math.round(128 * scale),
    incidents: Math.max(0, Math.round(3 * scale)),
  };
}

function refresh(): void {
  state.refreshing = true;
  rerender();
  setTimeout(() => {
    state.seed += 3; // a genuinely different shape, not a spinner for show
    state.refreshing = false;
    rerender();
    toaster.success('Dashboard refreshed', { description: 'Figures are up to date.' });
  }, 1000);
}

function statCards(): TemplateResult {
  const t = totals();
  const cards = [
    {
      key: 'all' as const,
      label: 'Revenue',
      value: currency.format(t.revenue),
      delta: '+12.4%',
      tone: 'success',
      icon: 'trending-up',
    },
    {
      key: 'Active' as const,
      label: 'Active',
      value: t.entities.toLocaleString('en-US'),
      delta: '+3.1%',
      tone: 'success',
      icon: 'users',
    },
    {
      key: 'Pending' as const,
      label: 'Pending',
      value: String(t.pending),
      delta: '-8.0%',
      tone: 'warning',
      icon: 'clock',
    },
    {
      key: 'Archived' as const,
      label: 'Archived',
      value: String(t.incidents),
      delta: '+2',
      tone: 'danger',
      icon: 'circle-alert',
    },
  ];

  return html`<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(210px,1fr))">
    ${cards.map(
      (card) =>
        html`<kt-card
          clickable
          style=${state.focus === card.key ? 'outline:2px solid var(--color-primary-base)' : ''}
          @kt-card-click=${() => {
            state.focus = state.focus === card.key ? 'all' : card.key;
            rerender();
          }}
        >
          <div slot="header" class="row" style="justify-content:space-between">
            <span class="overline">${card.label}</span>
            <kt-icon
              name=${card.icon}
              size="18"
              style=${`color:var(--color-${card.tone}-base)`}
            ></kt-icon>
          </div>
          ${
            state.refreshing
              ? html`<kt-skeleton variant="rect" height="43px"></kt-skeleton>`
              : html`<div style="font:var(--font-title-h1)">${card.value}</div>`
          }
          <span slot="footer" style=${`color:var(--color-${card.tone}-base)`}
            >${card.delta} <span class="muted">${PERIOD_LABEL[state.period]}</span></span
          >
        </kt-card>`,
    )}
  </div>`;
}

/** A bar chart drawn from tokens — Kanto ships no charting library. */
function chart(): TemplateResult {
  const { bars } = totals();
  const peak = Math.max(...bars);

  return html`<div class="chart" role="img" aria-label="Revenue by month">
    ${bars.map(
      (value, index) =>
        html`<div
          class="chart-col"
          @pointerenter=${() => {
            state.hovered = index;
            rerender();
          }}
          @pointerleave=${() => {
            state.hovered = null;
            rerender();
          }}
        >
          ${
            state.hovered === index
              ? html`<span class="chart-tip">${currency.format(value * 220)}</span>`
              : ''
          }
          <span
            class="chart-bar"
            style=${`height:${(value / peak) * 100}%;background:${
              state.hovered === index
                ? 'var(--color-primary-hover)'
                : index === bars.length - 2
                  ? 'var(--color-primary-base)'
                  : 'var(--surface-raised)'
            }`}
          ></span>
          <span class="chart-label">${MONTHS[index]}</span>
        </div>`,
    )}
  </div>`;
}

const ACTIVITY = [
  { icon: 'user-plus', text: 'Entity 4823 created', who: 'A. Michel', time: '2 min ago' },
  { icon: 'file-check', text: 'Monthly report approved', who: 'C. Bertin', time: '18 min ago' },
  { icon: 'triangle-alert', text: 'Storage quota at 88%', who: 'System', time: '1 h ago' },
  { icon: 'refresh-cw', text: 'Synchronisation finished', who: 'System', time: '3 h ago' },
  { icon: 'trash-2', text: 'Entity 4790 archived', who: 'F. Nguyen', time: '5 h ago' },
];

export function dashboardPage(): TemplateResult {
  const rows = ENTITIES.filter((row) => state.focus === 'all' || row.status === state.focus).slice(
    0,
    6,
  );

  return html`
    <header class="page-header">
      <div class="row" style="justify-content:space-between;align-items:flex-start">
        <div class="stack" style="gap:6px">
          <h1>Dashboard</h1>
          <p>
            Everything here is wired: the period redraws the chart and the figures, a stat card
            filters the table beneath it, and refreshing really reloads.
          </p>
        </div>
        <div class="row">
          <kt-segmented-control
            label="Period"
            .value=${state.period}
            .options=${[
              { value: 'week', label: 'Week' },
              { value: 'month', label: 'Month' },
              { value: 'year', label: 'Year' },
            ]}
            @kt-change=${(e: CustomEvent<{ value: Period }>) => {
              state.period = e.detail.value;
              rerender();
            }}
          ></kt-segmented-control>
          <kt-tooltip text="Reloads every figure on the page">
            <kt-button
              variant="dark"
              icon="refresh-cw"
              ?disabled=${state.refreshing}
              @click=${refresh}
              >${state.refreshing ? 'Refreshing…' : 'Refresh'}</kt-button
            >
          </kt-tooltip>
        </div>
      </div>
      ${
        state.refreshing
          ? html`<kt-progress-bar
              striped
              animated
              value="60"
              size="small"
              label="Refreshing"
            ></kt-progress-bar>`
          : ''
      }
    </header>

    <section>${statCards()}</section>

    <section>
      <div class="grid" style="align-items:start;grid-template-columns:minmax(0,2fr) minmax(0,1fr)">
        <kt-card>
          <div slot="header" class="row" style="justify-content:space-between">
            <h6>Revenue</h6>
            <kt-chip variant="category" color="var(--color-primary-base)"
              >${currency.format(totals().revenue)}</kt-chip
            >
          </div>
          ${state.refreshing ? html`<kt-skeleton variant="rect" height="180px"></kt-skeleton>` : chart()}
        </kt-card>

        <kt-card>
          <h6 slot="header">Activity</h6>
          ${
            state.refreshing
              ? html`<kt-skeleton count="5"></kt-skeleton>`
              : html`<div class="stack">
                  ${ACTIVITY.map(
                    (entry) =>
                      html`<div class="row" style="gap:10px;flex-wrap:nowrap">
                        <kt-icon
                          name=${entry.icon}
                          size="18"
                          style="color:var(--text-muted)"
                        ></kt-icon>
                        <span class="stack" style="gap:2px;flex:1;min-width:0">
                          <span>${entry.text}</span>
                          <span class="muted" style="font:var(--font-normal-small)"
                            >${entry.who}</span
                          >
                        </span>
                        <span class="muted" style="font:var(--font-normal-small);white-space:nowrap"
                          >${entry.time}</span
                        >
                      </div>`,
                  )}
                </div>`
          }
          <kt-button slot="footer" variant="text">View full history</kt-button>
        </kt-card>
      </div>
    </section>

    <section>
      <kt-card>
        <div slot="header" class="row" style="justify-content:space-between">
          <h6>Recent transactions</h6>
          ${
            state.focus !== 'all'
              ? html`<kt-chip
                  clickable
                  @kt-chip-click=${() => {
                    state.focus = 'all';
                    rerender();
                  }}
                  >Filtered: ${state.focus} — clear</kt-chip
                >`
              : ''
          }
        </div>
        <kt-table
          label="Recent transactions"
          compact
          .loading=${state.refreshing}
          .columns=${[
            { key: 'ref', label: 'Reference', sortable: true },
            { key: 'owner', label: 'Owner', sortable: true },
            { key: 'region', label: 'Region' },
            { key: 'amount', label: 'Amount', sortable: true, align: 'right' },
            { key: 'updated', label: 'Updated' },
            { key: 'status', label: 'Status' },
          ]}
          .data=${rows}
          empty-text="No transactions with this status."
          .renderCell=${(row: Record<string, unknown>, column: { key: string }) => {
            if (column.key === 'amount') return currencyPrecise.format(Number(row['amount']));
            if (column.key === 'status') {
              return html`<kt-chip variant="category" color=${STATUS_TONE[row['status'] as Status]}
                >${row['status']}</kt-chip
              >`;
            }
            return undefined;
          }}
          @kt-row-click=${(e: CustomEvent<{ row: Entity }>) => {
            state.detail = e.detail.row;
            rerender();
          }}
        ></kt-table>
        <kt-button slot="footer" variant="text">View full history</kt-button>
      </kt-card>
    </section>

    <kt-side-panel
      ?open=${state.detail !== null}
      eyebrow="Transaction"
      heading=${state.detail?.ref ?? ''}
      @kt-close=${() => {
        state.detail = null;
        rerender();
      }}
    >
      ${
        state.detail
          ? html`<div class="stack">
              ${[
                ['Owner', state.detail.owner],
                ['Region', state.detail.region],
                ['Plan', state.detail.plan],
                ['Amount', currencyPrecise.format(state.detail.amount)],
                ['Updated', state.detail.updated],
              ].map(
                ([label, value]) =>
                  html`<div class="detail-row">
                    <span class="overline">${label}</span><span>${value}</span>
                  </div>`,
              )}
            </div>`
          : ''
      }
    </kt-side-panel>
  `;
}
