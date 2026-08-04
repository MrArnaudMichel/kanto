import { html, type TemplateResult } from 'lit';
import { toaster } from 'kanto';
import { rerender } from '../lib/render.js';
import {
  buildEntities,
  currency,
  PLANS,
  REGIONS,
  STATUS_TONE,
  type Entity,
  type Status,
} from '../lib/data.js';

/**
 * A data-management screen, wired end to end.
 *
 * Everything here changes something: the tabs and the filters narrow the rows,
 * selection drives a bulk action bar, a row opens the side panel, and deleting
 * goes through a confirmation before a toast reports it. The point is that the
 * components cooperate — a gallery of them sitting next to each other proves
 * much less.
 */

const ALL = buildEntities();

interface State {
  rows: Entity[];
  query: string;
  status: Status | 'all';
  regions: string[];
  plan: string | null;
  selected: number[];
  page: number;
  sortKey: string | null;
  sortDirection: 'asc' | 'desc' | null;
  detail: Entity | null;
  pendingDelete: boolean;
  loading: boolean;
}

const state: State = {
  rows: [...ALL],
  query: '',
  status: 'all',
  regions: [],
  plan: null,
  selected: [],
  page: 1,
  sortKey: 'ref',
  sortDirection: 'asc',
  detail: null,
  pendingDelete: false,
  loading: false,
};

function visibleRows(): Entity[] {
  const needle = state.query.trim().toLowerCase();

  return state.rows.filter((row) => {
    if (state.status !== 'all' && row.status !== state.status) return false;
    if (state.regions.length > 0 && !state.regions.includes(row.region)) return false;
    if (state.plan && row.plan !== state.plan) return false;
    if (!needle) return true;

    return [row.ref, row.name, row.owner, row.region, row.plan]
      .join(' ')
      .toLowerCase()
      .includes(needle);
  });
}

function countFor(status: Status | 'all'): number {
  return status === 'all'
    ? state.rows.length
    : state.rows.filter((row) => row.status === status).length;
}

function resetFilters(): void {
  state.query = '';
  state.status = 'all';
  state.regions = [];
  state.plan = null;
  state.page = 1;
  rerender();
}

function deleteSelected(): void {
  const count = state.selected.length;
  state.rows = state.rows.filter((row) => !state.selected.includes(row.id));
  state.selected = [];
  state.pendingDelete = false;
  rerender();
  toaster.success(`${count} entit${count > 1 ? 'ies' : 'y'} deleted`, {
    description: 'They are gone from the list.',
  });
}

function reload(): void {
  state.loading = true;
  rerender();
  setTimeout(() => {
    state.loading = false;
    rerender();
    toaster.info('List refreshed');
  }, 900);
}

const activeFilterCount = (): number =>
  (state.status !== 'all' ? 1 : 0) + state.regions.length + (state.plan ? 1 : 0);

function filterBar(): TemplateResult {
  return html`<kt-card>
    <div class="row" style="justify-content:space-between;align-items:flex-end">
      <div class="row" style="align-items:flex-end">
        <kt-label-input label="Search">
          <kt-input
            placeholder="Reference, name, owner..."
            icon="search"
            style="width:280px"
            .value=${state.query}
            @kt-input=${(e: CustomEvent<{ value: string }>) => {
              state.query = e.detail.value;
              state.page = 1;
              rerender();
            }}
          ></kt-input>
        </kt-label-input>

        <kt-label-input label="Plan">
          <kt-select
            style="width:200px"
            placeholder="Any plan"
            .value=${state.plan}
            .options=${PLANS.map((plan) => ({ id: plan, label: plan }))}
            @kt-change=${(e: CustomEvent<{ value: string | null }>) => {
              state.plan = e.detail.value;
              state.page = 1;
              rerender();
            }}
          ></kt-select>
        </kt-label-input>

        <kt-label-input label="Region">
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
        </kt-label-input>
      </div>

      <div class="row">
        ${
          activeFilterCount() > 0
            ? html`<kt-button variant="secondary-no-bg" size="small" icon="x" @click=${resetFilters}
                >Clear ${activeFilterCount()} filter${activeFilterCount() > 1 ? 's' : ''}</kt-button
              >`
            : ''
        }
        <kt-button variant="dark" icon="refresh-cw" @click=${reload}>Refresh</kt-button>
        <kt-button
          variant="dark"
          icon="download"
          @click=${() => toaster.info(`Exporting ${visibleRows().length} rows…`)}
          >Export</kt-button
        >
        <kt-button icon="plus" @click=${() => toaster.info('The create flow is on the Form page.')}
          >New entity</kt-button
        >
      </div>
    </div>
  </kt-card>`;
}

