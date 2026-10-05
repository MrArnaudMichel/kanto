import type { KtDescriptionList, KtInput, KtSidePanel, KtTable, KtTableRow } from 'kanto-ds';
import { CUSTOMER_COLUMNS } from '../content';
import { getCustomer, listCustomers } from '../data/api';
import { customerDetails, customerRows } from '../view';

export function customersPage(page: HTMLElement): () => void {
  page.innerHTML = `
    <kt-page-header heading="Customers" description="Everyone you bill, and what they owe."></kt-page-header>
    <kt-input class="search" type="search" icon="search" label="Search customers" placeholder="Search by name, email or company"></kt-input>
    <kt-table label="Customers" page-size="10" loading></kt-table>
    <kt-side-panel eyebrow="Customer"><kt-description-list></kt-description-list></kt-side-panel>`;
  const search = page.querySelector<KtInput>('kt-input.search')!;
  const table = page.querySelector<KtTable>('kt-table')!;
  const panel = page.querySelector<KtSidePanel>('kt-side-panel')!;
  const details = page.querySelector<KtDescriptionList>('kt-description-list')!;
  table.columns = CUSTOMER_COLUMNS;

  // Each search is a ticket: an answer that comes back after a later search was
  // sent is dropped, so fast typing never shows the results of an old query.
  let ticket = 0;
  const load = (query: string): void => {
    const mine = ++ticket;
    table.loading = true;
    void listCustomers(query).then((customers) => {
      if (mine !== ticket) return;
      table.data = customerRows(customers);
      table.page = 1;
      table.loading = false;
    });
  };

  search.addEventListener('kt-input', (event) => {
    load((event as CustomEvent<{ value: string }>).detail.value);
  });
  table.addEventListener('kt-row-click', (event) => {
    const { row } = (event as CustomEvent<{ row: KtTableRow }>).detail;
    void getCustomer(String(row.id)).then((customer) => {
      if (!customer) return;
      panel.heading = customer.name;
      details.items = customerDetails(customer);
      panel.open = true;
    });
  });

  load('');
  return () => {
    ticket += 1;
  };
}
