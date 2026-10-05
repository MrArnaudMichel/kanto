import type { KtChart, KtStat, KtTable } from 'kanto-ds';
import { APP_NAME, INVOICE_COLUMNS } from '../content';
import { getSummary, listInvoices } from '../data/api';
import { formatMoney } from '../format';
import { invoiceRows, revenueSeries, summaryStats } from '../view';

export function dashboardPage(page: HTMLElement): () => void {
  page.innerHTML = `
    <kt-page-header heading="Overview" description="What is billed, paid and late this month."></kt-page-header>
    <div class="stats" aria-busy="true"></div>
    <section class="panel"><kt-chart type="area" height="240" label="Billed and paid, by month"></kt-chart></section>
    <kt-table label="Latest invoices" compact loading></kt-table>`;
  page.querySelector('kt-page-header')!.setAttribute('eyebrow', APP_NAME);
  const stats = page.querySelector<HTMLElement>('.stats')!;
  const chart = page.querySelector<KtChart>('kt-chart')!;
  const table = page.querySelector<KtTable>('kt-table')!;
  table.columns = INVOICE_COLUMNS;
  chart.format = formatMoney;

  let live = true;
  void getSummary().then((summary) => {
    if (!live) return;
    stats.replaceChildren(
      ...summaryStats(summary).map((view) => {
        const stat = document.createElement('kt-stat') as KtStat;
        Object.assign(stat, {
          label: view.label,
          value: view.value,
          delta: view.delta,
          trend: view.trend,
          inverted: view.inverted,
        });
        return stat;
      }),
    );
    stats.removeAttribute('aria-busy');
    chart.labels = [...summary.months];
    chart.series = revenueSeries(summary);
  });
  void listInvoices(6).then((invoices) => {
    if (!live) return;
    table.data = invoiceRows(invoices);
    table.loading = false;
  });
  return () => {
    live = false;
  };
}
