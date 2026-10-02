import { html, type TemplateResult } from 'lit';
import { toaster } from 'kanto-ds';
import { rerender } from '../../lib/render.js';
import {
  buildEntities,
  currency,
  PLANS,
  REGIONS,
  STATUS_TONE,
  type Entity,
  type Status,
} from '../../lib/data.js';
import { consoleShell } from '../shell.js';

/** The customer list: filter, sort, select, act, inspect. */

const ALL = buildEntities(64, 5150);

const state = {
  rows: [...ALL],
  query: '',
  plan: null as string | null,
  regions: [] as string[],
  selected: [] as number[],
  page: 1,
  sortKey: 'ref' as string | null,
  sortDirection: 'asc' as 'asc' | 'desc' | null,
  detail: null as Entity | null,
  confirmDelete: false,
};

const PAGE_SIZE = 9;

function visible(): Entity[] {
  const needle = state.query.trim().toLowerCase();

  return state.rows.filter((row) => {
    if (state.plan && row.plan !== state.plan) return false;
    if (state.regions.length > 0 && !state.regions.includes(row.region)) return false;
    if (!needle) return true;
    return `${row.ref} ${row.owner} ${row.region} ${row.plan}`.toLowerCase().includes(needle);
  });
}

export function consoleCustomers(): TemplateResult {
  const rows = visible();
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const page = Math.min(state.page, totalPages);
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const filters = (state.plan ? 1 : 0) + state.regions.length;

  const body = html`
    <kt-card class="toolbar-card">
      <div class="toolbar">
        <kt-input
          placeholder="Search customers..."
          icon="search"
          style="width:280px"
          .value=${state.query}
          @kt-input=${(e: CustomEvent<{ value: string }>) => {
            state.query = e.detail.value;
            state.page = 1;
            rerender();
          }}
        ></kt-input>
        <kt-select
          style="width:170px"
          placeholder="Any plan"
          .value=${state.plan}
          .options=${PLANS.map((plan) => ({ id: plan, label: plan }))}
          @kt-change=${(e: CustomEvent<{ value: string | null }>) => {
            state.plan = e.detail.value;
            state.page = 1;
            rerender();
          }}
        ></kt-select>
        <kt-toggle-button-group
          multiple
          label="Region"
          .value=${state.regions}
          @kt-change=${(e: CustomEvent<{ value: string[] }>) => {
            state.regions = e.detail.value;
            state.page = 1;
            rerender();
          }}
        >
          ${REGIONS.map(
            (region) =>
              html`<kt-toggle-button variant="outline" size="small" value=${region}
                >${region}</kt-toggle-button
              >`,
          )}
        </kt-toggle-button-group>

        <span style="flex:1"></span>
        ${
          filters > 0
            ? html`<kt-button
                variant="secondary-no-bg"
                size="small"
                icon="x"
                @click=${() => {
                  state.plan = null;
                  state.regions = [];
                  state.query = '';
                  state.page = 1;
                  rerender();
                }}
                >Clear ${filters}</kt-button
              >`
            : ''
        }
        <kt-button
          variant="dark"
          icon="download"
          @click=${() => toaster.info(`Exporting ${rows.length} customers…`)}
          >Export</kt-button
        >
      </div>
    </kt-card>

      ${
        state.selected.length > 0
          ? html`<div class="bulk-bar">
              <span><strong>${state.selected.length}</strong> selected</span>
              <div class="row">
                <kt-button
                  size="small"
                  variant="dark"
                  icon="mail"
                  @click=${() => toaster.success(`Emailed ${state.selected.length} customers`)}
                  >Email</kt-button
                >
                <kt-button
                  size="small"
                  variant="danger"
                  icon="trash-2"
                  @click=${() => {
                    state.confirmDelete = true;
                    rerender();
                  }}
                  >Delete</kt-button
                >
              </div>
            </div>`
          : ''
      }

      <kt-card>
        <kt-table
          label="Customers"
          selectable
          .columns=${[
            { key: 'owner', label: 'Customer', sortable: true },
            { key: 'ref', label: 'Account', sortable: true, width: '120px' },
            { key: 'region', label: 'Region', sortable: true },
            { key: 'plan', label: 'Plan', sortable: true, width: '120px' },
            { key: 'amount', label: 'MRR', sortable: true, align: 'right' },
            { key: 'status', label: 'Status', sortable: true, width: '120px' },
          ]}
          .data=${pageRows}
          .selected=${state.selected}
          .sortKey=${state.sortKey}
          .sortDirection=${state.sortDirection}
          empty-text=${
            filters > 0 || state.query ? 'No customer matches these filters.' : 'No customers yet.'
          }
          .renderCell=${(row: Record<string, unknown>, column: { key: string }) => {
            if (column.key === 'owner') {
              return html`<span class="cell-person">
                <kt-avatar name=${String(row['owner'])} size="small"></kt-avatar>
                <span>${row['owner']}</span>
              </span>`;
            }
            if (column.key === 'amount') return currency.format(Number(row['amount']));
            if (column.key === 'ref') return html`<code>${row['ref']}</code>`;
            if (column.key === 'status') {
              return html`<kt-badge variant="category" color=${STATUS_TONE[row['status'] as Status]}
                >${row['status']}</kt-badge
              >`;
            }
            return undefined;
          }}
          @kt-sort-change=${(
            e: CustomEvent<{ key: string | null; direction: 'asc' | 'desc' | null }>,
          ) => {
            state.sortKey = e.detail.key;
            state.sortDirection = e.detail.direction;
            rerender();
          }}
          @kt-selection-change=${(e: CustomEvent<{ selected: number[] }>) => {
            state.selected = e.detail.selected;
            rerender();
          }}
          @kt-row-click=${(e: CustomEvent<{ row: Entity }>) => {
            state.detail = e.detail.row;
            rerender();
          }}
        ></kt-table>

        <div slot="footer" class="row" style="justify-content:space-between;width:100%">
          <span class="muted" style="font:var(--font-normal-small)"
            >${rows.length} of ${state.rows.length} customers</span
          >
          <kt-pagination
            .page=${page}
            .totalPages=${totalPages}
            @kt-page-change=${(e: CustomEvent<{ page: number }>) => {
              state.page = e.detail.page;
              rerender();
            }}
          ></kt-pagination>
        </div>
      </kt-card>

      <kt-side-panel
        ?open=${state.detail !== null}
        eyebrow="Customer"
        heading=${state.detail?.owner ?? ''}
        @kt-close=${() => {
          state.detail = null;
          rerender();
        }}
      >
        ${
          state.detail
            ? html`<div class="stack">
                <div class="row" style="gap:12px">
                  <kt-avatar name=${state.detail.owner} size="large"></kt-avatar>
                  <div class="stack" style="gap:2px">
                    <strong>${state.detail.owner}</strong>
                    <span class="muted" style="font:var(--font-normal-small)"
                      >${state.detail.ref}</span
                    >
                  </div>
                </div>
                ${[
                  ['Region', state.detail.region],
                  ['Plan', state.detail.plan],
                  ['MRR', currency.format(state.detail.amount)],
                  ['Last activity', state.detail.updated],
                ].map(
                  ([label, value]) =>
                    html`<div class="detail-row">
                      <span class="overline">${label}</span><span>${value}</span>
                    </div>`,
                )}
                <kt-alert variant="info" description="This account renews in 14 days."></kt-alert>
              </div>`
            : ''
        }
        <kt-button slot="footer" full-width @click=${() => toaster.success('Customer saved')}
          >Save</kt-button
        >
      </kt-side-panel>

      <kt-confirm-dialog
        ?open=${state.confirmDelete}
        heading=${`Delete ${state.selected.length} customer${state.selected.length > 1 ? 's' : ''}?`}
        message="Their history goes with them. This cannot be undone."
        confirm-label="Delete"
        @kt-confirm=${() => {
          const count = state.selected.length;
          state.rows = state.rows.filter((row) => !state.selected.includes(row.id));
          state.selected = [];
          state.confirmDelete = false;
          rerender();
          toaster.success(`${count} customer${count > 1 ? 's' : ''} deleted`);
        }}
        @kt-cancel=${() => {
          state.confirmDelete = false;
          rerender();
        }}
      ></kt-confirm-dialog>
    </kt-card>
  `;

  return consoleShell(
    'customers',
    html`<kt-page-header
        eyebrow="Workspace"
        heading="Customers"
        description="Every account this workspace bills, with the filters the support team actually uses."
      >
        <kt-button slot="actions" variant="dark" icon="download">Export</kt-button>
        <kt-button slot="actions" icon="plus">Add customer</kt-button>
      </kt-page-header>
      ${body}`,
  );
}
