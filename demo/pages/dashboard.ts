import { html, type TemplateResult } from 'lit';

const STATS = [
  { label: 'Revenue', value: '$24,892', delta: '+12.4%', tone: 'success', icon: 'trending-up' },
  { label: 'Entities', value: '4,812', delta: '+3.1%', tone: 'success', icon: 'users' },
  { label: 'Pending', value: '128', delta: '-8.0%', tone: 'warning', icon: 'clock' },
  { label: 'Incidents', value: '3', delta: '+2', tone: 'danger', icon: 'circle-alert' },
] as const;

const TRANSACTIONS = [
  {
    id: 1,
    ref: 'TR-4812',
    client: 'Miotte Group',
    amount: '$1,240.00',
    date: '25 Jan',
    status: 'Paid',
  },
  {
    id: 2,
    ref: 'TR-4811',
    client: 'Kanto Studio',
    amount: '$320.50',
    date: '24 Jan',
    status: 'Pending',
  },
  {
    id: 3,
    ref: 'TR-4810',
    client: 'Bertin Ltd',
    amount: '$120.00',
    date: '24 Jan',
    status: 'Paid',
  },
  {
    id: 4,
    ref: 'TR-4809',
    client: 'Northern Studio',
    amount: '$2,980.00',
    date: '23 Jan',
    status: 'Failed',
  },
];

const ACTIVITY = [
  { icon: 'user-plus', text: 'New entity created', time: '2 min ago' },
  { icon: 'file-check', text: 'Monthly report approved', time: '18 min ago' },
  { icon: 'triangle-alert', text: 'Storage quota at 88%', time: '1 h ago' },
  { icon: 'refresh-cw', text: 'Synchronisation finished', time: '3 h ago' },
];

const STATUS_TONE: Record<string, string> = {
  Paid: 'var(--color-success-base)',
  Pending: 'var(--color-warning-base)',
  Failed: 'var(--color-danger-base)',
};

/** A bar chart drawn from tokens — Kanto ships no charting library. */
function miniChart(): TemplateResult {
  const bars = [42, 58, 36, 71, 64, 88, 52, 76, 61, 94, 70, 83];

  return html`<div style="display:flex;align-items:flex-end;gap:6px;height:180px">
    ${bars.map(
      (value, index) =>
        html`<span
          title=${`${value}k`}
          style=${`flex:1;height:${value}%;border-radius:4px 4px 0 0;background:${
            index === bars.length - 2 ? 'var(--color-primary-base)' : 'var(--surface-raised)'
          }`}
        ></span>`,
    )}
  </div>`;
}

export function dashboardPage(): TemplateResult {
  return html`
    <header class="page-header">
      <div class="row" style="justify-content:space-between">
        <div class="stack" style="gap:6px">
          <h1>Dashboard</h1>
          <p>Welcome to your Kanto workspace.</p>
        </div>
        <div class="row">
          <kt-button variant="dark" icon="refresh-cw">Refresh</kt-button>
          <kt-button icon="plus">New entity</kt-button>
        </div>
      </div>
    </header>

    <section>
      <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(210px,1fr))">
        ${STATS.map(
          (stat) =>
            html`<kt-card>
              <div slot="header" class="row" style="justify-content:space-between">
                <span class="overline">${stat.label}</span>
                <kt-icon
                  name=${stat.icon}
                  size="18"
                  style=${`color:var(--color-${stat.tone}-base)`}
                ></kt-icon>
              </div>
              <div style="font:var(--font-title-h1)">${stat.value}</div>
              <span slot="footer" style=${`color:var(--color-${stat.tone}-base)`}
                >${stat.delta}</span
              >
            </kt-card>`,
        )}
      </div>
    </section>

    <section>
      <div class="grid" style="align-items:start;grid-template-columns:minmax(0,2fr) minmax(0,1fr)">
        <kt-card>
          <div slot="header" class="row" style="justify-content:space-between">
            <h6>Revenue</h6>
            <kt-segmented-control
              size="small"
              label="Period"
              .value=${'month'}
              .options=${[
                { value: 'week', label: 'Week' },
                { value: 'month', label: 'Month' },
                { value: 'year', label: 'Year' },
              ]}
            ></kt-segmented-control>
          </div>
          ${miniChart()}
        </kt-card>

        <kt-card>
          <h6 slot="header">Activity</h6>
          <div class="stack">
            ${ACTIVITY.map(
              (entry) =>
                html`<div class="row" style="gap:10px;flex-wrap:nowrap">
                  <kt-icon name=${entry.icon} size="18" style="color:var(--text-muted)"></kt-icon>
                  <span style="flex:1;min-width:0">${entry.text}</span>
                  <span
                    style="color:var(--text-muted);font:var(--font-normal-small);white-space:nowrap"
                    >${entry.time}</span
                  >
                </div>`,
            )}
          </div>
          <kt-button slot="footer" variant="text">View full history</kt-button>
        </kt-card>
      </div>
    </section>

    <section>
      <kt-card>
        <h6 slot="header">Recent transactions</h6>
        <kt-table
          label="Recent transactions"
          compact
          .columns=${[
            { key: 'ref', label: 'Reference', sortable: true },
            { key: 'client', label: 'Client', sortable: true },
            { key: 'amount', label: 'Amount', sortable: true, align: 'right' },
            { key: 'date', label: 'Date' },
            { key: 'status', label: 'Status' },
          ]}
          .data=${TRANSACTIONS}
          .renderCell=${(row: Record<string, unknown>, column: { key: string }) =>
            column.key === 'status'
              ? html`<kt-chip
                  variant="category"
                  color=${STATUS_TONE[String(row['status'])] ?? 'var(--text-muted)'}
                  >${row['status']}</kt-chip
                >`
              : undefined}
        ></kt-table>
        <kt-button slot="footer" variant="text">View full history</kt-button>
      </kt-card>
    </section>
  `;
}
