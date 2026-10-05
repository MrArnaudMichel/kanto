/**
 * The workspace's made-up data: two dozen customers, a dozen invoices, a year
 * of revenue. It goes when src/data/api.ts talks to your backend.
 */
export type CustomerStatus = 'active' | 'overdue' | 'archived';

export interface Customer {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly company: string;
  readonly status: CustomerStatus;
  readonly balance: number;
  readonly since: string;
}

export type InvoiceStatus = 'paid' | 'sent' | 'overdue';

export interface Invoice {
  readonly id: string;
  readonly customer: string;
  readonly amount: number;
  readonly status: InvoiceStatus;
  readonly due: string;
}

const PEOPLE = [
  'Ada Park',
  'Sam Ortiz',
  'Lena Brandt',
  'Tom Achterberg',
  'Mira Sato',
  'Jonas Weber',
  'Priya Nair',
  'Hugo Laurent',
  'Ines Costa',
  'Kofi Mensah',
  'Elena Rossi',
  'Noah Kim',
];
const COMPANIES = ['Northwind', 'Kiln', 'Halcyon', 'Fieldnote', 'Orbital', 'Sato Ceramics'];
const STATUSES: readonly CustomerStatus[] = [
  'active',
  'active',
  'active',
  'overdue',
  'active',
  'archived',
];
const INVOICE_STATUSES: readonly InvoiceStatus[] = ['paid', 'sent', 'paid', 'overdue'];

const pad = (n: number) => String(n).padStart(2, '0');

export const CUSTOMERS: readonly Customer[] = Array.from({ length: 24 }, (_, i) => {
  const person = PEOPLE[i % PEOPLE.length]!;
  const company = COMPANIES[i % COMPANIES.length]!;
  const first = person.split(' ')[0]!;
  const second = i >= PEOPLE.length;
  return {
    id: `cus_${String(i + 1).padStart(3, '0')}`,
    name: second ? `${first} ${String.fromCharCode(65 + i - PEOPLE.length)}.` : person,
    email: `${first.toLowerCase()}${second ? i : ''}@${company.toLowerCase().replace(/\W+/g, '')}.com`,
    company,
    status: STATUSES[i % STATUSES.length]!,
    balance: ((i * 7919) % 9000) + 120,
    since: `202${4 + (i % 3)}-${pad((i % 12) + 1)}-${pad((i % 27) + 1)}`,
  };
});

export const INVOICES: readonly Invoice[] = Array.from({ length: 12 }, (_, i) => ({
  id: `INV-${2041 - i}`,
  customer: CUSTOMERS[i]!.company,
  amount: ((i * 3571) % 4800) + 240,
  status: INVOICE_STATUSES[i % INVOICE_STATUSES.length]!,
  due: `2026-10-${pad(28 - i * 2)}`,
}));

export const MONTHS: readonly string[] = [
  'Nov',
  'Dec',
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
];
export const BILLED: readonly number[] = [18, 21, 19, 24, 26, 25, 29, 31, 30, 34, 37, 41].map(
  (k) => k * 1000,
);
export const PAID: readonly number[] = [16, 20, 18, 21, 25, 24, 26, 30, 29, 31, 35, 36].map(
  (k) => k * 1000,
);
