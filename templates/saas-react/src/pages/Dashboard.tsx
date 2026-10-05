import { useEffect, useState } from 'react';
import type { KtTableRow } from 'kanto-ds';
import { APP_NAME, INVOICE_COLUMNS } from '../content';
import { getSummary, listInvoices, type Summary } from '../data/api';
import { formatMoney } from '../format';
import { invoiceRows, revenueSeries, summaryStats } from '../view';

export function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [invoices, setInvoices] = useState<KtTableRow[] | null>(null);

  useEffect(() => {
    let live = true;
    void getSummary().then((next) => {
      if (live) setSummary(next);
    });
    void listInvoices(6).then((next) => {
      if (live) setInvoices(invoiceRows(next));
    });
    return () => {
      live = false;
    };
  }, []);

  return (
    <>
      <kt-page-header
        eyebrow={APP_NAME}
        heading="Overview"
        description="What is billed, paid and late this month."
      />
      <div className="stats" aria-busy={summary === null}>
        {summary &&
          summaryStats(summary).map((stat) => (
            <kt-stat
              key={stat.key}
              label={stat.label}
              value={stat.value}
              delta={stat.delta}
              trend={stat.trend}
              inverted={stat.inverted}
            />
          ))}
      </div>
      <section className="panel">
        <kt-chart
          type="area"
          height={240}
          label="Billed and paid, by month"
          labels={summary ? [...summary.months] : []}
          series={summary ? revenueSeries(summary) : []}
          format={formatMoney}
        />
      </section>
      <kt-table
        label="Latest invoices"
        compact
        columns={INVOICE_COLUMNS}
        data={invoices ?? []}
        loading={invoices === null}
      />
    </>
  );
}
