import { html, type TemplateResult } from 'lit';
import { toaster } from 'kanto';

interface Entity extends Record<string, unknown> {
  id: number;
  name: string;
  region: string;
  amount: number;
  status: 'Active' | 'Pending' | 'Archived';
}

const REGIONS = ['North East', 'South West', 'Midlands', 'North West'];
const STATUSES: Entity['status'][] = ['Active', 'Pending', 'Archived'];

/**
 * Deterministic sample rows — a seeded sequence rather than Math.random, so
 * the page looks the same on every reload and a screenshot stays comparable.
 */
const ENTITIES: Entity[] = Array.from({ length: 43 }, (_, index) => ({
  id: index + 1,
  name: `Entity ${4800 + index}`,
  region: REGIONS[(index * 3) % REGIONS.length]!,
  amount: ((index * 977) % 9000) + 120,
  status: STATUSES[(index * 5) % STATUSES.length]!,
}));

const STATUS_TONE: Record<string, string> = {
  Active: 'var(--color-success-base)',
  Pending: 'var(--color-warning-base)',
  Archived: 'var(--text-muted)',
};

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function tablePage(): TemplateResult {
  return html`
    <header class="page-header">
      <h1>Data</h1>
      <p>
        Tri-state sorting, multiple selection, paging. Sortable headers are real buttons: a table
        you can only sort with a mouse is a table half the users cannot sort.
      </p>
    </header>

    <section>
      <div class="row" style="justify-content:space-between;margin-bottom:14px">
        <kt-input placeholder="Search an entity..." icon="search" style="max-width:320px">
        </kt-input>
        <div class="row">
          <kt-button variant="dark" icon="download">Export</kt-button>
          <kt-button icon="plus">New entity</kt-button>
        </div>
      </div>

      <kt-card>
        <kt-table
          label="Entities"
          selectable
          page-size="10"
          .columns=${[
            { key: 'name', label: 'Name', sortable: true },
            { key: 'region', label: 'Region', sortable: true },
            { key: 'amount', label: 'Amount', sortable: true, align: 'right' },
            { key: 'status', label: 'Status', sortable: true },
          ]}
          .data=${ENTITIES}
          .renderCell=${(row: Record<string, unknown>, column: { key: string }) => {
            if (column.key === 'amount') return currency.format(Number(row['amount']));
            if (column.key === 'status') {
              return html`<kt-chip
                variant="category"
                color=${STATUS_TONE[String(row['status'])] ?? 'var(--text-muted)'}
                >${row['status']}</kt-chip
              >`;
            }
            return undefined;
          }}
          @kt-selection-change=${(event: CustomEvent<{ selected: unknown[] }>) => {
            const count = event.detail.selected.length;
            if (count > 0) toaster.info(`${count} entit${count > 1 ? 'ies' : 'y'} selected`);
          }}
        ></kt-table>
      </kt-card>
    </section>

    <section>
      <h6>States</h6>
      <div class="stack">
        <kt-card>
          <span slot="header" class="overline">Loading</span>
          <kt-table loading .columns=${[{ key: 'name', label: 'Name' }]}></kt-table>
        </kt-card>
        <kt-card>
          <span slot="header" class="overline">Empty</span>
          <kt-table
            .columns=${[
              { key: 'name', label: 'Name' },
              { key: 'region', label: 'Region' },
            ]}
            .data=${[]}
          ></kt-table>
        </kt-card>
      </div>
    </section>
  `;
}