function bulkBar(): TemplateResult | string {
  if (state.selected.length === 0) return '';

  return html`<div class="bulk-bar">
    <span><strong>${state.selected.length}</strong> selected</span>
    <div class="row">
      <kt-button
        size="small"
        variant="dark"
        icon="check"
        @click=${() => {
          const ids = new Set(state.selected);
          state.rows = state.rows.map((row) =>
            ids.has(row.id) ? { ...row, status: 'Active' } : row,
          );
          rerender();
          toaster.success(`${ids.size} activated`);
        }}
        >Activate</kt-button
      >
      <kt-button
        size="small"
        variant="danger"
        icon="trash-2"
        @click=${() => {
          state.pendingDelete = true;
          rerender();
        }}
        >Delete</kt-button
      >
      <kt-button
        size="small"
        variant="secondary-no-bg"
        icon="x"
        label="Clear selection"
        @click=${() => {
          state.selected = [];
          rerender();
        }}
      ></kt-button>
    </div>
  </div>`;
}

function detailPanel(): TemplateResult {
  const entity = state.detail;

  return html`<kt-side-panel
    ?open=${entity !== null}
    eyebrow="Details"
    heading=${entity?.name ?? ''}
    @kt-close=${() => {
      state.detail = null;
      rerender();
    }}
  >
    ${
      entity
        ? html`<div class="stack">
            ${[
              ['Reference', entity.ref],
              ['Owner', entity.owner],
              ['Region', entity.region],
              ['Plan', entity.plan],
              ['Amount', currency.format(entity.amount)],
              ['Updated', entity.updated],
            ].map(
              ([label, value]) =>
                html`<div class="detail-row">
                  <span class="overline">${label}</span>
                  <span>${value}</span>
                </div>`,
            )}
            <div class="detail-row">
              <span class="overline">Status</span>
              <kt-chip variant="category" color=${STATUS_TONE[entity.status]}
                >${entity.status}</kt-chip
              >
            </div>
          </div>`
        : ''
    }
    <kt-button
      slot="footer"
      full-width
      @click=${() => {
        state.detail = null;
        rerender();
        toaster.success('Saved');
      }}
      >Save</kt-button
    >
  </kt-side-panel>`;
}

export function dataPage(): TemplateResult {
  const rows = visibleRows();
  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const page = Math.min(state.page, totalPages);
  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize);

  return html`
    <header class="page-header">
      <h1>Entities</h1>
      <p>
        A working screen rather than a gallery. The tabs and filters narrow the list, selecting rows
        raises a bulk action bar, a row opens the side panel, and deleting goes through a
        confirmation before a toast reports it.
      </p>
    </header>

    <section>
      <kt-tabs
        label="Status"
        .value=${state.status}
        .tabs=${[
          { value: 'all', label: `All (${countFor('all')})` },
          { value: 'Active', label: `Active (${countFor('Active')})` },
          { value: 'Pending', label: `Pending (${countFor('Pending')})` },
          { value: 'Archived', label: `Archived (${countFor('Archived')})` },
        ]}
        @kt-change=${(e: CustomEvent<{ value: Status | 'all' }>) => {
          state.status = e.detail.value;
          state.page = 1;
          rerender();
        }}
      ></kt-tabs>
    </section>

    <section>${filterBar()}</section>
    ${bulkBar()}

    <section>
      <kt-card>
        <kt-table
          label="Entities"
          selectable
          .columns=${[
            { key: 'ref', label: 'Reference', sortable: true, width: '120px' },
            { key: 'name', label: 'Name', sortable: true },
            { key: 'owner', label: 'Owner', sortable: true },
            { key: 'region', label: 'Region', sortable: true },
            { key: 'plan', label: 'Plan', sortable: true, width: '110px' },
            { key: 'amount', label: 'Amount', sortable: true, align: 'right' },
            { key: 'status', label: 'Status', sortable: true, width: '120px' },
          ]}
          .data=${pageRows}
          .selected=${state.selected}
          .loading=${state.loading}
          .sortKey=${state.sortKey}
          .sortDirection=${state.sortDirection}
          empty-text=${
            state.query || activeFilterCount() > 0
              ? 'Nothing matches these filters.'
              : 'No data to display'
          }
          .renderCell=${(row: Record<string, unknown>, column: { key: string }) => {
            if (column.key === 'amount') return currency.format(Number(row['amount']));
            if (column.key === 'status') {
              return html`<kt-chip variant="category" color=${STATUS_TONE[row['status'] as Status]}
                >${row['status']}</kt-chip
              >`;
            }
            if (column.key === 'ref') return html`<code>${row['ref']}</code>`;
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
          <span class="muted" style="font:var(--font-normal-small)">
            ${rows.length} of ${state.rows.length} entities
          </span>
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
    </section>

    ${detailPanel()}

    <kt-confirm-dialog
      ?open=${state.pendingDelete}
      heading=${`Delete ${state.selected.length} entit${state.selected.length > 1 ? 'ies' : 'y'}?`}
      message="This action cannot be undone."
      confirm-label="Delete"
      @kt-confirm=${deleteSelected}
      @kt-cancel=${() => {
        state.pendingDelete = false;
        rerender();
      }}
    ></kt-confirm-dialog>
  `;
}
