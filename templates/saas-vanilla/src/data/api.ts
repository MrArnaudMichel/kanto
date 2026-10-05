/**
 * The app's one door to its data. Every page asks here, and nothing else
 * touches the fixtures: replace these functions with calls to your backend and
 * the pages do not change.
 */
import { BILLED, CUSTOMERS, INVOICES, MONTHS, PAID } from './fixtures';
import type { Customer, Invoice } from './fixtures';

export type { Customer, Invoice } from './fixtures';

export interface Summary {
  readonly billed: number;
  readonly paid: number;
  readonly overdue: number;
  readonly customers: number;
  readonly months: readonly string[];
  readonly billedByMonth: readonly number[];
  readonly paidByMonth: readonly number[];
}

export interface Profile {
  readonly name: string;
  readonly email: string;
}

/** A network's worth of waiting, so the loading states show. */
const latency = (ms = 300) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function getSummary(): Promise<Summary> {
  await latency();
  return {
    billed: BILLED.at(-1)!,
    paid: PAID.at(-1)!,
    overdue: INVOICES.filter((invoice) => invoice.status === 'overdue').reduce(
      (sum, invoice) => sum + invoice.amount,
      0,
    ),
    customers: CUSTOMERS.filter((customer) => customer.status !== 'archived').length,
    months: MONTHS,
    billedByMonth: BILLED,
    paidByMonth: PAID,
  };
}

export async function listInvoices(limit = INVOICES.length): Promise<Invoice[]> {
  await latency();
  return INVOICES.slice(0, limit);
}

/** Customers whose name, email or company holds `query`, ignoring case. */
export async function listCustomers(query = ''): Promise<Customer[]> {
  await latency();
  const needle = query.trim().toLowerCase();
  return CUSTOMERS.filter(
    (customer) =>
      !needle ||
      [customer.name, customer.email, customer.company].some((field) =>
        field.toLowerCase().includes(needle),
      ),
  );
}

export async function getCustomer(id: string): Promise<Customer | undefined> {
  await latency(150);
  return CUSTOMERS.find((customer) => customer.id === id);
}

export async function saveProfile(profile: Profile): Promise<Profile> {
  await latency(600);
  if (!profile.name.trim()) throw new Error('Enter a name.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
    throw new Error('Enter an email address, like name@example.com.');
  }
  return profile;
}
