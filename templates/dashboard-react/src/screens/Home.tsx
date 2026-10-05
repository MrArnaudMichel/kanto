/** The overview: the numbers, the trend, the latest orders and what happened lately. */
import { useEffect, useState } from 'react';
import { toaster } from 'kanto-ds';
import { orderCell } from '../cells';
import { getOverview, type Grain, type Overview } from '../data/api';
import { PERSON } from '../data/fixtures';
import { formatMoney } from '../format';
import { hrefFor } from '../nav';
import { Screen, SectionHeader, TileCard, useKept } from '../parts';

const GRAINS = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
];

const ORDER_COLUMNS = [
  { key: 'ref', label: 'ID', sortable: true, width: '110px' },
  { key: 'updated', label: 'Date' },
  { key: 'status', label: 'Status', width: '130px' },
  { key: 'owner', label: 'Customer', sortable: true },
  { key: 'amount', label: 'Amount', sortable: true, align: 'right' as const },
];

// Kept while the reader is elsewhere.
const kept = { grain: 'daily' as Grain };

const formatAxis = (n: number) => formatMoney(n);
const formatGb = (n: number) => `${n} GB`;

export function Home() {
  const [grain, setGrain] = useKept(kept, 'grain');
  // Bumped by Refresh: the same grain, loaded again.
  const [reloads, setReloads] = useState(0);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState(-1);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setHovered(-1);
    void getOverview(grain).then((next) => {
      if (!live) return;
      setOverview(next);
      setLoading(false);
    });
    return () => {
      live = false;
    };
  }, [grain, reloads]);

  const point = overview?.revenue[hovered];

  return (
    <Screen name="home">
      <kt-page-header
        eyebrow="Dashboard"
        heading={`Welcome back, ${PERSON.name.split(' ')[0]}`}
        description="An overview of the workspace: revenue, recent orders, integrations and what changed."
      >
        <kt-button
          slot="actions"
          variant="dark"
          icon="download"
          onClick={() => toaster.info('Export started: the file will be in Files.')}
        >
          Export
        </kt-button>
        <kt-button
          slot="actions"
          icon="plus"
          onClick={() => toaster.info('Orders are created from a customer: open one in Customers.')}
        >
          New order
        </kt-button>
      </kt-page-header>

      <kt-card className="toolbar-card">
        <div className="toolbar">
          <span className="row muted">
            <kt-icon name="calendar" size={16} />
            Aug 12 – Sep 10, 2026
          </span>
          <kt-select
            className="grain"
            label="Grain"
            clearable={false}
            options={GRAINS}
            value={grain}
            onkt-change={(event) => setGrain(event.detail.value as Grain)}
          />
          <span className="grow" />
          <kt-button
            variant="dark"
            icon="refresh-cw"
            disabled={loading}
            onClick={() => setReloads((count) => count + 1)}
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </kt-button>
        </div>
      </kt-card>

      <div className="tile-row">
        {(overview?.tiles ?? []).map((tile) => (
          <TileCard key={tile.label} tile={tile} loading={loading} />
        ))}
      </div>

      <kt-card>
        <div slot="header">
          <div className="overline">Revenue</div>
          <div className="revenue-figure">{formatMoney(point ?? overview?.total ?? 0)}</div>
          <div className="muted small">
            {point === undefined
              ? 'Total for the period'
              : `${overview?.labels[hovered]} · one point in the period`}
          </div>
        </div>
        {loading || !overview ? (
          <kt-skeleton variant="rect" height="240px" />
        ) : (
          <kt-chart
            type="area"
            height={240}
            smooth
            label="Revenue over the selected period"
            labels={[...overview.labels]}
            series={[{ name: 'Revenue', values: [...overview.revenue] }]}
            format={formatAxis}
            onkt-point-hover={(event) => setHovered(event.detail.index)}
          />
        )}
      </kt-card>

      <section className="stack">
        <SectionHeader
          heading="Latest orders"
          link={{ label: 'See all customers', href: hrefFor('/customers') }}
        />
        <kt-card>
          <kt-table
            label="Latest orders"
            compact
            loading={loading}
            columns={ORDER_COLUMNS}
            data={overview?.orders ?? []}
            renderCell={orderCell}
          />
        </kt-card>
      </section>

      <div className="panel-row">
        <kt-card>
          <div slot="header" className="card-head">
            <SectionHeader
              heading="Recent activity"
              link={{ label: 'All activity', href: hrefFor('/activity') }}
            />
          </div>
          <kt-timeline compact>
            {(overview?.activity ?? []).map((event) => (
              <kt-timeline-item
                key={event.heading}
                heading={event.heading}
                time={event.time}
                icon={event.icon}
                variant={event.variant}
              >
                {event.body}
              </kt-timeline-item>
            ))}
          </kt-timeline>
        </kt-card>

        <kt-card>
          <div slot="header" className="card-head">
            <SectionHeader
              heading="Integrations"
              link={{ label: 'Manage', href: hrefFor('/integrations') }}
            />
          </div>
          <ul className="mini-list">
            {(overview?.integrations ?? []).map((entry) => (
              <li key={entry.id} className="mini-row">
                <span className="mini-icon">
                  <kt-icon name={entry.icon} size={16} />
                </span>
                <span className="mini-copy">
                  <span className="mini-title">{entry.name}</span>
                  <span className="muted small">{entry.note}</span>
                </span>
                <kt-badge tone={entry.connected ? 'success' : 'neutral'}>
                  {entry.connected ? 'Connected' : 'Off'}
                </kt-badge>
              </li>
            ))}
          </ul>
        </kt-card>

        <kt-card>
          <div slot="header" className="card-head">
            <SectionHeader heading="Storage" link={{ label: 'Details', href: hrefFor('/files') }} />
          </div>
          {overview ? (
            <>
              <kt-meter
                showLegend
                max={overview.storage.total}
                segments={overview.storage.segments}
                format={formatGb}
              />
              <p className="muted small">
                {`${overview.storage.used} GB of ${overview.storage.total} GB used. Backups are pruned after 90 days.`}
              </p>
            </>
          ) : null}
        </kt-card>
      </div>
    </Screen>
  );
}
