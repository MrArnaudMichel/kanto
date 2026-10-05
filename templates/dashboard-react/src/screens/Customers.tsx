/** The customers: filter, sort, select, act on several, inspect one. */
import { useEffect, useState } from 'react';
import { toaster } from 'kanto-ds';
import { customerCell } from '../cells';
import { deleteCustomers, listCustomers, type Entity } from '../data/api';
import { PLANS, REGIONS } from '../data/generate';
import { formatMoney } from '../format';
import { Screen } from '../parts';
import { activeFilters, customerPage, NO_FILTERS, PAGE_SIZE, type CustomerQuery } from '../views';

const COLUMNS = [
  { key: 'owner', label: 'Customer', sortable: true },
  { key: 'ref', label: 'Account', sortable: true, width: '120px' },
  { key: 'region', label: 'Region', sortable: true },
  { key: 'plan', label: 'Plan', sortable: true, width: '120px' },
  { key: 'amount', label: 'MRR', sortable: true, align: 'right' as const },
  { key: 'status', label: 'Status', sortable: true, width: '120px' },
];

const PLAN_OPTIONS = PLANS.map((name) => ({ id: name, label: name }));
const REGION_OPTIONS = REGIONS.map((name) => ({ id: name, label: name }));

export function Customers() {
  const [all, setAll] = useState<readonly Entity[] | null>(null);
  const [query, setQuery] = useState<CustomerQuery>(NO_FILTERS);
  const [selected, setSelected] = useState<number[]>([]);
  const [detail, setDetail] = useState<Entity | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    let live = true;
    void listCustomers().then((rows) => {
      if (live) setAll(rows);
    });
    return () => {
      live = false;
    };
  }, []);

  const filter = (patch: Partial<CustomerQuery>) =>
    setQuery((now) => ({ ...now, page: 1, ...patch }));
  const shown = customerPage(all ?? [], query);
  const filters = activeFilters(query) + (query.query ? 1 : 0);
  const plural = selected.length > 1 ? 's' : '';

  return (
    <Screen name="customers">
      <kt-page-header
        eyebrow="Workspace"
        heading="Customers"
        description="Every account this workspace bills, with the filters the support team uses."
      >
        <kt-button
          slot="actions"
          variant="dark"
          icon="download"
          onClick={() => toaster.info(`Exporting ${shown.total} customers…`)}
        >
          Export
        </kt-button>
      </kt-page-header>

      <kt-card className="toolbar-card">
        <div className="toolbar">
          <kt-input
            className="customer-search"
            placeholder="Search customers…"
            icon="search"
            label="Search customers"
            value={query.query}
            onkt-input={(event) => filter({ query: event.detail.value })}
          />
          <kt-select
            className="customer-plan"
            placeholder="Any plan"
            label="Plan"
            options={PLAN_OPTIONS}
            value={query.plan}
            onkt-change={(event) => filter({ plan: event.detail.value as string | null })}
          />
          <kt-multi-select
            className="customer-regions"
            label="Region"
            placeholder="Any region"
            options={REGION_OPTIONS}
            value={[...query.regions]}
            onkt-change={(event) => filter({ regions: event.detail.value.map(String) })}
          />
          <span className="grow" />
          {filters > 0 ? (
            <kt-button
              variant="secondary-no-bg"
              size="small"
              icon="x"
              onClick={() => filter({ query: '', plan: null, regions: [] })}
            >
              {`Clear ${filters}`}
            </kt-button>
          ) : null}
        </div>
      </kt-card>

      {selected.length > 0 ? (
        <div className="bulk-bar">
          <span>
            <strong>{selected.length}</strong> selected
          </span>
          <div className="row">
            <kt-button
              size="small"
              variant="dark"
              icon="mail"
              onClick={() => toaster.success(`Emailed ${selected.length} customer${plural}`)}
            >
              Email
            </kt-button>
            <kt-button
              size="small"
              variant="danger"
              icon="trash-2"
              onClick={() => setConfirming(true)}
            >
              Delete
            </kt-button>
          </div>
        </div>
      ) : null}

      <kt-card>
        <kt-table
          label="Customers"
          selectable
          manual
          pageSize={PAGE_SIZE}
          columns={COLUMNS}
          data={shown.rows}
          page={shown.page}
          totalRows={shown.total}
          loading={all === null}
          selected={selected}
          sortKey={query.sortKey}
          sortDirection={query.sortDirection}
          emptyText={filters > 0 ? 'No customer matches these filters.' : 'No customers yet.'}
          renderCell={customerCell}
          onkt-sort-change={(event) =>
            setQuery((now) => ({
              ...now,
              sortKey: event.detail.key,
              sortDirection: event.detail.direction,
            }))
          }
          onkt-page-change={(event) => setQuery((now) => ({ ...now, page: event.detail.page }))}
          onkt-selection-change={(event) => setSelected(event.detail.selected.map(Number))}
          onkt-row-click={(event) => setDetail(event.detail.row as Entity)}
        />
        <div slot="footer" className="table-footer">
          <span className="muted small customer-count">
            {`${shown.total} of ${all?.length ?? 0} customers`}
          </span>
        </div>
      </kt-card>

      <kt-side-panel
        eyebrow="Customer"
        heading={detail?.owner ?? ''}
        open={detail !== null}
        onkt-close={() => setDetail(null)}
      >
        {detail ? (
          <div className="stack">
            <div className="row">
              <kt-avatar name={detail.owner} size="large" />
              <div className="stack tight">
                <strong>{detail.owner}</strong>
                <span className="muted small">{detail.ref}</span>
              </div>
            </div>
            {[
              ['Region', detail.region],
              ['Plan', detail.plan],
              ['MRR', formatMoney(detail.amount)],
              ['Last activity', detail.updated],
            ].map(([label, value]) => (
              <div key={label} className="detail-row">
                <span className="overline">{label}</span>
                <span>{value}</span>
              </div>
            ))}
            <kt-alert variant="info" description="This account renews in 14 days." />
          </div>
        ) : null}
        <kt-button slot="footer" variant="dark" onClick={() => setDetail(null)}>
          Close
        </kt-button>
      </kt-side-panel>

      <kt-confirm-dialog
        open={confirming}
        heading={`Delete ${selected.length} customer${plural}?`}
        message="Their history goes with them. This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onkt-confirm={() => {
          const ids = selected;
          setConfirming(false);
          void deleteCustomers(ids).then(async () => {
            setAll(await listCustomers());
            setSelected([]);
            toaster.success(`${ids.length} customer${ids.length > 1 ? 's' : ''} deleted`);
          });
        }}
        onkt-cancel={() => setConfirming(false)}
      />
    </Screen>
  );
}
