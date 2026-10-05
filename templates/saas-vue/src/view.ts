/** What the pages show, worked out once for every stack: rows, tiles, series, details. */
import type { KtDescriptionItem, KtSeries, KtTableRow } from 'kanto-ds';
import type { Customer, Invoice, Summary } from './data/api';
import { formatDate, formatMoney, STATUS_LABEL } from './format';

export interface StatView {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly delta: string;
  readonly trend: 'up' | 'down' | 'flat';
  readonly inverted: boolean;
}

export function invoiceRows(invoices: readonly Invoice[]): KtTableRow[] {
  return invoices.map((invoice) => ({
    id: invoice.id,
    customer: invoice.customer,
    amount: formatMoney(invoice.amount),
    status: STATUS_LABEL[invoice.status] ?? invoice.status,
    due: formatDate(invoice.due),
  }));
}

export function customerRows(customers: readonly Customer[]): KtTableRow[] {
  return customers.map((customer) => ({
    id: customer.id,
    name: customer.name,
    company: customer.company,
    status: STATUS_LABEL[customer.status] ?? customer.status,
    balance: formatMoney(customer.balance),
  }));
}

/** This month against the last: "+10.8%", and which way it went. */
function change(values: readonly number[]): Pick<StatView, 'delta' | 'trend'> {
  const now = values.at(-1) ?? 0;
  const before = values.at(-2) ?? now;
  const percent = before ? ((now - before) / before) * 100 : 0;
  return {
    delta: `${percent >= 0 ? '+' : '-'}${Math.abs(percent).toFixed(1)}%`,
    trend: percent > 0 ? 'up' : percent < 0 ? 'down' : 'flat',
  };
}

export function summaryStats(summary: Summary): StatView[] {
  return [
    {
      key: 'billed',
      label: 'Billed this month',
      value: formatMoney(summary.billed),
      inverted: false,
      ...change(summary.billedByMonth),
    },
    {
      key: 'paid',
      label: 'Paid this month',
      value: formatMoney(summary.paid),
      inverted: false,
      ...change(summary.paidByMonth),
    },
    {
      key: 'overdue',
      label: 'Overdue',
      value: formatMoney(summary.overdue),
      delta: '',
      trend: 'flat',
      inverted: true,
    },
    {
      key: 'customers',
      label: 'Active customers',
      value: String(summary.customers),
      delta: '',
      trend: 'flat',
      inverted: false,
    },
  ];
}

export function revenueSeries(summary: Summary): KtSeries[] {
  return [
    { name: 'Billed', values: [...summary.billedByMonth] },
    { name: 'Paid', values: [...summary.paidByMonth] },
  ];
}

export function customerDetails(customer: Customer): KtDescriptionItem[] {
  return [
    { term: 'Company', detail: customer.company },
    { term: 'Email', detail: customer.email },
    { term: 'Status', detail: STATUS_LABEL[customer.status] ?? customer.status },
    { term: 'Balance', detail: formatMoney(customer.balance) },
    { term: 'Customer since', detail: formatDate(customer.since) },
  ];
}
